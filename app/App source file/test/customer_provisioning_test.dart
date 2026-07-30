import 'package:flutter_test/flutter_test.dart';
import 'package:ultrawash/core/cleango/onboarding/customer_address_service.dart';
import 'package:ultrawash/core/cleango/onboarding/customer_provisioning_service.dart';
import 'package:ultrawash/core/cleango/onboarding/customer_startup_route.dart';
import 'package:ultrawash/core/cleango/onboarding/location_onboarding_policy.dart';
import 'package:ultrawash/core/cleango/onboarding/service_zone_validator.dart';

void main() {
  group('CustomerProvisioningService', () {
    test('creates a missing phone-auth customer', () async {
      final store = _MemoryProvisioningStore();
      final service = CustomerProvisioningService(store: store);

      final result = await service.provision(
        const CustomerIdentity(
          uid: 'customer-a',
          phoneNumber: '+237600000000',
          authProviders: {'phone'},
        ),
      );

      expect(result.status, CustomerProvisioningStatus.created);
      expect(store.data?['uid'], 'customer-a');
      expect(store.data?['onboardingCompleted'], false);
      expect(store.data?['authProviders'], ['phone']);
    });

    test('merges phone-auth identity into an existing customer', () async {
      final store = _MemoryProvisioningStore({
        'uid': 'customer-a',
        'userId': 'customer-a',
        'email': 'customer@example.invalid',
        'accountStatus': 'active',
        'onboardingCompleted': false,
        'authProviders': ['google.com'],
      });
      final service = CustomerProvisioningService(store: store);

      final result = await service.provision(
        const CustomerIdentity(
          uid: 'customer-a',
          phoneNumber: '+237600000000',
          authProviders: {'phone'},
        ),
      );

      expect(result.status, CustomerProvisioningStatus.updated);
      expect(store.data?['phoneNumber'], '+237600000000');
      expect(store.data?['authProviders'], ['google.com', 'phone']);
    });

    test('merges Google identity into an existing customer', () async {
      final store = _MemoryProvisioningStore({
        'uid': 'customer-a',
        'userId': 'customer-a',
        'phoneNumber': '+237600000000',
        'accountStatus': 'active',
        'onboardingCompleted': false,
        'authProviders': ['phone'],
      });
      final service = CustomerProvisioningService(store: store);

      final result = await service.provision(
        const CustomerIdentity(
          uid: 'customer-a',
          email: 'customer@example.invalid',
          displayName: 'Customer Name',
          avatarUrl: 'provider-avatar',
          authProviders: {'google.com'},
        ),
      );

      expect(result.status, CustomerProvisioningStatus.updated);
      expect(store.data?['email'], 'customer@example.invalid');
      expect(store.data?['displayName'], 'Customer Name');
      expect(store.data?['fullName'], 'Customer Name');
      expect(store.data?['avatarUrl'], 'provider-avatar');
      expect(store.data?['profileImage'], 'provider-avatar');
      expect(store.data?['authProviders'], ['google.com', 'phone']);
    });

    test('preserves existing user-entered identity values', () async {
      final store = _MemoryProvisioningStore({
        'uid': 'customer-a',
        'userId': 'customer-a',
        'displayName': 'Saved customer',
        'avatarUrl': 'saved-avatar',
        'accountStatus': 'active',
        'onboardingCompleted': true,
        'authProviders': ['phone'],
      });
      final service = CustomerProvisioningService(store: store);

      await service.provision(
        const CustomerIdentity(
          uid: 'customer-a',
          displayName: 'Provider name',
          avatarUrl: 'provider-avatar',
          authProviders: {'google.com'},
        ),
      );

      expect(store.data?['displayName'], 'Saved customer');
      expect(store.data?['avatarUrl'], 'saved-avatar');
      expect(store.data?['authProviders'], ['google.com', 'phone']);
    });

    test('is idempotent for identical identity', () async {
      final store = _MemoryProvisioningStore({
        'uid': 'customer-a',
        'userId': 'customer-a',
        'email': 'customer@example.invalid',
        'accountStatus': 'active',
        'onboardingCompleted': false,
        'authProviders': ['google.com'],
      });
      final service = CustomerProvisioningService(store: store);
      const identity = CustomerIdentity(
        uid: 'customer-a',
        email: 'customer@example.invalid',
        authProviders: {'google.com'},
      );

      final first = await service.provision(identity);
      final second = await service.provision(identity);

      expect(first.status, CustomerProvisioningStatus.unchanged);
      expect(second.status, CustomerProvisioningStatus.unchanged);
      expect(store.mergeCount, 0);
    });
  });

  group('ServiceZoneValidator', () {
    const validator = ServiceZoneValidator();

    test('supports Yaoundé manual entry', () {
      expect(validator.validateManualCity('Yaoundé').isSupported, isTrue);
    });

    test('rejects an unsupported city', () {
      expect(validator.validateManualCity('Bafoussam').isSupported, isFalse);
    });

    test('reports missing coordinates safely', () {
      expect(
        validator.validateCoordinates(latitude: null, longitude: null).failure,
        ServiceZoneFailure.missingLocation,
      );
    });

    test('rejects inaccurate coordinates and permits manual fallback', () {
      final result = validator.validateCoordinates(
        latitude: 3.86,
        longitude: 11.52,
        accuracyMeters: ServiceZoneValidator.maximumAccuracyMeters + 1,
      );

      expect(result.isSupported, isFalse);
      expect(result.failure, ServiceZoneFailure.inaccurateLocation);
      expect(validator.validateManualCity('Yaoundé').isSupported, isTrue);
    });
  });

  group('LocationOnboardingPolicy', () {
    const policy = LocationOnboardingPolicy();

    test('permission denial leaves manual entry available', () {
      final result = policy.evaluate(
        servicesEnabled: true,
        permission: CustomerLocationPermission.denied,
      );

      expect(result.canUseCurrentLocation, isFalse);
      expect(result.manualEntryAvailable, isTrue);
      expect(result.failure, LocationReadinessFailure.permissionDenied);
    });

    test('permanent denial leaves manual entry available', () {
      final result = policy.evaluate(
        servicesEnabled: true,
        permission: CustomerLocationPermission.deniedForever,
      );

      expect(result.canUseCurrentLocation, isFalse);
      expect(result.manualEntryAvailable, isTrue);
      expect(result.failure, LocationReadinessFailure.permissionDeniedForever);
    });

    test('disabled location services leave manual entry available', () {
      final result = policy.evaluate(
        servicesEnabled: false,
        permission: CustomerLocationPermission.granted,
      );

      expect(result.canUseCurrentLocation, isFalse);
      expect(result.manualEntryAvailable, isTrue);
      expect(result.failure, LocationReadinessFailure.servicesDisabled);
    });
  });

  group('CustomerStartupRouteResolver', () {
    const resolver = CustomerStartupRouteResolver();

    test('routes unauthenticated users to authentication', () {
      expect(
        resolver.resolve(authenticated: false),
        CustomerStartupRoute.authentication,
      );
    });

    test('routes missing customer to provisioning', () {
      expect(
        resolver.resolve(authenticated: true),
        CustomerStartupRoute.provisioning,
      );
    });

    test('routes customer without address to onboarding', () {
      expect(
        resolver.resolve(
          authenticated: true,
          state: const CustomerOnboardingState(
            customerExists: true,
            onboardingCompleted: false,
            hasDefaultAddress: false,
            accountStatus: 'active',
          ),
        ),
        CustomerStartupRoute.addressOnboarding,
      );
    });

    test('routes a returning customer with a valid address to dashboard', () {
      expect(
        resolver.resolve(
          authenticated: true,
          state: const CustomerOnboardingState(
            customerExists: true,
            onboardingCompleted: false,
            hasDefaultAddress: true,
            accountStatus: 'active',
          ),
        ),
        CustomerStartupRoute.dashboard,
      );
    });

    test('routes a complete customer to dashboard', () {
      expect(
        resolver.resolve(
          authenticated: true,
          state: const CustomerOnboardingState(
            customerExists: true,
            onboardingCompleted: true,
            hasDefaultAddress: true,
            accountStatus: 'active',
          ),
        ),
        CustomerStartupRoute.dashboard,
      );
    });
  });
}

class _MemoryProvisioningStore implements CustomerProvisioningStore {
  _MemoryProvisioningStore([Map<String, dynamic>? initial])
    : data = initial == null ? null : Map.of(initial);

  Map<String, dynamic>? data;
  int mergeCount = 0;

  @override
  Future<void> createCustomer(String uid, Map<String, dynamic> values) async {
    data = Map.of(values);
  }

  @override
  Future<void> mergeCustomer(String uid, Map<String, dynamic> values) async {
    mergeCount++;
    data = {...?data, ...values};
  }

  @override
  Future<Map<String, dynamic>?> readCustomer(String uid) async {
    return data == null ? null : Map.of(data!);
  }
}

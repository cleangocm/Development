import 'package:ultrawash/core/cleango/models/address.dart';
import 'package:ultrawash/core/cleango/models/customer.dart';
import 'package:ultrawash/core/cleango/models/subscription.dart';
import 'package:ultrawash/core/cleango/repositories/customer_repository.dart';
import 'package:ultrawash/core/cleango/repositories/subscription_repository.dart';
import 'package:ultrawash/core/cleango/subscriptions/subscription_pricing_catalogue.dart';
import 'package:ultrawash/core/cleango/subscriptions/subscription_request_service.dart';

class MockCustomerService
    implements
        CustomerRepository,
        SubscriptionRepository,
        SubscriptionRequestStore {
  MockCustomerService() {
    final plan = SubscriptionPricingCatalogue.requirePlan('standard');
    final createdAt = DateTime(2026, 7, 1);
    _subscriptions.add(
      Subscription(
        id: 'subscription-demo-001',
        customerId: _customerId,
        planId: plan.id,
        planSnapshot: plan,
        serviceAddressId: _primaryAddress.id,
        serviceAddressSnapshot: SubscriptionAddressSnapshot.fromAddress(
          _primaryAddress,
        ),
        status: SubscriptionStatus.active,
        paymentStatus: SubscriptionPaymentStatus.paid,
        startDate: createdAt,
        endDate: DateTime(2026, 8, 1),
        billingCycle: SubscriptionBillingCycle.monthly,
        includedPickupsPerMonth: plan.pickupsPerMonth,
        includedBagsPerPickup: plan.includedBagsPerPickup,
        usedPickups: 2,
        extraBagRate: SubscriptionPricingCatalogue.extraBagRateXaf,
        createdAt: createdAt,
        updatedAt: createdAt,
        cancelledAt: null,
        pricingVersion: plan.pricingVersion,
      ),
    );
  }

  static const _customerId = 'customer-demo-001';

  static const _primaryAddress = Address(
    id: 'address-demo-001',
    label: 'Home',
    street: 'Bastos',
    city: 'Yaounde',
    region: 'Centre',
    country: 'Cameroon',
    latitude: 3.884,
    longitude: 11.502,
    serviceZone: 'yaounde',
    isWithinServiceArea: true,
    isPrimary: true,
  );

  Customer _customer = const Customer(
    id: _customerId,
    fullName: 'Preview Customer',
    phoneNumber: '+237 600000000',
    email: 'preview@example.com',
    serviceArea: 'Yaounde, Centre Region',
    primaryAddress: _primaryAddress,
  );

  final List<Subscription> _subscriptions = [];

  late final SubscriptionRequestService _requestService =
      SubscriptionRequestService(store: this);

  @override
  Future<Customer?> getCurrentCustomer() async => _customer;

  @override
  Future<Customer?> getCustomerById(String customerId) async {
    return customerId == _customer.id ? _customer : null;
  }

  @override
  Future<Customer> updateCustomer(Customer customer) async {
    _customer = customer;
    return _customer;
  }

  @override
  Future<List<SubscriptionPlanDefinition>> getAvailablePlans() async {
    return SubscriptionPricingCatalogue.plans;
  }

  @override
  Future<SubscriptionRequestResult> requestSubscription(
    SubscriptionRequest request,
  ) {
    return _requestService.request(customerId: _customerId, request: request);
  }

  @override
  Future<Subscription?> getActiveSubscription(String customerId) async {
    for (final subscription in _subscriptions) {
      if (subscription.customerId == customerId && subscription.isActive) {
        return subscription;
      }
    }
    return null;
  }

  @override
  Future<List<Subscription>> getSubscriptionHistory(String customerId) async {
    return List.unmodifiable(
      _subscriptions.where(
        (subscription) => subscription.customerId == customerId,
      ),
    );
  }

  @override
  Future<Subscription> updateSubscription(Subscription subscription) async {
    final index = _subscriptions.indexWhere(
      (item) => item.id == subscription.id,
    );
    if (index == -1) {
      _subscriptions.add(subscription);
    } else {
      _subscriptions[index] = subscription;
    }
    return subscription;
  }

  @override
  Future<Address?> getOwnedSubscriptionAddress({
    required String customerId,
    required String addressId,
  }) async {
    if (customerId == _customerId && addressId == _primaryAddress.id) {
      return _primaryAddress;
    }
    return null;
  }

  @override
  Future<SubscriptionRequestResult> createOrGetSubscription(
    SubscriptionRequestDraft draft,
  ) async {
    for (final existing in _subscriptions) {
      if (existing.id == draft.documentId) {
        return SubscriptionRequestResult(
          subscription: existing,
          wasDuplicate: true,
        );
      }
    }
    final now = DateTime.now();
    final subscription = Subscription(
      id: draft.documentId,
      customerId: draft.customerId,
      planId: draft.plan.id,
      planSnapshot: draft.plan,
      serviceAddressId: draft.addressId,
      serviceAddressSnapshot: draft.addressSnapshot,
      status: draft.status,
      paymentStatus: draft.paymentStatus,
      startDate: null,
      endDate: null,
      billingCycle: draft.billingCycle,
      includedPickupsPerMonth: draft.plan.pickupsPerMonth,
      includedBagsPerPickup: draft.plan.includedBagsPerPickup,
      usedPickups: 0,
      extraBagRate: SubscriptionPricingCatalogue.extraBagRateXaf,
      createdAt: now,
      updatedAt: now,
      cancelledAt: null,
      pricingVersion: draft.plan.pricingVersion,
    );
    _subscriptions.add(subscription);
    return SubscriptionRequestResult(
      subscription: subscription,
      wasDuplicate: false,
    );
  }
}

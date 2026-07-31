import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ultrawash/core/cleango/collections/collection_booking_service.dart';
import 'package:ultrawash/core/cleango/collections/collection_pricing_service.dart';
import 'package:ultrawash/core/cleango/collections/collection_schedule_service.dart';
import 'package:ultrawash/core/cleango/models/address.dart';
import 'package:ultrawash/core/cleango/models/collection.dart';
import 'package:ultrawash/core/cleango/models/subscription.dart';
import 'package:ultrawash/core/cleango/services/mock_collection_service.dart';
import 'package:ultrawash/core/cleango/session/current_customer_provider.dart';
import 'package:ultrawash/core/cleango/subscriptions/subscription_pricing_catalogue.dart';
import 'package:ultrawash/core/cleango/subscriptions/subscription_request_service.dart';
import 'package:ultrawash/core/config/data_mode.dart';
import 'package:ultrawash/feature/customer_dashboard/collections/collection_details_screen.dart';
import 'package:ultrawash/feature/customer_dashboard/collections/controller/collections_tab_controller.dart';

void main() {
  const pricingService = CollectionPricingService();
  const scheduleService = CollectionScheduleService();
  const customerId = 'customer-a';
  const supportedAddress = Address(
    id: 'address-a',
    label: 'Home',
    street: 'Test address',
    city: 'Yaounde',
    region: 'Test district',
    country: 'Cameroon',
    latitude: 3.86,
    longitude: 11.52,
    serviceZone: CollectionPricingService.supportedServiceZone,
    isWithinServiceArea: true,
    isPrimary: true,
  );
  final nowUtc = DateTime.utc(2026, 7, 30, 12);
  final validDate = DateTime(2026, 8, 1);

  group('SubscriptionPricingCatalogue', () {
    const expectedPlans = [
      _ExpectedPlan(
        id: 'basic',
        frenchName: 'Forfait Basique',
        monthlyPriceXaf: 5000,
        pickupsPerWeek: 1,
        pickupsPerMonth: 4,
        includedBagsPerPickup: 2,
        bagsSupplied: true,
      ),
      _ExpectedPlan(
        id: 'standard',
        frenchName: 'Standard',
        monthlyPriceXaf: 8500,
        pickupsPerWeek: 2,
        pickupsPerMonth: 8,
        includedBagsPerPickup: 2,
      ),
      _ExpectedPlan(
        id: 'popular',
        frenchName: 'Populaire',
        monthlyPriceXaf: 11000,
        pickupsPerWeek: 2,
        pickupsPerMonth: 8,
        includedBagsPerPickup: 4,
      ),
      _ExpectedPlan(
        id: 'premium',
        frenchName: 'Premium',
        monthlyPriceXaf: 16500,
        pickupsPerWeek: 3,
        pickupsPerMonth: 12,
        includedBagsPerPickup: 6,
      ),
      _ExpectedPlan(
        id: 'apartments_hotels',
        frenchName: 'Appartements & Hôtels',
        monthlyPriceXaf: null,
        pickupsPerWeek: 0,
        pickupsPerMonth: 0,
        includedBagsPerPickup: 10,
        flexibleSchedule: true,
        urgentPickup: true,
        requiresQuotation: true,
        startingPriceXaf: 35000,
      ),
    ];

    for (final expected in expectedPlans) {
      test('${expected.id} matches the approved plan contract', () {
        final plan = SubscriptionPricingCatalogue.requirePlan(expected.id);

        expect(plan.id, expected.id);
        expect(plan.frenchName, expected.frenchName);
        expect(plan.monthlyPriceXaf, expected.monthlyPriceXaf);
        expect(plan.pickupsPerWeek, expected.pickupsPerWeek);
        expect(plan.pickupsPerMonth, expected.pickupsPerMonth);
        expect(plan.includedBagsPerPickup, expected.includedBagsPerPickup);
        expect(plan.bagsSupplied, expected.bagsSupplied);
        expect(plan.flexibleSchedule, expected.flexibleSchedule);
        expect(plan.urgentPickup, expected.urgentPickup);
        expect(plan.requiresQuotation, expected.requiresQuotation);
        expect(plan.startingPriceXaf, expected.startingPriceXaf);
        expect(plan.currency, 'XAF');
        expect(plan.pricingVersion, 'approved-v1-2026-07');
        expect(plan.active, isTrue);
      });
    }

    test('uses stable plan IDs in approved display order', () {
      expect(SubscriptionPricingCatalogue.plans.map((plan) => plan.id), [
        'basic',
        'standard',
        'popular',
        'premium',
        'apartments_hotels',
      ]);
      expect(
        SubscriptionPricingCatalogue.plans.map((plan) => plan.displayOrder),
        [1, 2, 3, 4, 5],
      );
    });

    test('calculates extra CLEANGO 60L bags with integer FCFA', () {
      expect(SubscriptionPricingCatalogue.extraBagRateXaf, 500);
      expect(SubscriptionPricingCatalogue.extraBagAmount(0), 0);
      expect(SubscriptionPricingCatalogue.extraBagAmount(3), 1500);
      expect(
        () => SubscriptionPricingCatalogue.extraBagAmount(-1),
        throwsArgumentError,
      );
    });
  });

  group('CollectionPricingService', () {
    for (final entry in const {1: 500, 2: 1000, 10: 5000}.entries) {
      test('${entry.key} one-time 60L bag(s) costs ${entry.value} FCFA', () {
        final pricing = pricingService.quoteOneTimeBagCount(
          declaredBagCount: entry.key,
          serviceZone: 'yaounde',
        );

        expect(pricing.currency, 'XAF');
        expect(pricing.baseAmount, entry.value);
        expect(pricing.includedBagCount, 0);
        expect(pricing.extraBagCount, 0);
        expect(pricing.extraBagRate, 500);
        expect(pricing.extraBagAmount, 0);
        expect(pricing.serviceFee, 0);
        expect(pricing.discount, 0);
        expect(pricing.totalAmount, entry.value);
        expect(pricing.totalAmount, isA<int>());
        expect(pricing.pricingVersion, 'approved-v1-2026-07');
        expect(pricing.calculationSource, 'approvedOneTimeBagRate');
      });
    }

    test('enforces configured one-time bag limits', () {
      expect(CollectionPricingService.maxOneTimeBagCount, 50);
      expect(
        () => pricingService.quoteOneTimeBagCount(
          declaredBagCount: 0,
          serviceZone: 'yaounde',
        ),
        throwsA(isA<CollectionPricingException>()),
      );
      expect(
        () => pricingService.quoteOneTimeBagCount(
          declaredBagCount: 51,
          serviceZone: 'yaounde',
        ),
        throwsA(isA<CollectionPricingException>()),
      );
    });

    test('calculates subscription extra bags without changing base price', () {
      final pricing = pricingService.quoteSubscription(
        plan: SubscriptionPricingCatalogue.requirePlan('basic'),
        extraBagCount: 3,
        serviceZone: 'yaounde',
      );

      expect(pricing.baseAmount, 5000);
      expect(pricing.includedBagCount, 2);
      expect(pricing.extraBagCount, 3);
      expect(pricing.extraBagRate, 500);
      expect(pricing.extraBagAmount, 1500);
      expect(pricing.totalAmount, 6500);
    });

    test('photo quotation has no client-authoritative price', () {
      final pricing = pricingService.pendingPhotoQuotation(
        serviceZone: 'yaounde',
      );

      expect(pricing.baseAmount, isNull);
      expect(pricing.totalAmount, isNull);
      expect(pricing.hasFinalAmount, isFalse);
      expect(pricing.calculationSource, 'pendingAdminQuotation');
    });

    test('apartments and hotels starting price is never a final total', () {
      final plan = SubscriptionPricingCatalogue.requirePlan(
        'apartments_hotels',
      );
      final pricing = pricingService.quoteSubscription(
        plan: plan,
        extraBagCount: 0,
        serviceZone: 'yaounde',
      );

      expect(plan.startingPriceXaf, 35000);
      expect(plan.monthlyPriceXaf, isNull);
      expect(pricing.baseAmount, isNull);
      expect(pricing.totalAmount, isNull);
      expect(pricing.hasFinalAmount, isFalse);
    });

    test('rejects unsupported service zones', () {
      expect(
        () => pricingService.quoteOneTimeBagCount(
          declaredBagCount: 1,
          serviceZone: 'douala',
        ),
        throwsA(isA<CollectionPricingException>()),
      );
    });
  });

  group('CollectionScheduleService', () {
    test('rejects past schedule times', () {
      expect(
        () => scheduleService.validateAndResolveUtc(
          date: DateTime(2026, 7, 28),
          timeWindow: CollectionTimeWindow.morningEarly,
          nowUtc: nowUtc,
        ),
        throwsA(isA<CollectionScheduleException>()),
      );
    });

    test('rejects closed dates and unknown time-window values', () {
      expect(scheduleService.isAvailableDate(DateTime(2026, 8, 2)), isFalse);
      expect(CollectionTimeWindow.fromWireValue('12:00-14:00'), isNull);
      expect(scheduleService.timeWindows, CollectionTimeWindow.values);
    });

    test('resolves Yaounde schedule time to a stable UTC instant', () {
      final resolved = scheduleService.validateAndResolveUtc(
        date: validDate,
        timeWindow: CollectionTimeWindow.morningEarly,
        nowUtc: nowUtc,
      );

      expect(resolved, DateTime.utc(2026, 8, 1, 7));
      expect(
        scheduleService.toServiceLocalDate(resolved),
        DateTime(2026, 8, 1, 8),
      );
    });
  });
  group('CollectionBookingService', () {
    test('rejects a missing owned address', () async {
      final service = CollectionBookingService(store: _MemoryBookingStore());

      await expectLater(
        service.book(
          customerId: customerId,
          request: _bagRequest(addressId: 'missing', date: validDate),
          nowUtc: nowUtc,
        ),
        throwsA(
          isA<CollectionBookingException>().having(
            (error) => error.code,
            'code',
            'address-not-found',
          ),
        ),
      );
    });

    test(
      'rejects an unsupported service zone without creating a record',
      () async {
        final store = _MemoryBookingStore(
          addresses: {
            'address-a': supportedAddress.copyWith(
              serviceZone: 'douala',
              isWithinServiceArea: false,
            ),
          },
        );
        final service = CollectionBookingService(store: store);

        await expectLater(
          service.book(
            customerId: customerId,
            request: _bagRequest(date: validDate),
            nowUtc: nowUtc,
          ),
          throwsA(
            isA<CollectionBookingException>().having(
              (error) => error.code,
              'code',
              'unsupported-service-zone',
            ),
          ),
        );
        expect(store.collections, isEmpty);
      },
    );

    test(
      'builds the canonical bag-count payload and pricing snapshot',
      () async {
        final store = _MemoryBookingStore(
          addresses: const {'address-a': supportedAddress},
        );
        final service = CollectionBookingService(store: store);

        final result = await service.book(
          customerId: customerId,
          request: _bagRequest(date: validDate, declaredBagCount: 3),
          nowUtc: nowUtc,
        );
        final draft = store.lastDraft!;

        expect(result.wasDuplicate, isFalse);
        expect(draft.documentId, matches(RegExp(r'^collection_[0-9a-f]{64}$')));
        expect(draft.customerId, customerId);
        expect(draft.addressId, supportedAddress.id);
        expect(draft.addressSnapshot.addressLine, supportedAddress.street);
        expect(draft.bookingMode, CollectionBookingMode.oneTimeBagCount);
        expect(draft.collectionType, CollectionType.oneTime);
        expect(draft.wasteCategory, WasteCategory.household);
        expect(draft.frequency, CollectionFrequency.once);
        expect(draft.scheduledTimeWindow, CollectionTimeWindow.morningEarly);
        expect(draft.scheduledDateUtc, DateTime.utc(2026, 8, 1, 7));
        expect(draft.declaredBagCount, 3);
        expect(draft.pricing.totalAmount, 1500);
        expect(draft.photoStoragePaths, isEmpty);
        expect(draft.status, CollectionStatus.pending);
        expect(result.collection.paymentStatus, CollectionPaymentStatus.unpaid);
      },
    );

    test('creates a photo quotation with no price or schedule', () async {
      final store = _MemoryBookingStore(
        addresses: const {'address-a': supportedAddress},
      );
      final service = CollectionBookingService(store: store);
      const requestId = 'photo-request';
      final documentId = CollectionBookingService.bookingDocumentId(
        customerId: customerId,
        requestId: requestId,
      );

      final result = await service.book(
        customerId: customerId,
        request: CollectionBookingRequest(
          requestId: requestId,
          addressId: 'address-a',
          bookingMode: CollectionBookingMode.oneTimePhotoQuote,
          wasteCategory: WasteCategory.other,
          photoStoragePaths: [
            'collection-quotes/$customerId/$documentId/quote_1_0123456789abcdef.jpg',
          ],
          customerNotes: 'Please review the attached waste photo.',
        ),
        nowUtc: nowUtc,
      );

      expect(result.collection.status, CollectionStatus.quotationRequested);
      expect(
        result.collection.quotationStatus,
        CollectionQuotationStatus.requested,
      );
      expect(result.collection.scheduledDate, isNull);
      expect(result.collection.scheduledTimeWindow, isNull);
      expect(result.collection.pricing.baseAmount, isNull);
      expect(result.collection.pricing.totalAmount, isNull);
      expect(result.collection.quotedAmount, isNull);
      expect(result.collection.paymentStatus, CollectionPaymentStatus.unpaid);
    });

    test('rejects photo references outside the owner booking path', () async {
      final store = _MemoryBookingStore(
        addresses: const {'address-a': supportedAddress},
      );
      final service = CollectionBookingService(store: store);

      await expectLater(
        service.book(
          customerId: customerId,
          request: const CollectionBookingRequest(
            requestId: 'photo-invalid',
            addressId: 'address-a',
            bookingMode: CollectionBookingMode.oneTimePhotoQuote,
            wasteCategory: WasteCategory.other,
            photoStoragePaths: [
              'collection-quotes/another-user/another-booking/quote_1_bad.jpg',
            ],
          ),
          nowUtc: nowUtc,
        ),
        throwsA(
          isA<CollectionBookingException>().having(
            (error) => error.code,
            'code',
            'invalid-photo-path',
          ),
        ),
      );
    });

    test('rejects invalid mode combinations', () async {
      final store = _MemoryBookingStore(
        addresses: const {'address-a': supportedAddress},
      );
      final service = CollectionBookingService(store: store);

      await expectLater(
        service.book(
          customerId: customerId,
          request: _bagRequest(
            date: validDate,
            frequency: CollectionFrequency.weekly,
          ),
          nowUtc: nowUtc,
        ),
        throwsA(
          isA<CollectionBookingException>().having(
            (error) => error.code,
            'code',
            'invalid-bag-booking',
          ),
        ),
      );
      await expectLater(
        service.book(
          customerId: customerId,
          request: CollectionBookingRequest(
            requestId: 'photo-scheduled',
            addressId: 'address-a',
            bookingMode: CollectionBookingMode.oneTimePhotoQuote,
            wasteCategory: WasteCategory.other,
            scheduledDate: validDate,
            scheduledTimeWindow: CollectionTimeWindow.morningEarly,
            photoStoragePaths: const ['unused'],
          ),
          nowUtc: nowUtc,
        ),
        throwsA(isA<CollectionBookingException>()),
      );
    });

    test('prevents duplicate documents when a request is retried', () async {
      final store = _MemoryBookingStore(
        addresses: const {'address-a': supportedAddress},
      );
      final service = CollectionBookingService(store: store);
      final request = _bagRequest(date: validDate);

      final first = await service.book(
        customerId: customerId,
        request: request,
        nowUtc: nowUtc,
      );
      final second = await service.book(
        customerId: customerId,
        request: request,
        nowUtc: nowUtc,
      );

      expect(first.wasDuplicate, isFalse);
      expect(second.wasDuplicate, isTrue);
      expect(first.collection.id, second.collection.id);
      expect(store.collections, hasLength(1));
    });

    test('same request remains stable after service restart', () async {
      final store = _MemoryBookingStore(
        addresses: const {'address-a': supportedAddress},
      );
      final request = _bagRequest(date: validDate);
      final first = await CollectionBookingService(
        store: store,
      ).book(customerId: customerId, request: request, nowUtc: nowUtc);
      final restored = await CollectionBookingService(
        store: store,
      ).book(customerId: customerId, request: request, nowUtc: nowUtc);

      expect(restored.wasDuplicate, isTrue);
      expect(restored.collection.id, first.collection.id);
      expect(store.collections, hasLength(1));
    });
  });
  group('SubscriptionRequestService', () {
    test('fixed plan request remains pending payment and inactive', () async {
      final store = _MemorySubscriptionStore(
        addresses: const {'address-a': supportedAddress},
      );
      final service = SubscriptionRequestService(store: store);

      final result = await service.request(
        customerId: customerId,
        request: const SubscriptionRequest(
          requestId: 'basic-request',
          planId: 'basic',
          addressId: 'address-a',
        ),
      );

      expect(result.wasDuplicate, isFalse);
      expect(result.subscription.status, SubscriptionStatus.pendingPayment);
      expect(
        result.subscription.paymentStatus,
        SubscriptionPaymentStatus.unpaid,
      );
      expect(result.subscription.isActive, isFalse);
      expect(result.subscription.monthlyPriceXaf, 5000);
      expect(result.subscription.includedPickupsPerMonth, 4);
      expect(result.subscription.includedBagsPerPickup, 2);
      expect(result.subscription.extraBagRate, 500);
      expect(result.subscription.startDate, isNull);
      expect(result.subscription.endDate, isNull);
    });

    test(
      'apartments and hotels request requires review without final price',
      () async {
        final store = _MemorySubscriptionStore(
          addresses: const {'address-a': supportedAddress},
        );
        final service = SubscriptionRequestService(store: store);

        final result = await service.request(
          customerId: customerId,
          request: const SubscriptionRequest(
            requestId: 'apartments-request',
            planId: 'apartments_hotels',
            addressId: 'address-a',
          ),
        );

        expect(result.subscription.status, SubscriptionStatus.pendingReview);
        expect(
          result.subscription.billingCycle,
          SubscriptionBillingCycle.flexibleReview,
        );
        expect(
          result.subscription.paymentStatus,
          SubscriptionPaymentStatus.unpaid,
        );
        expect(result.subscription.monthlyPriceXaf, isNull);
        expect(result.subscription.planSnapshot.startingPriceXaf, 35000);
        expect(result.subscription.isActive, isFalse);
      },
    );

    test('subscription request IDs prevent duplicate records', () async {
      final store = _MemorySubscriptionStore(
        addresses: const {'address-a': supportedAddress},
      );
      final service = SubscriptionRequestService(store: store);
      const request = SubscriptionRequest(
        requestId: 'stable-subscription-request',
        planId: 'popular',
        addressId: 'address-a',
      );

      final first = await service.request(
        customerId: customerId,
        request: request,
      );
      final second = await service.request(
        customerId: customerId,
        request: request,
      );

      expect(first.wasDuplicate, isFalse);
      expect(second.wasDuplicate, isTrue);
      expect(first.subscription.id, second.subscription.id);
      expect(
        first.subscription.id,
        matches(RegExp(r'^subscription_[0-9a-f]{64}$')),
      );
      expect(store.subscriptions, hasLength(1));
    });

    test(
      'subscription request rejects missing and unsupported addresses',
      () async {
        final missingService = SubscriptionRequestService(
          store: _MemorySubscriptionStore(),
        );
        await expectLater(
          missingService.request(
            customerId: customerId,
            request: const SubscriptionRequest(
              requestId: 'missing-address',
              planId: 'basic',
              addressId: 'missing',
            ),
          ),
          throwsA(
            isA<SubscriptionRequestException>().having(
              (error) => error.code,
              'code',
              'address-not-found',
            ),
          ),
        );

        final unsupportedService = SubscriptionRequestService(
          store: _MemorySubscriptionStore(
            addresses: {
              'address-a': supportedAddress.copyWith(
                serviceZone: 'douala',
                isWithinServiceArea: false,
              ),
            },
          ),
        );
        await expectLater(
          unsupportedService.request(
            customerId: customerId,
            request: const SubscriptionRequest(
              requestId: 'unsupported-address',
              planId: 'basic',
              addressId: 'address-a',
            ),
          ),
          throwsA(
            isA<SubscriptionRequestException>().having(
              (error) => error.code,
              'code',
              'unsupported-service-zone',
            ),
          ),
        );
      },
    );
  });

  group('Collections controller and cancellation', () {
    test('maps and sorts upcoming and history data safely', () async {
      final repository = MockCollectionService();
      final controller = CollectionsTabController(
        currentCustomerProvider: const _StaticCustomerProvider(
          'customer-demo-001',
        ),
        collectionRepository: repository,
      );

      final data = await controller.load();

      expect(data.upcomingCollections, isNotEmpty);
      expect(data.collectionHistory, isNotEmpty);
      expect(data.upcomingCollections.first.isUpcoming, isTrue);
      expect(data.collectionHistory.first.isUpcoming, isFalse);
    });

    test('returns a safe empty state without customer identity', () async {
      final controller = CollectionsTabController(
        currentCustomerProvider: const _StaticCustomerProvider(null),
        collectionRepository: MockCollectionService(),
      );

      final data = await controller.load();

      expect(data.upcomingCollections, isEmpty);
      expect(data.collectionHistory, isEmpty);
    });

    test('allows pending cancellation and retains the record', () async {
      final repository = MockCollectionService();
      final booking = await repository.bookCollection(
        CollectionBookingRequest(
          requestId: 'cancel-pending',
          addressId: 'address-demo-001',
          bookingMode: CollectionBookingMode.oneTimeBagCount,
          wasteCategory: WasteCategory.household,
          scheduledDate: const CollectionScheduleService().firstAvailableDate(),
          scheduledTimeWindow: CollectionTimeWindow.morningEarly,
          declaredBagCount: 1,
        ),
      );

      final cancelled = await repository.cancelCollection(
        booking.collection.id,
      );

      expect(cancelled.status, CollectionStatus.cancelled);
      expect(cancelled.cancelledAt, isNotNull);
      expect(await repository.getCollectionById(cancelled.id), isNotNull);
    });

    test('denies cancellation of a completed collection', () async {
      final repository = MockCollectionService();

      await expectLater(
        repository.cancelCollection('collection-demo-002'),
        throwsA(
          isA<CollectionBookingException>().having(
            (error) => error.code,
            'code',
            'cancellation-not-allowed',
          ),
        ),
      );
    });
  });

  testWidgets('pending quotation UI never fabricates a total', (tester) async {
    final controller = CollectionsTabController(
      currentCustomerProvider: const _StaticCustomerProvider(
        'customer-demo-001',
      ),
      collectionRepository: MockCollectionService(),
    );

    await tester.pumpWidget(
      MaterialApp(
        home: CollectionDetailsScreen(
          controller: controller,
          initialCollection: _pendingPhotoCollection(),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Quotation pending'), findsOneWidget);
    expect(find.textContaining('No final price'), findsOneWidget);
    await tester.scrollUntilVisible(find.text('Pending CLEANGO review'), 300);
    expect(find.text('Pending CLEANGO review'), findsOneWidget);
    expect(find.textContaining('0 FCFA'), findsNothing);
  });

  test('Firebase release mode rejects the REST fallback', () {
    expect(
      DataModeConfig.resolve(rawValue: '', isRelease: true),
      CleanGoDataMode.firebase,
    );
    expect(
      () => DataModeConfig.resolve(rawValue: 'restHybrid', isRelease: true),
      throwsStateError,
    );
  });
}

CollectionBookingRequest _bagRequest({
  String requestId = 'stable-request-id',
  String addressId = 'address-a',
  required DateTime date,
  int declaredBagCount = 2,
  CollectionFrequency frequency = CollectionFrequency.once,
}) {
  return CollectionBookingRequest(
    requestId: requestId,
    addressId: addressId,
    bookingMode: CollectionBookingMode.oneTimeBagCount,
    wasteCategory: WasteCategory.household,
    scheduledDate: date,
    scheduledTimeWindow: CollectionTimeWindow.morningEarly,
    frequency: frequency,
    declaredBagCount: declaredBagCount,
    customerNotes: 'Leave at the gate.',
  );
}

class _ExpectedPlan {
  const _ExpectedPlan({
    required this.id,
    required this.frenchName,
    required this.monthlyPriceXaf,
    required this.pickupsPerWeek,
    required this.pickupsPerMonth,
    required this.includedBagsPerPickup,
    this.bagsSupplied = false,
    this.flexibleSchedule = false,
    this.urgentPickup = false,
    this.requiresQuotation = false,
    this.startingPriceXaf,
  });

  final String id;
  final String frenchName;
  final int? monthlyPriceXaf;
  final int pickupsPerWeek;
  final int pickupsPerMonth;
  final int includedBagsPerPickup;
  final bool bagsSupplied;
  final bool flexibleSchedule;
  final bool urgentPickup;
  final bool requiresQuotation;
  final int? startingPriceXaf;
}

class _MemoryBookingStore implements CollectionBookingStore {
  _MemoryBookingStore({Map<String, Address>? addresses})
    : addresses = {...?addresses};

  final Map<String, Address> addresses;
  final Map<String, WasteCollection> collections = {};
  CollectionBookingDraft? lastDraft;

  @override
  Future<Address?> getOwnedAddress({
    required String customerId,
    required String addressId,
  }) async {
    return customerId == 'customer-a' ? addresses[addressId] : null;
  }

  @override
  Future<CollectionBookingResult> createOrGetCollection(
    CollectionBookingDraft draft,
  ) async {
    lastDraft = draft;
    final existing = collections[draft.documentId];
    if (existing != null) {
      return CollectionBookingResult(collection: existing, wasDuplicate: true);
    }
    final createdAt = DateTime.utc(2026, 7, 30, 12);
    final collection = WasteCollection(
      id: draft.documentId,
      customerId: draft.customerId,
      addressId: draft.addressId,
      addressSnapshot: draft.addressSnapshot,
      serviceZone: draft.serviceZone,
      bookingMode: draft.bookingMode,
      collectionType: draft.collectionType,
      wasteCategory: draft.wasteCategory,
      scheduleType: draft.scheduleType,
      scheduledDate: draft.scheduledDateUtc == null
          ? null
          : const CollectionScheduleService().toServiceLocalDate(
              draft.scheduledDateUtc!,
            ),
      scheduledTimeWindow: draft.scheduledTimeWindow,
      frequency: draft.frequency,
      status: draft.status,
      paymentStatus: CollectionPaymentStatus.unpaid,
      pricing: draft.pricing,
      declaredBagCount: draft.declaredBagCount,
      includedBagCount: draft.pricing.includedBagCount,
      extraBagCount: draft.pricing.extraBagCount,
      extraBagRate: draft.pricing.extraBagRate,
      quotationStatus: draft.quotationStatus,
      quotedAmount: null,
      quotationReviewedBy: null,
      quotationReviewedAt: null,
      quotationAcceptedAt: null,
      photoStoragePaths: draft.photoStoragePaths,
      customerNotes: draft.customerNotes,
      createdAt: createdAt,
      updatedAt: createdAt,
    );
    collections[draft.documentId] = collection;
    return CollectionBookingResult(collection: collection, wasDuplicate: false);
  }
}

class _MemorySubscriptionStore implements SubscriptionRequestStore {
  _MemorySubscriptionStore({Map<String, Address>? addresses})
    : addresses = {...?addresses};

  final Map<String, Address> addresses;
  final Map<String, Subscription> subscriptions = {};

  @override
  Future<Address?> getOwnedSubscriptionAddress({
    required String customerId,
    required String addressId,
  }) async {
    return customerId == 'customer-a' ? addresses[addressId] : null;
  }

  @override
  Future<SubscriptionRequestResult> createOrGetSubscription(
    SubscriptionRequestDraft draft,
  ) async {
    final existing = subscriptions[draft.documentId];
    if (existing != null) {
      return SubscriptionRequestResult(
        subscription: existing,
        wasDuplicate: true,
      );
    }
    final timestamp = DateTime.utc(2026, 7, 30, 12);
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
      createdAt: timestamp,
      updatedAt: timestamp,
      cancelledAt: null,
      pricingVersion: draft.plan.pricingVersion,
    );
    subscriptions[draft.documentId] = subscription;
    return SubscriptionRequestResult(
      subscription: subscription,
      wasDuplicate: false,
    );
  }
}

class _StaticCustomerProvider implements CurrentCustomerProvider {
  const _StaticCustomerProvider(this.customerId);

  final String? customerId;

  @override
  Future<String?> getCurrentCustomerId() async => customerId;

  @override
  Future<bool> isLoggedIn() async => customerId != null;

  @override
  Future<void> refresh() async {}
}

WasteCollection _pendingPhotoCollection() {
  const address = CollectionAddressSnapshot(
    label: 'Home',
    addressLine: 'Test address',
    city: 'Yaounde',
    district: 'Test district',
    latitude: 3.86,
    longitude: 11.52,
  );
  const pricing = CollectionPricing(
    currency: 'XAF',
    baseAmount: null,
    includedBagCount: 0,
    extraBagCount: 0,
    extraBagRate: 500,
    extraBagAmount: 0,
    serviceFee: 0,
    discount: 0,
    totalAmount: null,
    pricingVersion: 'approved-v1-2026-07',
    calculationSource: 'pendingAdminQuotation',
  );
  final timestamp = DateTime.utc(2026, 7, 30, 12);
  return WasteCollection(
    id: CollectionBookingService.bookingDocumentId(
      customerId: 'customer-demo-001',
      requestId: 'pending-photo',
    ),
    customerId: 'customer-demo-001',
    addressId: 'address-demo-001',
    addressSnapshot: address,
    serviceZone: 'yaounde',
    bookingMode: CollectionBookingMode.oneTimePhotoQuote,
    collectionType: CollectionType.oneTime,
    wasteCategory: WasteCategory.other,
    scheduleType: CollectionScheduleType.quotationPending,
    scheduledDate: null,
    scheduledTimeWindow: null,
    frequency: CollectionFrequency.once,
    status: CollectionStatus.quotationRequested,
    paymentStatus: CollectionPaymentStatus.unpaid,
    pricing: pricing,
    declaredBagCount: null,
    includedBagCount: 0,
    extraBagCount: 0,
    extraBagRate: 500,
    quotationStatus: CollectionQuotationStatus.requested,
    quotedAmount: null,
    quotationReviewedBy: null,
    quotationReviewedAt: null,
    quotationAcceptedAt: null,
    photoStoragePaths: const ['collection-quotes/redacted/path.jpg'],
    customerNotes: '',
    createdAt: timestamp,
    updatedAt: timestamp,
  );
}

import 'package:ultrawash/core/cleango/collections/collection_booking_service.dart';
import 'package:ultrawash/core/cleango/collections/collection_pricing_service.dart';
import 'package:ultrawash/core/cleango/collections/collection_schedule_service.dart';
import 'package:ultrawash/core/cleango/models/address.dart';
import 'package:ultrawash/core/cleango/models/collection.dart';
import 'package:ultrawash/core/cleango/repositories/collection_repository.dart';

class MockCollectionService
    implements CollectionRepository, CollectionBookingStore {
  MockCollectionService() {
    final now = DateTime.now();
    final future = _scheduleService.firstAvailableDate(nowUtc: now.toUtc());
    final past = now.subtract(const Duration(days: 7));
    final price = _pricingService.quoteOneTimeBagCount(
      declaredBagCount: 2,
      serviceZone: _primaryAddress.serviceZone,
    );
    _collections.addAll([
      _sampleCollection(
        id: 'collection-demo-001',
        date: future,
        status: CollectionStatus.confirmed,
        pricing: price,
        createdAt: now,
      ),
      _sampleCollection(
        id: 'collection-demo-002',
        date: past,
        status: CollectionStatus.completed,
        pricing: price,
        createdAt: past.subtract(const Duration(days: 1)),
      ),
    ]);
  }

  final List<WasteCollection> _collections = [];
  final CollectionPricingService _pricingService =
      const CollectionPricingService();
  final CollectionScheduleService _scheduleService =
      const CollectionScheduleService();

  late final CollectionBookingService _bookingService =
      CollectionBookingService(
        store: this,
        pricingService: _pricingService,
        scheduleService: _scheduleService,
      );

  static const _primaryAddress = Address(
    id: 'address-demo-001',
    label: 'Home',
    street: 'Bastos',
    city: 'Yaounde',
    region: 'Centre',
    country: 'Cameroon',
    latitude: 3.884,
    longitude: 11.502,
    serviceZone: CollectionPricingService.supportedServiceZone,
    isWithinServiceArea: true,
    isPrimary: true,
  );

  @override
  Future<List<Address>> getSavedAddresses(String customerId) async {
    return customerId == 'customer-demo-001'
        ? const [_primaryAddress]
        : const [];
  }

  @override
  CollectionPricing quoteCollection({
    required CollectionBookingMode bookingMode,
    required int? declaredBagCount,
    required String serviceZone,
  }) {
    return _bookingService.quote(
      bookingMode: bookingMode,
      declaredBagCount: declaredBagCount,
      serviceZone: serviceZone,
    );
  }

  @override
  Future<CollectionBookingResult> bookCollection(
    CollectionBookingRequest request,
  ) {
    return _bookingService.book(
      customerId: 'customer-demo-001',
      request: request,
    );
  }

  @override
  Future<List<WasteCollection>> getUpcomingCollections(
    String customerId,
  ) async {
    return List.unmodifiable(
      _collections.where(
        (collection) =>
            collection.customerId == customerId && collection.isUpcoming,
      ),
    );
  }

  @override
  Future<List<WasteCollection>> getCollectionHistory(String customerId) async {
    return List.unmodifiable(
      _collections.where(
        (collection) =>
            collection.customerId == customerId && !collection.isUpcoming,
      ),
    );
  }

  @override
  Future<WasteCollection?> getCollectionById(String collectionId) async {
    return _find(collectionId);
  }

  @override
  Future<WasteCollection> rescheduleCollection(
    String collectionId,
    DateTime scheduledDate,
    String timeWindow,
  ) async {
    final collection = _requireCollection(collectionId);
    final window =
        CollectionTimeWindow.fromWireValue(timeWindow) ??
        collection.scheduledTimeWindow;
    return _replace(
      collection.copyWith(
        scheduledDate: scheduledDate,
        scheduledTimeWindow: window,
        status: CollectionStatus.pending,
        updatedAt: DateTime.now(),
      ),
    );
  }

  @override
  Future<WasteCollection> reportMissedCollection(String collectionId) async {
    final collection = _requireCollection(collectionId);
    return _replace(
      collection.copyWith(
        status: CollectionStatus.missed,
        updatedAt: DateTime.now(),
      ),
    );
  }

  @override
  Future<WasteCollection> cancelCollection(String collectionId) async {
    final collection = _requireCollection(collectionId);
    if (!collection.canCancel) {
      throw const CollectionBookingException(
        'cancellation-not-allowed',
        'Only quotation, pending, or confirmed requests can be cancelled.',
      );
    }
    final now = DateTime.now();
    return _replace(
      collection.copyWith(
        status: CollectionStatus.cancelled,
        cancelledAt: now,
        updatedAt: now,
      ),
    );
  }

  @override
  Future<WasteCollection> acceptQuotation(String collectionId) async {
    final collection = _requireCollection(collectionId);
    if (!collection.canAcceptQuotation) {
      throw const CollectionBookingException(
        'quotation-not-ready',
        'CLEANGO has not issued a quotation for this request yet.',
      );
    }
    final now = DateTime.now();
    return _replace(
      collection.copyWith(
        quotationStatus: CollectionQuotationStatus.accepted,
        quotationAcceptedAt: now,
        updatedAt: now,
      ),
    );
  }

  @override
  Future<Address?> getOwnedAddress({
    required String customerId,
    required String addressId,
  }) async {
    if (customerId == 'customer-demo-001' && addressId == _primaryAddress.id) {
      return _primaryAddress;
    }
    return null;
  }

  @override
  Future<CollectionBookingResult> createOrGetCollection(
    CollectionBookingDraft draft,
  ) async {
    final existing = _find(draft.documentId);
    if (existing != null) {
      return CollectionBookingResult(collection: existing, wasDuplicate: true);
    }
    final now = DateTime.now();
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
          : _scheduleService.toServiceLocalDate(draft.scheduledDateUtc!),
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
      createdAt: now,
      updatedAt: now,
    );
    _collections.add(collection);
    return CollectionBookingResult(collection: collection, wasDuplicate: false);
  }

  WasteCollection? _find(String collectionId) {
    for (final collection in _collections) {
      if (collection.id == collectionId) return collection;
    }
    return null;
  }

  WasteCollection _requireCollection(String collectionId) {
    final collection = _find(collectionId);
    if (collection == null) {
      throw StateError('Collection not found: $collectionId');
    }
    return collection;
  }

  WasteCollection _replace(WasteCollection collection) {
    final index = _collections.indexWhere((item) => item.id == collection.id);
    _collections[index] = collection;
    return collection;
  }

  static WasteCollection _sampleCollection({
    required String id,
    required DateTime date,
    required CollectionStatus status,
    required CollectionPricing pricing,
    required DateTime createdAt,
  }) {
    return WasteCollection(
      id: id,
      customerId: 'customer-demo-001',
      addressId: _primaryAddress.id,
      addressSnapshot: CollectionAddressSnapshot.fromAddress(_primaryAddress),
      serviceZone: _primaryAddress.serviceZone,
      bookingMode: CollectionBookingMode.oneTimeBagCount,
      collectionType: CollectionType.oneTime,
      wasteCategory: WasteCategory.household,
      scheduleType: CollectionScheduleType.customerSelected,
      scheduledDate: date,
      scheduledTimeWindow: CollectionTimeWindow.morningEarly,
      frequency: CollectionFrequency.once,
      status: status,
      paymentStatus: CollectionPaymentStatus.unpaid,
      pricing: pricing,
      declaredBagCount: 2,
      includedBagCount: pricing.includedBagCount,
      extraBagCount: pricing.extraBagCount,
      extraBagRate: pricing.extraBagRate,
      quotationStatus: CollectionQuotationStatus.notRequired,
      quotedAmount: null,
      quotationReviewedBy: null,
      quotationReviewedAt: null,
      quotationAcceptedAt: null,
      photoStoragePaths: const [],
      customerNotes: '',
      createdAt: createdAt,
      updatedAt: createdAt,
      completedAt: status == CollectionStatus.completed ? date : null,
    );
  }
}

import 'package:ultrawash/core/cleango/collections/collection_pricing_service.dart';
import 'package:ultrawash/core/cleango/models/address.dart';
import 'package:ultrawash/core/cleango/models/collection.dart';
import 'package:ultrawash/core/cleango/repositories/collection_repository.dart';
import 'package:ultrawash/core/service/api_service/api_service.dart';

class RestCollectionRepository implements CollectionRepository {
  RestCollectionRepository({NetworkService? networkService})
    : _networkService = networkService ?? NetworkService();

  final NetworkService _networkService;
  final CollectionPricingService _pricingService =
      const CollectionPricingService();

  @override
  Future<List<Address>> getSavedAddresses(String customerId) async {
    return const [];
  }

  @override
  CollectionPricing quoteCollection({
    required CollectionBookingMode bookingMode,
    required int? declaredBagCount,
    required String serviceZone,
  }) {
    return switch (bookingMode) {
      CollectionBookingMode.oneTimeBagCount =>
        _pricingService.quoteOneTimeBagCount(
          declaredBagCount: declaredBagCount ?? 0,
          serviceZone: serviceZone,
        ),
      CollectionBookingMode.oneTimePhotoQuote =>
        _pricingService.pendingPhotoQuotation(serviceZone: serviceZone),
      CollectionBookingMode.subscription => throw UnsupportedError(
        'Choose subscriptions through the CLEANGO plan catalogue.',
      ),
    };
  }

  @override
  Future<CollectionBookingResult> bookCollection(
    CollectionBookingRequest request,
  ) {
    throw UnsupportedError(
      'CLEANGO collection booking requires Firebase data mode.',
    );
  }

  @override
  Future<List<WasteCollection>> getUpcomingCollections(
    String customerId,
  ) async {
    final collections = await _getCollections(
      customerId: customerId,
      status: 'ongoing',
    );
    return List.unmodifiable(
      collections.where((collection) => collection.isUpcoming),
    );
  }

  @override
  Future<List<WasteCollection>> getCollectionHistory(String customerId) async {
    final collections = await _getCollections(
      customerId: customerId,
      status: 'all',
    );
    return List.unmodifiable(
      collections.where((collection) => !collection.isUpcoming),
    );
  }

  @override
  Future<WasteCollection?> getCollectionById(String collectionId) async {
    final response = await _networkService.client.getRequest(
      '/orders/$collectionId',
    );
    if (!response.isSuccess) {
      if (response.statusCode == 400 || response.statusCode == 404) return null;
      throw StateError(
        response.errorMessage ?? 'Unable to load collection details',
      );
    }
    final envelope = _map(response.responseData);
    final data = _map(envelope?['data']);
    return data == null ? null : _fromLegacyOrder(data);
  }

  @override
  Future<WasteCollection> rescheduleCollection(
    String collectionId,
    DateTime scheduledDate,
    String timeWindow,
  ) {
    throw UnsupportedError(
      'The legacy backend does not expose customer rescheduling.',
    );
  }

  @override
  Future<WasteCollection> reportMissedCollection(String collectionId) {
    throw UnsupportedError(
      'The legacy backend does not expose missed-collection reporting.',
    );
  }

  @override
  Future<WasteCollection> cancelCollection(String collectionId) {
    throw UnsupportedError('CLEANGO cancellation requires Firebase data mode.');
  }

  @override
  Future<WasteCollection> acceptQuotation(String collectionId) {
    throw UnsupportedError(
      'CLEANGO quotation acceptance requires Firebase data mode.',
    );
  }

  Future<List<WasteCollection>> _getCollections({
    required String customerId,
    required String status,
  }) async {
    final response = await _networkService.client.getRequest(
      '/orders/my-orders',
      query: {'status': status},
    );
    if (!response.isSuccess) {
      throw StateError(response.errorMessage ?? 'Unable to load collections');
    }
    final envelope = _map(response.responseData);
    final raw = envelope?['data'];
    if (raw is! List) return const [];
    return raw
        .map(_map)
        .whereType<Map<String, dynamic>>()
        .map((order) => _fromLegacyOrder(order, customerId: customerId))
        .toList(growable: false);
  }

  WasteCollection _fromLegacyOrder(
    Map<String, dynamic> order, {
    String customerId = '',
  }) {
    final schedule = _map(order['schedule']);
    final shipping = _map(order['shippingInfo']);
    final location = _map(order['customerLocation']);
    final coordinates = location?['coordinates'];
    final date =
        _date(
          schedule?['pickupDate'] ??
              order['scheduledDate'] ??
              order['orderDate'] ??
              order['createdAt'],
        ) ??
        DateTime.fromMillisecondsSinceEpoch(0);
    final id = _first([order['_id'], order['id'], order['orderId']]);
    final addressLine = _first([
      order['address'],
      shipping?['address'],
      'Address unavailable',
    ]);
    final total = _integer(order['totalAmount'] ?? order['total']);
    final createdAt = _date(order['createdAt']) ?? date;

    return WasteCollection(
      id: id,
      customerId: customerId.isNotEmpty ? customerId : _entityId(order['user']),
      addressId: 'legacy-order-address',
      addressSnapshot: CollectionAddressSnapshot(
        label: 'Collection address',
        addressLine: addressLine,
        city: '',
        district: '',
        latitude: _coordinate(coordinates, 1),
        longitude: _coordinate(coordinates, 0),
      ),
      serviceZone: 'legacy-unknown',
      bookingMode: CollectionBookingMode.oneTimeBagCount,
      collectionType: CollectionType.oneTime,
      wasteCategory: _legacyCategory(order),
      scheduleType: CollectionScheduleType.customerSelected,
      scheduledDate: date,
      scheduledTimeWindow: _legacyWindow(
        _first([schedule?['pickupSlot'], order['timeWindow']]),
      ),
      frequency: CollectionFrequency.once,
      status: _legacyStatus(order['status']),
      paymentStatus: CollectionPaymentStatus.unpaid,
      pricing: CollectionPricing(
        currency: 'XAF',
        baseAmount: total,
        includedBagCount: 0,
        extraBagCount: 0,
        extraBagRate: 0,
        extraBagAmount: 0,
        serviceFee: 0,
        discount: 0,
        totalAmount: total,
        pricingVersion: 'legacy-rest',
        calculationSource: 'legacy-rest-display-only',
      ),
      declaredBagCount: null,
      includedBagCount: 0,
      extraBagCount: 0,
      extraBagRate: 0,
      quotationStatus: CollectionQuotationStatus.notRequired,
      quotedAmount: null,
      quotationReviewedBy: null,
      quotationReviewedAt: null,
      quotationAcceptedAt: null,
      photoStoragePaths: const [],
      customerNotes: '',
      createdAt: createdAt,
      updatedAt: _date(order['updatedAt']) ?? createdAt,
      completedAt: _date(order['deliveredAt'] ?? order['pickedUpAt']),
    );
  }
}

CollectionStatus _legacyStatus(Object? value) {
  final normalized = _string(
    value,
  ).toLowerCase().replaceAll('-', '_').replaceAll(' ', '_');
  return switch (normalized) {
    'confirmed' => CollectionStatus.confirmed,
    'pickup_assigned' || 'collector_assigned' => CollectionStatus.assigned,
    'at_warehouse' ||
    'in_process' ||
    'cleaned' ||
    'ready' ||
    'delivery_assigned' ||
    'out_for_delivery' => CollectionStatus.inProgress,
    'picked_up' || 'delivered' || 'completed' => CollectionStatus.completed,
    'missed' => CollectionStatus.missed,
    'cancelled' || 'canceled' => CollectionStatus.cancelled,
    _ => CollectionStatus.pending,
  };
}

WasteCategory _legacyCategory(Map<String, dynamic> order) {
  final signal = _string(
    order['wasteType'] ?? order['itemsSummary'],
  ).toLowerCase();
  if (signal.contains('commercial') || signal.contains('business')) {
    return WasteCategory.officeBusiness;
  }
  if (signal.contains('household') || signal.isEmpty) {
    return WasteCategory.household;
  }
  return WasteCategory.other;
}

CollectionTimeWindow _legacyWindow(String value) {
  final normalized = value.toLowerCase();
  if (normalized.contains('10') && normalized.contains('12')) {
    return CollectionTimeWindow.morningLate;
  }
  if (normalized.contains('14') || normalized.contains('1:00 pm')) {
    return CollectionTimeWindow.afternoonEarly;
  }
  if (normalized.contains('16') || normalized.contains('4:00 pm')) {
    return CollectionTimeWindow.afternoonLate;
  }
  return CollectionTimeWindow.morningEarly;
}

Map<String, dynamic>? _map(Object? value) {
  if (value is Map<String, dynamic>) return value;
  if (value is Map) return Map<String, dynamic>.from(value);
  return null;
}

String _string(Object? value) => value?.toString().trim() ?? '';

String _first(List<Object?> values) {
  for (final value in values) {
    final candidate = _string(value);
    if (candidate.isNotEmpty) return candidate;
  }
  return '';
}

String _entityId(Object? value) {
  final entity = _map(value);
  return _first([entity?['_id'], entity?['id'], value]);
}

DateTime? _date(Object? value) {
  if (value is DateTime) return value;
  return DateTime.tryParse(_string(value));
}

int _integer(Object? value) {
  if (value is num) return value.toInt();
  return int.tryParse(_string(value)) ?? 0;
}

double? _coordinate(Object? coordinates, int index) {
  if (coordinates is! List || coordinates.length <= index) return null;
  final value = coordinates[index];
  if (value is num) return value.toDouble();
  return double.tryParse(_string(value));
}

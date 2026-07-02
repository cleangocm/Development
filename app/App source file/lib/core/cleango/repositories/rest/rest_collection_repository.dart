import 'package:ultrawash/core/cleango/models/address.dart';
import 'package:ultrawash/core/cleango/models/collection.dart';
import 'package:ultrawash/core/cleango/repositories/collection_repository.dart';
import 'package:ultrawash/core/service/api_service/api_service.dart';

class RestCollectionRepository implements CollectionRepository {
  RestCollectionRepository({NetworkService? networkService})
    : _networkService = networkService ?? NetworkService();

  final NetworkService _networkService;

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

    final envelope = _asMap(response.responseData);
    final data = _asMap(envelope?['data']);
    if (data == null) return null;
    return _CollectionDto.fromJson(data).toDomain();
  }

  @override
  Future<WasteCollection> rescheduleCollection(
    String collectionId,
    DateTime scheduledDate,
    String timeWindow,
  ) {
    throw UnsupportedError(
      'The current backend does not expose a customer reschedule endpoint.',
    );
  }

  @override
  Future<WasteCollection> reportMissedCollection(String collectionId) {
    throw UnsupportedError(
      'The current backend does not expose a missed-collection endpoint.',
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

    final envelope = _asMap(response.responseData);
    final rawCollections = envelope?['data'];
    if (rawCollections is! List) {
      throw const FormatException('Collection list response is missing data');
    }

    return rawCollections
        .map(_asMap)
        .whereType<Map<String, dynamic>>()
        .map(
          (json) => _CollectionDto.fromJson(
            json,
            fallbackCustomerId: customerId,
          ).toDomain(),
        )
        .toList(growable: false);
  }
}

class _CollectionDto {
  const _CollectionDto({
    required this.id,
    required this.customerId,
    required this.scheduledDate,
    required this.timeWindow,
    required this.wasteType,
    required this.address,
    required this.status,
    required this.timeline,
    this.collectorName,
    this.completedAt,
  });

  factory _CollectionDto.fromJson(
    Map<String, dynamic> json, {
    String fallbackCustomerId = '',
  }) {
    final schedule = _asMap(json['schedule']);
    final timeline = _timelineFromJson(json['trackingSteps']);
    final status = _collectionStatus(json['status'], timeline);

    return _CollectionDto(
      id: _stringValue(json['_id'] ?? json['id'] ?? json['orderId']),
      customerId: _entityId(json['user']) ?? fallbackCustomerId,
      scheduledDate: _scheduledDate(json, schedule),
      timeWindow: _firstNonEmpty([
        schedule?['pickupSlot'],
        json['timeWindow'],
        'Time pending',
      ]),
      wasteType: _wasteType(json),
      address: _AddressDto.fromOrder(json).toDomain(),
      status: status,
      timeline: timeline,
      collectorName: _entityName(json['pickupDeliveryBoy']),
      completedAt: status == CollectionStatus.completed
          ? _dateValue(
              json['pickedUpAt'] ?? json['deliveredAt'] ?? json['updatedAt'],
            )
          : null,
    );
  }

  final String id;
  final String customerId;
  final DateTime scheduledDate;
  final String timeWindow;
  final WasteType wasteType;
  final Address address;
  final CollectionStatus status;
  final List<_TimelineStepDto> timeline;
  final String? collectorName;
  final DateTime? completedAt;

  WasteCollection toDomain() {
    if (id.isEmpty) {
      throw const FormatException('Collection is missing an id');
    }
    return WasteCollection(
      id: id,
      customerId: customerId,
      scheduledDate: scheduledDate,
      timeWindow: timeWindow,
      wasteType: wasteType,
      address: address,
      status: status,
      collectorName: collectorName,
      completedAt: completedAt,
    );
  }
}

class _TimelineStepDto {
  const _TimelineStepDto({
    required this.title,
    required this.status,
    this.date,
  });

  factory _TimelineStepDto.fromJson(Map<String, dynamic> json) {
    return _TimelineStepDto(
      title: _stringValue(json['title']),
      status: _stringValue(json['status']).toLowerCase(),
      date: _nullableString(json['date']),
    );
  }

  final String title;
  final String status;
  final String? date;
}

class _AddressDto {
  const _AddressDto({
    required this.street,
    required this.latitude,
    required this.longitude,
  });

  factory _AddressDto.fromOrder(Map<String, dynamic> json) {
    final shipping = _asMap(json['shippingInfo']);
    final billing = _asMap(json['billingInfo']);
    final location = _asMap(json['customerLocation']);
    final coordinates = location?['coordinates'];

    return _AddressDto(
      street: _firstNonEmpty([
        json['address'],
        shipping?['address'],
        billing?['address'],
        'Address pending',
      ]),
      longitude: _coordinate(coordinates, 0),
      latitude: _coordinate(coordinates, 1),
    );
  }

  final String street;
  final double latitude;
  final double longitude;

  Address toDomain() {
    return Address(
      id: 'collection-address',
      label: 'Collection address',
      street: street,
      city: '',
      region: '',
      country: 'Cameroon',
      latitude: latitude,
      longitude: longitude,
      serviceZone: '',
      isWithinServiceArea: latitude != 0 || longitude != 0,
      isPrimary: false,
    );
  }
}

CollectionStatus _collectionStatus(
  dynamic rawStatus,
  List<_TimelineStepDto> timeline,
) {
  final status = _stringValue(
    rawStatus,
  ).toLowerCase().replaceAll('-', '_').replaceAll(' ', '_');

  switch (status) {
    case 'pending':
    case 'confirmed':
    case 'scheduled':
      return CollectionStatus.scheduled;
    case 'pickup_assigned':
    case 'collector_assigned':
      return CollectionStatus.collectorAssigned;
    case 'picked_up':
    case 'delivered':
    case 'completed':
      return CollectionStatus.completed;
    case 'cancelled':
    case 'canceled':
      return CollectionStatus.cancelled;
    case 'missed':
      return CollectionStatus.missed;
    case 'at_warehouse':
    case 'in_process':
    case 'cleaned':
    case 'ready':
    case 'delivery_assigned':
    case 'out_for_delivery':
      return CollectionStatus.inProgress;
  }

  final currentStep = timeline.where((step) => step.status == 'current');
  if (currentStep.isNotEmpty) {
    final title = currentStep.first.title.toLowerCase();
    if (title.contains('assign')) return CollectionStatus.collectorAssigned;
    if (title.contains('picked up') || title.contains('delivered')) {
      return CollectionStatus.completed;
    }
    return CollectionStatus.inProgress;
  }

  return CollectionStatus.scheduled;
}

List<_TimelineStepDto> _timelineFromJson(dynamic value) {
  if (value is! List) return const [];
  return value
      .map(_asMap)
      .whereType<Map<String, dynamic>>()
      .map(_TimelineStepDto.fromJson)
      .toList(growable: false);
}

WasteType _wasteType(Map<String, dynamic> json) {
  final items = json['items'];
  final signal = [
    json['wasteType'],
    json['itemsSummary'],
    if (items is List)
      ...items.map((item) {
        final itemJson = _asMap(item);
        return "${_stringValue(itemJson?['serviceName'])} ${_stringValue(itemJson?['name'])}";
      }),
  ].map(_stringValue).join(' ').toLowerCase();

  if (signal.contains('medical')) return WasteType.medical;
  if (signal.contains('organic') || signal.contains('food')) {
    return WasteType.organic;
  }
  if (signal.contains('recycl')) return WasteType.recyclable;
  if (signal.contains('commercial') || signal.contains('business')) {
    return WasteType.commercial;
  }
  if (signal.contains('bulky') || signal.contains('furniture')) {
    return WasteType.bulky;
  }
  return WasteType.household;
}

DateTime _scheduledDate(
  Map<String, dynamic> json,
  Map<String, dynamic>? schedule,
) {
  return _dateValue(
        schedule?['pickupDate'] ??
            json['scheduledDate'] ??
            json['orderDate'] ??
            json['createdAt'],
      ) ??
      DateTime.fromMillisecondsSinceEpoch(0, isUtc: true);
}

Map<String, dynamic>? _asMap(dynamic value) {
  if (value is Map<String, dynamic>) return value;
  if (value is Map) return Map<String, dynamic>.from(value);
  return null;
}

String _stringValue(dynamic value) => value?.toString().trim() ?? '';

String? _nullableString(dynamic value) {
  final string = _stringValue(value);
  return string.isEmpty || string == 'Pending' || string == '-' ? null : string;
}

String _firstNonEmpty(List<dynamic> values) {
  for (final value in values) {
    final string = _stringValue(value);
    if (string.isNotEmpty) return string;
  }
  return '';
}

String? _entityId(dynamic value) {
  final entity = _asMap(value);
  return _nullableString(entity?['_id'] ?? entity?['id'] ?? value);
}

String? _entityName(dynamic value) {
  final entity = _asMap(value);
  return _nullableString(entity?['name']);
}

DateTime? _dateValue(dynamic value) {
  if (value is DateTime) return value;
  if (value is String && value.isNotEmpty && value != 'Pending') {
    return DateTime.tryParse(value);
  }
  return null;
}

double _coordinate(dynamic coordinates, int index) {
  if (coordinates is! List || coordinates.length <= index) return 0;
  final value = coordinates[index];
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value) ?? 0;
  return 0;
}

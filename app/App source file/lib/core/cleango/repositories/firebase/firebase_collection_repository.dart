import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:ultrawash/core/cleango/models/address.dart';
import 'package:ultrawash/core/cleango/models/collection.dart';
import 'package:ultrawash/core/cleango/repositories/collection_repository.dart';

class FirebaseCollectionRepository implements CollectionRepository {
  FirebaseCollectionRepository({
    FirebaseFirestore? firestore,
    FirebaseAuth? firebaseAuth,
    FirebaseFunctions? functions,
  }) : _firestore = firestore ?? FirebaseFirestore.instance,
       _firebaseAuth = firebaseAuth ?? FirebaseAuth.instance,
       _functions =
           functions ?? FirebaseFunctions.instanceFor(region: 'europe-west1');

  final FirebaseFirestore _firestore;
  final FirebaseAuth _firebaseAuth;
  final FirebaseFunctions _functions;

  @override
  Future<List<WasteCollection>> getUpcomingCollections(
    String customerId,
  ) async {
    _assertCurrentCustomer(customerId);
    final collections = await _readCustomerPickups(customerId);
    return List.unmodifiable(
      collections.where((collection) => collection.isUpcoming),
    );
  }

  @override
  Future<List<WasteCollection>> getCollectionHistory(String customerId) async {
    _assertCurrentCustomer(customerId);
    final collections = await _readCustomerPickups(customerId);
    return List.unmodifiable(
      collections.where((collection) => !collection.isUpcoming),
    );
  }

  @override
  Future<WasteCollection?> getCollectionById(String collectionId) async {
    final uid = _currentUid();
    final snapshot = await _firestore
        .collection('pickups')
        .doc(collectionId)
        .get();
    if (!snapshot.exists) return null;

    final data = snapshot.data() ?? <String, dynamic>{};
    if (_stringValue(data['customerId']) != uid) {
      throw StateError('Cannot read another customer pickup.');
    }
    return _collectionFromDocument(snapshot);
  }

  @override
  Future<WasteCollection> rescheduleCollection(
    String collectionId,
    DateTime scheduledDate,
    String timeWindow,
  ) async {
    await _verifyPickupOwner(collectionId);

    final callable = _functions.httpsCallable('reschedulePickup');
    await callable.call<Map<String, dynamic>>({
      'pickupId': collectionId,
      'scheduledDate': _dateOnly(scheduledDate),
    });

    final updated = await getCollectionById(collectionId);
    if (updated == null) {
      throw StateError('Pickup was not found after rescheduling.');
    }
    return updated.copyWith(
      timeWindow: timeWindow.isEmpty ? updated.timeWindow : timeWindow,
    );
  }

  @override
  Future<WasteCollection> reportMissedCollection(String collectionId) {
    throw UnsupportedError(
      'Reporting a missed collection requires a customer-safe Cloud Function. '
      'The existing pickup status function is collector/admin controlled, so the '
      'mobile app must not write missed status directly.',
    );
  }

  Future<List<WasteCollection>> _readCustomerPickups(String customerId) async {
    final snapshot = await _firestore
        .collection('pickups')
        .where('customerId', isEqualTo: customerId)
        .get();

    final collections = await Future.wait(
      snapshot.docs.map(_collectionFromDocument),
    );
    collections.sort((a, b) => a.scheduledDate.compareTo(b.scheduledDate));
    return collections;
  }

  Future<WasteCollection> _collectionFromDocument(
    DocumentSnapshot<Map<String, dynamic>> document,
  ) async {
    final data = document.data() ?? <String, dynamic>{};
    final collectorData = await _readCollectorData(data);
    final addressData = await _readAddressData(data);

    return _FirebaseCollectionDto.fromFirestore(
      id: document.id,
      data: data,
      collectorData: collectorData,
      addressData: addressData,
    ).toDomain();
  }

  Future<Map<String, dynamic>?> _readCollectorData(
    Map<String, dynamic> data,
  ) async {
    final collectorId = _stringValue(data['collectorId']);
    if (collectorId.isEmpty) return null;

    try {
      final snapshot = await _firestore
          .collection('collectors')
          .doc(collectorId)
          .get();
      return snapshot.data();
    } on FirebaseException catch (error) {
      if (error.code == 'permission-denied' || error.code == 'not-found') {
        return null;
      }
      rethrow;
    }
  }

  Future<Map<String, dynamic>?> _readAddressData(
    Map<String, dynamic> data,
  ) async {
    final embedded = _asMap(data['address'] ?? data['primaryAddress']);
    if (embedded != null) return embedded;

    final addressId = _stringValue(data['addressId']);
    if (addressId.isEmpty) return null;

    try {
      final snapshot = await _firestore
          .collection('addresses')
          .doc(addressId)
          .get();
      final address = snapshot.data();
      if (address == null) return null;
      return {...address, 'id': snapshot.id};
    } on FirebaseException catch (error) {
      if (error.code == 'permission-denied' || error.code == 'not-found') {
        return null;
      }
      rethrow;
    }
  }

  Future<void> _verifyPickupOwner(String collectionId) async {
    final uid = _currentUid();
    final snapshot = await _firestore
        .collection('pickups')
        .doc(collectionId)
        .get();
    if (!snapshot.exists) throw StateError('Pickup was not found.');
    final data = snapshot.data() ?? <String, dynamic>{};
    if (_stringValue(data['customerId']) != uid) {
      throw StateError('Cannot modify another customer pickup.');
    }
  }

  void _assertCurrentCustomer(String customerId) {
    final uid = _currentUid();
    if (uid != customerId) {
      throw StateError('Cannot read another customer pickups.');
    }
  }

  String _currentUid() {
    final uid = _firebaseAuth.currentUser?.uid;
    if (uid == null || uid.isEmpty) {
      throw StateError('A Firebase user is required to read pickups.');
    }
    return uid;
  }
}

class _FirebaseCollectionDto {
  const _FirebaseCollectionDto({
    required this.id,
    required this.customerId,
    required this.scheduledDate,
    required this.timeWindow,
    required this.wasteType,
    required this.address,
    required this.status,
    this.collectorName,
    this.completedAt,
  });

  factory _FirebaseCollectionDto.fromFirestore({
    required String id,
    required Map<String, dynamic> data,
    required Map<String, dynamic>? collectorData,
    required Map<String, dynamic>? addressData,
  }) {
    final status = _statusValue(data['status']);
    return _FirebaseCollectionDto(
      id: id,
      customerId: _stringValue(data['customerId']),
      scheduledDate: _dateValue(data['scheduledDate']) ?? DateTime.now(),
      timeWindow: _firstNonEmpty([
        data['timeWindow'],
        data['pickupWindow'],
        data['scheduledWindow'],
        data['preferredTimeWindow'],
        'Time pending',
      ]),
      wasteType: _wasteType(data),
      address: _FirebasePickupAddressDto.fromFirestore(
        pickupId: id,
        data: data,
        addressData: addressData,
      ),
      status: status,
      collectorName: _collectorName(data, collectorData),
      completedAt: status == CollectionStatus.completed
          ? _dateValue(data['completedAt'] ?? data['updatedAt'])
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
  final String? collectorName;
  final DateTime? completedAt;

  WasteCollection toDomain() {
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

class _FirebasePickupAddressDto {
  const _FirebasePickupAddressDto._();

  static Address fromFirestore({
    required String pickupId,
    required Map<String, dynamic> data,
    required Map<String, dynamic>? addressData,
  }) {
    final location = _asMap(data['location'] ?? addressData?['location']);
    final geoPoint = data['geoPoint'] ?? addressData?['geoPoint'];
    final coordinates = location?['coordinates'];

    return Address(
      id: _firstNonEmpty([
        addressData?['id'],
        data['addressId'],
        '$pickupId-address',
      ]),
      label: _firstNonEmpty([addressData?['label'], 'Collection address']),
      street: _firstNonEmpty([
        data['addressText'],
        data['locationDetails'],
        addressData?['street'],
        addressData?['address'],
        'Address pending',
      ]),
      city: _firstNonEmpty([addressData?['city'], data['city']]),
      region: _firstNonEmpty([addressData?['region'], data['region']]),
      country: _firstNonEmpty([addressData?['country'], 'Cameroon']),
      latitude: _coordinate(
        data['latitude'] ?? addressData?['latitude'],
        coordinates,
        1,
        geoPoint,
      ),
      longitude: _coordinate(
        data['longitude'] ?? addressData?['longitude'],
        coordinates,
        0,
        geoPoint,
      ),
      serviceZone: _firstNonEmpty([
        data['serviceZoneName'],
        data['serviceZoneId'],
        addressData?['serviceZone'],
      ]),
      isWithinServiceArea: true,
      isPrimary: false,
    );
  }
}

CollectionStatus _statusValue(dynamic value) {
  final status = _stringValue(
    value,
  ).toLowerCase().replaceAll('-', '_').replaceAll(' ', '_');
  switch (status) {
    case 'scheduled':
      return CollectionStatus.scheduled;
    case 'assigned':
    case 'collector_assigned':
    case 'pickup_assigned':
      return CollectionStatus.collectorAssigned;
    case 'en_route':
    case 'arrived':
    case 'in_progress':
    case 'rescheduled':
      return CollectionStatus.inProgress;
    case 'completed':
      return CollectionStatus.completed;
    case 'missed':
      return CollectionStatus.missed;
    case 'cancelled':
    case 'canceled':
      return CollectionStatus.cancelled;
    default:
      return CollectionStatus.scheduled;
  }
}

WasteType _wasteType(Map<String, dynamic> data) {
  final value = _firstNonEmpty([
    data['wasteType'],
    data['type'],
    data['category'],
  ]).toLowerCase().replaceAll('-', '_').replaceAll(' ', '_');

  switch (value) {
    case 'recyclable':
    case 'recycling':
      return WasteType.recyclable;
    case 'organic':
      return WasteType.organic;
    case 'commercial':
    case 'business':
      return WasteType.commercial;
    case 'medical':
      return WasteType.medical;
    case 'bulky':
    case 'large':
      return WasteType.bulky;
    case 'household':
    case 'domestic':
    default:
      return WasteType.household;
  }
}

String? _collectorName(
  Map<String, dynamic> data,
  Map<String, dynamic>? collectorData,
) {
  final name = _firstNonEmpty([
    data['collectorName'],
    collectorData?['fullName'],
    collectorData?['name'],
    collectorData?['displayName'],
  ]);
  return name.isEmpty ? null : name;
}

DateTime? _dateValue(dynamic value) {
  if (value is Timestamp) return value.toDate();
  if (value is DateTime) return value;
  if (value is String) return DateTime.tryParse(value);
  if (value is int) return DateTime.fromMillisecondsSinceEpoch(value);
  return null;
}

String _dateOnly(DateTime date) {
  final month = date.month.toString().padLeft(2, '0');
  final day = date.day.toString().padLeft(2, '0');
  return '${date.year}-$month-$day';
}

Map<String, dynamic>? _asMap(dynamic value) {
  if (value is Map<String, dynamic>) return value;
  if (value is Map) return Map<String, dynamic>.from(value);
  return null;
}

String _stringValue(dynamic value) => value?.toString().trim() ?? '';

String _firstNonEmpty(List<dynamic> values) {
  for (final value in values) {
    final string = _stringValue(value);
    if (string.isNotEmpty) return string;
  }
  return '';
}

double _coordinate(
  dynamic directValue,
  dynamic coordinates,
  int coordinateIndex,
  dynamic geoPoint,
) {
  if (directValue is num) return directValue.toDouble();
  if (directValue is String) return double.tryParse(directValue) ?? 0;
  if (geoPoint is GeoPoint) {
    return coordinateIndex == 1 ? geoPoint.latitude : geoPoint.longitude;
  }
  if (coordinates is List && coordinates.length > coordinateIndex) {
    final value = coordinates[coordinateIndex];
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0;
  }
  return 0;
}

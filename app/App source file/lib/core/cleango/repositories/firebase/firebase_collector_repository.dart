import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:ultrawash/core/cleango/collectors/collector.dart';
import 'package:ultrawash/core/cleango/collectors/collector_status_policy.dart';
import 'package:ultrawash/core/cleango/collections/collection_schedule_service.dart';
import 'package:ultrawash/core/cleango/models/collection.dart';
import 'package:ultrawash/core/cleango/repositories/collector_repository.dart';

class FirebaseCollectorRepository implements CollectorRepository {
  FirebaseCollectorRepository({
    FirebaseFirestore? firestore,
    FirebaseAuth? firebaseAuth,
  }) : _firestore = firestore ?? FirebaseFirestore.instance,
       _firebaseAuth = firebaseAuth ?? FirebaseAuth.instance;

  final FirebaseFirestore _firestore;
  final FirebaseAuth _firebaseAuth;

  @override
  Future<CollectorProfile?> getCurrentCollector() async {
    final uid = _currentUid();
    final snapshot = await _firestore.collection('collectors').doc(uid).get();
    if (!snapshot.exists) return null;
    return _profileFromDocument(snapshot, expectedUid: uid);
  }

  @override
  Future<List<CollectorAssignment>> getAssignedCollections() async {
    final profile = await _requireOperationalCollector();
    final snapshot = await _firestore
        .collection('collections')
        .where('assignedWorkerId', isEqualTo: profile.uid)
        .get();
    final assignments =
        snapshot.docs
            .map(_assignmentFromDocument)
            .where((assignment) => assignment.assignedWorkerId == profile.uid)
            .toList(growable: false)
          ..sort((left, right) {
            final leftDate =
                left.scheduledDate ??
                DateTime.fromMillisecondsSinceEpoch(0, isUtc: true);
            final rightDate =
                right.scheduledDate ??
                DateTime.fromMillisecondsSinceEpoch(0, isUtc: true);
            return leftDate.compareTo(rightDate);
          });
    return List.unmodifiable(assignments);
  }

  @override
  Future<CollectorProfile> updateAvailability(
    CollectorAvailability availability, {
    String? reason,
  }) async {
    final uid = _currentUid();
    final reference = _firestore.collection('collectors').doc(uid);
    await _firestore.runTransaction((transaction) async {
      final snapshot = await transaction.get(reference);
      final profile = _profileFromDocument(snapshot, expectedUid: uid);
      _assertCanOperate(profile);
      transaction.update(reference, <String, dynamic>{
        'currentAvailability': availability.wireValue,
        'availabilityReason': _nullableTrimmed(reason),
        'availabilityUpdatedAt': FieldValue.serverTimestamp(),
        'lastActiveAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      });
    });

    final updated = await reference.get();
    return _profileFromDocument(updated, expectedUid: uid);
  }

  @override
  Future<CollectorAssignment> updateCollectionStatus(
    String collectionId,
    CollectionStatus nextStatus, {
    String? missedReason,
  }) async {
    final uid = _currentUid();
    final collectorReference = _firestore.collection('collectors').doc(uid);
    final collectionReference = _firestore
        .collection('collections')
        .doc(collectionId);

    await _firestore.runTransaction((transaction) async {
      final collectorSnapshot = await transaction.get(collectorReference);
      final profile = _profileFromDocument(collectorSnapshot, expectedUid: uid);
      _assertCanOperate(profile);

      final collectionSnapshot = await transaction.get(collectionReference);
      if (!collectionSnapshot.exists) {
        throw StateError('The assigned collection was not found.');
      }
      final data = collectionSnapshot.data() ?? const <String, dynamic>{};
      if (_string(data['assignedWorkerId']) != uid) {
        throw StateError('This collection is not assigned to this collector.');
      }

      final currentStatus = _collectionStatus(data['status']);
      if (!CollectorStatusPolicy.canTransition(
        currentStatus,
        nextStatus,
        missedReason: missedReason,
      )) {
        throw StateError('This collection status transition is not allowed.');
      }

      final updates = <String, dynamic>{
        'status': nextStatus.wireValue,
        'updatedAt': FieldValue.serverTimestamp(),
      };
      switch (nextStatus) {
        case CollectionStatus.onTheWay:
          updates['onTheWayAt'] = FieldValue.serverTimestamp();
        case CollectionStatus.arrived:
          updates['arrivedAt'] = FieldValue.serverTimestamp();
        case CollectionStatus.inProgress:
          updates['startedAt'] = FieldValue.serverTimestamp();
        case CollectionStatus.completed:
          updates['completedAt'] = FieldValue.serverTimestamp();
        case CollectionStatus.missed:
          updates['missedAt'] = FieldValue.serverTimestamp();
          updates['missedReason'] = missedReason!.trim();
        case CollectionStatus.quotationRequested:
        case CollectionStatus.pending:
        case CollectionStatus.confirmed:
        case CollectionStatus.assigned:
        case CollectionStatus.cancelled:
          throw StateError('Collectors cannot set this collection status.');
      }
      transaction.update(collectionReference, updates);
    });

    final updated = await collectionReference.get();
    return _assignmentFromDocument(updated);
  }

  Future<CollectorProfile> _requireOperationalCollector() async {
    final profile = await getCurrentCollector();
    if (profile == null) {
      throw StateError('A CLEANGO collector profile is required.');
    }
    _assertCanOperate(profile);
    return profile;
  }

  void _assertCanOperate(CollectorProfile profile) {
    if (!profile.canOperate) {
      throw StateError('This collector account is not approved and active.');
    }
  }

  String _currentUid() {
    final uid = _firebaseAuth.currentUser?.uid;
    if (uid == null || uid.isEmpty) {
      throw StateError('Sign in before accessing collector operations.');
    }
    return uid;
  }
}

CollectorProfile _profileFromDocument(
  DocumentSnapshot<Map<String, dynamic>> snapshot, {
  required String expectedUid,
}) {
  if (!snapshot.exists) {
    throw StateError('The CLEANGO collector profile was not found.');
  }
  final data = snapshot.data() ?? const <String, dynamic>{};
  final uid = _string(data['uid']).isEmpty ? snapshot.id : _string(data['uid']);
  if (uid != expectedUid || snapshot.id != expectedUid) {
    throw StateError('Collector identity does not match the signed-in user.');
  }

  return CollectorProfile(
    uid: uid,
    displayName: _fallback(data['displayName'], 'CLEANGO collector'),
    phoneNumber: _string(data['phoneNumber']),
    email: _string(data['email']),
    profileImageUrl: _string(data['profileImageUrl']),
    role: _string(data['role']).toLowerCase(),
    approvalStatus: collectorApprovalStatusFromWire(data['approvalStatus']),
    accountStatus: collectorAccountStatusFromWire(data['accountStatus']),
    serviceZones: _stringList(data['serviceZones']),
    vehicleType: collectorVehicleTypeFromWire(data['vehicleType']),
    vehicleId: _nullableTrimmed(data['vehicleId']),
    employeeReference: _nullableTrimmed(data['employeeReference']),
    createdAt: _date(data['createdAt']),
    updatedAt: _date(data['updatedAt']),
    approvedAt: _nullableDate(data['approvedAt']),
    approvedBy: _nullableTrimmed(data['approvedBy']),
    suspendedAt: _nullableDate(data['suspendedAt']),
    suspensionReason: _nullableTrimmed(data['suspensionReason']),
    lastActiveAt: _nullableDate(data['lastActiveAt']),
    currentAvailability: collectorAvailabilityFromWire(
      data['currentAvailability'],
    ),
    availabilityReason: _nullableTrimmed(data['availabilityReason']),
  );
}

CollectorAssignment _assignmentFromDocument(
  DocumentSnapshot<Map<String, dynamic>> snapshot,
) {
  if (!snapshot.exists) {
    throw StateError('The assigned collection was not found.');
  }
  final data = snapshot.data() ?? const <String, dynamic>{};
  final address = _map(data['addressSnapshot']);
  final customer = _map(data['customerSnapshot']);
  return CollectorAssignment(
    id: snapshot.id,
    customerDisplayName: _fallback(
      customer?['firstName'] ?? data['customerDisplayName'],
      'Customer',
    ),
    addressLine: _fallback(
      address?['addressLine'] ?? address?['street'],
      'Address unavailable',
    ),
    district: _string(address?['district'] ?? address?['neighborhood']),
    scheduledDate: _serviceDate(data['scheduledDate']),
    timeWindow: _fallback(data['scheduledTimeWindow'], 'Schedule pending'),
    bagCount: _nullableInteger(
      data['declaredBagCount'] ?? data['includedBagCount'],
    ),
    bookingMode: _bookingMode(data['bookingMode'], data['collectionType']),
    wasteCategory: _wasteCategory(data['wasteCategory']),
    customerNotes: _string(data['customerNotes']),
    paymentStatus: _paymentStatus(data['paymentStatus']),
    status: _collectionStatus(data['status']),
    assignedWorkerId: _string(data['assignedWorkerId']),
    updatedAt: _date(data['updatedAt']),
    missedReason: _nullableTrimmed(data['missedReason']),
  );
}

CollectionStatus _collectionStatus(Object? value) {
  return switch (_normalized(value)) {
    'quotationrequested' ||
    'quotation_requested' => CollectionStatus.quotationRequested,
    'confirmed' => CollectionStatus.confirmed,
    'assigned' => CollectionStatus.assigned,
    'ontheway' || 'on_the_way' || 'en_route' => CollectionStatus.onTheWay,
    'arrived' => CollectionStatus.arrived,
    'inprogress' || 'in_progress' => CollectionStatus.inProgress,
    'completed' => CollectionStatus.completed,
    'missed' => CollectionStatus.missed,
    'cancelled' || 'canceled' => CollectionStatus.cancelled,
    _ => CollectionStatus.pending,
  };
}

CollectionPaymentStatus _paymentStatus(Object? value) {
  return switch (_normalized(value)) {
    'pending' ||
    'processing' ||
    'awaitingcashconfirmation' ||
    'awaiting_cash_confirmation' => CollectionPaymentStatus.pending,
    'paid' => CollectionPaymentStatus.paid,
    'failed' => CollectionPaymentStatus.failed,
    'refunded' => CollectionPaymentStatus.refunded,
    _ => CollectionPaymentStatus.unpaid,
  };
}

CollectionBookingMode _bookingMode(Object? value, Object? collectionType) {
  return switch (_string(value)) {
    'subscription' => CollectionBookingMode.subscription,
    'oneTimePhotoQuote' => CollectionBookingMode.oneTimePhotoQuote,
    'oneTimeBagCount' => CollectionBookingMode.oneTimeBagCount,
    _ =>
      _string(collectionType) == 'subscription'
          ? CollectionBookingMode.subscription
          : CollectionBookingMode.oneTimeBagCount,
  };
}

WasteCategory _wasteCategory(Object? value) {
  return switch (_string(value)) {
    'officeBusiness' ||
    'commercial' ||
    'business' => WasteCategory.officeBusiness,
    'other' => WasteCategory.other,
    _ => WasteCategory.household,
  };
}

Map<String, dynamic>? _map(Object? value) {
  if (value is Map<String, dynamic>) return value;
  if (value is Map) return Map<String, dynamic>.from(value);
  return null;
}

List<String> _stringList(Object? value) {
  if (value is! Iterable) return const <String>[];
  return List.unmodifiable(value.map(_string).where((item) => item.isNotEmpty));
}

String _fallback(Object? value, String fallback) {
  final text = _string(value);
  return text.isEmpty ? fallback : text;
}

String _string(Object? value) => value?.toString().trim() ?? '';

String _normalized(Object? value) =>
    _string(value).toLowerCase().replaceAll('-', '_');

String? _nullableTrimmed(Object? value) {
  final text = _string(value);
  return text.isEmpty ? null : text;
}

DateTime? _serviceDate(Object? value) {
  final date = _nullableDate(value);
  if (date == null) return null;
  return const CollectionScheduleService().toServiceLocalDate(date.toUtc());
}

DateTime _date(Object? value) =>
    _nullableDate(value) ?? DateTime.fromMillisecondsSinceEpoch(0, isUtc: true);

DateTime? _nullableDate(Object? value) {
  if (value is Timestamp) return value.toDate();
  if (value is DateTime) return value;
  if (value is int) return DateTime.fromMillisecondsSinceEpoch(value);
  if (value is String) return DateTime.tryParse(value);
  return null;
}

int? _nullableInteger(Object? value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse(_string(value));
}

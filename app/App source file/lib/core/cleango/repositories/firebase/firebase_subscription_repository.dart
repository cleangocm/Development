import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:ultrawash/core/cleango/models/subscription.dart';
import 'package:ultrawash/core/cleango/repositories/subscription_repository.dart';

class FirebaseSubscriptionRepository implements SubscriptionRepository {
  FirebaseSubscriptionRepository({
    FirebaseFirestore? firestore,
    FirebaseAuth? firebaseAuth,
  }) : _firestore = firestore ?? FirebaseFirestore.instance,
       _firebaseAuth = firebaseAuth ?? FirebaseAuth.instance;

  final FirebaseFirestore _firestore;
  final FirebaseAuth _firebaseAuth;

  @override
  Future<Subscription?> getActiveSubscription(String customerId) async {
    _assertCurrentCustomer(customerId);

    final activeSnapshot = await _firestore
        .collection('subscriptions')
        .where('customerId', isEqualTo: customerId)
        .where('status', isEqualTo: 'active')
        .limit(1)
        .get();

    if (activeSnapshot.docs.isNotEmpty) {
      return _subscriptionFromDocument(activeSnapshot.docs.first);
    }

    final subscriptions = await getSubscriptionHistory(customerId);
    for (final subscription in subscriptions) {
      if (subscription.isActive) return subscription;
    }
    return null;
  }

  @override
  Future<List<Subscription>> getSubscriptionHistory(String customerId) async {
    _assertCurrentCustomer(customerId);

    final snapshot = await _firestore
        .collection('subscriptions')
        .where('customerId', isEqualTo: customerId)
        .get();

    final subscriptions = await Future.wait(
      snapshot.docs.map(_subscriptionFromDocument),
    );
    subscriptions.sort((a, b) => b.renewalDate.compareTo(a.renewalDate));
    return List.unmodifiable(subscriptions);
  }

  @override
  Future<Subscription> updateSubscription(Subscription subscription) {
    throw UnsupportedError(
      'Subscription state changes must use dedicated Cloud Functions. '
      'The current SubscriptionRepository interface is too broad for safe '
      'customer-side plan, price, status, or billing updates.',
    );
  }

  Future<Subscription> _subscriptionFromDocument(
    QueryDocumentSnapshot<Map<String, dynamic>> document,
  ) async {
    final data = document.data();
    final planData = await _readPlanData(data);
    final pickupAllowance = _pickupAllowance(data, planData);
    final usedPickups = await _usedPickupsInCurrentCycle(
      subscriptionId: document.id,
      cycleStart: _dateValue(data['currentPeriodStart'] ?? data['startDate']),
      renewalDate: _renewalDate(data),
    );

    return _FirebaseSubscriptionDto.fromFirestore(
      id: document.id,
      data: data,
      planData: planData,
      remainingCollections: _remainingCollections(
        data,
        pickupAllowance: pickupAllowance,
        usedPickups: usedPickups,
      ),
    ).toDomain();
  }

  Future<Map<String, dynamic>?> _readPlanData(Map<String, dynamic> data) async {
    final planId = _stringValue(data['planId']);
    if (planId.isEmpty) return null;

    try {
      final snapshot = await _firestore.collection('plans').doc(planId).get();
      return snapshot.data();
    } on FirebaseException catch (error) {
      if (error.code == 'permission-denied' || error.code == 'not-found') {
        return null;
      }
      rethrow;
    }
  }

  Future<int> _usedPickupsInCurrentCycle({
    required String subscriptionId,
    required DateTime? cycleStart,
    required DateTime renewalDate,
  }) async {
    try {
      var query = _firestore
          .collection('pickups')
          .where('subscriptionId', isEqualTo: subscriptionId)
          .where('status', whereIn: ['completed', 'missed']);

      if (cycleStart != null) {
        query = query.where(
          'scheduledDate',
          isGreaterThanOrEqualTo: Timestamp.fromDate(cycleStart),
        );
      }
      query = query.where(
        'scheduledDate',
        isLessThan: Timestamp.fromDate(renewalDate),
      );

      final snapshot = await query.get();
      return snapshot.docs.length;
    } on FirebaseException catch (error) {
      if (error.code == 'permission-denied' ||
          error.code == 'failed-precondition') {
        return 0;
      }
      rethrow;
    }
  }

  void _assertCurrentCustomer(String customerId) {
    final uid = _firebaseAuth.currentUser?.uid;
    if (uid == null || uid.isEmpty) {
      throw StateError('A Firebase user is required to read subscriptions.');
    }
    if (uid != customerId) {
      throw StateError('Cannot read another customer subscription.');
    }
  }
}

class _FirebaseSubscriptionDto {
  const _FirebaseSubscriptionDto({
    required this.id,
    required this.customerId,
    required this.plan,
    required this.renewalDate,
    required this.remainingCollections,
    required this.status,
    required this.monthlyPriceXaf,
  });

  factory _FirebaseSubscriptionDto.fromFirestore({
    required String id,
    required Map<String, dynamic> data,
    required Map<String, dynamic>? planData,
    required int remainingCollections,
  }) {
    return _FirebaseSubscriptionDto(
      id: id,
      customerId: _firstNonEmpty([data['customerId'], data['userId']]),
      plan: _planValue(data, planData),
      renewalDate: _renewalDate(data),
      remainingCollections: remainingCollections,
      status: _statusValue(data['status']),
      monthlyPriceXaf: _intValue(
        data['monthlyPriceXaf'] ??
            data['priceXaf'] ??
            data['amountXaf'] ??
            planData?['monthlyPriceXaf'] ??
            planData?['priceXaf'] ??
            planData?['price'] ??
            planData?['amountXaf'],
      ),
    );
  }

  final String id;
  final String customerId;
  final SubscriptionPlan plan;
  final DateTime renewalDate;
  final int remainingCollections;
  final SubscriptionStatus status;
  final int monthlyPriceXaf;

  Subscription toDomain() {
    return Subscription(
      id: id,
      customerId: customerId,
      plan: plan,
      renewalDate: renewalDate,
      remainingCollections: remainingCollections,
      status: status,
      monthlyPriceXaf: monthlyPriceXaf,
    );
  }
}

SubscriptionPlan _planValue(
  Map<String, dynamic> data,
  Map<String, dynamic>? planData,
) {
  final raw = _firstNonEmpty([
    data['plan'],
    data['planName'],
    planData?['plan'],
    planData?['name'],
    data['planId'],
  ]).toLowerCase();

  if (raw.contains('enterprise')) return SubscriptionPlan.enterprise;
  if (raw.contains('business')) return SubscriptionPlan.business;
  if (raw.contains('premium')) return SubscriptionPlan.premium;
  if (raw.contains('standard')) return SubscriptionPlan.standard;
  if (raw.contains('basic')) return SubscriptionPlan.basic;
  return SubscriptionPlan.basic;
}

SubscriptionStatus _statusValue(dynamic value) {
  final status = _stringValue(value).toLowerCase();
  switch (status) {
    case 'active':
      return SubscriptionStatus.active;
    case 'pending':
      return SubscriptionStatus.pending;
    case 'paused':
      return SubscriptionStatus.paused;
    case 'cancelled':
    case 'canceled':
      return SubscriptionStatus.cancelled;
    case 'expired':
      return SubscriptionStatus.expired;
    default:
      return SubscriptionStatus.pending;
  }
}

DateTime _renewalDate(Map<String, dynamic> data) {
  return _dateValue(
        data['renewalDate'] ??
            data['nextBillingDate'] ??
            data['currentPeriodEnd'] ??
            data['endDate'],
      ) ??
      (_dateValue(data['startDate']) ?? DateTime.now()).add(
        const Duration(days: 30),
      );
}

int _pickupAllowance(
  Map<String, dynamic> data,
  Map<String, dynamic>? planData,
) {
  final direct = _intValue(
    data['pickupAllowance'] ??
        data['monthlyPickupAllowance'] ??
        data['pickupsPerMonth'] ??
        data['collectionAllowance'] ??
        planData?['pickupAllowance'] ??
        planData?['monthlyPickupAllowance'] ??
        planData?['pickupsPerMonth'] ??
        planData?['collectionAllowance'],
  );
  if (direct > 0) return direct;

  final frequency = _intValue(
    data['pickupFrequency'] ?? planData?['pickupFrequency'],
  );
  return frequency > 0 ? frequency * 4 : 0;
}

int _remainingCollections(
  Map<String, dynamic> data, {
  required int pickupAllowance,
  required int usedPickups,
}) {
  final explicit = _intValue(
    data['remainingCollections'] ??
        data['remainingPickups'] ??
        data['remainingPickupAllowance'],
  );
  if (explicit > 0) return explicit;
  if (pickupAllowance <= 0) return 0;
  final remaining = pickupAllowance - usedPickups;
  return remaining < 0 ? 0 : remaining;
}

DateTime? _dateValue(dynamic value) {
  if (value is Timestamp) return value.toDate();
  if (value is DateTime) return value;
  if (value is String) return DateTime.tryParse(value);
  if (value is int) return DateTime.fromMillisecondsSinceEpoch(value);
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

int _intValue(dynamic value) {
  if (value is int) return value;
  if (value is num) return value.round();
  if (value is String) return int.tryParse(value) ?? 0;
  return 0;
}

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:ultrawash/core/cleango/collections/collection_pricing_service.dart';
import 'package:ultrawash/core/cleango/models/address.dart';
import 'package:ultrawash/core/cleango/models/subscription.dart';
import 'package:ultrawash/core/cleango/repositories/subscription_repository.dart';
import 'package:ultrawash/core/cleango/subscriptions/subscription_pricing_catalogue.dart';
import 'package:ultrawash/core/cleango/subscriptions/subscription_request_service.dart';

class FirebaseSubscriptionRepository
    implements SubscriptionRepository, SubscriptionRequestStore {
  FirebaseSubscriptionRepository({
    FirebaseFirestore? firestore,
    FirebaseAuth? firebaseAuth,
  }) : _firestore = firestore ?? FirebaseFirestore.instance,
       _firebaseAuth = firebaseAuth ?? FirebaseAuth.instance;

  final FirebaseFirestore _firestore;
  final FirebaseAuth _firebaseAuth;

  late final SubscriptionRequestService _requestService =
      SubscriptionRequestService(store: this);

  @override
  Future<List<SubscriptionPlanDefinition>> getAvailablePlans() async {
    _currentUid();
    try {
      final snapshot = await _firestore
          .collection('plans')
          .where('active', isEqualTo: true)
          .get();
      final remotePlans =
          snapshot.docs
              .map((document) => _planFromMap(document.id, document.data()))
              .where(SubscriptionPricingCatalogue.matchesApprovedPlan)
              .toList()
            ..sort(
              (left, right) => left.displayOrder.compareTo(right.displayOrder),
            );
      if (remotePlans.length == SubscriptionPricingCatalogue.plans.length) {
        return List.unmodifiable(remotePlans);
      }
    } on FirebaseException catch (error) {
      if (error.code != 'permission-denied' &&
          error.code != 'unavailable' &&
          error.code != 'failed-precondition') {
        rethrow;
      }
    }

    // Display-only fallback. New subscription writes remain independently
    // validated against this versioned contract by Firestore rules.
    return SubscriptionPricingCatalogue.plans;
  }

  @override
  Future<SubscriptionRequestResult> requestSubscription(
    SubscriptionRequest request,
  ) async {
    final uid = _currentUid();
    try {
      return await _requestService.request(customerId: uid, request: request);
    } on FirebaseException catch (error) {
      throw SubscriptionRequestException(
        error.code,
        _firebaseMessage(
          error.code,
          fallback: 'Unable to submit subscription request.',
        ),
      );
    }
  }

  @override
  Future<Subscription?> getActiveSubscription(String customerId) async {
    _assertCurrentCustomer(customerId);
    final snapshot = await _firestore
        .collection('subscriptions')
        .where('customerId', isEqualTo: customerId)
        .where('status', isEqualTo: 'active')
        .limit(1)
        .get();
    if (snapshot.docs.isEmpty) return null;
    return _subscriptionFromDocument(snapshot.docs.first);
  }

  @override
  Future<List<Subscription>> getSubscriptionHistory(String customerId) async {
    _assertCurrentCustomer(customerId);
    final snapshot = await _firestore
        .collection('subscriptions')
        .where('customerId', isEqualTo: customerId)
        .get();
    final subscriptions = snapshot.docs.map(_subscriptionFromDocument).toList()
      ..sort((left, right) => right.createdAt.compareTo(left.createdAt));
    return List.unmodifiable(subscriptions);
  }

  @override
  Future<Subscription> updateSubscription(Subscription subscription) {
    throw UnsupportedError(
      'Subscription state, price, payment, and usage changes require trusted '
      'CLEANGO administration or dedicated Cloud Functions.',
    );
  }

  @override
  Future<Address?> getOwnedSubscriptionAddress({
    required String customerId,
    required String addressId,
  }) async {
    _assertCurrentCustomer(customerId);
    final snapshot = await _firestore
        .collection('addresses')
        .doc(addressId)
        .get();
    if (!snapshot.exists) return null;
    final data = snapshot.data() ?? const <String, dynamic>{};
    if (_string(data['customerId']) != customerId) return null;
    final zone = _first([data['serviceZone'], data['serviceZoneId']]);
    return Address(
      id: snapshot.id,
      label: _first([data['label'], 'Saved address']),
      street: _first([data['addressLine'], data['street'], data['address']]),
      city: _first([data['city'], 'Yaounde']),
      region: _first([data['district'], data['neighborhood'], data['region']]),
      country: _first([data['country'], 'Cameroon']),
      latitude: _double(data['latitude']),
      longitude: _double(data['longitude']),
      serviceZone: zone,
      isWithinServiceArea:
          data['isWithinServiceArea'] == true &&
          zone == CollectionPricingService.supportedServiceZone,
      isPrimary: data['isPrimary'] == true || data['isDefault'] == true,
    );
  }

  @override
  Future<SubscriptionRequestResult> createOrGetSubscription(
    SubscriptionRequestDraft draft,
  ) async {
    final uid = _currentUid();
    if (draft.customerId != uid) {
      throw const SubscriptionRequestException(
        'permission-denied',
        'A subscription can only be requested for the signed-in customer.',
      );
    }
    final reference = _firestore
        .collection('subscriptions')
        .doc(draft.documentId);
    var duplicate = false;
    try {
      await reference.set(_requestPayload(draft));
    } on FirebaseException catch (createError) {
      if (createError.code != 'permission-denied') rethrow;

      // A missing document cannot prove ownership in Firestore rules. If the
      // deterministic ID already exists, verify its owner and treat this as a
      // retry instead of weakening read access for uncreated documents.
      try {
        final existing = await reference.get();
        if (!existing.exists) rethrow;
        _verifyOwner(existing.data(), uid);
        duplicate = true;
      } on FirebaseException {
        throw createError;
      }
    }
    final snapshot = await reference.get();
    if (!snapshot.exists) {
      throw const SubscriptionRequestException(
        'request-not-created',
        'The subscription request could not be confirmed.',
      );
    }
    return SubscriptionRequestResult(
      subscription: _subscriptionFromDocument(snapshot),
      wasDuplicate: duplicate,
    );
  }

  Map<String, Object?> _requestPayload(SubscriptionRequestDraft draft) {
    final plan = draft.plan;
    return {
      'idempotencyKey': draft.documentId,
      'customerId': draft.customerId,
      'planId': plan.id,
      'planSnapshot': _planMap(plan),
      'serviceAddressId': draft.addressId,
      'serviceAddressSnapshot': {
        'label': draft.addressSnapshot.label,
        'addressLine': draft.addressSnapshot.addressLine,
        'city': draft.addressSnapshot.city,
        'district': draft.addressSnapshot.district,
        'latitude': draft.addressSnapshot.latitude,
        'longitude': draft.addressSnapshot.longitude,
      },
      'status': draft.status.wireValue,
      'paymentStatus': draft.paymentStatus.wireValue,
      'startDate': null,
      'endDate': null,
      'billingCycle': draft.billingCycle.wireValue,
      'includedPickupsPerMonth': plan.pickupsPerMonth,
      'includedBagsPerPickup': plan.includedBagsPerPickup,
      'usedPickups': 0,
      'extraBagRate': SubscriptionPricingCatalogue.extraBagRateXaf,
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
      'cancelledAt': null,
      'pricingVersion': plan.pricingVersion,
    };
  }

  Subscription _subscriptionFromDocument(
    DocumentSnapshot<Map<String, dynamic>> document,
  ) {
    final data = document.data() ?? const <String, dynamic>{};
    final planMap = _map(data['planSnapshot']);
    final planId = _first([data['planId'], planMap?['id'], data['plan']]);
    final plan = _planFromMap(planId, planMap ?? data);
    final address =
        _map(data['serviceAddressSnapshot']) ??
        _map(data['addressSnapshot']) ??
        const <String, dynamic>{};
    final createdAt =
        _date(data['createdAt']) ??
        _date(data['startDate']) ??
        DateTime.fromMillisecondsSinceEpoch(0, isUtc: true);

    return Subscription(
      id: document.id,
      customerId: _first([data['customerId'], data['userId']]),
      planId: plan.id,
      planSnapshot: plan,
      serviceAddressId: _first([data['serviceAddressId'], data['addressId']]),
      serviceAddressSnapshot: SubscriptionAddressSnapshot(
        label: _first([address['label'], 'Service address']),
        addressLine: _first([
          address['addressLine'],
          address['street'],
          address['address'],
        ]),
        city: _first([address['city'], 'Yaounde']),
        district: _first([
          address['district'],
          address['neighborhood'],
          address['region'],
        ]),
        latitude: _double(address['latitude']),
        longitude: _double(address['longitude']),
      ),
      status: _status(data['status']),
      paymentStatus: _paymentStatus(data['paymentStatus']),
      startDate: _date(data['startDate']),
      endDate: _date(
        data['endDate'] ?? data['renewalDate'] ?? data['currentPeriodEnd'],
      ),
      billingCycle: _billingCycle(data['billingCycle']),
      includedPickupsPerMonth: _integer(
        data['includedPickupsPerMonth'] ??
            data['pickupAllowance'] ??
            data['pickupsPerMonth'] ??
            plan.pickupsPerMonth,
      ),
      includedBagsPerPickup: _integer(
        data['includedBagsPerPickup'] ?? plan.includedBagsPerPickup,
      ),
      usedPickups: _integer(data['usedPickups']),
      extraBagRate: _integer(
        data['extraBagRate'] ?? SubscriptionPricingCatalogue.extraBagRateXaf,
      ),
      createdAt: createdAt,
      updatedAt: _date(data['updatedAt']) ?? createdAt,
      cancelledAt: _date(data['cancelledAt']),
      pricingVersion: _first([
        data['pricingVersion'],
        plan.pricingVersion,
        'legacy-unknown',
      ]),
    );
  }

  void _assertCurrentCustomer(String customerId) {
    if (_currentUid() != customerId) {
      throw StateError('Cannot read another customer subscription.');
    }
  }

  void _verifyOwner(Map<String, dynamic>? data, String uid) {
    if (_string(data?['customerId']) != uid) {
      throw const SubscriptionRequestException(
        'permission-denied',
        'Another customer subscription cannot be accessed.',
      );
    }
  }

  String _currentUid() {
    final uid = _firebaseAuth.currentUser?.uid;
    if (uid == null || uid.isEmpty) {
      throw StateError('A Firebase user is required for subscriptions.');
    }
    return uid;
  }
}

Map<String, Object?> _planMap(SubscriptionPlanDefinition plan) {
  return {
    'id': plan.id,
    'englishName': plan.englishName,
    'frenchName': plan.frenchName,
    'monthlyPriceXaf': plan.monthlyPriceXaf,
    'pickupsPerWeek': plan.pickupsPerWeek,
    'pickupsPerMonth': plan.pickupsPerMonth,
    'includedBagsPerPickup': plan.includedBagsPerPickup,
    'bagsSupplied': plan.bagsSupplied,
    'flexibleSchedule': plan.flexibleSchedule,
    'urgentPickup': plan.urgentPickup,
    'requiresQuotation': plan.requiresQuotation,
    'startingPriceXaf': plan.startingPriceXaf,
    'currency': plan.currency,
    'pricingVersion': plan.pricingVersion,
    'active': plan.active,
    'displayOrder': plan.displayOrder,
  };
}

SubscriptionPlanDefinition _planFromMap(
  String documentId,
  Map<String, dynamic> data,
) {
  final id = _first([data['id'], documentId]);
  final approved = SubscriptionPricingCatalogue.find(id);
  return SubscriptionPlanDefinition(
    id: id.isEmpty ? 'basic' : id,
    englishName: _first([
      data['englishName'],
      data['name'],
      approved?.englishName,
      'Legacy plan',
    ]),
    frenchName: _first([
      data['frenchName'],
      approved?.frenchName,
      data['name'],
      'Forfait historique',
    ]),
    monthlyPriceXaf: _nullableInteger(
      data['monthlyPriceXaf'] ??
          data['priceXaf'] ??
          data['amountXaf'] ??
          approved?.monthlyPriceXaf,
    ),
    pickupsPerWeek: _integer(
      data['pickupsPerWeek'] ?? approved?.pickupsPerWeek,
    ),
    pickupsPerMonth: _integer(
      data['pickupsPerMonth'] ??
          data['pickupAllowance'] ??
          approved?.pickupsPerMonth,
    ),
    includedBagsPerPickup: _integer(
      data['includedBagsPerPickup'] ?? approved?.includedBagsPerPickup,
    ),
    bagsSupplied:
        data['bagsSupplied'] == true ||
        (data['bagsSupplied'] == null && approved?.bagsSupplied == true),
    flexibleSchedule:
        data['flexibleSchedule'] == true ||
        (data['flexibleSchedule'] == null &&
            approved?.flexibleSchedule == true),
    urgentPickup:
        data['urgentPickup'] == true ||
        (data['urgentPickup'] == null && approved?.urgentPickup == true),
    requiresQuotation:
        data['requiresQuotation'] == true ||
        (data['requiresQuotation'] == null &&
            approved?.requiresQuotation == true),
    startingPriceXaf: _nullableInteger(
      data['startingPriceXaf'] ?? approved?.startingPriceXaf,
    ),
    currency: _first([data['currency'], approved?.currency, 'XAF']),
    pricingVersion: _first([
      data['pricingVersion'],
      approved?.pricingVersion,
      'legacy-unknown',
    ]),
    active: data['active'] != false,
    displayOrder: _integer(data['displayOrder'] ?? approved?.displayOrder),
  );
}

SubscriptionStatus _status(Object? value) {
  return switch (_string(value).toLowerCase()) {
    'active' => SubscriptionStatus.active,
    'suspended' || 'paused' => SubscriptionStatus.suspended,
    'expired' => SubscriptionStatus.expired,
    'cancelled' || 'canceled' => SubscriptionStatus.cancelled,
    'pendingreview' || 'pending_review' => SubscriptionStatus.pendingReview,
    _ => SubscriptionStatus.pendingPayment,
  };
}

SubscriptionPaymentStatus _paymentStatus(Object? value) {
  return switch (_string(value).toLowerCase()) {
    'pending' || 'processing' => SubscriptionPaymentStatus.pending,
    'paid' => SubscriptionPaymentStatus.paid,
    'failed' => SubscriptionPaymentStatus.failed,
    'refunded' => SubscriptionPaymentStatus.refunded,
    _ => SubscriptionPaymentStatus.unpaid,
  };
}

SubscriptionBillingCycle _billingCycle(Object? value) {
  return _string(value) == 'flexibleReview'
      ? SubscriptionBillingCycle.flexibleReview
      : SubscriptionBillingCycle.monthly;
}

String _firebaseMessage(String code, {required String fallback}) {
  return switch (code) {
    'permission-denied' => 'You do not have permission for this request.',
    'unavailable' => 'The subscription service is temporarily unavailable.',
    'deadline-exceeded' => 'The subscription request timed out. Try again.',
    _ => fallback,
  };
}

Map<String, dynamic>? _map(Object? value) {
  if (value is Map<String, dynamic>) return value;
  if (value is Map) return Map<String, dynamic>.from(value);
  return null;
}

DateTime? _date(Object? value) {
  if (value is Timestamp) return value.toDate();
  if (value is DateTime) return value;
  if (value is String) return DateTime.tryParse(value);
  if (value is int) return DateTime.fromMillisecondsSinceEpoch(value);
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

int _integer(Object? value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse(_string(value)) ?? 0;
}

int? _nullableInteger(Object? value) {
  if (value == null) return null;
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse(_string(value));
}

double? _double(Object? value) {
  if (value is num) return value.toDouble();
  return double.tryParse(_string(value));
}

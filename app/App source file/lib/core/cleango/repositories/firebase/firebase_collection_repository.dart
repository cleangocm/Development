import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:ultrawash/core/cleango/collections/collection_booking_service.dart';
import 'package:ultrawash/core/cleango/collections/collection_pricing_service.dart';
import 'package:ultrawash/core/cleango/collections/collection_schedule_service.dart';
import 'package:ultrawash/core/cleango/models/address.dart';
import 'package:ultrawash/core/cleango/models/collection.dart';
import 'package:ultrawash/core/cleango/repositories/collection_repository.dart';

class FirebaseCollectionRepository
    implements CollectionRepository, CollectionBookingStore {
  FirebaseCollectionRepository({
    FirebaseFirestore? firestore,
    FirebaseAuth? firebaseAuth,
    FirebaseFunctions? functions,
    CollectionPricingService pricingService = const CollectionPricingService(),
    CollectionScheduleService scheduleService =
        const CollectionScheduleService(),
  }) : _firestore = firestore ?? FirebaseFirestore.instance,
       _firebaseAuth = firebaseAuth ?? FirebaseAuth.instance,
       _pricingService = pricingService,
       _scheduleService = scheduleService;

  final FirebaseFirestore _firestore;
  final FirebaseAuth _firebaseAuth;
  final CollectionPricingService _pricingService;
  final CollectionScheduleService _scheduleService;

  late final CollectionBookingService _bookingService =
      CollectionBookingService(
        store: this,
        pricingService: _pricingService,
        scheduleService: _scheduleService,
      );

  @override
  Future<List<Address>> getSavedAddresses(String customerId) async {
    _assertCurrentCustomer(customerId);
    final snapshot = await _firestore
        .collection('addresses')
        .where('customerId', isEqualTo: customerId)
        .get();
    final addresses = snapshot.docs.map(_addressFromDocument).toList()
      ..sort((left, right) {
        if (left.isPrimary != right.isPrimary) return left.isPrimary ? -1 : 1;
        return left.label.toLowerCase().compareTo(right.label.toLowerCase());
      });
    return List.unmodifiable(addresses);
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
  ) async {
    final uid = _currentUid();
    try {
      return await _bookingService.book(customerId: uid, request: request);
    } on FirebaseException catch (error) {
      throw CollectionBookingException(
        error.code,
        _firebaseMessage(error.code, fallback: 'Unable to submit booking.'),
      );
    }
  }

  @override
  Future<List<WasteCollection>> getUpcomingCollections(
    String customerId,
  ) async {
    _assertCurrentCustomer(customerId);
    final collections = await _readCustomerCollections(customerId);
    final upcoming =
        collections.where((collection) => collection.isUpcoming).toList()
          ..sort((left, right) => _sortDate(left).compareTo(_sortDate(right)));
    return List.unmodifiable(upcoming);
  }

  @override
  Future<List<WasteCollection>> getCollectionHistory(String customerId) async {
    _assertCurrentCustomer(customerId);
    final collections = await _readCustomerCollections(customerId);
    final history =
        collections.where((collection) => !collection.isUpcoming).toList()
          ..sort((left, right) => right.createdAt.compareTo(left.createdAt));
    return List.unmodifiable(history);
  }

  @override
  Future<WasteCollection?> getCollectionById(String collectionId) async {
    final uid = _currentUid();
    final snapshot = await _firestore
        .collection('collections')
        .doc(collectionId)
        .get();
    if (!snapshot.exists) return null;
    _verifyOwner(snapshot.data(), uid);
    return _collectionFromDocument(snapshot);
  }

  @override
  Future<WasteCollection> rescheduleCollection(
    String collectionId,
    DateTime scheduledDate,
    String timeWindow,
  ) {
    throw UnsupportedError(
      'Collection rescheduling is not available in this phase. Cancel the '
      'pending request and create a new booking.',
    );
  }

  @override
  Future<WasteCollection> reportMissedCollection(String collectionId) {
    throw UnsupportedError(
      'Missed-collection reporting requires a trusted operational workflow.',
    );
  }

  @override
  Future<WasteCollection> cancelCollection(String collectionId) async {
    final uid = _currentUid();
    final reference = _firestore.collection('collections').doc(collectionId);
    try {
      await _firestore.runTransaction((transaction) async {
        final snapshot = await transaction.get(reference);
        if (!snapshot.exists) {
          throw const CollectionBookingException(
            'not-found',
            'This collection booking no longer exists.',
          );
        }
        final data = snapshot.data() ?? const <String, dynamic>{};
        _verifyOwner(data, uid);
        final status = _collectionStatus(data['status']);
        if (status != CollectionStatus.quotationRequested &&
            status != CollectionStatus.pending &&
            status != CollectionStatus.confirmed) {
          throw const CollectionBookingException(
            'cancellation-not-allowed',
            'Only quotation, pending, or confirmed requests can be cancelled.',
          );
        }
        transaction.update(reference, {
          'status': CollectionStatus.cancelled.wireValue,
          'cancelledAt': FieldValue.serverTimestamp(),
          'updatedAt': FieldValue.serverTimestamp(),
        });
      });
      return _reload(reference, 'The cancelled booking could not be reloaded.');
    } on FirebaseException catch (error) {
      throw CollectionBookingException(
        error.code,
        _firebaseMessage(error.code, fallback: 'Unable to cancel booking.'),
      );
    }
  }

  @override
  Future<WasteCollection> acceptQuotation(String collectionId) async {
    final uid = _currentUid();
    final reference = _firestore.collection('collections').doc(collectionId);
    try {
      await _firestore.runTransaction((transaction) async {
        final snapshot = await transaction.get(reference);
        if (!snapshot.exists) {
          throw const CollectionBookingException(
            'not-found',
            'This quotation request no longer exists.',
          );
        }
        final data = snapshot.data() ?? const <String, dynamic>{};
        _verifyOwner(data, uid);
        final quotationStatus = _quotationStatus(data['quotationStatus']);
        final quotedAmount = _nullableInteger(data['quotedAmount']);
        if (quotationStatus != CollectionQuotationStatus.quoted ||
            quotedAmount == null ||
            quotedAmount <= 0) {
          throw const CollectionBookingException(
            'quotation-not-ready',
            'CLEANGO has not issued a quotation for this request yet.',
          );
        }
        transaction.update(reference, {
          'quotationStatus': CollectionQuotationStatus.accepted.wireValue,
          'quotationAcceptedAt': FieldValue.serverTimestamp(),
          'updatedAt': FieldValue.serverTimestamp(),
        });
      });
      return _reload(
        reference,
        'The accepted quotation could not be reloaded.',
      );
    } on FirebaseException catch (error) {
      throw CollectionBookingException(
        error.code,
        _firebaseMessage(error.code, fallback: 'Unable to accept quotation.'),
      );
    }
  }

  @override
  Future<Address?> getOwnedAddress({
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
    return _addressFromDocument(snapshot);
  }

  @override
  Future<CollectionBookingResult> createOrGetCollection(
    CollectionBookingDraft draft,
  ) async {
    final uid = _currentUid();
    if (draft.customerId != uid) {
      throw const CollectionBookingException(
        'permission-denied',
        'A collection can only be booked for the signed-in customer.',
      );
    }
    final reference = _firestore
        .collection('collections')
        .doc(draft.documentId);
    var duplicate = false;
    try {
      await reference.set(_bookingPayload(draft));
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
    return CollectionBookingResult(
      collection: await _reload(
        reference,
        'The collection booking could not be confirmed.',
      ),
      wasDuplicate: duplicate,
    );
  }

  Future<List<WasteCollection>> _readCustomerCollections(
    String customerId,
  ) async {
    final snapshot = await _firestore
        .collection('collections')
        .where('customerId', isEqualTo: customerId)
        .get();
    return snapshot.docs.map(_collectionFromDocument).toList();
  }

  Map<String, Object?> _bookingPayload(CollectionBookingDraft draft) {
    final pricing = _pricingMap(draft.pricing);
    return {
      'idempotencyKey': draft.documentId,
      'customerId': draft.customerId,
      'addressId': draft.addressId,
      'addressSnapshot': {
        'label': draft.addressSnapshot.label,
        'addressLine': draft.addressSnapshot.addressLine,
        'city': draft.addressSnapshot.city,
        'district': draft.addressSnapshot.district,
        'latitude': draft.addressSnapshot.latitude,
        'longitude': draft.addressSnapshot.longitude,
      },
      'serviceZone': draft.serviceZone,
      'bookingMode': draft.bookingMode.wireValue,
      'collectionType': draft.collectionType.wireValue,
      'wasteCategory': draft.wasteCategory.wireValue,
      'scheduleType': draft.scheduleType.wireValue,
      'scheduledDate': draft.scheduledDateUtc == null
          ? null
          : Timestamp.fromDate(draft.scheduledDateUtc!),
      'scheduledTimeWindow': draft.scheduledTimeWindow?.wireValue,
      'frequency': draft.frequency.wireValue,
      'status': draft.status.wireValue,
      'paymentStatus': CollectionPaymentStatus.unpaid.wireValue,
      'pricing': pricing,
      'pricingSnapshot': pricing,
      'declaredBagCount': draft.declaredBagCount,
      'includedBagCount': draft.pricing.includedBagCount,
      'extraBagCount': draft.pricing.extraBagCount,
      'extraBagRate': draft.pricing.extraBagRate,
      'extraBagAmount': draft.pricing.extraBagAmount,
      'quotationStatus': draft.quotationStatus.wireValue,
      'quotedAmount': null,
      'quotationReviewedBy': null,
      'quotationReviewedAt': null,
      'quotationAcceptedAt': null,
      'photoStoragePaths': draft.photoStoragePaths,
      'subscriptionId': null,
      'includedInSubscription': false,
      'customerNotes': draft.customerNotes,
      'assignedWorkerId': null,
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
      'cancelledAt': null,
      'completedAt': null,
    };
  }

  Map<String, Object?> _pricingMap(CollectionPricing pricing) {
    return {
      'currency': pricing.currency,
      'baseAmount': pricing.baseAmount,
      'includedBagCount': pricing.includedBagCount,
      'extraBagCount': pricing.extraBagCount,
      'extraBagRate': pricing.extraBagRate,
      'extraBagAmount': pricing.extraBagAmount,
      'serviceFee': pricing.serviceFee,
      'discount': pricing.discount,
      'totalAmount': pricing.totalAmount,
      'pricingVersion': pricing.pricingVersion,
      'calculationSource': pricing.calculationSource,
    };
  }

  WasteCollection _collectionFromDocument(
    DocumentSnapshot<Map<String, dynamic>> document,
  ) {
    final data = document.data() ?? const <String, dynamic>{};
    final rawScheduledDate = _date(data['scheduledDate']);
    final localScheduledDate = rawScheduledDate == null
        ? null
        : _scheduleService.toServiceLocalDate(rawScheduledDate.toUtc());
    final address = _map(data['addressSnapshot']);
    final pricing =
        _map(data['pricingSnapshot']) ??
        _map(data['pricing']) ??
        const <String, dynamic>{};
    final createdAt =
        _date(data['createdAt']) ??
        rawScheduledDate ??
        DateTime.fromMillisecondsSinceEpoch(0, isUtc: true);
    final bookingMode = _bookingMode(
      data['bookingMode'],
      data['collectionType'],
    );

    return WasteCollection(
      id: document.id,
      customerId: _string(data['customerId']),
      addressId: _string(data['addressId']),
      addressSnapshot: CollectionAddressSnapshot(
        label: _first([address?['label'], 'Collection address']),
        addressLine: _first([
          address?['addressLine'],
          address?['street'],
          'Address unavailable',
        ]),
        city: _first([address?['city'], 'Yaounde']),
        district: _first([address?['district'], address?['neighborhood'], '']),
        latitude: _double(address?['latitude']),
        longitude: _double(address?['longitude']),
      ),
      serviceZone: _first([data['serviceZone'], 'unknown']),
      bookingMode: bookingMode,
      collectionType: bookingMode.collectionType,
      wasteCategory: _wasteCategory(data['wasteCategory']),
      scheduleType: _scheduleType(data['scheduleType'], bookingMode),
      scheduledDate: localScheduledDate,
      scheduledTimeWindow: CollectionTimeWindow.fromWireValue(
        data['scheduledTimeWindow'],
      ),
      frequency: _frequency(data['frequency']),
      status: _collectionStatus(data['status']),
      paymentStatus: _paymentStatus(data['paymentStatus']),
      pricing: CollectionPricing(
        currency: _first([pricing['currency'], 'XAF']),
        baseAmount: _nullableInteger(pricing['baseAmount']),
        includedBagCount: _integer(
          pricing['includedBagCount'] ?? data['includedBagCount'],
        ),
        extraBagCount: _integer(
          pricing['extraBagCount'] ?? data['extraBagCount'],
        ),
        extraBagRate: _integer(
          pricing['extraBagRate'] ?? data['extraBagRate'] ?? 500,
        ),
        extraBagAmount: _integer(
          pricing['extraBagAmount'] ?? data['extraBagAmount'],
        ),
        serviceFee: _integer(pricing['serviceFee']),
        discount: _integer(pricing['discount']),
        totalAmount: _nullableInteger(pricing['totalAmount']),
        pricingVersion: _first([pricing['pricingVersion'], 'legacy-unknown']),
        calculationSource: _first([
          pricing['calculationSource'],
          'legacyUnknown',
        ]),
      ),
      declaredBagCount: _nullableInteger(data['declaredBagCount']),
      includedBagCount: _integer(data['includedBagCount']),
      extraBagCount: _integer(data['extraBagCount']),
      extraBagRate: _integer(data['extraBagRate'] ?? 500),
      quotationStatus: _quotationStatus(data['quotationStatus']),
      quotedAmount: _nullableInteger(data['quotedAmount']),
      quotationReviewedBy: _nullableString(data['quotationReviewedBy']),
      quotationReviewedAt: _date(data['quotationReviewedAt']),
      quotationAcceptedAt: _date(data['quotationAcceptedAt']),
      photoStoragePaths: _stringList(data['photoStoragePaths']),
      subscriptionId: _nullableString(data['subscriptionId']),
      includedInSubscription: data['includedInSubscription'] == true,
      customerNotes: _string(data['customerNotes']),
      assignedWorkerId: _nullableString(data['assignedWorkerId']),
      createdAt: createdAt,
      updatedAt: _date(data['updatedAt']) ?? createdAt,
      cancelledAt: _date(data['cancelledAt']),
      completedAt: _date(data['completedAt']),
    );
  }

  Address _addressFromDocument(
    DocumentSnapshot<Map<String, dynamic>> document,
  ) {
    final data = document.data() ?? const <String, dynamic>{};
    final zone = _first([data['serviceZone'], data['serviceZoneId']]);
    return Address(
      id: document.id,
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
      isPrimary: data['isDefault'] == true || data['isPrimary'] == true,
    );
  }

  Future<WasteCollection> _reload(
    DocumentReference<Map<String, dynamic>> reference,
    String missingMessage,
  ) async {
    final snapshot = await reference.get();
    if (!snapshot.exists) {
      throw CollectionBookingException('not-found', missingMessage);
    }
    return _collectionFromDocument(snapshot);
  }

  DateTime _sortDate(WasteCollection collection) {
    return collection.scheduledDate ?? collection.createdAt;
  }

  void _assertCurrentCustomer(String customerId) {
    if (_currentUid() != customerId) {
      throw const CollectionBookingException(
        'permission-denied',
        'Another customer collection cannot be accessed.',
      );
    }
  }

  void _verifyOwner(Map<String, dynamic>? data, String uid) {
    if (_string(data?['customerId']) != uid) {
      throw const CollectionBookingException(
        'permission-denied',
        'Another customer collection cannot be accessed.',
      );
    }
  }

  String _currentUid() {
    final uid = _firebaseAuth.currentUser?.uid;
    if (uid == null || uid.isEmpty) {
      throw const CollectionBookingException(
        'authentication-required',
        'Sign in before accessing collections.',
      );
    }
    return uid;
  }
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

CollectionScheduleType _scheduleType(
  Object? value,
  CollectionBookingMode bookingMode,
) {
  if (_string(value) == 'quotationPending' ||
      bookingMode == CollectionBookingMode.oneTimePhotoQuote) {
    return CollectionScheduleType.quotationPending;
  }
  return CollectionScheduleType.customerSelected;
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

CollectionFrequency _frequency(Object? value) {
  return switch (_string(value)) {
    'weekly' => CollectionFrequency.weekly,
    'twiceWeekly' => CollectionFrequency.twiceWeekly,
    'monthly' => CollectionFrequency.monthly,
    _ => CollectionFrequency.once,
  };
}

CollectionStatus _collectionStatus(Object? value) {
  return switch (_string(value).toLowerCase()) {
    'quotationrequested' ||
    'quotation_requested' => CollectionStatus.quotationRequested,
    'confirmed' => CollectionStatus.confirmed,
    'assigned' ||
    'collectorassigned' ||
    'collector_assigned' => CollectionStatus.assigned,
    'inprogress' ||
    'in_progress' ||
    'en_route' ||
    'arrived' => CollectionStatus.inProgress,
    'completed' => CollectionStatus.completed,
    'missed' => CollectionStatus.missed,
    'cancelled' || 'canceled' => CollectionStatus.cancelled,
    _ => CollectionStatus.pending,
  };
}

CollectionPaymentStatus _paymentStatus(Object? value) {
  return switch (_string(value).toLowerCase()) {
    'pending' || 'processing' => CollectionPaymentStatus.pending,
    'paid' => CollectionPaymentStatus.paid,
    'failed' => CollectionPaymentStatus.failed,
    'refunded' => CollectionPaymentStatus.refunded,
    _ => CollectionPaymentStatus.unpaid,
  };
}

CollectionQuotationStatus _quotationStatus(Object? value) {
  return switch (_string(value)) {
    'requested' => CollectionQuotationStatus.requested,
    'underReview' => CollectionQuotationStatus.underReview,
    'quoted' => CollectionQuotationStatus.quoted,
    'accepted' => CollectionQuotationStatus.accepted,
    'rejected' => CollectionQuotationStatus.rejected,
    'expired' => CollectionQuotationStatus.expired,
    _ => CollectionQuotationStatus.notRequired,
  };
}

String _firebaseMessage(String code, {required String fallback}) {
  return switch (code) {
    'permission-denied' => 'You do not have permission for this booking.',
    'unavailable' => 'The booking service is temporarily unavailable.',
    'deadline-exceeded' => 'The booking request timed out. Try again.',
    _ => fallback,
  };
}

DateTime? _date(Object? value) {
  if (value is Timestamp) return value.toDate();
  if (value is DateTime) return value;
  if (value is String) return DateTime.tryParse(value);
  if (value is int) return DateTime.fromMillisecondsSinceEpoch(value);
  return null;
}

Map<String, dynamic>? _map(Object? value) {
  if (value is Map<String, dynamic>) return value;
  if (value is Map) return Map<String, dynamic>.from(value);
  return null;
}

String _string(Object? value) => value?.toString().trim() ?? '';

String? _nullableString(Object? value) {
  final result = _string(value);
  return result.isEmpty ? null : result;
}

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

List<String> _stringList(Object? value) {
  if (value is! List) return const [];
  return List.unmodifiable(value.map(_string).where((item) => item.isNotEmpty));
}

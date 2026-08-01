import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:crypto/crypto.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:ultrawash/core/cleango/models/payment.dart';
import 'package:ultrawash/core/cleango/repositories/payment_repository.dart';

class FirebasePaymentRepository implements PaymentRepository {
  FirebasePaymentRepository({
    FirebaseFirestore? firestore,
    FirebaseAuth? firebaseAuth,
  }) : _firestore = firestore ?? FirebaseFirestore.instance,
       _firebaseAuth = firebaseAuth ?? FirebaseAuth.instance;

  final FirebaseFirestore _firestore;
  final FirebaseAuth _firebaseAuth;

  CollectionReference<Map<String, dynamic>> get _payments =>
      _firestore.collection('payments');

  CollectionReference<Map<String, dynamic>> get _paymentIdempotency =>
      _firestore.collection('paymentIdempotency');

  @override
  Future<List<Payment>> getPayments(String customerId) async {
    final uid = _requireCurrentCustomer(customerId: customerId);
    final snapshot = await _payments.where('customerId', isEqualTo: uid).get();
    final payments =
        snapshot.docs
            .map(_paymentFromDocument)
            .whereType<Payment>()
            .where((payment) => payment.customerId == uid)
            .toList(growable: false)
          ..sort(
            (left, right) => right.initiatedAt.compareTo(left.initiatedAt),
          );
    return List.unmodifiable(payments);
  }

  @override
  Future<Payment?> getPaymentById(String paymentId) async {
    final uid = _requireCurrentCustomer();
    final snapshot = await _payments.doc(paymentId).get();
    if (!snapshot.exists) return null;
    final payment = _paymentFromDocument(snapshot);
    if (payment == null) return null;
    if (payment.customerId != uid) {
      throw StateError('Payment does not belong to the signed-in customer.');
    }
    return payment;
  }

  @override
  Future<int> getOutstandingBalanceXaf(String customerId) async {
    final payments = await getPayments(customerId);
    return payments
        .where((payment) => payment.isOutstanding)
        .fold<int>(0, (total, payment) => total + payment.amountXaf);
  }

  @override
  Future<PaymentCreationResult> createPaymentIntent(
    PaymentIntentRequest request,
  ) async {
    final uid = _requireCurrentCustomer();
    _validateCashRequest(request);
    await _verifyProtectedPricingSource(uid, request);

    final idempotencyKey = _idempotencyKey(uid, request);
    final lockRef = _paymentIdempotency.doc(idempotencyKey);
    final newPaymentRef = _payments.doc();
    final sourceId =
        request.bookingId ??
        request.subscriptionId ??
        request.quotationId ??
        '';
    final payload = _cashPaymentPayload(
      uid: uid,
      idempotencyKey: idempotencyKey,
      request: request,
    );

    final existingPaymentId = await _firestore.runTransaction<String?>((
      transaction,
    ) async {
      final lock = await transaction.get(lockRef);
      if (lock.exists) {
        final paymentId = _nullableString(lock.data()?['paymentId']);
        if (paymentId == null) {
          throw StateError('The existing payment request is invalid.');
        }
        return paymentId;
      }

      transaction.set(newPaymentRef, payload);
      transaction.set(lockRef, <String, Object?>{
        'customerId': uid,
        'paymentId': newPaymentRef.id,
        'purpose': request.purpose.wireValue,
        'sourceId': sourceId,
        'createdAt': FieldValue.serverTimestamp(),
      });
      return null;
    });

    final paymentRef = existingPaymentId == null
        ? newPaymentRef
        : _payments.doc(existingPaymentId);
    final snapshot = await paymentRef.get();
    final payment = _paymentFromDocument(snapshot);
    if (payment == null || payment.customerId != uid) {
      throw StateError('The payment request could not be confirmed.');
    }
    if (payment.idempotencyKey != idempotencyKey) {
      throw StateError('The payment request does not match this attempt.');
    }

    return PaymentCreationResult(
      payment: payment,
      wasDuplicate: existingPaymentId != null,
    );
  }

  void _validateCashRequest(PaymentIntentRequest request) {
    if (request.method != PaymentMethod.cash) {
      throw StateError(
        'MTN Mobile Money and Orange Money are not configured yet.',
      );
    }
    if (request.requestId.trim().isEmpty || request.amountXaf <= 0) {
      throw StateError('A valid payment request and amount are required.');
    }
    if (request.pricingSnapshot.currency != 'XAF' ||
        request.pricingSnapshot.amountXaf != request.amountXaf) {
      throw StateError('Payment pricing is invalid.');
    }
  }

  Map<String, Object?> _cashPaymentPayload({
    required String uid,
    required String idempotencyKey,
    required PaymentIntentRequest request,
  }) {
    return <String, Object?>{
      'customerId': uid,
      'paymentMethod': PaymentMethod.cash.wireValue,
      'paymentStatus': PaymentStatus.awaitingCashConfirmation.wireValue,
      'amount': request.amountXaf,
      'currency': 'XAF',
      'purpose': request.purpose.wireValue,
      'bookingId': request.bookingId,
      'subscriptionId': request.subscriptionId,
      'quotationId': request.quotationId,
      'providerReference': null,
      'externalTransactionId': null,
      'idempotencyKey': idempotencyKey,
      'phoneNumberMasked': null,
      'initiatedAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
      'confirmedAt': null,
      'failedAt': null,
      'cancelledAt': null,
      'confirmedBy': null,
      'confirmationSource': null,
      'failureCode': null,
      'failureMessageSafe': null,
      'pricingSnapshot': <String, Object?>{
        'amount': request.pricingSnapshot.amountXaf,
        'currency': request.pricingSnapshot.currency,
        'sourceType': request.pricingSnapshot.sourceType,
        'sourceId': request.pricingSnapshot.sourceId,
        'pricingVersion': request.pricingSnapshot.pricingVersion,
      },
      'receipt': const <String, Object?>{
        'available': false,
        'receiptNumber': null,
        'downloadUrl': null,
        'issuedAt': null,
      },
      'metadataVersion': 1,
    };
  }

  Future<void> _verifyProtectedPricingSource(
    String uid,
    PaymentIntentRequest request,
  ) async {
    switch (request.purpose) {
      case PaymentPurpose.oneTimePickup:
      case PaymentPurpose.quotationPayment:
      case PaymentPurpose.extraBagCharge:
        final bookingId = request.bookingId;
        if (bookingId == null || bookingId.isEmpty) {
          throw StateError('A booking is required for this payment.');
        }
        final snapshot = await _firestore
            .collection('collections')
            .doc(bookingId)
            .get();
        final data = snapshot.data();
        if (!snapshot.exists || data == null || data['customerId'] != uid) {
          throw StateError('The booking is unavailable.');
        }

        final expected = switch (request.purpose) {
          PaymentPurpose.quotationPayment => _intValue(data['quotedAmount']),
          PaymentPurpose.extraBagCharge => _intValue(
            (data['pricingSnapshot'] as Map?)?['extraBagAmount'] ??
                (data['pricing'] as Map?)?['extraBagAmount'],
          ),
          _ => _intValue(
            (data['pricingSnapshot'] as Map?)?['totalAmount'] ??
                (data['pricing'] as Map?)?['totalAmount'],
          ),
        };
        if (expected == null || expected != request.amountXaf) {
          throw StateError('The booking amount has changed.');
        }
        if (request.purpose == PaymentPurpose.quotationPayment &&
            data['quotationStatus'] != 'accepted') {
          throw StateError('Accept the quotation before payment.');
        }
      case PaymentPurpose.subscriptionPurchase:
      case PaymentPurpose.subscriptionRenewal:
        final subscriptionId = request.subscriptionId;
        if (subscriptionId == null || subscriptionId.isEmpty) {
          throw StateError('A subscription is required for this payment.');
        }
        final snapshot = await _firestore
            .collection('subscriptions')
            .doc(subscriptionId)
            .get();
        final data = snapshot.data();
        if (!snapshot.exists || data == null || data['customerId'] != uid) {
          throw StateError('The subscription is unavailable.');
        }
        final plan = data['planSnapshot'];
        final expected = plan is Map
            ? _intValue(plan['monthlyPriceXaf'])
            : null;
        if (expected == null || expected != request.amountXaf) {
          throw StateError('The subscription amount has changed.');
        }
    }
  }

  Payment? _paymentFromDocument(
    DocumentSnapshot<Map<String, dynamic>> snapshot,
  ) {
    final data = snapshot.data();
    if (data == null) return null;
    final method = PaymentMethodValue.tryParse(
      data['paymentMethod'] ?? data['provider'] ?? data['method'],
    );
    if (method == null) return null;
    final amount = _intValue(data['amount'] ?? data['amountXaf']);
    if (amount == null || amount < 0) return null;
    final pricingValue = data['pricingSnapshot'];
    final pricing = pricingValue is Map
        ? pricingValue
        : const <String, Object?>{};
    final receiptValue = data['receipt'];
    final receipt = receiptValue is Map
        ? receiptValue
        : const <String, Object?>{};
    final status = PaymentStatusValue.parse(
      data['paymentStatus'] ?? data['status'],
    );

    return Payment(
      id: snapshot.id,
      customerId: _stringValue(data['customerId']),
      amountXaf: amount,
      currency: _stringValue(data['currency'], fallback: 'XAF'),
      method: method,
      status: status,
      purpose: PaymentPurposeValue.parse(data['purpose']),
      bookingId: _nullableString(data['bookingId'] ?? data['pickupId']),
      subscriptionId: _nullableString(data['subscriptionId']),
      quotationId: _nullableString(data['quotationId']),
      providerReference: _nullableString(data['providerReference']),
      externalTransactionId: _nullableString(
        data['externalTransactionId'] ?? data['providerTransactionId'],
      ),
      idempotencyKey: _stringValue(
        data['idempotencyKey'],
        fallback: snapshot.id,
      ),
      phoneNumberMasked: _nullableString(data['phoneNumberMasked']),
      initiatedAt: _dateValue(
        data['initiatedAt'] ?? data['createdAt'] ?? data['paidAt'],
      ),
      updatedAt: _dateValue(
        data['updatedAt'] ?? data['initiatedAt'] ?? data['createdAt'],
      ),
      confirmedAt: _nullableDate(data['confirmedAt'] ?? data['paidAt']),
      failedAt: _nullableDate(data['failedAt']),
      cancelledAt: _nullableDate(data['cancelledAt']),
      confirmedBy: _nullableString(data['confirmedBy'] ?? data['verifiedBy']),
      confirmationSource: _nullableString(data['confirmationSource']),
      failureCode: _nullableString(data['failureCode']),
      failureMessageSafe: _nullableString(data['failureMessageSafe']),
      pricingSnapshot: PaymentPricingSnapshot(
        amountXaf: _intValue(pricing['amount']) ?? amount,
        currency: _stringValue(pricing['currency'], fallback: 'XAF'),
        sourceType: _stringValue(pricing['sourceType'], fallback: 'legacy'),
        sourceId: _stringValue(pricing['sourceId'], fallback: snapshot.id),
        pricingVersion: _stringValue(
          pricing['pricingVersion'],
          fallback: 'legacy',
        ),
      ),
      metadataVersion: _intValue(data['metadataVersion']) ?? 1,
      receipt: Receipt(
        paymentId: snapshot.id,
        available: status == PaymentStatus.paid && receipt['available'] == true,
        receiptNumber: _nullableString(receipt['receiptNumber']),
        downloadUrl: _nullableString(receipt['downloadUrl']),
        issuedAt: _nullableDate(receipt['issuedAt']),
      ),
    );
  }

  String _idempotencyKey(String uid, PaymentIntentRequest request) {
    final sourceId =
        request.bookingId ??
        request.subscriptionId ??
        request.quotationId ??
        '';
    final input = <String>[
      uid,
      request.requestId,
      request.method.wireValue,
      request.purpose.wireValue,
      sourceId,
      request.amountXaf.toString(),
    ].join('|');
    return sha256.convert(input.codeUnits).toString();
  }

  String _requireCurrentCustomer({String? customerId}) {
    final uid = _firebaseAuth.currentUser?.uid;
    if (uid == null || uid.isEmpty) {
      throw StateError('A Firebase customer session is required.');
    }
    if (customerId != null && customerId.isNotEmpty && customerId != uid) {
      throw StateError('Requested customer does not match the signed-in user.');
    }
    return uid;
  }
}

DateTime _dateValue(Object? value) => _nullableDate(value) ?? DateTime(0);

DateTime? _nullableDate(Object? value) {
  if (value is Timestamp) return value.toDate();
  if (value is DateTime) return value;
  if (value is int) return DateTime.fromMillisecondsSinceEpoch(value);
  if (value is String) return DateTime.tryParse(value);
  return null;
}

int? _intValue(Object? value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value);
  return null;
}

String _stringValue(Object? value, {String fallback = ''}) {
  final text = value?.toString().trim() ?? '';
  return text.isEmpty ? fallback : text;
}

String? _nullableString(Object? value) {
  final text = _stringValue(value);
  return text.isEmpty ? null : text;
}

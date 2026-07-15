import 'package:cloud_firestore/cloud_firestore.dart';
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

  @override
  Future<List<Payment>> getPayments(String customerId) async {
    final uid = _requireCurrentCustomer(customerId: customerId);
    final snapshot = await _payments.where('customerId', isEqualTo: uid).get();

    final records = snapshot.docs
        .map(_paymentRecordFromDocument)
        .where((record) => record.payment.customerId == uid)
        .toList(growable: false);

    records.sort((left, right) => right.sortDate.compareTo(left.sortDate));
    return List.unmodifiable(records.map((record) => record.payment));
  }

  @override
  Future<Payment?> getPaymentById(String paymentId) async {
    final uid = _requireCurrentCustomer();
    final snapshot = await _payments.doc(paymentId).get();
    if (!snapshot.exists || snapshot.data() == null) return null;

    final record = _paymentRecordFromDocument(snapshot);
    if (record.payment.customerId != uid) {
      throw StateError('Payment does not belong to the signed-in customer.');
    }

    return record.payment;
  }

  @override
  Future<int> getOutstandingBalanceXaf(String customerId) async {
    final payments = await getPayments(customerId);
    return payments
        .where(
          (payment) =>
              payment.status == PaymentStatus.pending ||
              payment.status == PaymentStatus.processing,
        )
        .fold<int>(0, (total, payment) => total + payment.amountXaf);
  }

  _PaymentRecord _paymentRecordFromDocument(
    DocumentSnapshot<Map<String, dynamic>> snapshot,
  ) {
    final data = snapshot.data() ?? const <String, dynamic>{};
    final paidAt = _dateFromValue(data['paidAt']);
    final createdAt = _dateFromValue(data['createdAt']);
    final updatedAt = _dateFromValue(data['updatedAt']);

    final payment = Payment(
      id: snapshot.id,
      customerId: _stringFromValue(data['customerId']) ?? '',
      amountXaf:
          _intFromValue(data['amountXaf']) ??
          _intFromValue(data['amount']) ??
          _intFromValue(data['totalAmount']) ??
          0,
      method: _paymentMethodFromValue(
        data['provider'] ?? data['method'] ?? data['paymentMethod'],
      ),
      status: _paymentStatusFromValue(data['status']),
      invoiceNumber:
          _stringFromValue(data['invoiceNumber']) ??
          _stringFromValue(data['invoiceId']) ??
          'INV-${snapshot.id}',
      billingPeriod: _billingPeriodFromData(data),
      paidAt: paidAt,
      transactionReference:
          _stringFromValue(data['providerTransactionId']) ??
          _stringFromValue(data['providerReference']) ??
          _stringFromValue(data['transactionReference']) ??
          _stringFromValue(data['reference']),
    );

    return _PaymentRecord(
      payment: payment,
      sortDate: createdAt ?? paidAt ?? updatedAt ?? DateTime(0),
    );
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

  PaymentStatus _paymentStatusFromValue(Object? value) {
    final normalized = _normalize(value);
    switch (normalized) {
      case 'paid':
      case 'success':
      case 'succeeded':
      case 'completed':
        return PaymentStatus.paid;
      case 'processing':
      case 'initiated':
      case 'inprogress':
      case 'in_progress':
        return PaymentStatus.processing;
      case 'failed':
      case 'failure':
      case 'declined':
      case 'expired':
      case 'cancelled':
      case 'canceled':
        return PaymentStatus.failed;
      case 'refunded':
      case 'refund':
        return PaymentStatus.refunded;
      case 'pending':
      case 'awaitingpayment':
      case 'awaiting_payment':
      default:
        return PaymentStatus.pending;
    }
  }

  PaymentMethod _paymentMethodFromValue(Object? value) {
    final normalized = _normalize(value);
    if (normalized.contains('mtn')) return PaymentMethod.mtnMobileMoney;
    if (normalized.contains('orange')) return PaymentMethod.orangeMoney;
    if (normalized.contains('stripe') ||
        normalized.contains('card') ||
        normalized.contains('credit')) {
      return PaymentMethod.stripeCard;
    }
    if (normalized.contains('cash')) return PaymentMethod.cashOnCollection;
    if (normalized.contains('bank') ||
        normalized.contains('transfer') ||
        normalized.contains('manual')) {
      return PaymentMethod.bankTransfer;
    }

    return PaymentMethod.bankTransfer;
  }

  String _billingPeriodFromData(Map<String, dynamic> data) {
    final billingPeriod = _stringFromValue(data['billingPeriod']);
    if (billingPeriod != null && billingPeriod.isNotEmpty) return billingPeriod;

    final period = _stringFromValue(data['period']);
    if (period != null && period.isNotEmpty) return period;

    final start = _dateFromValue(data['billingStart'] ?? data['periodStart']);
    final end = _dateFromValue(data['billingEnd'] ?? data['periodEnd']);
    if (start != null && end != null) {
      return '${_monthName(start.month)} ${start.year} - '
          '${_monthName(end.month)} ${end.year}';
    }

    return 'Current period';
  }

  DateTime? _dateFromValue(Object? value) {
    if (value == null) return null;
    if (value is Timestamp) return value.toDate();
    if (value is DateTime) return value;
    if (value is int) return DateTime.fromMillisecondsSinceEpoch(value);
    if (value is String) return DateTime.tryParse(value);
    return null;
  }

  int? _intFromValue(Object? value) {
    if (value == null) return null;
    if (value is int) return value;
    if (value is double) return value.round();
    if (value is num) return value.toInt();
    if (value is String) return int.tryParse(value);
    return null;
  }

  String? _stringFromValue(Object? value) {
    if (value == null) return null;
    final text = value.toString().trim();
    return text.isEmpty ? null : text;
  }

  String _normalize(Object? value) {
    return value.toString().trim().toLowerCase().replaceAll(
      RegExp(r'[\s-]+'),
      '_',
    );
  }

  String _monthName(int month) {
    const names = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return names[month.clamp(1, 12) - 1];
  }
}

class _PaymentRecord {
  const _PaymentRecord({required this.payment, required this.sortDate});

  final Payment payment;
  final DateTime sortDate;
}

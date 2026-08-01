import 'package:ultrawash/core/cleango/models/payment.dart';
import 'package:ultrawash/core/cleango/repositories/payment_repository.dart';

class MockPaymentService implements PaymentRepository {
  final List<Payment> _payments = [
    Payment(
      id: 'payment-demo-001',
      customerId: 'customer-demo-001',
      amountXaf: 5000,
      currency: 'XAF',
      method: PaymentMethod.mtnMobileMoney,
      status: PaymentStatus.paid,
      purpose: PaymentPurpose.subscriptionPurchase,
      subscriptionId: 'subscription-demo-001',
      idempotencyKey: 'payment-demo-001',
      initiatedAt: DateTime(2026, 6, 21, 9, 30),
      updatedAt: DateTime(2026, 6, 21, 9, 35),
      confirmedAt: DateTime(2026, 6, 21, 9, 35),
      pricingSnapshot: const PaymentPricingSnapshot(
        amountXaf: 5000,
        currency: 'XAF',
        sourceType: 'subscription',
        sourceId: 'subscription-demo-001',
        pricingVersion: 'approved-v1-2026-07',
      ),
      metadataVersion: 1,
      receipt: const Receipt(
        paymentId: 'payment-demo-001',
        available: true,
        receiptNumber: 'CG-2026-0060',
      ),
    ),
  ];

  @override
  Future<PaymentCreationResult> createPaymentIntent(
    PaymentIntentRequest request,
  ) async {
    if (request.method != PaymentMethod.cash) {
      throw UnsupportedError('Only cash is available in preview payment mode.');
    }
    final id = 'payment-${request.requestId}';
    for (final payment in _payments) {
      if (payment.id == id) {
        return PaymentCreationResult(payment: payment, wasDuplicate: true);
      }
    }
    final now = DateTime.now();
    final payment = Payment(
      id: id,
      customerId: 'customer-demo-001',
      amountXaf: request.amountXaf,
      currency: 'XAF',
      method: PaymentMethod.cash,
      status: PaymentStatus.awaitingCashConfirmation,
      purpose: request.purpose,
      bookingId: request.bookingId,
      subscriptionId: request.subscriptionId,
      quotationId: request.quotationId,
      idempotencyKey: id,
      initiatedAt: now,
      updatedAt: now,
      pricingSnapshot: request.pricingSnapshot,
      metadataVersion: 1,
      receipt: Receipt(paymentId: id, available: false),
    );
    _payments.add(payment);
    return PaymentCreationResult(payment: payment, wasDuplicate: false);
  }

  @override
  Future<int> getOutstandingBalanceXaf(String customerId) async {
    return _payments
        .where(
          (payment) => payment.customerId == customerId && payment.isOutstanding,
        )
        .fold<int>(0, (total, payment) => total + payment.amountXaf);
  }

  @override
  Future<Payment?> getPaymentById(String paymentId) async {
    for (final payment in _payments) {
      if (payment.id == paymentId) return payment;
    }
    return null;
  }

  @override
  Future<List<Payment>> getPayments(String customerId) async {
    return List.unmodifiable(
      _payments.where((payment) => payment.customerId == customerId),
    );
  }
}
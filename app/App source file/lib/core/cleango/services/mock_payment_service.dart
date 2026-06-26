import 'package:ultrawash/core/cleango/models/payment.dart';
import 'package:ultrawash/core/cleango/repositories/payment_repository.dart';

class MockPaymentService implements PaymentRepository {
  final List<Payment> _payments = [
    Payment(
      id: 'payment-demo-001',
      customerId: 'customer-demo-001',
      amountXaf: 5000,
      method: PaymentMethod.mtnMobileMoney,
      status: PaymentStatus.paid,
      invoiceNumber: 'INV-CG-2026-0060',
      billingPeriod: 'June 2026',
      paidAt: DateTime(2026, 6, 21, 9, 30),
      transactionReference: 'CG-2026-0621-1842',
    ),
    Payment(
      id: 'payment-demo-002',
      customerId: 'customer-demo-001',
      amountXaf: 5000,
      method: PaymentMethod.stripeCard,
      status: PaymentStatus.pending,
      invoiceNumber: 'INV-CG-2026-0071',
      billingPeriod: 'July 2026',
    ),
  ];

  @override
  Future<int> getOutstandingBalanceXaf(String customerId) async {
    return _payments
        .where(
          (payment) =>
              payment.customerId == customerId &&
              payment.status == PaymentStatus.pending,
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

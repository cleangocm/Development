import 'package:ultrawash/core/cleango/models/payment.dart';
import 'package:ultrawash/core/cleango/repositories/payment_repository.dart';
import 'package:ultrawash/core/cleango/services/mock_payment_service.dart';

class PaymentsTabController {
  PaymentsTabController({
    required this.paymentRepository,
    this.customerId = _demoCustomerId,
  });

  factory PaymentsTabController.mock() {
    return PaymentsTabController(paymentRepository: MockPaymentService());
  }

  static const _demoCustomerId = 'customer-demo-001';

  final PaymentRepository paymentRepository;
  final String customerId;

  Future<PaymentsTabViewData> load() async {
    final payments = await paymentRepository.getPayments(customerId);
    final outstandingBalanceXaf = await paymentRepository
        .getOutstandingBalanceXaf(customerId);

    final sortedPayments = [...payments]
      ..sort((left, right) {
        final leftDate = left.paidAt ?? DateTime(0);
        final rightDate = right.paidAt ?? DateTime(0);
        return rightDate.compareTo(leftDate);
      });

    final paidThisMonthXaf = sortedPayments
        .where((payment) => _isPaidInCurrentBillingMonth(payment))
        .fold<int>(0, (total, payment) => total + payment.amountXaf);

    return PaymentsTabViewData(
      outstandingBalanceXaf: outstandingBalanceXaf,
      paidThisMonthXaf: paidThisMonthXaf,
      subscriptionStatus: 'Active',
      payments: List.unmodifiable(sortedPayments),
      invoices: List.unmodifiable(sortedPayments),
      supportedMethods: PaymentMethod.values,
    );
  }

  bool _isPaidInCurrentBillingMonth(Payment payment) {
    final paidAt = payment.paidAt;
    if (paidAt == null || payment.status != PaymentStatus.paid) return false;

    final now = DateTime.now();
    return paidAt.year == now.year && paidAt.month == now.month;
  }
}

class PaymentsTabViewData {
  const PaymentsTabViewData({
    required this.outstandingBalanceXaf,
    required this.paidThisMonthXaf,
    required this.subscriptionStatus,
    required this.payments,
    required this.invoices,
    required this.supportedMethods,
  });

  factory PaymentsTabViewData.empty() {
    return const PaymentsTabViewData(
      outstandingBalanceXaf: 0,
      paidThisMonthXaf: 0,
      subscriptionStatus: 'Pending',
      payments: [],
      invoices: [],
      supportedMethods: [],
    );
  }

  final int outstandingBalanceXaf;
  final int paidThisMonthXaf;
  final String subscriptionStatus;
  final List<Payment> payments;
  final List<Payment> invoices;
  final List<PaymentMethod> supportedMethods;
}

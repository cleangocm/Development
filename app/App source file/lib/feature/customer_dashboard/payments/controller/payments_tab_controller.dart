import 'package:ultrawash/core/cleango/models/payment.dart';
import 'package:ultrawash/core/cleango/di/cleango_service_locator.dart';
import 'package:ultrawash/core/cleango/repositories/payment_repository.dart';
import 'package:ultrawash/core/cleango/session/current_customer_provider.dart';

class PaymentsTabController {
  PaymentsTabController({
    required this.currentCustomerProvider,
    required this.paymentRepository,
  });

  factory PaymentsTabController.mock() {
    final dependencies = CleanGoServiceLocator.instance.dashboardDependencies;
    return PaymentsTabController(
      currentCustomerProvider: dependencies.currentCustomerProvider,
      paymentRepository: dependencies.paymentRepository,
    );
  }

  final CurrentCustomerProvider currentCustomerProvider;
  final PaymentRepository paymentRepository;

  Future<PaymentsTabViewData> load() async {
    final customerId = await currentCustomerProvider.getCurrentCustomerId();
    if (customerId == null || customerId.isEmpty) {
      return PaymentsTabViewData.empty();
    }

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

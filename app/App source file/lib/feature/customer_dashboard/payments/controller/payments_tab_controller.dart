import 'package:ultrawash/core/cleango/di/cleango_service_locator.dart';
import 'package:ultrawash/core/cleango/models/payment.dart';
import 'package:ultrawash/core/cleango/models/subscription.dart';
import 'package:ultrawash/core/cleango/payments/payment_configuration.dart';
import 'package:ultrawash/core/cleango/repositories/payment_repository.dart';
import 'package:ultrawash/core/cleango/repositories/subscription_repository.dart';
import 'package:ultrawash/core/cleango/session/current_customer_provider.dart';

class PaymentsTabController {
  PaymentsTabController({
    required this.currentCustomerProvider,
    required this.paymentRepository,
    required this.subscriptionRepository,
    PaymentConfiguration? configuration,
  }) : configuration = configuration ?? PaymentConfiguration.fromEnvironment();

  factory PaymentsTabController.mock() {
    final dependencies = CleanGoServiceLocator.instance.dashboardDependencies;
    return PaymentsTabController(
      currentCustomerProvider: dependencies.currentCustomerProvider,
      paymentRepository: dependencies.paymentRepository,
      subscriptionRepository: dependencies.subscriptionRepository,
    );
  }

  final CurrentCustomerProvider currentCustomerProvider;
  final PaymentRepository paymentRepository;
  final SubscriptionRepository subscriptionRepository;
  final PaymentConfiguration configuration;

  Future<PaymentsTabViewData> load() async {
    final customerId = await currentCustomerProvider.getCurrentCustomerId();
    if (customerId == null || customerId.isEmpty) {
      return PaymentsTabViewData.empty(
        supportedMethods: configuration.visibleMethods,
      );
    }

    final payments = await paymentRepository.getPayments(customerId);
    final outstandingBalanceXaf = await paymentRepository
        .getOutstandingBalanceXaf(customerId);
    final sortedPayments = [...payments]
      ..sort((left, right) => right.initiatedAt.compareTo(left.initiatedAt));

    final paidThisMonthXaf = sortedPayments
        .where(_isPaidInCurrentMonth)
        .fold<int>(0, (total, payment) => total + payment.amountXaf);

    var subscriptionStatus = 'No active plan';
    try {
      final subscription = await subscriptionRepository.getActiveSubscription(
        customerId,
      );
      subscriptionStatus = subscription?.status.label ?? subscriptionStatus;
    } catch (_) {
      // Payment history remains useful if the subscription read is unavailable.
    }

    return PaymentsTabViewData(
      outstandingBalanceXaf: outstandingBalanceXaf,
      paidThisMonthXaf: paidThisMonthXaf,
      subscriptionStatus: subscriptionStatus,
      payments: List.unmodifiable(sortedPayments),
      supportedMethods: configuration.visibleMethods,
    );
  }

  bool _isPaidInCurrentMonth(Payment payment) {
    final confirmedAt = payment.confirmedAt;
    if (confirmedAt == null || payment.status != PaymentStatus.paid) {
      return false;
    }
    final now = DateTime.now();
    return confirmedAt.year == now.year && confirmedAt.month == now.month;
  }
}

class PaymentsTabViewData {
  const PaymentsTabViewData({
    required this.outstandingBalanceXaf,
    required this.paidThisMonthXaf,
    required this.subscriptionStatus,
    required this.payments,
    required this.supportedMethods,
  });

  factory PaymentsTabViewData.empty({
    List<PaymentMethod> supportedMethods = const [],
  }) {
    return PaymentsTabViewData(
      outstandingBalanceXaf: 0,
      paidThisMonthXaf: 0,
      subscriptionStatus: 'No active plan',
      payments: const [],
      supportedMethods: supportedMethods,
    );
  }

  final int outstandingBalanceXaf;
  final int paidThisMonthXaf;
  final String subscriptionStatus;
  final List<Payment> payments;
  final List<PaymentMethod> supportedMethods;
}

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ultrawash/core/cleango/models/payment.dart';
import 'package:ultrawash/core/cleango/models/subscription.dart';
import 'package:ultrawash/core/cleango/payments/adapters/mtn_mobile_money_adapter.dart';
import 'package:ultrawash/core/cleango/payments/adapters/orange_money_adapter.dart';
import 'package:ultrawash/core/cleango/payments/payment_configuration.dart';
import 'package:ultrawash/core/cleango/payments/payment_result.dart';
import 'package:ultrawash/core/cleango/payments/payment_service.dart';
import 'package:ultrawash/core/cleango/repositories/payment_repository.dart';
import 'package:ultrawash/core/cleango/repositories/subscription_repository.dart';
import 'package:ultrawash/core/cleango/session/current_customer_provider.dart';
import 'package:ultrawash/feature/customer_dashboard/payments/controller/payments_tab_controller.dart';
import 'package:ultrawash/feature/customer_dashboard/payments/payments_tab.dart';

void main() {
  group('Payment policy', () {
    test('exposes only approved methods and stable stored values', () {
      expect(PaymentMethod.values, [
        PaymentMethod.mtnMobileMoney,
        PaymentMethod.orangeMoney,
        PaymentMethod.cash,
      ]);
      expect(PaymentMethod.values.map((method) => method.wireValue), [
        'mtn_mobile_money',
        'orange_money',
        'cash',
      ]);
      expect(PaymentMethodValue.tryParse('stripe'), isNull);
      expect(PaymentMethodValue.tryParse('card'), isNull);
      expect(PaymentMethod.cash.label(languageCode: 'fr'), 'Espèces');
    });

    test('keeps mobile money visible but unavailable', () {
      const configuration = PaymentConfiguration();

      expect(configuration.visibleMethods, PaymentMethod.values);
      expect(configuration.isAvailable(PaymentMethod.mtnMobileMoney), isFalse);
      expect(configuration.isAvailable(PaymentMethod.orangeMoney), isFalse);
      expect(configuration.isAvailable(PaymentMethod.cash), isTrue);
    });

    test('MTN adapter fails closed', () async {
      final result = await const MtnMobileMoneyAdapter().initiate(
        _paymentRequest(PaymentMethod.mtnMobileMoney),
      );

      expect(result.isSuccess, isFalse);
      expect(result.failure?.code, PaymentFailureCode.integrationNotConfigured);
    });

    test('Orange adapter fails closed', () async {
      final result = await const OrangeMoneyAdapter().initiate(
        _paymentRequest(PaymentMethod.orangeMoney),
      );

      expect(result.isSuccess, isFalse);
      expect(result.failure?.code, PaymentFailureCode.integrationNotConfigured);
    });

    test('rejects a client amount mismatch before repository access', () async {
      final repository = _MemoryPaymentRepository();
      final result = await PaymentService(paymentRepository: repository)
          .initiate(
            PaymentIntentRequest(
              requestId: 'mismatch',
              method: PaymentMethod.cash,
              purpose: PaymentPurpose.oneTimePickup,
              amountXaf: 2000,
              pricingSnapshot: const PaymentPricingSnapshot(
                amountXaf: 1500,
                currency: 'XAF',
                sourceType: 'collection',
                sourceId: 'collection-a',
                pricingVersion: 'approved-v1',
              ),
              bookingId: 'collection-a',
            ),
          );

      expect(result.isSuccess, isFalse);
      expect(result.failure?.code, PaymentFailureCode.invalidRequest);
      expect(repository.createCalls, 0);
    });

    test('cash creates an awaiting-confirmation payment', () async {
      final repository = _MemoryPaymentRepository();
      final result = await PaymentService(
        paymentRepository: repository,
      ).initiate(_paymentRequest(PaymentMethod.cash));

      expect(result.isSuccess, isTrue);
      expect(result.payment?.method, PaymentMethod.cash);
      expect(result.payment?.status, PaymentStatus.awaitingCashConfirmation);
      expect(result.payment?.isOutstanding, isTrue);
      expect(repository.createCalls, 1);
    });

    test('controller sorts history and calculates summaries', () async {
      final now = DateTime.now();
      final repository = _MemoryPaymentRepository(
        payments: [
          _payment(
            id: 'older-paid',
            status: PaymentStatus.paid,
            amountXaf: 2500,
            initiatedAt: now.subtract(const Duration(days: 2)),
            confirmedAt: now,
          ),
          _payment(
            id: 'newer-pending',
            status: PaymentStatus.awaitingCashConfirmation,
            amountXaf: 1500,
            initiatedAt: now,
          ),
        ],
      );
      final data = await PaymentsTabController(
        currentCustomerProvider: const _StaticCustomerProvider('customer-a'),
        paymentRepository: repository,
        subscriptionRepository: const _EmptySubscriptionRepository(),
        configuration: const PaymentConfiguration(),
      ).load();

      expect(data.payments.map((payment) => payment.id), [
        'newer-pending',
        'older-paid',
      ]);
      expect(data.outstandingBalanceXaf, 1500);
      expect(data.paidThisMonthXaf, 2500);
      expect(data.supportedMethods, PaymentMethod.values);
    });

    test('controller returns a safe signed-out state without reads', () async {
      final repository = _MemoryPaymentRepository();
      final data = await PaymentsTabController(
        currentCustomerProvider: const _StaticCustomerProvider(null),
        paymentRepository: repository,
        subscriptionRepository: const _EmptySubscriptionRepository(),
        configuration: const PaymentConfiguration(),
      ).load();

      expect(data.payments, isEmpty);
      expect(data.outstandingBalanceXaf, 0);
      expect(repository.readCalls, 0);
    });
  });

  testWidgets('payment tab exposes only approved customer methods', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: PaymentsTab(
            controller: PaymentsTabController(
              currentCustomerProvider: const _StaticCustomerProvider(null),
              paymentRepository: _MemoryPaymentRepository(),
              subscriptionRepository: const _EmptySubscriptionRepository(),
              configuration: const PaymentConfiguration(),
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('MTN Mobile Money'), findsOneWidget);
    expect(find.text('Orange Money'), findsOneWidget);
    expect(find.text('Cash'), findsOneWidget);
    expect(find.textContaining('Stripe'), findsNothing);
    expect(find.textContaining('Card'), findsNothing);
  });

  testWidgets('payment tab reloads when its refresh token changes', (
    tester,
  ) async {
    final repository = _MemoryPaymentRepository();
    final controller = PaymentsTabController(
      currentCustomerProvider: const _StaticCustomerProvider('customer-a'),
      paymentRepository: repository,
      subscriptionRepository: const _EmptySubscriptionRepository(),
      configuration: const PaymentConfiguration(),
    );

    Widget buildTab(int refreshToken) {
      return MaterialApp(
        home: Scaffold(
          body: PaymentsTab(controller: controller, refreshToken: refreshToken),
        ),
      );
    }

    await tester.pumpWidget(buildTab(0));
    await tester.pumpAndSettle();
    expect(repository.readCalls, 2);
    expect(find.text('Unable to load payments'), findsNothing);

    repository.payments.add(
      _payment(
        id: 'new-cash-request',
        status: PaymentStatus.awaitingCashConfirmation,
        amountXaf: 1500,
        initiatedAt: DateTime.now(),
      ),
    );
    await tester.pumpWidget(buildTab(1));
    await tester.pumpAndSettle();

    expect(repository.readCalls, 4);
    expect(find.text('Unable to load payments'), findsNothing);
  });
}

PaymentIntentRequest _paymentRequest(PaymentMethod method) {
  return PaymentIntentRequest(
    requestId: 'request-${method.wireValue}',
    method: method,
    purpose: PaymentPurpose.oneTimePickup,
    amountXaf: 1500,
    pricingSnapshot: const PaymentPricingSnapshot(
      amountXaf: 1500,
      currency: 'XAF',
      sourceType: 'collection',
      sourceId: 'collection-a',
      pricingVersion: 'approved-v1',
    ),
    bookingId: 'collection-a',
  );
}

Payment _payment({
  required String id,
  required PaymentStatus status,
  required int amountXaf,
  required DateTime initiatedAt,
  DateTime? confirmedAt,
  PaymentMethod method = PaymentMethod.cash,
}) {
  return Payment(
    id: id,
    customerId: 'customer-a',
    amountXaf: amountXaf,
    currency: 'XAF',
    method: method,
    status: status,
    purpose: PaymentPurpose.oneTimePickup,
    idempotencyKey: 'key-$id',
    initiatedAt: initiatedAt,
    updatedAt: initiatedAt,
    confirmedAt: confirmedAt,
    pricingSnapshot: PaymentPricingSnapshot(
      amountXaf: amountXaf,
      currency: 'XAF',
      sourceType: 'collection',
      sourceId: 'collection-a',
      pricingVersion: 'approved-v1',
    ),
    metadataVersion: 1,
    bookingId: 'collection-a',
  );
}

class _MemoryPaymentRepository implements PaymentRepository {
  _MemoryPaymentRepository({List<Payment>? payments})
    : payments = [...?payments];

  final List<Payment> payments;
  int createCalls = 0;
  int readCalls = 0;

  @override
  Future<PaymentCreationResult> createPaymentIntent(
    PaymentIntentRequest request,
  ) async {
    createCalls += 1;
    final payment = _payment(
      id: 'cash-payment',
      status: PaymentStatus.awaitingCashConfirmation,
      amountXaf: request.amountXaf,
      initiatedAt: DateTime.now(),
      method: request.method,
    );
    payments.add(payment);
    return PaymentCreationResult(payment: payment, wasDuplicate: false);
  }

  @override
  Future<int> getOutstandingBalanceXaf(String customerId) async {
    readCalls += 1;
    return payments
        .where((payment) => payment.isOutstanding)
        .fold<int>(0, (total, payment) => total + payment.amountXaf);
  }

  @override
  Future<Payment?> getPaymentById(String paymentId) async {
    for (final payment in payments) {
      if (payment.id == paymentId) return payment;
    }
    return null;
  }

  @override
  Future<List<Payment>> getPayments(String customerId) async {
    readCalls += 1;
    return payments
        .where((payment) => payment.customerId == customerId)
        .toList();
  }
}

class _StaticCustomerProvider implements CurrentCustomerProvider {
  const _StaticCustomerProvider(this.customerId);

  final String? customerId;

  @override
  Future<String?> getCurrentCustomerId() async => customerId;

  @override
  Future<bool> isLoggedIn() async => customerId != null;

  @override
  Future<void> refresh() async {}
}

class _EmptySubscriptionRepository implements SubscriptionRepository {
  const _EmptySubscriptionRepository();

  @override
  Future<Subscription?> getActiveSubscription(String customerId) async => null;

  @override
  Future<List<SubscriptionPlanDefinition>> getAvailablePlans() async =>
      const [];

  @override
  Future<List<Subscription>> getSubscriptionHistory(String customerId) async =>
      const [];

  @override
  Future<SubscriptionRequestResult> requestSubscription(
    SubscriptionRequest request,
  ) async => throw UnsupportedError('Not used by this test.');

  @override
  Future<Subscription> updateSubscription(Subscription subscription) async =>
      throw UnsupportedError('Not used by this test.');
}

import 'package:ultrawash/core/cleango/models/payment.dart';
import 'package:ultrawash/core/cleango/payments/adapters/cash_payment_adapter.dart';
import 'package:ultrawash/core/cleango/payments/adapters/mtn_mobile_money_adapter.dart';
import 'package:ultrawash/core/cleango/payments/adapters/orange_money_adapter.dart';
import 'package:ultrawash/core/cleango/payments/payment_configuration.dart';
import 'package:ultrawash/core/cleango/payments/payment_provider_adapter.dart';
import 'package:ultrawash/core/cleango/payments/payment_result.dart';
import 'package:ultrawash/core/cleango/repositories/payment_repository.dart';

class PaymentService {
  PaymentService({
    required PaymentRepository paymentRepository,
    PaymentConfiguration? configuration,
    List<PaymentProviderAdapter>? adapters,
  }) : configuration = configuration ?? PaymentConfiguration.fromEnvironment(),
       _adapters = {
         for (final adapter
             in adapters ??
                 [
                   const MtnMobileMoneyAdapter(),
                   const OrangeMoneyAdapter(),
                   CashPaymentAdapter(paymentRepository: paymentRepository),
                 ])
           adapter.method: adapter,
       };

  final PaymentConfiguration configuration;
  final Map<PaymentMethod, PaymentProviderAdapter> _adapters;

  List<PaymentMethod> get visibleMethods => configuration.visibleMethods;

  bool isConfigured(PaymentMethod method) =>
      _adapters[method]?.isConfigured == true;

  String availabilityMessage(PaymentMethod method) =>
      configuration.availabilityMessage(method);

  Future<PaymentResult> initiate(PaymentIntentRequest request) async {
    if (request.amountXaf <= 0 || request.pricingSnapshot.amountXaf <= 0) {
      return const PaymentResult.failure(
        PaymentFailure(
          code: PaymentFailureCode.invalidRequest,
          message: 'A valid protected XAF amount is required.',
        ),
      );
    }
    if (request.amountXaf != request.pricingSnapshot.amountXaf ||
        request.pricingSnapshot.currency != 'XAF') {
      return const PaymentResult.failure(
        PaymentFailure(
          code: PaymentFailureCode.invalidRequest,
          message: 'The payment amount does not match its pricing source.',
        ),
      );
    }

    final adapter = _adapters[request.method];
    if (adapter == null) {
      return const PaymentResult.failure(
        PaymentFailure(
          code: PaymentFailureCode.unavailable,
          message: 'This payment method is unavailable.',
        ),
      );
    }
    return adapter.initiate(request);
  }
}

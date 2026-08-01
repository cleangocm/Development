import 'package:ultrawash/core/cleango/models/payment.dart';
import 'package:ultrawash/core/cleango/payments/payment_provider_adapter.dart';
import 'package:ultrawash/core/cleango/payments/payment_result.dart';

class OrangeMoneyAdapter implements PaymentProviderAdapter {
  const OrangeMoneyAdapter();

  @override
  PaymentMethod get method => PaymentMethod.orangeMoney;

  @override
  bool get isConfigured => false;

  @override
  Future<PaymentResult> initiate(PaymentIntentRequest request) async {
    return const PaymentResult.failure(
      PaymentFailure(
        code: PaymentFailureCode.integrationNotConfigured,
        message:
            'Orange Money is not configured yet. No payment has been created.',
      ),
    );
  }
}

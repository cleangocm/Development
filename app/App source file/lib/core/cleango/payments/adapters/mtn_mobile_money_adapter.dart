import 'package:ultrawash/core/cleango/models/payment.dart';
import 'package:ultrawash/core/cleango/payments/payment_provider_adapter.dart';
import 'package:ultrawash/core/cleango/payments/payment_result.dart';

class MtnMobileMoneyAdapter implements PaymentProviderAdapter {
  const MtnMobileMoneyAdapter();

  @override
  PaymentMethod get method => PaymentMethod.mtnMobileMoney;

  @override
  bool get isConfigured => false;

  @override
  Future<PaymentResult> initiate(PaymentIntentRequest request) async {
    return const PaymentResult.failure(
      PaymentFailure(
        code: PaymentFailureCode.integrationNotConfigured,
        message:
            'MTN Mobile Money is not configured yet. No payment has been created.',
      ),
    );
  }
}

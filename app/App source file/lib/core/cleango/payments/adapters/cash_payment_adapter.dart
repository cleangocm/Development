import 'package:ultrawash/core/cleango/models/payment.dart';
import 'package:ultrawash/core/cleango/payments/payment_provider_adapter.dart';
import 'package:ultrawash/core/cleango/payments/payment_result.dart';
import 'package:ultrawash/core/cleango/repositories/payment_repository.dart';

class CashPaymentAdapter implements PaymentProviderAdapter {
  const CashPaymentAdapter({required this.paymentRepository});

  final PaymentRepository paymentRepository;

  @override
  PaymentMethod get method => PaymentMethod.cash;

  @override
  bool get isConfigured => true;

  @override
  Future<PaymentResult> initiate(PaymentIntentRequest request) async {
    if (request.method != PaymentMethod.cash) {
      return const PaymentResult.failure(
        PaymentFailure(
          code: PaymentFailureCode.invalidRequest,
          message: 'This adapter accepts cash payments only.',
        ),
      );
    }

    try {
      final result = await paymentRepository.createPaymentIntent(request);
      return PaymentResult.success(
        result.payment,
        wasDuplicate: result.wasDuplicate,
      );
    } catch (error) {
      return PaymentResult.failure(
        PaymentFailure(
          code: PaymentFailureCode.unknown,
          message: _safeMessage(error),
        ),
      );
    }
  }
}

String _safeMessage(Object error) {
  final message = error.toString();
  if (message.contains('permission-denied')) {
    return 'You do not have permission to create this payment request.';
  }
  if (message.contains('unauthenticated') || message.contains('signed-in')) {
    return 'Sign in again before creating a payment request.';
  }
  if (message.contains('invalid') || message.contains('amount')) {
    return 'The payment request is no longer valid. Refresh and try again.';
  }
  return 'Unable to create the cash payment request. Please try again.';
}

import 'package:ultrawash/core/cleango/models/payment.dart';
import 'package:ultrawash/core/cleango/payments/payment_result.dart';

abstract interface class PaymentProviderAdapter {
  PaymentMethod get method;

  bool get isConfigured;

  Future<PaymentResult> initiate(PaymentIntentRequest request);
}

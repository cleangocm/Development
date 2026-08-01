import 'package:ultrawash/core/cleango/models/payment.dart';

enum PaymentFailureCode {
  integrationNotConfigured,
  unavailable,
  unauthenticated,
  invalidRequest,
  permissionDenied,
  duplicate,
  network,
  unknown,
}

class PaymentFailure {
  const PaymentFailure({required this.code, required this.message});

  final PaymentFailureCode code;
  final String message;
}

class PaymentResult {
  const PaymentResult._({
    this.payment,
    this.failure,
    this.wasDuplicate = false,
  });

  const PaymentResult.success(Payment value, {bool wasDuplicate = false})
    : this._(payment: value, wasDuplicate: wasDuplicate);

  const PaymentResult.failure(PaymentFailure value) : this._(failure: value);

  final Payment? payment;
  final PaymentFailure? failure;
  final bool wasDuplicate;

  bool get isSuccess => payment != null && failure == null;
}

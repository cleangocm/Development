import 'package:ultrawash/core/cleango/models/payment.dart';

abstract interface class PaymentRepository {
  Future<List<Payment>> getPayments(String customerId);

  Future<Payment?> getPaymentById(String paymentId);

  Future<int> getOutstandingBalanceXaf(String customerId);
}

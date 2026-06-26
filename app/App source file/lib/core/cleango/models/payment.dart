enum PaymentMethod {
  mtnMobileMoney,
  orangeMoney,
  stripeCard,
  bankTransfer,
  cashOnCollection,
}

enum PaymentStatus { paid, pending, processing, failed, refunded }

class Payment {
  const Payment({
    required this.id,
    required this.customerId,
    required this.amountXaf,
    required this.method,
    required this.status,
    required this.invoiceNumber,
    required this.billingPeriod,
    this.paidAt,
    this.transactionReference,
  });

  final String id;
  final String customerId;
  final int amountXaf;
  final PaymentMethod method;
  final PaymentStatus status;
  final String invoiceNumber;
  final String billingPeriod;
  final DateTime? paidAt;
  final String? transactionReference;

  bool get isSettled =>
      status == PaymentStatus.paid || status == PaymentStatus.refunded;

  Payment copyWith({
    String? id,
    String? customerId,
    int? amountXaf,
    PaymentMethod? method,
    PaymentStatus? status,
    String? invoiceNumber,
    String? billingPeriod,
    DateTime? paidAt,
    String? transactionReference,
  }) {
    return Payment(
      id: id ?? this.id,
      customerId: customerId ?? this.customerId,
      amountXaf: amountXaf ?? this.amountXaf,
      method: method ?? this.method,
      status: status ?? this.status,
      invoiceNumber: invoiceNumber ?? this.invoiceNumber,
      billingPeriod: billingPeriod ?? this.billingPeriod,
      paidAt: paidAt ?? this.paidAt,
      transactionReference: transactionReference ?? this.transactionReference,
    );
  }
}

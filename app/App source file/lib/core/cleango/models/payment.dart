enum PaymentMethod { mtnMobileMoney, orangeMoney, cash }

extension PaymentMethodValue on PaymentMethod {
  String get wireValue => switch (this) {
    PaymentMethod.mtnMobileMoney => 'mtn_mobile_money',
    PaymentMethod.orangeMoney => 'orange_money',
    PaymentMethod.cash => 'cash',
  };

  String label({String languageCode = 'en'}) => switch (this) {
    PaymentMethod.mtnMobileMoney => 'MTN Mobile Money',
    PaymentMethod.orangeMoney => 'Orange Money',
    PaymentMethod.cash => languageCode == 'fr' ? 'Espèces' : 'Cash',
  };

  static PaymentMethod? tryParse(Object? value) {
    final normalized = value?.toString().trim().toLowerCase().replaceAll(
      RegExp(r'[\s-]+'),
      '_',
    );
    return switch (normalized) {
      'mtn' || 'mtn_momo' || 'mtn_mobile_money' => PaymentMethod.mtnMobileMoney,
      'orange' || 'orange_momo' || 'orange_money' => PaymentMethod.orangeMoney,
      'cash' ||
      'cash_on_collection' ||
      'cashoncollection' => PaymentMethod.cash,
      _ => null,
    };
  }
}

enum PaymentStatus {
  draft,
  awaitingCustomerAction,
  pending,
  awaitingCashConfirmation,
  processing,
  paid,
  failed,
  cancelled,
  expired,
  refunded,
}

extension PaymentStatusValue on PaymentStatus {
  String get wireValue => switch (this) {
    PaymentStatus.draft => 'draft',
    PaymentStatus.awaitingCustomerAction => 'awaitingCustomerAction',
    PaymentStatus.pending => 'pending',
    PaymentStatus.awaitingCashConfirmation => 'awaitingCashConfirmation',
    PaymentStatus.processing => 'processing',
    PaymentStatus.paid => 'paid',
    PaymentStatus.failed => 'failed',
    PaymentStatus.cancelled => 'cancelled',
    PaymentStatus.expired => 'expired',
    PaymentStatus.refunded => 'refunded',
  };

  String get label => switch (this) {
    PaymentStatus.draft => 'Draft',
    PaymentStatus.awaitingCustomerAction => 'Action required',
    PaymentStatus.pending => 'Pending',
    PaymentStatus.awaitingCashConfirmation => 'Awaiting cash confirmation',
    PaymentStatus.processing => 'Processing',
    PaymentStatus.paid => 'Paid',
    PaymentStatus.failed => 'Failed',
    PaymentStatus.cancelled => 'Cancelled',
    PaymentStatus.expired => 'Expired',
    PaymentStatus.refunded => 'Refunded',
  };

  bool get isOutstanding =>
      this == PaymentStatus.awaitingCustomerAction ||
      this == PaymentStatus.pending ||
      this == PaymentStatus.awaitingCashConfirmation ||
      this == PaymentStatus.processing;

  bool get isSettled =>
      this == PaymentStatus.paid || this == PaymentStatus.refunded;

  static PaymentStatus parse(Object? value) {
    final normalized = value?.toString().trim().toLowerCase().replaceAll(
      RegExp(r'[\s-]+'),
      '_',
    );
    return switch (normalized) {
      'draft' => PaymentStatus.draft,
      'awaitingcustomeraction' ||
      'awaiting_customer_action' => PaymentStatus.awaitingCustomerAction,
      'awaitingcashconfirmation' ||
      'awaiting_cash_confirmation' => PaymentStatus.awaitingCashConfirmation,
      'processing' || 'initiated' || 'in_progress' => PaymentStatus.processing,
      'paid' || 'success' || 'succeeded' || 'completed' => PaymentStatus.paid,
      'failed' || 'failure' || 'declined' => PaymentStatus.failed,
      'cancelled' || 'canceled' => PaymentStatus.cancelled,
      'expired' => PaymentStatus.expired,
      'refunded' || 'refund' => PaymentStatus.refunded,
      _ => PaymentStatus.pending,
    };
  }
}

enum PaymentPurpose {
  oneTimePickup,
  subscriptionPurchase,
  subscriptionRenewal,
  quotationPayment,
  extraBagCharge,
}

extension PaymentPurposeValue on PaymentPurpose {
  String get wireValue => switch (this) {
    PaymentPurpose.oneTimePickup => 'oneTimePickup',
    PaymentPurpose.subscriptionPurchase => 'subscriptionPurchase',
    PaymentPurpose.subscriptionRenewal => 'subscriptionRenewal',
    PaymentPurpose.quotationPayment => 'quotationPayment',
    PaymentPurpose.extraBagCharge => 'extraBagCharge',
  };

  String get label => switch (this) {
    PaymentPurpose.oneTimePickup => 'One-time collection',
    PaymentPurpose.subscriptionPurchase => 'Subscription purchase',
    PaymentPurpose.subscriptionRenewal => 'Subscription renewal',
    PaymentPurpose.quotationPayment => 'Approved quotation',
    PaymentPurpose.extraBagCharge => 'Extra bag charge',
  };

  static PaymentPurpose parse(Object? value) => switch (value?.toString()) {
    'subscriptionPurchase' => PaymentPurpose.subscriptionPurchase,
    'subscriptionRenewal' => PaymentPurpose.subscriptionRenewal,
    'quotationPayment' => PaymentPurpose.quotationPayment,
    'extraBagCharge' => PaymentPurpose.extraBagCharge,
    _ => PaymentPurpose.oneTimePickup,
  };
}

class PaymentPricingSnapshot {
  const PaymentPricingSnapshot({
    required this.amountXaf,
    required this.currency,
    required this.sourceType,
    required this.sourceId,
    required this.pricingVersion,
  });

  final int amountXaf;
  final String currency;
  final String sourceType;
  final String sourceId;
  final String pricingVersion;
}

class Receipt {
  const Receipt({
    required this.paymentId,
    required this.available,
    this.receiptNumber,
    this.downloadUrl,
    this.issuedAt,
  });

  final String paymentId;
  final bool available;
  final String? receiptNumber;
  final String? downloadUrl;
  final DateTime? issuedAt;
}

class Payment {
  const Payment({
    required this.id,
    required this.customerId,
    required this.amountXaf,
    required this.currency,
    required this.method,
    required this.status,
    required this.purpose,
    required this.idempotencyKey,
    required this.initiatedAt,
    required this.updatedAt,
    required this.pricingSnapshot,
    required this.metadataVersion,
    this.bookingId,
    this.subscriptionId,
    this.quotationId,
    this.providerReference,
    this.externalTransactionId,
    this.phoneNumberMasked,
    this.confirmedAt,
    this.failedAt,
    this.cancelledAt,
    this.confirmedBy,
    this.confirmationSource,
    this.failureCode,
    this.failureMessageSafe,
    this.receipt,
  });

  final String id;
  final String customerId;
  final int amountXaf;
  final String currency;
  final PaymentMethod method;
  final PaymentStatus status;
  final PaymentPurpose purpose;
  final String? bookingId;
  final String? subscriptionId;
  final String? quotationId;
  final String? providerReference;
  final String? externalTransactionId;
  final String idempotencyKey;
  final String? phoneNumberMasked;
  final DateTime initiatedAt;
  final DateTime updatedAt;
  final DateTime? confirmedAt;
  final DateTime? failedAt;
  final DateTime? cancelledAt;
  final String? confirmedBy;
  final String? confirmationSource;
  final String? failureCode;
  final String? failureMessageSafe;
  final PaymentPricingSnapshot pricingSnapshot;
  final int metadataVersion;
  final Receipt? receipt;

  bool get isSettled => status.isSettled;

  bool get isOutstanding => status.isOutstanding;

  bool get receiptAvailable =>
      status == PaymentStatus.paid && receipt?.available == true;

  String get relatedServiceLabel => purpose.label;

  Payment copyWith({
    PaymentStatus? status,
    DateTime? updatedAt,
    DateTime? confirmedAt,
    DateTime? failedAt,
    DateTime? cancelledAt,
    String? providerReference,
    String? externalTransactionId,
    String? confirmedBy,
    String? confirmationSource,
    String? failureCode,
    String? failureMessageSafe,
    Receipt? receipt,
  }) {
    return Payment(
      id: id,
      customerId: customerId,
      amountXaf: amountXaf,
      currency: currency,
      method: method,
      status: status ?? this.status,
      purpose: purpose,
      bookingId: bookingId,
      subscriptionId: subscriptionId,
      quotationId: quotationId,
      providerReference: providerReference ?? this.providerReference,
      externalTransactionId:
          externalTransactionId ?? this.externalTransactionId,
      idempotencyKey: idempotencyKey,
      phoneNumberMasked: phoneNumberMasked,
      initiatedAt: initiatedAt,
      updatedAt: updatedAt ?? this.updatedAt,
      confirmedAt: confirmedAt ?? this.confirmedAt,
      failedAt: failedAt ?? this.failedAt,
      cancelledAt: cancelledAt ?? this.cancelledAt,
      confirmedBy: confirmedBy ?? this.confirmedBy,
      confirmationSource: confirmationSource ?? this.confirmationSource,
      failureCode: failureCode ?? this.failureCode,
      failureMessageSafe: failureMessageSafe ?? this.failureMessageSafe,
      pricingSnapshot: pricingSnapshot,
      metadataVersion: metadataVersion,
      receipt: receipt ?? this.receipt,
    );
  }
}

class PaymentIntentRequest {
  const PaymentIntentRequest({
    required this.requestId,
    required this.method,
    required this.purpose,
    required this.amountXaf,
    required this.pricingSnapshot,
    this.bookingId,
    this.subscriptionId,
    this.quotationId,
    this.phoneNumberMasked,
  });

  final String requestId;
  final PaymentMethod method;
  final PaymentPurpose purpose;
  final int amountXaf;
  final PaymentPricingSnapshot pricingSnapshot;
  final String? bookingId;
  final String? subscriptionId;
  final String? quotationId;
  final String? phoneNumberMasked;
}

class PaymentCreationResult {
  const PaymentCreationResult({
    required this.payment,
    required this.wasDuplicate,
  });

  final Payment payment;
  final bool wasDuplicate;
}

import 'package:ultrawash/core/cleango/models/collection.dart';
import 'package:ultrawash/core/cleango/models/payment.dart';
import 'package:ultrawash/core/cleango/models/subscription.dart';

class PaymentRequestContext {
  const PaymentRequestContext({
    required this.title,
    required this.amountXaf,
    required this.purpose,
    required this.pricingSnapshot,
    required this.idempotencyScope,
    this.bookingId,
    this.subscriptionId,
    this.quotationId,
  });

  factory PaymentRequestContext.forCollection(WasteCollection collection) {
    final amount = collection.displayAmount;
    if (amount == null || amount <= 0) {
      throw StateError('This collection does not have a payable amount.');
    }
    final quotation =
        collection.bookingMode == CollectionBookingMode.oneTimePhotoQuote;
    if (quotation &&
        collection.quotationStatus != CollectionQuotationStatus.accepted) {
      throw StateError('Accept the quotation before payment.');
    }

    return PaymentRequestContext(
      title: quotation ? 'Approved quotation' : 'One-time collection',
      amountXaf: amount,
      purpose: quotation
          ? PaymentPurpose.quotationPayment
          : PaymentPurpose.oneTimePickup,
      bookingId: collection.id,
      quotationId: quotation ? collection.id : null,
      idempotencyScope: <Object>[
        'collection',
        collection.id,
        collection.pricing.pricingVersion,
        amount,
      ].join(':'),
      pricingSnapshot: PaymentPricingSnapshot(
        amountXaf: amount,
        currency: collection.pricing.currency,
        sourceType: quotation ? 'quotation' : 'collection',
        sourceId: collection.id,
        pricingVersion: collection.pricing.pricingVersion,
      ),
    );
  }

  factory PaymentRequestContext.forSubscription(
    Subscription subscription, {
    bool renewal = false,
  }) {
    final amount = subscription.monthlyPriceXaf;
    if (amount == null || amount <= 0 || subscription.requiresReview) {
      throw StateError('This subscription requires CLEANGO review.');
    }
    final billingPeriod = renewal
        ? subscription.endDate?.toUtc().toIso8601String() ?? 'renewal'
        : 'purchase';

    return PaymentRequestContext(
      title: renewal ? 'Subscription renewal' : 'Subscription payment',
      amountXaf: amount,
      purpose: renewal
          ? PaymentPurpose.subscriptionRenewal
          : PaymentPurpose.subscriptionPurchase,
      subscriptionId: subscription.id,
      idempotencyScope: <Object>[
        'subscription',
        subscription.id,
        billingPeriod,
        subscription.pricingVersion,
      ].join(':'),
      pricingSnapshot: PaymentPricingSnapshot(
        amountXaf: amount,
        currency: subscription.planSnapshot.currency,
        sourceType: 'subscription',
        sourceId: subscription.id,
        pricingVersion: subscription.pricingVersion,
      ),
    );
  }

  final String title;
  final int amountXaf;
  final PaymentPurpose purpose;
  final String? bookingId;
  final String? subscriptionId;
  final String? quotationId;
  final String idempotencyScope;
  final PaymentPricingSnapshot pricingSnapshot;

  PaymentIntentRequest request({required PaymentMethod method}) {
    return PaymentIntentRequest(
      requestId: idempotencyScope,
      method: method,
      purpose: purpose,
      amountXaf: amountXaf,
      bookingId: bookingId,
      subscriptionId: subscriptionId,
      quotationId: quotationId,
      pricingSnapshot: pricingSnapshot,
    );
  }
}

import 'package:ultrawash/core/cleango/models/collection.dart';
import 'package:ultrawash/core/cleango/models/subscription.dart';
import 'package:ultrawash/core/cleango/subscriptions/subscription_pricing_catalogue.dart';

class CollectionPricingException implements Exception {
  const CollectionPricingException(this.message);

  final String message;

  @override
  String toString() => message;
}

class CollectionPricingService {
  const CollectionPricingService();

  static const supportedServiceZone = 'yaounde';
  static const currency = SubscriptionPricingCatalogue.currency;
  static const pricingVersion = SubscriptionPricingCatalogue.pricingVersion;
  static const bagRateXaf = SubscriptionPricingCatalogue.oneTimeBagRateXaf;
  static const maxOneTimeBagCount =
      SubscriptionPricingCatalogue.maxOneTimeBagCount;

  CollectionPricing quoteOneTimeBagCount({
    required int declaredBagCount,
    required String serviceZone,
  }) {
    _validateServiceZone(serviceZone);
    if (declaredBagCount < 1 || declaredBagCount > maxOneTimeBagCount) {
      throw CollectionPricingException(
        'Choose between 1 and $maxOneTimeBagCount CLEANGO 60L bags.',
      );
    }

    final amount = declaredBagCount * bagRateXaf;
    return CollectionPricing(
      currency: currency,
      baseAmount: amount,
      includedBagCount: 0,
      extraBagCount: 0,
      extraBagRate: bagRateXaf,
      extraBagAmount: 0,
      serviceFee: 0,
      discount: 0,
      totalAmount: amount,
      pricingVersion: pricingVersion,
      calculationSource: 'approvedOneTimeBagRate',
    );
  }

  CollectionPricing pendingPhotoQuotation({required String serviceZone}) {
    _validateServiceZone(serviceZone);
    return const CollectionPricing(
      currency: currency,
      baseAmount: null,
      includedBagCount: 0,
      extraBagCount: 0,
      extraBagRate: bagRateXaf,
      extraBagAmount: 0,
      serviceFee: 0,
      discount: 0,
      totalAmount: null,
      pricingVersion: pricingVersion,
      calculationSource: 'pendingAdminQuotation',
    );
  }

  CollectionPricing quoteSubscription({
    required SubscriptionPlanDefinition plan,
    required int extraBagCount,
    required String serviceZone,
  }) {
    _validateServiceZone(serviceZone);
    if (!SubscriptionPricingCatalogue.matchesApprovedPlan(plan)) {
      throw const CollectionPricingException(
        'This subscription plan is not in the approved CLEANGO catalogue.',
      );
    }
    if (extraBagCount < 0) {
      throw const CollectionPricingException(
        'Extra bag count cannot be negative.',
      );
    }

    final extraAmount = SubscriptionPricingCatalogue.extraBagAmount(
      extraBagCount,
    );
    final baseAmount = plan.monthlyPriceXaf;
    return CollectionPricing(
      currency: currency,
      baseAmount: baseAmount,
      includedBagCount: plan.includedBagsPerPickup,
      extraBagCount: extraBagCount,
      extraBagRate: SubscriptionPricingCatalogue.extraBagRateXaf,
      extraBagAmount: extraAmount,
      serviceFee: 0,
      discount: 0,
      totalAmount: baseAmount == null ? null : baseAmount + extraAmount,
      pricingVersion: pricingVersion,
      calculationSource: plan.requiresQuotation
          ? 'pendingAdminQuotation'
          : 'approvedSubscriptionCatalogue',
    );
  }

  void _validateServiceZone(String serviceZone) {
    if (serviceZone != supportedServiceZone) {
      throw const CollectionPricingException(
        'This address is outside the supported CLEANGO service area.',
      );
    }
  }
}

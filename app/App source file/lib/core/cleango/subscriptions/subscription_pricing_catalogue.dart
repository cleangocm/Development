import 'package:ultrawash/core/cleango/models/subscription.dart';

class SubscriptionPricingCatalogue {
  const SubscriptionPricingCatalogue._();

  static const currency = 'XAF';
  static const pricingVersion = 'approved-v1-2026-07';
  static const extraBagRateXaf = 500;
  static const oneTimeBagRateXaf = 500;
  static const maxOneTimeBagCount = 50;

  static const plans = <SubscriptionPlanDefinition>[
    SubscriptionPlanDefinition(
      id: 'basic',
      englishName: 'Basic Plan',
      frenchName: 'Forfait Basique',
      monthlyPriceXaf: 5000,
      pickupsPerWeek: 1,
      pickupsPerMonth: 4,
      includedBagsPerPickup: 2,
      bagsSupplied: true,
      flexibleSchedule: false,
      urgentPickup: false,
      requiresQuotation: false,
      startingPriceXaf: null,
      currency: currency,
      pricingVersion: pricingVersion,
      active: true,
      displayOrder: 1,
    ),
    SubscriptionPlanDefinition(
      id: 'standard',
      englishName: 'Standard',
      frenchName: 'Standard',
      monthlyPriceXaf: 8500,
      pickupsPerWeek: 2,
      pickupsPerMonth: 8,
      includedBagsPerPickup: 2,
      bagsSupplied: false,
      flexibleSchedule: false,
      urgentPickup: false,
      requiresQuotation: false,
      startingPriceXaf: null,
      currency: currency,
      pricingVersion: pricingVersion,
      active: true,
      displayOrder: 2,
    ),
    SubscriptionPlanDefinition(
      id: 'popular',
      englishName: 'Popular',
      frenchName: 'Populaire',
      monthlyPriceXaf: 11000,
      pickupsPerWeek: 2,
      pickupsPerMonth: 8,
      includedBagsPerPickup: 4,
      bagsSupplied: false,
      flexibleSchedule: false,
      urgentPickup: false,
      requiresQuotation: false,
      startingPriceXaf: null,
      currency: currency,
      pricingVersion: pricingVersion,
      active: true,
      displayOrder: 3,
    ),
    SubscriptionPlanDefinition(
      id: 'premium',
      englishName: 'Premium',
      frenchName: 'Premium',
      monthlyPriceXaf: 16500,
      pickupsPerWeek: 3,
      pickupsPerMonth: 12,
      includedBagsPerPickup: 6,
      bagsSupplied: false,
      flexibleSchedule: false,
      urgentPickup: false,
      requiresQuotation: false,
      startingPriceXaf: null,
      currency: currency,
      pricingVersion: pricingVersion,
      active: true,
      displayOrder: 4,
    ),
    SubscriptionPlanDefinition(
      id: 'apartments_hotels',
      englishName: 'Apartments & Hotels',
      frenchName: 'Appartements & Hôtels',
      monthlyPriceXaf: null,
      pickupsPerWeek: 0,
      pickupsPerMonth: 0,
      includedBagsPerPickup: 10,
      bagsSupplied: false,
      flexibleSchedule: true,
      urgentPickup: true,
      requiresQuotation: true,
      startingPriceXaf: 35000,
      currency: currency,
      pricingVersion: pricingVersion,
      active: true,
      displayOrder: 5,
    ),
  ];

  static SubscriptionPlanDefinition? find(String planId) {
    for (final plan in plans) {
      if (plan.id == planId) return plan;
    }
    return null;
  }

  static SubscriptionPlanDefinition requirePlan(String planId) {
    final plan = find(planId);
    if (plan == null || !plan.active) {
      throw ArgumentError.value(planId, 'planId', 'Unknown CLEANGO plan.');
    }
    return plan;
  }

  static int extraBagAmount(int extraBagCount) {
    if (extraBagCount < 0) {
      throw ArgumentError.value(
        extraBagCount,
        'extraBagCount',
        'Extra bag count cannot be negative.',
      );
    }
    return extraBagCount * extraBagRateXaf;
  }

  static bool matchesApprovedPlan(SubscriptionPlanDefinition candidate) {
    final approved = find(candidate.id);
    if (approved == null) return false;
    return candidate.englishName == approved.englishName &&
        candidate.frenchName == approved.frenchName &&
        candidate.monthlyPriceXaf == approved.monthlyPriceXaf &&
        candidate.pickupsPerWeek == approved.pickupsPerWeek &&
        candidate.pickupsPerMonth == approved.pickupsPerMonth &&
        candidate.includedBagsPerPickup == approved.includedBagsPerPickup &&
        candidate.bagsSupplied == approved.bagsSupplied &&
        candidate.flexibleSchedule == approved.flexibleSchedule &&
        candidate.urgentPickup == approved.urgentPickup &&
        candidate.requiresQuotation == approved.requiresQuotation &&
        candidate.startingPriceXaf == approved.startingPriceXaf &&
        candidate.currency == approved.currency &&
        candidate.pricingVersion == approved.pricingVersion &&
        candidate.active == approved.active &&
        candidate.displayOrder == approved.displayOrder;
  }
}

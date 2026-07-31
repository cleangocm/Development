import 'package:ultrawash/core/cleango/models/address.dart';

enum SubscriptionPlan {
  basic,
  standard,
  popular,
  premium,
  apartmentsHotels,
  business,
  enterprise,
}

enum SubscriptionStatus {
  pendingPayment,
  active,
  suspended,
  expired,
  cancelled,
  pendingReview,
}

enum SubscriptionPaymentStatus { unpaid, pending, paid, failed, refunded }

enum SubscriptionBillingCycle { monthly, flexibleReview }

extension SubscriptionPlanValue on SubscriptionPlan {
  String get id => switch (this) {
    SubscriptionPlan.basic => 'basic',
    SubscriptionPlan.standard => 'standard',
    SubscriptionPlan.popular => 'popular',
    SubscriptionPlan.premium => 'premium',
    SubscriptionPlan.apartmentsHotels => 'apartments_hotels',
    SubscriptionPlan.business => 'business',
    SubscriptionPlan.enterprise => 'enterprise',
  };

  String get label => switch (this) {
    SubscriptionPlan.basic => 'Forfait Basique',
    SubscriptionPlan.standard => 'Standard',
    SubscriptionPlan.popular => 'Populaire',
    SubscriptionPlan.premium => 'Premium',
    SubscriptionPlan.apartmentsHotels => 'Appartements & Hôtels',
    SubscriptionPlan.business => 'Legacy Business Plan',
    SubscriptionPlan.enterprise => 'Legacy Enterprise Plan',
  };
}

extension SubscriptionStatusValue on SubscriptionStatus {
  String get wireValue => switch (this) {
    SubscriptionStatus.pendingPayment => 'pendingPayment',
    SubscriptionStatus.active => 'active',
    SubscriptionStatus.suspended => 'suspended',
    SubscriptionStatus.expired => 'expired',
    SubscriptionStatus.cancelled => 'cancelled',
    SubscriptionStatus.pendingReview => 'pendingReview',
  };

  String get label => switch (this) {
    SubscriptionStatus.pendingPayment => 'Pending payment',
    SubscriptionStatus.active => 'Active',
    SubscriptionStatus.suspended => 'Suspended',
    SubscriptionStatus.expired => 'Expired',
    SubscriptionStatus.cancelled => 'Cancelled',
    SubscriptionStatus.pendingReview => 'Pending CLEANGO review',
  };
}

extension SubscriptionPaymentStatusValue on SubscriptionPaymentStatus {
  String get wireValue => switch (this) {
    SubscriptionPaymentStatus.unpaid => 'unpaid',
    SubscriptionPaymentStatus.pending => 'pending',
    SubscriptionPaymentStatus.paid => 'paid',
    SubscriptionPaymentStatus.failed => 'failed',
    SubscriptionPaymentStatus.refunded => 'refunded',
  };
}

extension SubscriptionBillingCycleValue on SubscriptionBillingCycle {
  String get wireValue => switch (this) {
    SubscriptionBillingCycle.monthly => 'monthly',
    SubscriptionBillingCycle.flexibleReview => 'flexibleReview',
  };
}

class SubscriptionPlanDefinition {
  const SubscriptionPlanDefinition({
    required this.id,
    required this.englishName,
    required this.frenchName,
    required this.monthlyPriceXaf,
    required this.pickupsPerWeek,
    required this.pickupsPerMonth,
    required this.includedBagsPerPickup,
    required this.bagsSupplied,
    required this.flexibleSchedule,
    required this.urgentPickup,
    required this.requiresQuotation,
    required this.startingPriceXaf,
    required this.currency,
    required this.pricingVersion,
    required this.active,
    required this.displayOrder,
  });

  final String id;
  final String englishName;
  final String frenchName;
  final int? monthlyPriceXaf;
  final int pickupsPerWeek;
  final int pickupsPerMonth;
  final int includedBagsPerPickup;
  final bool bagsSupplied;
  final bool flexibleSchedule;
  final bool urgentPickup;
  final bool requiresQuotation;
  final int? startingPriceXaf;
  final String currency;
  final String pricingVersion;
  final bool active;
  final int displayOrder;

  SubscriptionPlan get plan => switch (id) {
    'standard' => SubscriptionPlan.standard,
    'popular' => SubscriptionPlan.popular,
    'premium' => SubscriptionPlan.premium,
    'apartments_hotels' => SubscriptionPlan.apartmentsHotels,
    'business' => SubscriptionPlan.business,
    'enterprise' => SubscriptionPlan.enterprise,
    _ => SubscriptionPlan.basic,
  };
}

class SubscriptionAddressSnapshot {
  const SubscriptionAddressSnapshot({
    required this.label,
    required this.addressLine,
    required this.city,
    required this.district,
    required this.latitude,
    required this.longitude,
  });

  factory SubscriptionAddressSnapshot.fromAddress(Address address) {
    return SubscriptionAddressSnapshot(
      label: address.label,
      addressLine: address.street,
      city: address.city,
      district: address.region,
      latitude: address.latitude,
      longitude: address.longitude,
    );
  }

  final String label;
  final String addressLine;
  final String city;
  final String district;
  final double? latitude;
  final double? longitude;
}

class SubscriptionRequest {
  const SubscriptionRequest({
    required this.requestId,
    required this.planId,
    required this.addressId,
  });

  final String requestId;
  final String planId;
  final String addressId;
}

class SubscriptionRequestResult {
  const SubscriptionRequestResult({
    required this.subscription,
    required this.wasDuplicate,
  });

  final Subscription subscription;
  final bool wasDuplicate;
}

class Subscription {
  const Subscription({
    required this.id,
    required this.customerId,
    required this.planId,
    required this.planSnapshot,
    required this.serviceAddressId,
    required this.serviceAddressSnapshot,
    required this.status,
    required this.paymentStatus,
    required this.startDate,
    required this.endDate,
    required this.billingCycle,
    required this.includedPickupsPerMonth,
    required this.includedBagsPerPickup,
    required this.usedPickups,
    required this.extraBagRate,
    required this.createdAt,
    required this.updatedAt,
    required this.cancelledAt,
    required this.pricingVersion,
  });

  final String id;
  final String customerId;
  final String planId;
  final SubscriptionPlanDefinition planSnapshot;
  final String serviceAddressId;
  final SubscriptionAddressSnapshot serviceAddressSnapshot;
  final SubscriptionStatus status;
  final SubscriptionPaymentStatus paymentStatus;
  final DateTime? startDate;
  final DateTime? endDate;
  final SubscriptionBillingCycle billingCycle;
  final int includedPickupsPerMonth;
  final int includedBagsPerPickup;
  final int usedPickups;
  final int extraBagRate;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? cancelledAt;
  final String pricingVersion;

  SubscriptionPlan get plan => planSnapshot.plan;
  DateTime? get renewalDate => endDate;
  int? get monthlyPriceXaf => planSnapshot.monthlyPriceXaf;
  bool get isActive => status == SubscriptionStatus.active;
  bool get requiresReview => planSnapshot.requiresQuotation;
  int get remainingCollections {
    final remaining = includedPickupsPerMonth - usedPickups;
    return remaining < 0 ? 0 : remaining;
  }
}

enum SubscriptionPlan { basic, standard, premium, business, enterprise }

enum SubscriptionStatus { active, pending, paused, cancelled, expired }

class Subscription {
  const Subscription({
    required this.id,
    required this.customerId,
    required this.plan,
    required this.renewalDate,
    required this.remainingCollections,
    required this.status,
    required this.monthlyPriceXaf,
  });

  final String id;
  final String customerId;
  final SubscriptionPlan plan;
  final DateTime renewalDate;
  final int remainingCollections;
  final SubscriptionStatus status;
  final int monthlyPriceXaf;

  bool get isActive => status == SubscriptionStatus.active;

  Subscription copyWith({
    String? id,
    String? customerId,
    SubscriptionPlan? plan,
    DateTime? renewalDate,
    int? remainingCollections,
    SubscriptionStatus? status,
    int? monthlyPriceXaf,
  }) {
    return Subscription(
      id: id ?? this.id,
      customerId: customerId ?? this.customerId,
      plan: plan ?? this.plan,
      renewalDate: renewalDate ?? this.renewalDate,
      remainingCollections: remainingCollections ?? this.remainingCollections,
      status: status ?? this.status,
      monthlyPriceXaf: monthlyPriceXaf ?? this.monthlyPriceXaf,
    );
  }
}

import 'package:ultrawash/core/cleango/models/subscription.dart';

abstract interface class SubscriptionRepository {
  Future<Subscription?> getActiveSubscription(String customerId);

  Future<List<Subscription>> getSubscriptionHistory(String customerId);

  Future<Subscription> updateSubscription(Subscription subscription);
}

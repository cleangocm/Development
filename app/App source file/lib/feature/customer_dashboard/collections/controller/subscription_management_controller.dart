import 'package:ultrawash/core/cleango/di/cleango_service_locator.dart';
import 'package:ultrawash/core/cleango/models/subscription.dart';
import 'package:ultrawash/core/cleango/repositories/subscription_repository.dart';
import 'package:ultrawash/core/cleango/session/current_customer_provider.dart';

class SubscriptionManagementController {
  const SubscriptionManagementController({
    required this.currentCustomerProvider,
    required this.subscriptionRepository,
  });

  factory SubscriptionManagementController.fromLocator() {
    final dependencies = CleanGoServiceLocator.instance.dashboardDependencies;
    return SubscriptionManagementController(
      currentCustomerProvider: dependencies.currentCustomerProvider,
      subscriptionRepository: dependencies.subscriptionRepository,
    );
  }

  final CurrentCustomerProvider currentCustomerProvider;
  final SubscriptionRepository subscriptionRepository;

  Future<SubscriptionManagementViewData> load() async {
    final customerId = await currentCustomerProvider.getCurrentCustomerId();
    if (customerId == null || customerId.isEmpty) {
      return const SubscriptionManagementViewData(
        current: null,
        history: <Subscription>[],
      );
    }

    final history = await subscriptionRepository.getSubscriptionHistory(
      customerId,
    );
    final sorted = <Subscription>[...history]
      ..sort((left, right) => right.updatedAt.compareTo(left.updatedAt));

    Subscription? current;
    for (final subscription in sorted) {
      if (subscription.status == SubscriptionStatus.active) {
        current = subscription;
        break;
      }
    }
    current ??= sorted.isEmpty ? null : sorted.first;

    return SubscriptionManagementViewData(
      current: current,
      history: List<Subscription>.unmodifiable(sorted),
    );
  }
}

class SubscriptionManagementViewData {
  const SubscriptionManagementViewData({
    required this.current,
    required this.history,
  });

  final Subscription? current;
  final List<Subscription> history;
}

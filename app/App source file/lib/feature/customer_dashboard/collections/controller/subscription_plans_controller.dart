import 'package:ultrawash/core/cleango/di/cleango_service_locator.dart';
import 'package:ultrawash/core/cleango/models/address.dart';
import 'package:ultrawash/core/cleango/models/subscription.dart';
import 'package:ultrawash/core/cleango/repositories/collection_repository.dart';
import 'package:ultrawash/core/cleango/repositories/subscription_repository.dart';
import 'package:ultrawash/core/cleango/session/current_customer_provider.dart';
import 'package:ultrawash/core/cleango/subscriptions/subscription_request_service.dart';

class SubscriptionPlansController {
  SubscriptionPlansController({
    required this.currentCustomerProvider,
    required this.subscriptionRepository,
    required this.collectionRepository,
  });

  factory SubscriptionPlansController.fromLocator() {
    final dependencies = CleanGoServiceLocator.instance.dashboardDependencies;
    return SubscriptionPlansController(
      currentCustomerProvider: dependencies.currentCustomerProvider,
      subscriptionRepository: dependencies.subscriptionRepository,
      collectionRepository: dependencies.collectionRepository,
    );
  }

  final CurrentCustomerProvider currentCustomerProvider;
  final SubscriptionRepository subscriptionRepository;
  final CollectionRepository collectionRepository;

  String createRequestId() => SubscriptionRequestService.createRequestId();

  Future<SubscriptionPlansViewData> load() async {
    final customerId = await _requireCustomerId();
    final plans = await subscriptionRepository.getAvailablePlans();
    final addresses = await collectionRepository.getSavedAddresses(customerId);
    return SubscriptionPlansViewData(
      plans: List.unmodifiable(plans),
      addresses: List.unmodifiable(addresses),
    );
  }

  Future<SubscriptionRequestResult> requestPlan({
    required String requestId,
    required String planId,
    required String addressId,
  }) async {
    await _requireCustomerId();
    return subscriptionRepository.requestSubscription(
      SubscriptionRequest(
        requestId: requestId,
        planId: planId,
        addressId: addressId,
      ),
    );
  }

  Future<String> _requireCustomerId() async {
    final customerId = await currentCustomerProvider.getCurrentCustomerId();
    if (customerId == null || customerId.isEmpty) {
      throw const SubscriptionRequestException(
        'authentication-required',
        'Sign in before requesting a subscription.',
      );
    }
    return customerId;
  }
}

class SubscriptionPlansViewData {
  const SubscriptionPlansViewData({
    required this.plans,
    required this.addresses,
  });

  final List<SubscriptionPlanDefinition> plans;
  final List<Address> addresses;
}

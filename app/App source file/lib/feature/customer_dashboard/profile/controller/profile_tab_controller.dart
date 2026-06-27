import 'package:ultrawash/core/cleango/models/customer.dart';
import 'package:ultrawash/core/cleango/models/subscription.dart';
import 'package:ultrawash/core/cleango/repositories/customer_repository.dart';
import 'package:ultrawash/core/cleango/repositories/subscription_repository.dart';
import 'package:ultrawash/core/cleango/services/mock_customer_service.dart';
import 'package:ultrawash/core/cleango/session/current_customer_provider.dart';
import 'package:ultrawash/core/cleango/session/mock_current_customer_provider.dart';

class ProfileTabController {
  ProfileTabController({
    required this.currentCustomerProvider,
    required this.customerRepository,
    required this.subscriptionRepository,
  });

  factory ProfileTabController.mock() {
    final customerService = MockCustomerService();
    return ProfileTabController(
      currentCustomerProvider: MockCurrentCustomerProvider(),
      customerRepository: customerService,
      subscriptionRepository: customerService,
    );
  }

  final CurrentCustomerProvider currentCustomerProvider;
  final CustomerRepository customerRepository;
  final SubscriptionRepository subscriptionRepository;

  Future<ProfileTabViewData> load() async {
    final customerId = await currentCustomerProvider.getCurrentCustomerId();
    if (customerId == null || customerId.isEmpty) {
      return ProfileTabViewData.empty();
    }

    final customer = await customerRepository.getCustomerById(customerId);
    if (customer == null) return ProfileTabViewData.empty();

    final subscription = await subscriptionRepository.getActiveSubscription(
      customer.id,
    );

    return ProfileTabViewData(customer: customer, subscription: subscription);
  }
}

class ProfileTabViewData {
  const ProfileTabViewData({
    required this.customer,
    required this.subscription,
  });

  factory ProfileTabViewData.empty() {
    return const ProfileTabViewData(customer: null, subscription: null);
  }

  final Customer? customer;
  final Subscription? subscription;
}

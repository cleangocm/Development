import 'package:ultrawash/core/cleango/models/customer.dart';
import 'package:ultrawash/core/cleango/models/subscription.dart';
import 'package:ultrawash/core/cleango/repositories/customer_repository.dart';
import 'package:ultrawash/core/cleango/repositories/subscription_repository.dart';
import 'package:ultrawash/core/cleango/services/mock_customer_service.dart';

class ProfileTabController {
  ProfileTabController({
    required this.customerRepository,
    required this.subscriptionRepository,
  });

  factory ProfileTabController.mock() {
    final customerService = MockCustomerService();
    return ProfileTabController(
      customerRepository: customerService,
      subscriptionRepository: customerService,
    );
  }

  final CustomerRepository customerRepository;
  final SubscriptionRepository subscriptionRepository;

  Future<ProfileTabViewData> load() async {
    final customer = await customerRepository.getCurrentCustomer();
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

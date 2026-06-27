import 'package:ultrawash/core/cleango/di/repository_factory.dart';
import 'package:ultrawash/core/cleango/repositories/collection_repository.dart';
import 'package:ultrawash/core/cleango/repositories/customer_repository.dart';
import 'package:ultrawash/core/cleango/repositories/notification_repository.dart';
import 'package:ultrawash/core/cleango/repositories/payment_repository.dart';
import 'package:ultrawash/core/cleango/repositories/subscription_repository.dart';
import 'package:ultrawash/core/cleango/session/current_customer_provider.dart';
import 'package:ultrawash/core/cleango/session/mock_current_customer_provider.dart';

class DashboardDependencies {
  const DashboardDependencies({
    required this.currentCustomerProvider,
    required this.customerRepository,
    required this.subscriptionRepository,
    required this.collectionRepository,
    required this.paymentRepository,
    required this.notificationRepository,
  });

  factory DashboardDependencies.mock() {
    final repositories = RepositoryFactory.mock();
    return DashboardDependencies(
      currentCustomerProvider: MockCurrentCustomerProvider(),
      customerRepository: repositories.customerRepository,
      subscriptionRepository: repositories.subscriptionRepository,
      collectionRepository: repositories.collectionRepository,
      paymentRepository: repositories.paymentRepository,
      notificationRepository: repositories.notificationRepository,
    );
  }

  final CurrentCustomerProvider currentCustomerProvider;
  final CustomerRepository customerRepository;
  final SubscriptionRepository subscriptionRepository;
  final CollectionRepository collectionRepository;
  final PaymentRepository paymentRepository;
  final NotificationRepository notificationRepository;
}

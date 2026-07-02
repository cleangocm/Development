import 'package:ultrawash/core/cleango/di/repository_factory.dart';
import 'package:ultrawash/core/cleango/repositories/collection_repository.dart';
import 'package:ultrawash/core/cleango/repositories/customer_repository.dart';
import 'package:ultrawash/core/cleango/repositories/notification_repository.dart';
import 'package:ultrawash/core/cleango/repositories/payment_repository.dart';
import 'package:ultrawash/core/cleango/repositories/subscription_repository.dart';
import 'package:ultrawash/core/cleango/session/current_customer_provider.dart';
import 'package:ultrawash/core/cleango/session/mock_current_customer_provider.dart';
import 'package:ultrawash/core/cleango/session/rest_current_customer_provider.dart';
import 'package:ultrawash/core/cleango/session/session_store.dart';
import 'package:ultrawash/core/cleango/session/shared_preferences_session_store.dart';

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
    return DashboardDependencies.withCurrentCustomerProvider(
      currentCustomerProvider: MockCurrentCustomerProvider(),
    );
  }

  factory DashboardDependencies.rest({
    SessionStore? sessionStore,
    RepositoryFactory? repositoryFactory,
  }) {
    return DashboardDependencies.withCurrentCustomerProvider(
      currentCustomerProvider: RestCurrentCustomerProvider(
        sessionStore: sessionStore ?? SharedPreferencesSessionStore(),
      ),
      repositoryFactory: repositoryFactory,
    );
  }

  factory DashboardDependencies.withCurrentCustomerProvider({
    required CurrentCustomerProvider currentCustomerProvider,
    RepositoryFactory? repositoryFactory,
  }) {
    final repositories = repositoryFactory ?? RepositoryFactory.mock();
    return DashboardDependencies(
      currentCustomerProvider: currentCustomerProvider,
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

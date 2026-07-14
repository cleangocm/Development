import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:ultrawash/core/cleango/di/repository_factory.dart';
import 'package:ultrawash/core/cleango/repositories/collection_repository.dart';
import 'package:ultrawash/core/cleango/repositories/customer_repository.dart';
import 'package:ultrawash/core/cleango/repositories/notification_repository.dart';
import 'package:ultrawash/core/cleango/repositories/payment_repository.dart';
import 'package:ultrawash/core/cleango/repositories/subscription_repository.dart';
import 'package:ultrawash/core/cleango/session/current_customer_provider.dart';
import 'package:ultrawash/core/cleango/session/firebase_current_customer_provider.dart';
import 'package:ultrawash/core/cleango/session/mock_current_customer_provider.dart';
import 'package:ultrawash/core/cleango/session/rest_current_customer_provider.dart';
import 'package:ultrawash/core/cleango/session/secure_session_store.dart';
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

  factory DashboardDependencies.previewSession({
    RepositoryFactory? repositoryFactory,
  }) {
    return DashboardDependencies.rest(
      sessionStore: SharedPreferencesSessionStore(),
      repositoryFactory: repositoryFactory,
    );
  }

  factory DashboardDependencies.restHybrid({
    SessionStore? sessionStore,
    RepositoryFactory? repositoryFactory,
  }) {
    return DashboardDependencies.withCurrentCustomerProvider(
      currentCustomerProvider: RestCurrentCustomerProvider(
        sessionStore: sessionStore ?? SecureSessionStore(),
      ),
      repositoryFactory: repositoryFactory ?? RepositoryFactory.restHybrid(),
    );
  }

  factory DashboardDependencies.firebaseCustomerHybrid({
    FirebaseFirestore? firestore,
    FirebaseAuth? firebaseAuth,
    RepositoryFactory? repositoryFactory,
  }) {
    return DashboardDependencies.withCurrentCustomerProvider(
      currentCustomerProvider: FirebaseCurrentCustomerProvider(
        firebaseAuth: firebaseAuth,
      ),
      repositoryFactory:
          repositoryFactory ??
          RepositoryFactory.firebaseCustomerHybrid(
            firestore: firestore,
            firebaseAuth: firebaseAuth,
          ),
    );
  }

  factory DashboardDependencies.firebaseSubscriptionHybrid({
    FirebaseFirestore? firestore,
    FirebaseAuth? firebaseAuth,
    RepositoryFactory? repositoryFactory,
  }) {
    return DashboardDependencies.withCurrentCustomerProvider(
      currentCustomerProvider: FirebaseCurrentCustomerProvider(
        firebaseAuth: firebaseAuth,
      ),
      repositoryFactory:
          repositoryFactory ??
          RepositoryFactory.firebaseSubscriptionHybrid(
            firestore: firestore,
            firebaseAuth: firebaseAuth,
          ),
    );
  }

  factory DashboardDependencies.firebaseCollectionHybrid({
    FirebaseFirestore? firestore,
    FirebaseAuth? firebaseAuth,
    FirebaseFunctions? functions,
    RepositoryFactory? repositoryFactory,
  }) {
    return DashboardDependencies.withCurrentCustomerProvider(
      currentCustomerProvider: FirebaseCurrentCustomerProvider(
        firebaseAuth: firebaseAuth,
      ),
      repositoryFactory:
          repositoryFactory ??
          RepositoryFactory.firebaseCollectionHybrid(
            firestore: firestore,
            firebaseAuth: firebaseAuth,
            functions: functions,
          ),
    );
  }
  factory DashboardDependencies.rest({
    SessionStore? sessionStore,
    RepositoryFactory? repositoryFactory,
  }) {
    return DashboardDependencies.withCurrentCustomerProvider(
      currentCustomerProvider: RestCurrentCustomerProvider(
        sessionStore: sessionStore ?? SecureSessionStore(),
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

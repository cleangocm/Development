import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:ultrawash/core/cleango/di/repository_factory.dart';
import 'package:ultrawash/core/cleango/repositories/collection_repository.dart';
import 'package:ultrawash/core/cleango/repositories/customer_repository.dart';
import 'package:ultrawash/core/cleango/repositories/notification_repository.dart';
import 'package:ultrawash/core/cleango/repositories/payment_repository.dart';
import 'package:ultrawash/core/cleango/repositories/subscription_repository.dart';
import 'package:ultrawash/core/cleango/repositories/support_request_repository.dart';
import 'package:ultrawash/core/cleango/session/current_customer_provider.dart';
import 'package:ultrawash/core/cleango/session/firebase_current_customer_provider.dart';
import 'package:ultrawash/core/cleango/session/mock_current_customer_provider.dart';
import 'package:ultrawash/core/cleango/session/rest_current_customer_provider.dart';
import 'package:ultrawash/core/cleango/session/secure_session_store.dart';
import 'package:ultrawash/core/cleango/session/session_store.dart';
import 'package:ultrawash/core/cleango/session/shared_preferences_session_store.dart';
import 'package:ultrawash/core/cleango/storage/collection_quote_image_storage.dart';
import 'package:ultrawash/core/cleango/storage/firebase_collection_quote_image_storage.dart';
import 'package:ultrawash/core/cleango/storage/firebase_profile_image_storage.dart';
import 'package:ultrawash/core/cleango/storage/profile_image_storage.dart';

class DashboardDependencies {
  const DashboardDependencies({
    required this.currentCustomerProvider,
    required this.customerRepository,
    required this.subscriptionRepository,
    required this.collectionRepository,
    required this.paymentRepository,
    required this.notificationRepository,
    this.profileImageStorage,
    this.collectionQuoteImageStorage,
    this.supportRequestRepository,
  });

  factory DashboardDependencies.mock() {
    return DashboardDependencies.withCurrentCustomerProvider(
      currentCustomerProvider: MockCurrentCustomerProvider(),
    );
  }

  factory DashboardDependencies.previewSession({
    RepositoryFactory? repositoryFactory,
    ProfileImageStorage? profileImageStorage,
  }) {
    return DashboardDependencies.rest(
      sessionStore: SharedPreferencesSessionStore(),
      repositoryFactory: repositoryFactory,
      profileImageStorage: profileImageStorage,
    );
  }

  factory DashboardDependencies.restHybrid({
    SessionStore? sessionStore,
    RepositoryFactory? repositoryFactory,
    ProfileImageStorage? profileImageStorage,
  }) {
    return DashboardDependencies.withCurrentCustomerProvider(
      currentCustomerProvider: RestCurrentCustomerProvider(
        sessionStore: sessionStore ?? SecureSessionStore(),
      ),
      repositoryFactory: repositoryFactory ?? RepositoryFactory.restHybrid(),
      profileImageStorage: profileImageStorage,
    );
  }

  factory DashboardDependencies.firebaseCustomerHybrid({
    FirebaseFirestore? firestore,
    FirebaseAuth? firebaseAuth,
    RepositoryFactory? repositoryFactory,
    ProfileImageStorage? profileImageStorage,
  }) {
    final auth = firebaseAuth ?? FirebaseAuth.instance;
    return DashboardDependencies.withCurrentCustomerProvider(
      currentCustomerProvider: FirebaseCurrentCustomerProvider(
        firebaseAuth: auth,
      ),
      repositoryFactory:
          repositoryFactory ??
          RepositoryFactory.firebaseCustomerHybrid(
            firestore: firestore,
            firebaseAuth: auth,
          ),
      profileImageStorage: profileImageStorage,
    );
  }

  factory DashboardDependencies.firebaseSubscriptionHybrid({
    FirebaseFirestore? firestore,
    FirebaseAuth? firebaseAuth,
    RepositoryFactory? repositoryFactory,
    ProfileImageStorage? profileImageStorage,
  }) {
    final auth = firebaseAuth ?? FirebaseAuth.instance;
    return DashboardDependencies.withCurrentCustomerProvider(
      currentCustomerProvider: FirebaseCurrentCustomerProvider(
        firebaseAuth: auth,
      ),
      repositoryFactory:
          repositoryFactory ??
          RepositoryFactory.firebaseSubscriptionHybrid(
            firestore: firestore,
            firebaseAuth: auth,
          ),
      profileImageStorage: profileImageStorage,
    );
  }

  factory DashboardDependencies.firebaseCollectionHybrid({
    FirebaseFirestore? firestore,
    FirebaseAuth? firebaseAuth,
    FirebaseFunctions? functions,
    FirebaseStorage? storage,
    RepositoryFactory? repositoryFactory,
    ProfileImageStorage? profileImageStorage,
    CollectionQuoteImageStorage? collectionQuoteImageStorage,
  }) {
    final auth = firebaseAuth ?? FirebaseAuth.instance;
    return DashboardDependencies.withCurrentCustomerProvider(
      currentCustomerProvider: FirebaseCurrentCustomerProvider(
        firebaseAuth: auth,
      ),
      repositoryFactory:
          repositoryFactory ??
          RepositoryFactory.firebaseCollectionHybrid(
            firestore: firestore,
            firebaseAuth: auth,
            functions: functions,
          ),
      profileImageStorage: profileImageStorage,
      collectionQuoteImageStorage:
          collectionQuoteImageStorage ??
          FirebaseCollectionQuoteImageStorage(
            firebaseAuth: auth,
            storage: storage,
          ),
    );
  }

  factory DashboardDependencies.firebaseNotificationHybrid({
    FirebaseFirestore? firestore,
    FirebaseAuth? firebaseAuth,
    FirebaseFunctions? functions,
    FirebaseStorage? storage,
    RepositoryFactory? repositoryFactory,
    ProfileImageStorage? profileImageStorage,
    CollectionQuoteImageStorage? collectionQuoteImageStorage,
  }) {
    final auth = firebaseAuth ?? FirebaseAuth.instance;
    return DashboardDependencies.withCurrentCustomerProvider(
      currentCustomerProvider: FirebaseCurrentCustomerProvider(
        firebaseAuth: auth,
      ),
      repositoryFactory:
          repositoryFactory ??
          RepositoryFactory.firebaseNotificationHybrid(
            firestore: firestore,
            firebaseAuth: auth,
            functions: functions,
          ),
      profileImageStorage: profileImageStorage,
      collectionQuoteImageStorage:
          collectionQuoteImageStorage ??
          FirebaseCollectionQuoteImageStorage(
            firebaseAuth: auth,
            storage: storage,
          ),
    );
  }

  factory DashboardDependencies.firebasePaymentHybrid({
    FirebaseFirestore? firestore,
    FirebaseAuth? firebaseAuth,
    FirebaseFunctions? functions,
    FirebaseStorage? storage,
    RepositoryFactory? repositoryFactory,
    ProfileImageStorage? profileImageStorage,
    CollectionQuoteImageStorage? collectionQuoteImageStorage,
  }) {
    final auth = firebaseAuth ?? FirebaseAuth.instance;
    return DashboardDependencies.withCurrentCustomerProvider(
      currentCustomerProvider: FirebaseCurrentCustomerProvider(
        firebaseAuth: auth,
      ),
      repositoryFactory:
          repositoryFactory ??
          RepositoryFactory.firebasePayment(
            firestore: firestore,
            firebaseAuth: auth,
            functions: functions,
          ),
      profileImageStorage: profileImageStorage,
      collectionQuoteImageStorage:
          collectionQuoteImageStorage ??
          FirebaseCollectionQuoteImageStorage(
            firebaseAuth: auth,
            storage: storage,
          ),
    );
  }

  factory DashboardDependencies.firebaseProfileImageHybrid({
    FirebaseFirestore? firestore,
    FirebaseAuth? firebaseAuth,
    FirebaseFunctions? functions,
    FirebaseStorage? storage,
    ProfileImageStorage? profileImageStorage,
    CollectionQuoteImageStorage? collectionQuoteImageStorage,
    RepositoryFactory? repositoryFactory,
  }) {
    final auth = firebaseAuth ?? FirebaseAuth.instance;
    return DashboardDependencies.withCurrentCustomerProvider(
      currentCustomerProvider: FirebaseCurrentCustomerProvider(
        firebaseAuth: auth,
      ),
      repositoryFactory:
          repositoryFactory ??
          RepositoryFactory.firebasePayment(
            firestore: firestore,
            firebaseAuth: auth,
            functions: functions,
          ),
      profileImageStorage:
          profileImageStorage ??
          FirebaseProfileImageStorage(
            firestore: firestore,
            firebaseAuth: auth,
            storage: storage,
          ),
      collectionQuoteImageStorage:
          collectionQuoteImageStorage ??
          FirebaseCollectionQuoteImageStorage(
            firebaseAuth: auth,
            storage: storage,
          ),
    );
  }

  factory DashboardDependencies.rest({
    SessionStore? sessionStore,
    RepositoryFactory? repositoryFactory,
    ProfileImageStorage? profileImageStorage,
  }) {
    return DashboardDependencies.withCurrentCustomerProvider(
      currentCustomerProvider: RestCurrentCustomerProvider(
        sessionStore: sessionStore ?? SecureSessionStore(),
      ),
      repositoryFactory: repositoryFactory,
      profileImageStorage: profileImageStorage,
    );
  }

  factory DashboardDependencies.withCurrentCustomerProvider({
    required CurrentCustomerProvider currentCustomerProvider,
    RepositoryFactory? repositoryFactory,
    ProfileImageStorage? profileImageStorage,
    CollectionQuoteImageStorage? collectionQuoteImageStorage,
  }) {
    final repositories = repositoryFactory ?? RepositoryFactory.mock();
    return DashboardDependencies(
      currentCustomerProvider: currentCustomerProvider,
      customerRepository: repositories.customerRepository,
      subscriptionRepository: repositories.subscriptionRepository,
      collectionRepository: repositories.collectionRepository,
      paymentRepository: repositories.paymentRepository,
      notificationRepository: repositories.notificationRepository,
      profileImageStorage: profileImageStorage,
      collectionQuoteImageStorage: collectionQuoteImageStorage,
      supportRequestRepository: repositories.supportRequestRepository,
    );
  }

  final CurrentCustomerProvider currentCustomerProvider;
  final CustomerRepository customerRepository;
  final SubscriptionRepository subscriptionRepository;
  final CollectionRepository collectionRepository;
  final PaymentRepository paymentRepository;
  final NotificationRepository notificationRepository;
  final ProfileImageStorage? profileImageStorage;
  final CollectionQuoteImageStorage? collectionQuoteImageStorage;
  final SupportRequestRepository? supportRequestRepository;
}

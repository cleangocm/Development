import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:ultrawash/core/cleango/repositories/collection_repository.dart';
import 'package:ultrawash/core/cleango/repositories/customer_repository.dart';
import 'package:ultrawash/core/cleango/repositories/firebase/firebase_customer_repository.dart';
import 'package:ultrawash/core/cleango/repositories/notification_repository.dart';
import 'package:ultrawash/core/cleango/repositories/payment_repository.dart';
import 'package:ultrawash/core/cleango/repositories/rest/rest_collection_repository.dart';
import 'package:ultrawash/core/cleango/repositories/rest/rest_customer_repository.dart';
import 'package:ultrawash/core/cleango/repositories/rest/rest_notification_repository.dart';
import 'package:ultrawash/core/cleango/repositories/subscription_repository.dart';
import 'package:ultrawash/core/cleango/services/mock_collection_service.dart';
import 'package:ultrawash/core/cleango/services/mock_customer_service.dart';
import 'package:ultrawash/core/cleango/services/mock_notification_service.dart';
import 'package:ultrawash/core/cleango/services/mock_payment_service.dart';
import 'package:ultrawash/core/service/api_service/api_service.dart';

class RepositoryFactory {
  const RepositoryFactory({
    required this.customerRepository,
    required this.subscriptionRepository,
    required this.collectionRepository,
    required this.paymentRepository,
    required this.notificationRepository,
  });

  factory RepositoryFactory.mock() {
    final customerService = MockCustomerService();
    return RepositoryFactory(
      customerRepository: customerService,
      subscriptionRepository: customerService,
      collectionRepository: MockCollectionService(),
      paymentRepository: MockPaymentService(),
      notificationRepository: MockNotificationService(),
    );
  }

  factory RepositoryFactory.restHybrid({NetworkService? networkService}) {
    final resolvedNetworkService = networkService ?? NetworkService();
    final mockCustomerService = MockCustomerService();
    return RepositoryFactory(
      customerRepository: RestCustomerRepository(
        networkService: resolvedNetworkService,
      ),
      subscriptionRepository: mockCustomerService,
      collectionRepository: RestCollectionRepository(
        networkService: resolvedNetworkService,
      ),
      paymentRepository: MockPaymentService(),
      notificationRepository: RestNotificationRepository(
        networkService: resolvedNetworkService,
      ),
    );
  }

  factory RepositoryFactory.firebaseCustomerHybrid({
    FirebaseFirestore? firestore,
    FirebaseAuth? firebaseAuth,
    NetworkService? networkService,
  }) {
    final resolvedNetworkService = networkService ?? NetworkService();
    final mockCustomerService = MockCustomerService();
    return RepositoryFactory(
      customerRepository: FirebaseCustomerRepository(
        firestore: firestore,
        firebaseAuth: firebaseAuth,
      ),
      subscriptionRepository: mockCustomerService,
      collectionRepository: RestCollectionRepository(
        networkService: resolvedNetworkService,
      ),
      paymentRepository: MockPaymentService(),
      notificationRepository: RestNotificationRepository(
        networkService: resolvedNetworkService,
      ),
    );
  }

  factory RepositoryFactory.firebaseCustomer({
    FirebaseFirestore? firestore,
    FirebaseAuth? firebaseAuth,
  }) {
    final mockCustomerService = MockCustomerService();
    return RepositoryFactory(
      customerRepository: FirebaseCustomerRepository(
        firestore: firestore,
        firebaseAuth: firebaseAuth,
      ),
      subscriptionRepository: mockCustomerService,
      collectionRepository: MockCollectionService(),
      paymentRepository: MockPaymentService(),
      notificationRepository: MockNotificationService(),
    );
  }
  factory RepositoryFactory.restCustomer({NetworkService? networkService}) {
    final mockCustomerService = MockCustomerService();
    return RepositoryFactory(
      customerRepository: RestCustomerRepository(
        networkService: networkService,
      ),
      subscriptionRepository: mockCustomerService,
      collectionRepository: MockCollectionService(),
      paymentRepository: MockPaymentService(),
      notificationRepository: MockNotificationService(),
    );
  }

  factory RepositoryFactory.restNotification({NetworkService? networkService}) {
    final mockCustomerService = MockCustomerService();
    return RepositoryFactory(
      customerRepository: mockCustomerService,
      subscriptionRepository: mockCustomerService,
      collectionRepository: MockCollectionService(),
      paymentRepository: MockPaymentService(),
      notificationRepository: RestNotificationRepository(
        networkService: networkService,
      ),
    );
  }
  factory RepositoryFactory.restCollection({NetworkService? networkService}) {
    final mockCustomerService = MockCustomerService();
    return RepositoryFactory(
      customerRepository: mockCustomerService,
      subscriptionRepository: mockCustomerService,
      collectionRepository: RestCollectionRepository(
        networkService: networkService,
      ),
      paymentRepository: MockPaymentService(),
      notificationRepository: MockNotificationService(),
    );
  }
  final CustomerRepository customerRepository;
  final SubscriptionRepository subscriptionRepository;
  final CollectionRepository collectionRepository;
  final PaymentRepository paymentRepository;
  final NotificationRepository notificationRepository;
}

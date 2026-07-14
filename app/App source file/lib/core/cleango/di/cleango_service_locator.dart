import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:ultrawash/core/cleango/auth/cleango_auth_provider.dart';
import 'package:ultrawash/core/cleango/auth/cleango_auth_service.dart';
import 'package:ultrawash/core/cleango/auth/firebase_cleango_auth_provider.dart';
import 'package:ultrawash/core/cleango/auth/legacy_rest_auth_adapter.dart';
import 'package:ultrawash/core/cleango/auth/mock_cleango_auth_provider.dart';
import 'package:ultrawash/core/cleango/di/dashboard_dependencies.dart';
import 'package:ultrawash/core/cleango/di/repository_factory.dart';
import 'package:ultrawash/core/cleango/session/secure_session_store.dart';
import 'package:ultrawash/core/cleango/session/session_store.dart';
import 'package:ultrawash/core/cleango/session/shared_preferences_session_store.dart';

class CleanGoServiceLocator {
  CleanGoServiceLocator._({
    required this.authProvider,
    required this.dashboardDependencies,
    required this.sessionStore,
  }) : authService = CleangoAuthService(
         authProvider: authProvider,
         legacyRestAuthAdapter: LegacyRestAuthAdapter(
           sessionStore: sessionStore,
           currentCustomerProvider:
               dashboardDependencies.currentCustomerProvider,
         ),
         sessionStore: sessionStore,
         currentCustomerProvider: dashboardDependencies.currentCustomerProvider,
       );

  factory CleanGoServiceLocator.mock() {
    final sessionStore = SharedPreferencesSessionStore();
    return CleanGoServiceLocator._(
      authProvider: MockCleangoAuthProvider(),
      dashboardDependencies: DashboardDependencies.mock(),
      sessionStore: sessionStore,
    );
  }

  factory CleanGoServiceLocator.firebaseAuth({
    CleangoAuthProvider? authProvider,
    DashboardDependencies? dashboardDependencies,
  }) {
    final sessionStore = SecureSessionStore();
    return CleanGoServiceLocator._(
      authProvider: authProvider ?? FirebaseCleangoAuthProvider(),
      dashboardDependencies:
          dashboardDependencies ?? DashboardDependencies.mock(),
      sessionStore: sessionStore,
    );
  }

  factory CleanGoServiceLocator.previewSession({
    RepositoryFactory? repositoryFactory,
  }) {
    final sessionStore = SharedPreferencesSessionStore();
    return CleanGoServiceLocator._(
      authProvider: MockCleangoAuthProvider(),
      dashboardDependencies: DashboardDependencies.rest(
        sessionStore: sessionStore,
        repositoryFactory: repositoryFactory,
      ),
      sessionStore: sessionStore,
    );
  }

  factory CleanGoServiceLocator.restHybrid({
    SessionStore? sessionStore,
    RepositoryFactory? repositoryFactory,
    CleangoAuthProvider? authProvider,
  }) {
    final resolvedSessionStore = sessionStore ?? SecureSessionStore();
    return CleanGoServiceLocator._(
      authProvider: authProvider ?? FirebaseCleangoAuthProvider(),
      dashboardDependencies: DashboardDependencies.restHybrid(
        sessionStore: resolvedSessionStore,
        repositoryFactory: repositoryFactory,
      ),
      sessionStore: resolvedSessionStore,
    );
  }

  factory CleanGoServiceLocator.firebaseCustomerHybrid({
    FirebaseFirestore? firestore,
    FirebaseAuth? firebaseAuth,
    SessionStore? sessionStore,
    RepositoryFactory? repositoryFactory,
    CleangoAuthProvider? authProvider,
  }) {
    final resolvedSessionStore = sessionStore ?? SecureSessionStore();
    final resolvedFirebaseAuth = firebaseAuth ?? FirebaseAuth.instance;
    return CleanGoServiceLocator._(
      authProvider:
          authProvider ??
          FirebaseCleangoAuthProvider(firebaseAuth: resolvedFirebaseAuth),
      dashboardDependencies: DashboardDependencies.firebaseCustomerHybrid(
        firestore: firestore,
        firebaseAuth: resolvedFirebaseAuth,
        repositoryFactory: repositoryFactory,
      ),
      sessionStore: resolvedSessionStore,
    );
  }

  factory CleanGoServiceLocator.firebaseSubscriptionHybrid({
    FirebaseFirestore? firestore,
    FirebaseAuth? firebaseAuth,
    SessionStore? sessionStore,
    RepositoryFactory? repositoryFactory,
    CleangoAuthProvider? authProvider,
  }) {
    final resolvedSessionStore = sessionStore ?? SecureSessionStore();
    final resolvedFirebaseAuth = firebaseAuth ?? FirebaseAuth.instance;
    return CleanGoServiceLocator._(
      authProvider:
          authProvider ??
          FirebaseCleangoAuthProvider(firebaseAuth: resolvedFirebaseAuth),
      dashboardDependencies: DashboardDependencies.firebaseSubscriptionHybrid(
        firestore: firestore,
        firebaseAuth: resolvedFirebaseAuth,
        repositoryFactory: repositoryFactory,
      ),
      sessionStore: resolvedSessionStore,
    );
  }
  factory CleanGoServiceLocator.rest({
    SessionStore? sessionStore,
    RepositoryFactory? repositoryFactory,
  }) {
    final resolvedSessionStore = sessionStore ?? SecureSessionStore();
    return CleanGoServiceLocator._(
      authProvider: MockCleangoAuthProvider(loggedIn: false),
      dashboardDependencies: DashboardDependencies.rest(
        sessionStore: resolvedSessionStore,
        repositoryFactory: repositoryFactory,
      ),
      sessionStore: resolvedSessionStore,
    );
  }

  static CleanGoServiceLocator _instance = CleanGoServiceLocator.mock();

  static void useRestHybrid({
    SessionStore? sessionStore,
    RepositoryFactory? repositoryFactory,
    CleangoAuthProvider? authProvider,
  }) {
    _instance = CleanGoServiceLocator.restHybrid(
      sessionStore: sessionStore,
      repositoryFactory: repositoryFactory,
      authProvider: authProvider,
    );
  }

  static void useFirebaseCustomerHybrid({
    FirebaseFirestore? firestore,
    FirebaseAuth? firebaseAuth,
    SessionStore? sessionStore,
    RepositoryFactory? repositoryFactory,
    CleangoAuthProvider? authProvider,
  }) {
    _instance = CleanGoServiceLocator.firebaseCustomerHybrid(
      firestore: firestore,
      firebaseAuth: firebaseAuth,
      sessionStore: sessionStore,
      repositoryFactory: repositoryFactory,
      authProvider: authProvider,
    );
  }

  static void useFirebaseSubscriptionHybrid({
    FirebaseFirestore? firestore,
    FirebaseAuth? firebaseAuth,
    SessionStore? sessionStore,
    RepositoryFactory? repositoryFactory,
    CleangoAuthProvider? authProvider,
  }) {
    _instance = CleanGoServiceLocator.firebaseSubscriptionHybrid(
      firestore: firestore,
      firebaseAuth: firebaseAuth,
      sessionStore: sessionStore,
      repositoryFactory: repositoryFactory,
      authProvider: authProvider,
    );
  }

  static CleanGoServiceLocator get instance => _instance;

  static void configure(
    DashboardDependencies dashboardDependencies, {
    CleangoAuthProvider? authProvider,
    SessionStore? sessionStore,
  }) {
    _instance = CleanGoServiceLocator._(
      authProvider: authProvider ?? _instance.authProvider,
      dashboardDependencies: dashboardDependencies,
      sessionStore: sessionStore ?? _instance.sessionStore,
    );
  }

  final CleangoAuthProvider authProvider;
  final CleangoAuthService authService;
  final DashboardDependencies dashboardDependencies;
  final SessionStore sessionStore;
}

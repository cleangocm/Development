import 'package:ultrawash/core/cleango/auth/cleango_auth_provider.dart';
import 'package:ultrawash/core/cleango/auth/firebase_cleango_auth_provider.dart';
import 'package:ultrawash/core/cleango/auth/mock_cleango_auth_provider.dart';
import 'package:ultrawash/core/cleango/di/dashboard_dependencies.dart';
import 'package:ultrawash/core/cleango/di/repository_factory.dart';
import 'package:ultrawash/core/cleango/session/session_store.dart';

class CleanGoServiceLocator {
  CleanGoServiceLocator._({
    required this.authProvider,
    required this.dashboardDependencies,
  });

  factory CleanGoServiceLocator.mock() {
    return CleanGoServiceLocator._(
      authProvider: MockCleangoAuthProvider(),
      dashboardDependencies: DashboardDependencies.mock(),
    );
  }

  factory CleanGoServiceLocator.firebaseAuth({
    CleangoAuthProvider? authProvider,
    DashboardDependencies? dashboardDependencies,
  }) {
    return CleanGoServiceLocator._(
      authProvider: authProvider ?? FirebaseCleangoAuthProvider(),
      dashboardDependencies:
          dashboardDependencies ?? DashboardDependencies.mock(),
    );
  }

  factory CleanGoServiceLocator.previewSession({
    RepositoryFactory? repositoryFactory,
  }) {
    return CleanGoServiceLocator._(
      authProvider: MockCleangoAuthProvider(),
      dashboardDependencies: DashboardDependencies.previewSession(
        repositoryFactory: repositoryFactory,
      ),
    );
  }

  factory CleanGoServiceLocator.rest({
    SessionStore? sessionStore,
    RepositoryFactory? repositoryFactory,
  }) {
    return CleanGoServiceLocator._(
      authProvider: MockCleangoAuthProvider(),
      dashboardDependencies: DashboardDependencies.rest(
        sessionStore: sessionStore,
        repositoryFactory: repositoryFactory,
      ),
    );
  }

  static CleanGoServiceLocator _instance = CleanGoServiceLocator.mock();

  static CleanGoServiceLocator get instance => _instance;

  static void configure(
    DashboardDependencies dashboardDependencies, {
    CleangoAuthProvider? authProvider,
  }) {
    _instance = CleanGoServiceLocator._(
      authProvider: authProvider ?? _instance.authProvider,
      dashboardDependencies: dashboardDependencies,
    );
  }

  final CleangoAuthProvider authProvider;
  final DashboardDependencies dashboardDependencies;
}

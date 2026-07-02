import 'package:ultrawash/core/cleango/di/dashboard_dependencies.dart';
import 'package:ultrawash/core/cleango/di/repository_factory.dart';
import 'package:ultrawash/core/cleango/session/session_store.dart';

class CleanGoServiceLocator {
  CleanGoServiceLocator._({required this.dashboardDependencies});

  factory CleanGoServiceLocator.mock() {
    return CleanGoServiceLocator._(
      dashboardDependencies: DashboardDependencies.mock(),
    );
  }

  factory CleanGoServiceLocator.rest({
    SessionStore? sessionStore,
    RepositoryFactory? repositoryFactory,
  }) {
    return CleanGoServiceLocator._(
      dashboardDependencies: DashboardDependencies.rest(
        sessionStore: sessionStore,
        repositoryFactory: repositoryFactory,
      ),
    );
  }

  static CleanGoServiceLocator _instance = CleanGoServiceLocator.mock();

  static CleanGoServiceLocator get instance => _instance;

  static void configure(DashboardDependencies dashboardDependencies) {
    _instance = CleanGoServiceLocator._(
      dashboardDependencies: dashboardDependencies,
    );
  }

  final DashboardDependencies dashboardDependencies;
}

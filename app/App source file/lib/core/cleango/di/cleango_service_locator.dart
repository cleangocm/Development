import 'package:ultrawash/core/cleango/di/dashboard_dependencies.dart';

class CleanGoServiceLocator {
  CleanGoServiceLocator._({required this.dashboardDependencies});

  factory CleanGoServiceLocator.mock() {
    return CleanGoServiceLocator._(
      dashboardDependencies: DashboardDependencies.mock(),
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

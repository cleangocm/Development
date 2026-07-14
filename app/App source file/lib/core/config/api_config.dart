import 'package:ultrawash/core/config/app_environment.dart';

class ApiConfig {
  ApiConfig._();

  static const String _apiBaseUrlOverride = String.fromEnvironment(
    'CLEANGO_API_BASE_URL',
  );

  static const String developmentApiBaseUrl = 'http://10.0.2.2:5000/api/v1';
  static const String productionApiBaseUrl =
      'https://laundry-service-booking-app-backend.onrender.com/api/v1';

  static String get environmentName => AppEnvironment.currentName;

  static String get apiBaseUrl {
    final override = _apiBaseUrlOverride.trim();
    if (override.isNotEmpty) return _normalize(override);

    switch (AppEnvironment.current) {
      case CleanGoEnvironment.development:
        return developmentApiBaseUrl;
      case CleanGoEnvironment.staging:
        throw StateError(
          'CLEANGO_API_BASE_URL is required when CLEANGO_ENV=staging.',
        );
      case CleanGoEnvironment.production:
        return productionApiBaseUrl;
    }
  }

  static String _normalize(String value) {
    final normalized = value.trim();
    if (normalized.endsWith('/')) {
      return normalized.substring(0, normalized.length - 1);
    }
    return normalized;
  }

  static String startupSummary() {
    return 'CLEANGO API environment: $environmentName, baseUrl: $apiBaseUrl';
  }
}

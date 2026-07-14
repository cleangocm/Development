enum CleanGoEnvironment { development, staging, production }

class AppEnvironment {
  AppEnvironment._();

  static const String _rawEnvironment = String.fromEnvironment(
    'CLEANGO_ENV',
    defaultValue: 'development',
  );

  static String get currentName => _rawEnvironment.trim().toLowerCase();

  static CleanGoEnvironment get current {
    switch (currentName) {
      case '':
      case 'development':
      case 'dev':
        return CleanGoEnvironment.development;
      case 'staging':
      case 'stage':
        return CleanGoEnvironment.staging;
      case 'production':
      case 'prod':
        return CleanGoEnvironment.production;
      default:
        throw StateError(
          'Unsupported CLEANGO_ENV "$_rawEnvironment". '
          'Use development, staging, or production.',
        );
    }
  }
}

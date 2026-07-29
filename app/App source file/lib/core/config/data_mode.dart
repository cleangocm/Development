enum CleanGoDataMode { restHybrid, firebase }

class DataModeConfig {
  DataModeConfig._();

  static const String _rawDataMode = String.fromEnvironment(
    'CLEANGO_DATA_MODE',
    defaultValue: 'restHybrid',
  );

  static String get currentName => _rawDataMode.trim().toLowerCase();

  static CleanGoDataMode get current {
    switch (currentName) {
      case '':
      case 'rest':
      case 'resthybrid':
      case 'rest_hybrid':
      case 'legacy':
        return CleanGoDataMode.restHybrid;
      case 'firebase':
      case 'firebase_first':
      case 'firebasefirst':
        return CleanGoDataMode.firebase;
      default:
        throw StateError(
          'Unsupported CLEANGO_DATA_MODE "$_rawDataMode". '
          'Use restHybrid or firebase.',
        );
    }
  }

  static bool get isFirebase => current == CleanGoDataMode.firebase;

  static const String _rawProfileImageStorage = String.fromEnvironment(
    'CLEANGO_PROFILE_IMAGE_STORAGE',
    defaultValue: 'disabled',
  );

  static bool get useFirebaseProfileImageStorage {
    final value = _rawProfileImageStorage.trim().toLowerCase();
    return value == 'firebase' || value == 'enabled' || value == 'true';
  }

  static String get authModeLabel {
    return isFirebase ? 'firebase-auth' : 'legacy-rest-session';
  }

  static String startupSummary() {
    return 'CLEANGO data mode: ${current.name}, auth mode: $authModeLabel';
  }
}

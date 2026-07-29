import 'package:flutter/foundation.dart';

enum CleanGoDataMode { restHybrid, firebase }

class DataModeConfig {
  DataModeConfig._();

  static const String _rawDataMode = String.fromEnvironment(
    'CLEANGO_DATA_MODE',
    defaultValue: '',
  );

  static String get currentName => current.name;

  static CleanGoDataMode get current {
    return resolve(rawValue: _rawDataMode, isRelease: kReleaseMode);
  }

  @visibleForTesting
  static CleanGoDataMode resolve({
    required String rawValue,
    required bool isRelease,
  }) {
    final normalized = rawValue.trim().toLowerCase();
    switch (normalized) {
      case '':
        return isRelease
            ? CleanGoDataMode.firebase
            : CleanGoDataMode.restHybrid;
      case 'rest':
      case 'resthybrid':
      case 'rest_hybrid':
      case 'legacy':
        if (isRelease) {
          throw StateError(
            'CLEANGO release builds require Firebase data mode. '
            'Remove the REST mode override or set CLEANGO_DATA_MODE=firebase.',
          );
        }
        return CleanGoDataMode.restHybrid;
      case 'firebase':
      case 'firebase_first':
      case 'firebasefirst':
        return CleanGoDataMode.firebase;
      default:
        throw StateError(
          'Unsupported CLEANGO_DATA_MODE "$rawValue". '
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

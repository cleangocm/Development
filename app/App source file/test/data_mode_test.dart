import 'package:flutter_test/flutter_test.dart';
import 'package:ultrawash/core/config/data_mode.dart';

void main() {
  group('DataModeConfig.resolve', () {
    test('debug defaults to REST hybrid', () {
      expect(
        DataModeConfig.resolve(rawValue: '', isRelease: false),
        CleanGoDataMode.restHybrid,
      );
    });

    test('debug accepts explicit Firebase mode', () {
      expect(
        DataModeConfig.resolve(rawValue: 'firebase', isRelease: false),
        CleanGoDataMode.firebase,
      );
    });

    test('release defaults to Firebase mode', () {
      expect(
        DataModeConfig.resolve(rawValue: '', isRelease: true),
        CleanGoDataMode.firebase,
      );
    });

    test('release rejects REST hybrid mode', () {
      expect(
        () => DataModeConfig.resolve(rawValue: 'restHybrid', isRelease: true),
        throwsStateError,
      );
    });

    test('invalid mode fails closed', () {
      expect(
        () => DataModeConfig.resolve(rawValue: 'unexpected', isRelease: false),
        throwsStateError,
      );
    });
  });
}

import 'dart:async';

import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
}

class FirebaseMessagingService {
  FirebaseMessagingService({
    FirebaseMessaging? messaging,
    FirebaseFunctions? functions,
    FirebaseAuth? firebaseAuth,
  }) : _messaging = messaging ?? FirebaseMessaging.instance,
       _functions =
           functions ??
           FirebaseFunctions.instanceFor(region: defaultFunctionsRegion),
       _firebaseAuth = firebaseAuth ?? FirebaseAuth.instance;

  static const defaultFunctionsRegion = 'europe-west1';

  final FirebaseMessaging _messaging;
  final FirebaseFunctions _functions;
  final FirebaseAuth _firebaseAuth;

  StreamSubscription<User?>? _authSubscription;
  StreamSubscription<String>? _tokenSubscription;
  bool _initialized = false;

  Stream<RemoteMessage> get foregroundMessages => FirebaseMessaging.onMessage;

  Stream<String> get tokenRefreshes => _messaging.onTokenRefresh;

  Future<void> initialize({String platform = 'android'}) async {
    if (_initialized) return;
    _initialized = true;

    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
    _authSubscription = _firebaseAuth.authStateChanges().listen((user) {
      if (user != null) {
        unawaited(_registerCurrentDeviceSafely(platform: platform));
      }
    });
    _tokenSubscription = tokenRefreshes.listen((token) {
      final trimmedToken = token.trim();
      if (trimmedToken.isEmpty || _firebaseAuth.currentUser == null) return;
      unawaited(_registerTokenSafely(trimmedToken, platform: platform));
    });

    if (_firebaseAuth.currentUser != null) {
      await _registerCurrentDeviceSafely(platform: platform);
    }
  }

  Future<NotificationSettings> requestPermission() {
    return _messaging.requestPermission(alert: true, badge: true, sound: true);
  }

  Future<void> registerCurrentDevice({String platform = 'android'}) async {
    if (_firebaseAuth.currentUser == null) return;
    await requestPermission();
    final token = await _messaging.getToken();
    if (token == null || token.trim().isEmpty) return;
    await _registerToken(token.trim(), platform: platform);
  }

  Future<void> dispose() async {
    await _authSubscription?.cancel();
    await _tokenSubscription?.cancel();
    _initialized = false;
  }

  Future<void> _registerCurrentDeviceSafely({required String platform}) async {
    try {
      await registerCurrentDevice(platform: platform);
    } catch (_) {
      // Notification permission or token registration must not block app usage.
    }
  }

  Future<void> _registerTokenSafely(
    String token, {
    required String platform,
  }) async {
    try {
      await _registerToken(token, platform: platform);
    } catch (_) {
      // A later auth or token refresh event will retry registration.
    }
  }

  Future<void> _registerToken(String token, {required String platform}) async {
    final callable = _functions.httpsCallable('registerDeviceToken');
    await callable.call(<String, dynamic>{
      'token': token,
      'platform': platform,
    });
  }
}

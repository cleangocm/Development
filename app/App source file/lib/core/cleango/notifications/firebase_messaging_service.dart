import 'dart:async';

import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

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

  Stream<RemoteMessage> get foregroundMessages => FirebaseMessaging.onMessage;

  Stream<String> get tokenRefreshes => _messaging.onTokenRefresh;

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

  StreamSubscription<String> listenForTokenRefresh({
    String platform = 'android',
  }) {
    return tokenRefreshes.listen((token) {
      final trimmedToken = token.trim();
      if (trimmedToken.isEmpty || _firebaseAuth.currentUser == null) return;
      unawaited(_registerToken(trimmedToken, platform: platform));
    });
  }

  Future<void> _registerToken(String token, {required String platform}) async {
    final callable = _functions.httpsCallable('registerDeviceToken');
    await callable.call(<String, dynamic>{
      'token': token,
      'platform': platform,
    });
  }
}

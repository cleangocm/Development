import 'dart:async';

import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:ultrawash/core/cleango/notifications/notification_destination.dart';

const _channel = AndroidNotificationChannel(
  'cleango_updates',
  'CLEANGO updates',
  description: 'Collection, payment, and subscription updates.',
  importance: Importance.high,
);

const _initializationSettings = InitializationSettings(
  android: AndroidInitializationSettings('ic_stat_cleango'),
  iOS: DarwinInitializationSettings(
    requestAlertPermission: false,
    requestBadgePermission: false,
    requestSoundPermission: false,
  ),
);

const _notificationDetails = NotificationDetails(
  android: AndroidNotificationDetails(
    'cleango_updates',
    'CLEANGO updates',
    channelDescription: 'Collection, payment, and subscription updates.',
    importance: Importance.high,
    priority: Priority.high,
    icon: 'ic_stat_cleango',
  ),
  iOS: DarwinNotificationDetails(
    presentAlert: true,
    presentBadge: true,
    presentSound: true,
  ),
);

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  if (message.notification != null) return;

  final plugin = FlutterLocalNotificationsPlugin();
  await plugin.initialize(settings: _initializationSettings);
  await _showMessage(plugin, message);
}

class FirebaseMessagingService {
  FirebaseMessagingService({
    FirebaseMessaging? messaging,
    FirebaseFunctions? functions,
    FirebaseAuth? firebaseAuth,
    FlutterLocalNotificationsPlugin? localNotifications,
  }) : _messaging = messaging ?? FirebaseMessaging.instance,
       _functions =
           functions ??
           FirebaseFunctions.instanceFor(region: defaultFunctionsRegion),
       _firebaseAuth = firebaseAuth ?? FirebaseAuth.instance,
       _localNotifications =
           localNotifications ?? FlutterLocalNotificationsPlugin();

  static final FirebaseMessagingService instance = FirebaseMessagingService();
  static const defaultFunctionsRegion = 'europe-west1';

  final FirebaseMessaging _messaging;
  final FirebaseFunctions _functions;
  final FirebaseAuth _firebaseAuth;
  final FlutterLocalNotificationsPlugin _localNotifications;
  final StreamController<NotificationDestination> _destinationController =
      StreamController<NotificationDestination>.broadcast();

  StreamSubscription<User?>? _authSubscription;
  StreamSubscription<String>? _tokenSubscription;
  StreamSubscription<RemoteMessage>? _foregroundSubscription;
  StreamSubscription<RemoteMessage>? _openedSubscription;
  NotificationDestination? _pendingDestination;
  String? _lastDestinationPayload;
  bool _initialized = false;

  Stream<RemoteMessage> get foregroundMessages => FirebaseMessaging.onMessage;

  Stream<String> get tokenRefreshes => _messaging.onTokenRefresh;

  Stream<NotificationDestination> get notificationDestinations =>
      _destinationController.stream;

  NotificationDestination? takePendingDestination() {
    final destination = _pendingDestination;
    _pendingDestination = null;
    return destination;
  }

  Future<void> initialize({String platform = 'android'}) async {
    if (_initialized) return;
    _initialized = true;

    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
    await _initializeLocalNotifications();

    _foregroundSubscription = FirebaseMessaging.onMessage.listen((message) {
      unawaited(_showMessage(_localNotifications, message));
    });
    _openedSubscription = FirebaseMessaging.onMessageOpenedApp.listen(
      _publishMessageDestination,
    );
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

    final initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) _publishMessageDestination(initialMessage);

    final localLaunch = await _localNotifications
        .getNotificationAppLaunchDetails();
    final payload = localLaunch?.notificationResponse?.payload;
    if (localLaunch?.didNotificationLaunchApp == true &&
        payload != null &&
        payload.isNotEmpty) {
      _publishDestination(NotificationDestination.fromPayload(payload));
    }

    if (_firebaseAuth.currentUser != null) {
      unawaited(_registerCurrentDeviceSafely(platform: platform));
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

  Future<void> unregisterCurrentDevice() async {
    if (_firebaseAuth.currentUser == null) return;

    final token = await _messaging.getToken();
    try {
      if (token != null && token.trim().isNotEmpty) {
        final callable = _functions.httpsCallable('unregisterDeviceToken');
        await callable.call(<String, dynamic>{'token': token.trim()});
      }
    } finally {
      await _messaging.deleteToken();
    }
  }

  Future<void> dispose() async {
    await _authSubscription?.cancel();
    await _tokenSubscription?.cancel();
    await _foregroundSubscription?.cancel();
    await _openedSubscription?.cancel();
    _initialized = false;
  }

  Future<void> _initializeLocalNotifications() async {
    await _localNotifications.initialize(
      settings: _initializationSettings,
      onDidReceiveNotificationResponse: (response) {
        final payload = response.payload;
        if (payload == null || payload.isEmpty) return;
        _publishDestination(NotificationDestination.fromPayload(payload));
      },
    );

    final android = _localNotifications
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >();
    await android?.createNotificationChannel(_channel);
  }

  void _publishMessageDestination(RemoteMessage message) {
    _publishDestination(
      NotificationDestination.fromData(<String, dynamic>{
        ...message.data,
        if (message.messageId != null &&
            !message.data.containsKey('notificationId'))
          'notificationId': message.messageId,
      }),
    );
  }

  void _publishDestination(NotificationDestination destination) {
    final payload = destination.toPayload();
    if (_lastDestinationPayload == payload) return;
    _lastDestinationPayload = payload;
    _pendingDestination = destination;
    _destinationController.add(destination);
  }

  Future<void> _registerCurrentDeviceSafely({required String platform}) async {
    try {
      await registerCurrentDevice(platform: platform);
    } catch (_) {
      // Notification permission or registration must not block app usage.
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

Future<void> _showMessage(
  FlutterLocalNotificationsPlugin plugin,
  RemoteMessage message,
) async {
  final title =
      message.notification?.title ??
      message.data['title']?.toString().trim() ??
      'CLEANGO update';
  final body =
      message.notification?.body ??
      message.data['body']?.toString().trim() ??
      message.data['message']?.toString().trim() ??
      'You have a new CLEANGO update.';
  final destination = NotificationDestination.fromData(<String, dynamic>{
    ...message.data,
    if (message.messageId != null &&
        !message.data.containsKey('notificationId'))
      'notificationId': message.messageId,
  });
  final id =
      (message.messageId ?? destination.toPayload()).hashCode & 0x7fffffff;

  await plugin.show(
    id: id,
    title: title,
    body: body,
    notificationDetails: _notificationDetails,
    payload: destination.toPayload(),
  );
}

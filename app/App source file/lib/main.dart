import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:get/get.dart';
import 'package:ultrawash/Controller_Binding.dart';
import 'package:ultrawash/core/cleango/di/cleango_service_locator.dart';
import 'package:ultrawash/core/cleango/notifications/firebase_messaging_service.dart';
import 'package:ultrawash/core/cleango/session/secure_session_store.dart';
import 'package:ultrawash/core/config/api_config.dart';
import 'package:ultrawash/core/config/data_mode.dart';
import 'package:ultrawash/feature/auth/ui/screen/splash_screen.dart';

FirebaseMessagingService? _messagingService;

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final firebaseReady = await _initializeFirebase();

  const stripePublishableKey = String.fromEnvironment('STRIPE_PUBLISHABLE_KEY');
  if (stripePublishableKey.isNotEmpty) {
    Stripe.publishableKey = stripePublishableKey;
    Stripe.merchantIdentifier = 'merchant.cm.cleangocm';
    Stripe.urlScheme = 'cleangocm';
    await Stripe.instance.applySettings();
  }

  // Load token from storage before controllers initialize.
  final sessionStore = SecureSessionStore();
  await sessionStore.readAccessToken();
  _configureCleanGoRuntime(sessionStore);
  if (firebaseReady && DataModeConfig.isFirebase) {
    _messagingService = FirebaseMessagingService();
    await _messagingService!.initialize();
  }
  if (DataModeConfig.current == CleanGoDataMode.restHybrid) {
    debugPrint(ApiConfig.startupSummary());
  } else {
    debugPrint('CLEANGO API environment: inactive for Firebase data mode');
  }
  debugPrint(DataModeConfig.startupSummary());

  runApp(MyApp());
}

void _configureCleanGoRuntime(SecureSessionStore sessionStore) {
  switch (DataModeConfig.current) {
    case CleanGoDataMode.firebase:
      if (DataModeConfig.useFirebaseProfileImageStorage) {
        CleanGoServiceLocator.useFirebaseProfileImageHybrid(
          sessionStore: sessionStore,
        );
      } else {
        CleanGoServiceLocator.useFirebasePaymentHybrid(
          sessionStore: sessionStore,
        );
      }
    case CleanGoDataMode.restHybrid:
      CleanGoServiceLocator.useRestHybrid(sessionStore: sessionStore);
  }
}

Future<bool> _initializeFirebase() async {
  try {
    await Firebase.initializeApp();
    return true;
  } on FirebaseException catch (error) {
    if (DataModeConfig.isFirebase) rethrow;
    debugPrint('Firebase initialization skipped: ${error.code}');
    return false;
  } catch (_) {
    if (DataModeConfig.isFirebase) rethrow;
    debugPrint('Firebase initialization skipped in REST mode');
    return false;
  }
}

class MyApp extends StatelessWidget {
  const MyApp({super.key, this.home});

  final Widget? home;

  @override
  Widget build(BuildContext context) {
    return ScreenUtilInit(
      designSize: const Size(412, 917),
      minTextAdapt: true,
      splitScreenMode: true,
      builder: (context, child) {
        return GetMaterialApp(
          initialBinding: CleangoCoreBinding(),
          title: 'CLEANGO CM',
          debugShowCheckedModeBanner: false,
          theme: ThemeData(
            brightness: Brightness.light,
            colorScheme: ColorScheme.fromSeed(
              seedColor: Color(0xFF16A34A),
              brightness: Brightness.light,
            ),
            useMaterial3: true,
            scaffoldBackgroundColor: Color(0xFFFDFDFD),
          ),
          darkTheme: ThemeData(
            brightness: Brightness.dark,
            colorScheme: ColorScheme.fromSeed(
              seedColor: Color(0xFF16A34A),
              brightness: Brightness.dark,
            ),
            useMaterial3: true,
            scaffoldBackgroundColor: Color(0xFF022531),
          ),
          themeMode: ThemeMode.light,
          home: home ?? const SplashScreen(),
        );
      },
    );
  }
}

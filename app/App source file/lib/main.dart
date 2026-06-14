import 'package:device_preview/device_preview.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:get/get.dart';
import 'package:ultrawash/Controller_Binding.dart';
import 'package:ultrawash/core/service/shared_preferance/shared_prefarance.dart';
import 'package:ultrawash/feature/auth/ui/screen/splash_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  Stripe.publishableKey = const String.fromEnvironment(
    'STRIPE_PUBLISHABLE_KEY',
  );
  Stripe.merchantIdentifier = 'merchant.com.example.ultrawash';
  Stripe.urlScheme = 'flutterstripe';
  await Stripe.instance.applySettings();

  // Load token from storage before controllers initialize
  final sharedPrefs = SharedPrefs();
  await sharedPrefs.getToken();

  runApp(
    // DevicePreview(
    //   enabled: !kReleaseMode,
    //   builder: (context) => const MyApp(),
    // ),
    MyApp(),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ScreenUtilInit(
      designSize: const Size(412, 917),
      minTextAdapt: true,
      splitScreenMode: true,
      builder: (context, child) {
        return GetMaterialApp(
          initialBinding: ControllerBinding(),
          title: 'Ultra Wash',
          debugShowCheckedModeBanner: false,
          // useInheritedMediaQuery: true,
          // locale: DevicePreview.locale(context),
          // builder: DevicePreview.appBuilder,
          theme: ThemeData(
            brightness: Brightness.light,
            colorScheme: ColorScheme.fromSeed(
              seedColor: Color(0xFF0F7BA0),
              brightness: Brightness.light,
            ),
            useMaterial3: true,
            scaffoldBackgroundColor: Color(0xFFFDFDFD),
          ),
          darkTheme: ThemeData(
            brightness: Brightness.dark,
            colorScheme: ColorScheme.fromSeed(
              seedColor: Color(0xFF0F7BA0),
              brightness: Brightness.dark,
            ),
            useMaterial3: true,
            scaffoldBackgroundColor: Color(0xFF022531),
          ),
          themeMode: ThemeMode.light,
          home: const SplashScreen(),
        );
      },
    );
  }
}

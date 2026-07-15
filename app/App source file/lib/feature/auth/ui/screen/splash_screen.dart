import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ultrawash/app/assets.dart';
import 'package:ultrawash/core/cleango/di/cleango_service_locator.dart';
import 'package:ultrawash/core/config/data_mode.dart';
import 'package:ultrawash/feature/auth/ui/controller/auth_controller.dart';
import 'package:ultrawash/feature/auth/ui/screen/splash_find_screen.dart';
import 'package:ultrawash/feature/customer_dashboard/customer_dashboard_shell.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  final AuthController _authController = Get.find<AuthController>();
  final _authService = CleanGoServiceLocator.instance.authService;

  @override
  void initState() {
    super.initState();
    _navigateToNext();
  }

  void _navigateToNext() async {
    await Future.delayed(const Duration(seconds: 2));

    // Check if user is already logged in.
    final isLoggedIn = await _isSignedInForCurrentDataMode();

    if (isLoggedIn) {
      // User is logged in, go to CLEANGO customer dashboard
      Get.offAll(() => const CleanGoCustomerDashboardShell());
    } else {
      // User is not logged in, go to splash find screen
      Get.off(() => const SplashFindScreen());
    }
  }

  Future<bool> _isSignedInForCurrentDataMode() async {
    if (DataModeConfig.isFirebase) {
      final result = await _authService.isSignedIn();
      return result.value ?? false;
    }

    return _authController.isLoggedIn();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: BoxDecoration(
          image: DecorationImage(
            image: AssetImage(Assets.splash),
            fit: BoxFit.cover,
          ),
        ),
      ),
    );
  }
}

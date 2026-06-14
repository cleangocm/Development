import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ultrawash/app/assets.dart';
import 'package:ultrawash/feature/auth/ui/controller/auth_controller.dart';
import 'package:ultrawash/feature/auth/ui/screen/splash_find_screen.dart';
import 'package:ultrawash/feature/bottomNavigation.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  final AuthController _authController = Get.find<AuthController>();

  @override
  void initState() {
    super.initState();
    _navigateToNext();
  }

  void _navigateToNext() async {
    await Future.delayed(const Duration(seconds: 2));

    // Check if user is already logged in
    final isLoggedIn = await _authController.isLoggedIn();

    if (isLoggedIn) {
      // User is logged in, go to home
      Get.offAll(() => BottomNavigation());
    } else {
      // User is not logged in, go to splash find screen
      Get.off(() => const SplashFindScreen());
    }
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


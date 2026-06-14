import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:ultrawash/app/assets.dart';
import 'package:ultrawash/app/resource.dart';
import 'package:ultrawash/app/widget_button.dart';
import 'package:ultrawash/feature/auth/ui/screen/login_screen.dart';
import 'package:ultrawash/feature/auth/ui/screen/sign_up_screen.dart';

class SplashFindScreen extends StatelessWidget {
  const SplashFindScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: BoxDecoration(
          image: DecorationImage(
            image: AssetImage(Assets.splash_find),
            fit: BoxFit.cover,
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              const Spacer(),
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 24.w, vertical: 40.h),
                child: Row(
                  children: [
                    Expanded(
                      child: WButton(
                        onPressed: () {
                          // Registration action
                        Get.to(() => const SignUpScreen());
                        },
                        label: 'Sign Up',
                        decorationType: DecorationType.primaryStroke,
                        textColor: R.color.deepNavyBlue,
                      ),
                    ),
                    SizedBox(width: 32.w),
                    Expanded(
                      child: WButton(
                        onPressed: () {
                          Get.to(() => const LoginScreen());
                        },
                        label: 'Login',
                        decorationType: DecorationType.primary,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}


import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:ultrawash/app/assets.dart';
import 'package:ultrawash/app/resource.dart';
import 'package:ultrawash/app/widget_button.dart';
import 'package:ultrawash/app/winput_text.dart';
import 'package:ultrawash/app/wtext.dart';
import 'package:ultrawash/feature/auth/ui/controller/auth_controller.dart';
import 'package:ultrawash/feature/auth/ui/screen/otp_screen.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final TextEditingController _emailController = TextEditingController();
  final AuthController _authController = Get.find<AuthController>();

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _handleForgotPassword() async {
    if (_emailController.text.isEmpty) {
      Get.snackbar(
        'Error',
        'Please enter your email',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red,
        colorText: Colors.white,
      );
      return;
    }

    final success = await _authController.forgotPassword(
      emailOrPhone: _emailController.text.trim(),
    );

    if (success) {
      Get.to(() => const OtpScreen());
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor:R.color.background,
      body: Column(
        children: [
          // Top Section with light blue background
          Container(
            width: double.infinity,
            height: 116.h,
            padding: EdgeInsets.only(top: 8.h, bottom: 8.h),
            decoration: BoxDecoration(
              color:  R.color.iceBlue,
              borderRadius: BorderRadius.only(
                bottomLeft: Radius.circular(16.r),
                bottomRight: Radius.circular(16.r),
              ),
            ),
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: 16.w),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () => Get.back(),
                      child: Row(
                        children: [
                          Icon(
                            Icons.arrow_back_ios,
                            color: R.color.charcoalNavy,
                            size: 18.sp,
                          ),
                          SizedBox(width: 4.w),
                          WText(
                            text: 'Forgot Password',
                            color: R.color.charcoalNavy,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          // Main Content
          Expanded(
            child: SingleChildScrollView(
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: 24.w),
                child: Column(
                  children: [
                    SizedBox(height: 40.h),
                    // Forgot Password Image
                    Image.asset(
                      Assets.forgot_password,
                      width: 249.4.w,
                      height: 220.h,
                      fit: BoxFit.contain,
                    ),
                    SizedBox(height: 30.h),
                    // Forgot Password Title
                    WText(
                      text: 'Forgot Password',
                      fontSize: 24.sp,
                      fontWeight: FontWeight.w500,
                      color: R.color.charcoalNavy,
                    ),
                    SizedBox(height: 12.h),
                    // Subtitle
                    WText(
                      text: 'Please enter Your Email.\nOne OTP Will send to your Email.',
                      fontSize: 12.sp,
                      fontWeight: FontWeight.w400,
                      color: R.color.mutedIndigo,
                      textAlign: TextAlign.center,
                    ),

                    SizedBox(height: 30.h),
                    // Email Input
                    InputFieldText(
                      textEditingController: _emailController,
                      labelText: 'Your Registered Email',
                      hintText: 'ex: name@yogacm.com',
                      keyboardType: TextInputType.emailAddress,
                      onChanged: (value) {},
                    ),
                    SizedBox(height: 24.h),
                    // Next Button
                    Obx(() => WButton(
                      onPressed: () => _handleForgotPassword(),
                      label: 'Next',
                      isLoading: _authController.isLoading.value,
                    )),
                    SizedBox(height: 40.h),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}


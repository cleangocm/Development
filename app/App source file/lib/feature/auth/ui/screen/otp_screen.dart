import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:ultrawash/app/assets.dart';
import 'package:ultrawash/app/resource.dart';
import 'package:ultrawash/app/widget_button.dart';
import 'package:ultrawash/app/wtext.dart';
import 'package:ultrawash/feature/auth/ui/controller/auth_controller.dart';
import 'package:ultrawash/feature/auth/ui/screen/create_new_password_screen.dart';

class OtpScreen extends StatefulWidget {
  const OtpScreen({super.key});

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final List<TextEditingController> _otpControllers = List.generate(
    6,
    (index) => TextEditingController(),
  );
  final List<FocusNode> _focusNodes = List.generate(
    6,
    (index) => FocusNode(),
  );
  final AuthController _authController = Get.find<AuthController>();

  @override
  void dispose() {
    for (var controller in _otpControllers) {
      controller.dispose();
    }
    for (var node in _focusNodes) {
      node.dispose();
    }
    super.dispose();
  }

  String _getOtpValue() {
    return _otpControllers.map((c) => c.text).join();
  }

  Future<void> _handleVerifyOtp() async {
    final otp = _getOtpValue();

    if (otp.length != 6) {
      Get.snackbar(
        'Error',
        'Please enter the complete 6-digit OTP',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red,
        colorText: Colors.white,
      );
      return;
    }

    final success = await _authController.verifyForgotOtp(otp: otp);

    if (success) {
      Get.to(() => const CreateNewPasswordScreen());
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
              color:   R.color.iceBlue,
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
                            text: 'Place OTP',
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
                    SizedBox(height: 20.h),
                    // OTP Image
                    Image.asset(
                      Assets.Otp,
                      width: 260.03.w,
                      height: 200.82.h,
                      fit: BoxFit.contain,
                    ),
                    SizedBox(height: 30.h),
                    // Place OTP Title
                    WText(
                      text: 'Place OTP',
                      fontSize: 24.sp,
                      fontWeight: FontWeight.w500,
                      color: R.color.charcoalNavy,
                    ),
                    SizedBox(height: 12.h),
                    // Subtitle
                    WText(
                      text: 'Please Enter your OTP.\nOne OTP Will send to your Email.',
                      fontSize: 12.sp,
                      fontWeight: FontWeight.w400,
                      color: R.color.mutedIndigo,
                      textAlign: TextAlign.center,
                    ),
                    SizedBox(height: 24.h),
                    // OTP Input Boxes
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: List.generate(
                        6,
                        (index) => _buildOtpBox(index),
                      ),
                    ),
                    SizedBox(height: 30.h),
                    // Next Button
                    Obx(() => WButton(
                      onPressed: () => _handleVerifyOtp(),
                      label: 'Next',
                      height: 50.h,
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

  Widget _buildOtpBox(int index) {
    return Container(
      width: 48.w,
      height: 48.h,
      decoration: BoxDecoration(
        color: R.color.white,
        borderRadius: BorderRadius.circular(8.r),
        border: Border.all(
          color: R.color.coolBlueGrey,
          width: 1,
        ),
      ),
      child: TextField(
        controller: _otpControllers[index],
        focusNode: _focusNodes[index],
        textAlign: TextAlign.center,
        keyboardType: TextInputType.number,
        maxLength: 1,
        style: TextStyle(
          fontSize: 18.sp,
          fontWeight: FontWeight.w600,
          color: R.color.black,
        ),
        decoration: InputDecoration(
          counterText: '',
          border: InputBorder.none,
          contentPadding: EdgeInsets.zero,
        ),
        inputFormatters: [
          FilteringTextInputFormatter.digitsOnly,
        ],
        onChanged: (value) {
          if (value.isNotEmpty && index < 5) {
            _focusNodes[index + 1].requestFocus();
          } else if (value.isEmpty && index > 0) {
            _focusNodes[index - 1].requestFocus();
          }
        },
      ),
    );
  }
}


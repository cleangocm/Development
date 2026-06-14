import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:get/get.dart';
import 'package:ultrawash/app/assets.dart';
import 'package:ultrawash/app/resource.dart';
import 'package:ultrawash/app/widget_button.dart';
import 'package:ultrawash/app/winput_text.dart';
import 'package:ultrawash/app/wtext.dart';
import 'package:ultrawash/feature/auth/ui/controller/auth_controller.dart';
import 'package:ultrawash/feature/auth/ui/screen/login_screen.dart';

class CreateNewPasswordScreen extends StatefulWidget {
  const CreateNewPasswordScreen({super.key});

  @override
  State<CreateNewPasswordScreen> createState() => _CreateNewPasswordScreenState();
}

class _CreateNewPasswordScreenState extends State<CreateNewPasswordScreen> {
  final TextEditingController _newPasswordController = TextEditingController();
  final TextEditingController _confirmPasswordController = TextEditingController();
  final AuthController _authController = Get.find<AuthController>();

  @override
  void dispose() {
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleResetPassword() async {
    if (_newPasswordController.text.isEmpty) {
      Get.snackbar(
        'Error',
        'Please enter new password',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red,
        colorText: Colors.white,
      );
      return;
    }
    if (_confirmPasswordController.text.isEmpty) {
      Get.snackbar(
        'Error',
        'Please confirm your password',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red,
        colorText: Colors.white,
      );
      return;
    }
    if (_newPasswordController.text != _confirmPasswordController.text) {
      Get.snackbar(
        'Error',
        'Passwords do not match',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red,
        colorText: Colors.white,
      );
      return;
    }

    final success = await _authController.resetPassword(
      newPassword: _newPasswordController.text,
      confirmPassword: _confirmPasswordController.text,
    );

    if (success) {
      _showSuccessDialog();
    }
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return Dialog(
          backgroundColor: Colors.transparent,
          elevation: 0,
          child: Container(
            width: 324.w,
            height: 229.h,
            padding: EdgeInsets.only(
              top: 22.h,
              right: 16.w,
              bottom: 32.h,
              left: 16.w,
            ),
            decoration: BoxDecoration(
              color:R.color.white,
              borderRadius: BorderRadius.circular(16.r),
              boxShadow: [
                BoxShadow(
                  color: Color(0x33000000),
                  blurRadius: 4,
                  spreadRadius: 0,
                  offset: Offset(0, 0),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Close button
                Align(
                  alignment: Alignment.topRight,
                  child: GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    child: Icon(
                      Icons.close,
                      color: R.color.slateBlueGrey,
                      size: 24.sp,
                    ),
                  ),
                ),
                SizedBox(height: 4.h),
                // Success Icon
                SvgPicture.asset(
                  Assets.passwordvalidation,
                  width: 64.w,
                  height: 64.h,
                ),
                SizedBox(height: 5.h),
                // Success Text
                WText(
                  text: 'Password Change Successfully',
                  fontSize: 16.sp,
                  fontWeight: FontWeight.w400,
                  color: R.color.charcoalNavy,
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: 5.h),
                // Login Now Button
                WButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                    // Navigate to login screen
                    Get.offAll(() => const LoginScreen());
                  },
                  label: 'Login Now',
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: R.color.background,
      body: Column(
        children: [
          // Top Section with light blue background
          Container(
            width: double.infinity,
            height: 116.h,
            padding: EdgeInsets.only(top: 8.h, bottom: 8.h),
            decoration: BoxDecoration(
              color: R.color.iceBlue,
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
                            text: 'Create New Password',
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
                    // Create Password Image
                    Image.asset(
                      Assets.create_password,
                      width: 285.06.w,
                      height: 220.h,
                      fit: BoxFit.contain,
                    ),
                    SizedBox(height: 30.h),
                    // Create New Password Title
                    WText(
                      text: 'Create New Password',
                      fontSize: 24.sp,
                      fontWeight: FontWeight.w500,
                      color: R.color.charcoalNavy,
                    ),
                    SizedBox(height: 12.h),
                    // Subtitle
                    WText(
                      text: 'Please Create New Password.',
                        fontSize: 12.sp,
                        fontWeight: FontWeight.w400,
                        color: R.color.mutedIndigo,
                        textAlign: TextAlign.center,
                    ),
                    SizedBox(height: 30.h),
                    // New Password Input
                    InputFieldText(
                      textEditingController: _newPasswordController,
                      labelText: 'New Password',
                      hintText: '••••••••',
                      // isPassword: true,
                      onChanged: (value) {},
                      prefixIcon: Padding(
                        padding: EdgeInsets.all(12),
                        child: SvgPicture.asset(
                          Assets.square_password,
                          width: 20.w,
                          height: 20.h,
                        ),
                      ),
                    ),
                    SizedBox(height: 16.h),
                    // Confirm New Password Input
                    InputFieldText(
                      textEditingController: _confirmPasswordController,
                      labelText: 'Confirm New Password',
                      hintText: '••••••••',
                      // isPassword: true,
                      onChanged: (value) {},
                      prefixIcon: Padding(
                        padding: EdgeInsets.all(12),
                        child: SvgPicture.asset(
                          Assets.square_password,
                          width: 20.w,
                          height: 20.h,
                        ),
                      ),
                    ),
                    SizedBox(height: 40.h),
                    // Next Button
                    Obx(() => WButton(
                      onPressed: () => _handleResetPassword(),
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


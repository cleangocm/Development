import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:ultrawash/app/resource.dart';
import 'package:ultrawash/app/widget_button.dart';
import 'package:ultrawash/app/winput_text.dart';
import 'package:ultrawash/app/wtext.dart';
import 'package:ultrawash/feature/auth/ui/controller/auth_controller.dart';
import 'package:ultrawash/feature/auth/ui/screen/login_screen.dart';

class SignUpScreen extends StatefulWidget {
  const SignUpScreen({super.key});

  @override
  State<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends State<SignUpScreen> {
  final TextEditingController _firstNameController = TextEditingController();
  final TextEditingController _lastNameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmPasswordController = TextEditingController();
  final AuthController _authController = Get.find<AuthController>();
  bool _agreeToTerms = false;

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleSignUp() async {
    // Validate fields
    if (_firstNameController.text.isEmpty || _lastNameController.text.isEmpty) {
      Get.snackbar(
        'Error',
        'Please enter your full name',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red,
        colorText: Colors.white,
      );
      return;
    }
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
    if (_phoneController.text.isEmpty) {
      Get.snackbar(
        'Error',
        'Please enter your phone number',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red,
        colorText: Colors.white,
      );
      return;
    }
    if (_passwordController.text.isEmpty) {
      Get.snackbar(
        'Error',
        'Please enter your password',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red,
        colorText: Colors.white,
      );
      return;
    }
    if (_passwordController.text != _confirmPasswordController.text) {
      Get.snackbar(
        'Error',
        'Passwords do not match',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red,
        colorText: Colors.white,
      );
      return;
    }
    if (!_agreeToTerms) {
      Get.snackbar(
        'Error',
        'Please agree to the Terms of Service',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red,
        colorText: Colors.white,
      );
      return;
    }

    final fullName = '${_firstNameController.text.trim()} ${_lastNameController.text.trim()}';

    final success = await _authController.register(
      name: fullName,
      email: _emailController.text.trim(),
      phone: _phoneController.text.trim(),
      password: _passwordController.text,
      confirmPassword: _confirmPasswordController.text,
    );

    if (success) {
      // Clear the token so user needs to login after registration
      await _authController.logout();
      // Navigate to login screen
      Get.offAll(() => const LoginScreen());
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: R.color.background,
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Top Section with light blue background and teal curved overlay
            Container(
              width: double.infinity,
              height: 180.h,
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  // Teal circular background (BOTTOM LAYER)
                  Positioned(
                    top: -165.h,
                    left: -120.w,
                    child: Container(
                      width: 419.w,
                      height: 419.h,
                      decoration: BoxDecoration(
                        color: R.color.oceanBlue,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                  // Light blue background (TOP LAYER - covers top portion)
                  Positioned(
                    top: 0.h,
                    left: 0,
                    right: 0,
                    child: Container(
                      width: 412.w,
                      height: 116.h,
                      padding: EdgeInsets.only(top: 8.h, bottom: 8.h),
                      decoration: BoxDecoration(
                        color: R.color.iceBlue,
                        borderRadius: BorderRadius.only(
                          bottomLeft: Radius.circular(16.r),
                          bottomRight: Radius.circular(16.r),
                        ),
                      ),
                    ),
                  ),
                  // Back button and Sign Up text (on light blue area)
                  Positioned(
                    left: 16.w,
                    top: 60.h,
                    child: GestureDetector(
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
                            text: 'Back',
                            color: R.color.charcoalNavy,
                          ),
                        ],
                      ),
                    ),
                  ),
                  // Tabs (Login / Sign Up) - on teal area
                  Positioned(
                    left: 16.w,
                    top: 140.h,
                    child: Row(
                      children: [

                        // Sign Up Tab (Active)
                        Container(
                          padding: EdgeInsets.only(bottom: 8.h),
                          decoration: BoxDecoration(
                            border: Border(
                              bottom: BorderSide(
                                color: R.color.white,
                                width: 1.h,
                              ),
                            ),
                          ),
                          child: WText(
                            text: 'Sign Up',
                            fontSize: 16.sp,
                            fontWeight: FontWeight.w500,
                            color:  R.color.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            // Main Content
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 24.w),
              child: Column(
                children: [
                  SizedBox(height: 80.h),
                  // First Name Input
                  InputFieldText(
                    textEditingController: _firstNameController,
                    labelText: 'First Name',
                    hintText: 'First Name',
                    keyboardType: TextInputType.name,
                    onChanged: (value) {},
                  ),
                  SizedBox(height: 16.h),
                  // Last Name Input
                  InputFieldText(
                    textEditingController: _lastNameController,
                    labelText: 'Last Name',
                    hintText: 'Last Name',
                    keyboardType: TextInputType.name,
                    onChanged: (value) {},
                  ),
                  SizedBox(height: 16.h),
                  // Email Input
                  InputFieldText(
                    textEditingController: _emailController,
                    labelText: 'Email',
                    hintText: 'ex: name@yogacm.com',
                    keyboardType: TextInputType.emailAddress,
                    onChanged: (value) {},
                  ),
                  SizedBox(height: 16.h),
                  // Phone Input
                  InputFieldText(
                    textEditingController: _phoneController,
                    labelText: 'Phone',
                    hintText: '+1234567890',
                    keyboardType: TextInputType.phone,
                    onChanged: (value) {},
                  ),
                  SizedBox(height: 16.h),
                  // Password Input
                  InputFieldText(
                    textEditingController: _passwordController,
                    labelText: 'Password',
                    hintText: '••••••••',
                    onChanged: (value) {},
                  ),
                  SizedBox(height: 16.h),
                  // Confirm Password Input
                  InputFieldText(
                    textEditingController: _confirmPasswordController,
                    labelText: 'Confirm Password',
                    hintText: '••••••••',
                    onChanged: (value) {},
                  ),
                  SizedBox(height: 20.h),
                  // Terms of Service Checkbox
                  Row(
                    children: [
                      SizedBox(
                        width: 20.w,
                        height: 20.h,
                        child: Checkbox(
                          value: _agreeToTerms,
                          onChanged: (value) {
                            setState(() {
                              _agreeToTerms = value ?? false;
                            });
                          },
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(4.r),
                          ),
                          side: BorderSide(
                            color: R.color.mutedIndigo,
                            width: 1,
                          ),
                          activeColor: R.color.tealOcean,
                        ),
                      ),
                      SizedBox(width: 10.w),
                      WText(
                        text: 'I agree to the Terms of Service',
                        fontSize: 12.sp,
                        fontWeight: FontWeight.w400,
                        color: R.color.black,
                      ),
                    ],
                  ),
                  SizedBox(height: 30.h),
                  // Sign Up Button
                  Obx(() => WButton(
                    onPressed: _authController.isLoading.value
                        ? null
                        : () {
                            _handleSignUp();
                          },
                    label: 'Sign Up',
                    isLoading: _authController.isLoading.value,
                  )),
                  SizedBox(height: 40.h),
                  // Login Link
                  Column(
                    children: [
                      WText(
                        text: "Already have a account",
                        fontSize: 14.sp,
                        fontWeight: FontWeight.w500,
                        color: R.color.black,
                      ),
                      SizedBox(height: 4.h),
                      GestureDetector(
                        onTap: () => Get.back(),
                        child: WText(
                          text: 'Please Login',
                          fontSize: 14.sp,
                          fontWeight: FontWeight.w500,
                          color: R.color.tealDeep,
                          textDecoration: TextDecoration.underline,
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 80.h),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Custom Clipper for curved bottom
class CurvedBottomClipper extends CustomClipper<Path> {
  @override
  Path getClip(Size size) {
    Path path = Path();
    path.lineTo(0, size.height - 30);
    path.quadraticBezierTo(
      size.width / 2,
      size.height + 20,
      size.width,
      size.height - 30,
    );
    path.lineTo(size.width, 0);
    path.close();
    return path;
  }

  @override
  bool shouldReclip(CustomClipper<Path> oldClipper) => false;
}


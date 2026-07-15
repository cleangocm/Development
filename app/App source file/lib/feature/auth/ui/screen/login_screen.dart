import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:get/get.dart';
import 'package:ultrawash/core/cleango/auth/cleango_auth_failure.dart';
import 'package:ultrawash/core/cleango/auth/cleango_auth_service.dart';
import 'package:ultrawash/core/cleango/di/cleango_service_locator.dart';
import 'package:ultrawash/app/assets.dart';
import 'package:ultrawash/app/resource.dart';
import 'package:ultrawash/app/widget_button.dart';
import 'package:ultrawash/app/winput_text.dart';
import 'package:ultrawash/app/wtext.dart';
import 'package:ultrawash/feature/auth/ui/screen/forgot_password_screen.dart';
import 'package:ultrawash/feature/auth/ui/screen/sign_up_screen.dart';
import 'package:ultrawash/feature/customer_dashboard/customer_dashboard_shell.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final CleangoAuthService _authService =
      CleanGoServiceLocator.instance.authService;
  bool _isLoading = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // This will be called when theme changes
    setState(() {});
  }

  Future<void> _handleLogin() async {
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

    setState(() => _isLoading = true);
    final result = await _authService.signInWithEmailPassword(
      _emailController.text.trim(),
      _passwordController.text,
    );
    if (!mounted) return;
    setState(() => _isLoading = false);

    if (result.isSuccess) {
      _showSuccessSnackbar('Login successful');
      Get.offAll(() => const CleanGoCustomerDashboardShell());
      return;
    }

    _showAuthError(result.failure);
  }

  // ignore: unused_element
  Future<void> _handleGoogleLogin() async {
    setState(() => _isLoading = true);
    final result = await _authService.signInWithGoogle();
    if (!mounted) return;
    setState(() => _isLoading = false);

    if (result.isSuccess) {
      _showSuccessSnackbar('Google login successful');
      Get.offAll(() => const CleanGoCustomerDashboardShell());
      return;
    }

    _showAuthError(result.failure);
  }

  void _showAuthError(CleangoAuthFailure? failure) {
    Get.snackbar(
      'Error',
      failure?.message ?? 'Authentication failed',
      snackPosition: SnackPosition.BOTTOM,
      backgroundColor: Colors.red,
      colorText: Colors.white,
    );
  }

  void _showSuccessSnackbar(String message) {
    Get.snackbar(
      'Success',
      message,
      snackPosition: SnackPosition.BOTTOM,
      backgroundColor: Colors.green,
      colorText: Colors.white,
      duration: const Duration(seconds: 2),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: R.color.background,
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Top Section with light blue background and teal curved overlay
            SizedBox(
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
                  // Back button and Login text (on light blue area)
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
                          WText(text: 'Back', color: R.color.charcoalNavy),
                        ],
                      ),
                    ),
                  ),
                  // Tabs (Login / Sign Up) - on teal area
                  Positioned(
                    left: 16.w,
                    top: 160.h,
                    child: Row(
                      children: [
                        // Login Tab (Active)
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
                            text: 'Login',
                            fontSize: 16.sp,
                            fontWeight: FontWeight.w500,
                            color: R.color.white,
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
                  SizedBox(height: 120.h),
                  Row(
                    children: [
                      Expanded(
                        child: Image.asset(Assets.Line, fit: BoxFit.fill),
                      ),
                      Padding(
                        padding: EdgeInsets.symmetric(horizontal: 20.w),
                        child: WText(
                          text: 'OR',
                          fontSize: 12.sp,
                          fontWeight: FontWeight.w300,
                          color: R.color.slateBlueGrey,
                        ),
                      ),
                      Expanded(
                        child: Image.asset(Assets.Line, fit: BoxFit.fill),
                      ),
                    ],
                  ),
                  SizedBox(height: 30.h),
                  // User ID Input
                  InputFieldText(
                    textEditingController: _emailController,
                    labelText: 'Enter Email',
                    hintText: 'Email',
                    keyboardType: TextInputType.emailAddress,
                    onChanged: (value) {},

                    prefixIcon: Container(
                      padding: EdgeInsets.all(4),
                      child: SvgPicture.asset(
                        Assets.user,
                        width: 12,
                        height: 12,
                        fit: BoxFit.scaleDown,
                      ),
                    ),
                  ),
                  SizedBox(height: 16.h),
                  // Password Input
                  InputFieldText(
                    textEditingController: _passwordController,
                    labelText: 'Password',
                    hintText: '••••••••',
                    // isPassword: true,
                    onChanged: (value) {},
                    prefixIcon: Container(
                      padding: EdgeInsets.all(4),
                      child: SvgPicture.asset(
                        Assets.square_password,
                        width: 12,
                        height: 12,
                        fit: BoxFit.scaleDown,
                      ),
                    ),
                  ),
                  SizedBox(height: 12.h),
                  // Forgot Password
                  Align(
                    alignment: Alignment.centerRight,
                    child: GestureDetector(
                      onTap: () {
                        Get.to(() => ForgotPasswordScreen());
                      },
                      child: WText(
                        text: 'Forgot Password',
                        fontSize: 14.sp,
                        fontWeight: FontWeight.w500,
                        color: R.color.charcoalNavy,
                        textDecoration: TextDecoration.underline,
                      ),
                    ),
                  ),
                  SizedBox(height: 40.h),
                  // Login Button
                  WButton(
                    onPressed: _isLoading
                        ? null
                        : () {
                            _handleLogin();
                          },
                    label: 'Login',
                    isLoading: _isLoading,
                  ),
                  SizedBox(height: 120.h),
                  // Register Link
                  Column(
                    children: [
                      WText(
                        text: "Don't Have Account",
                        fontSize: 14.sp,
                        fontWeight: FontWeight.w500,
                        color: R.color.black,
                      ),
                      SizedBox(height: 4.h),
                      GestureDetector(
                        onTap: () {
                          Get.to(() => SignUpScreen());
                        },
                        child: WText(
                          text: 'Please Register',
                          fontSize: 14.sp,
                          fontWeight: FontWeight.w500,
                          color: R.color.tealDeep,
                          textDecoration: TextDecoration.underline,
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 40.h),
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

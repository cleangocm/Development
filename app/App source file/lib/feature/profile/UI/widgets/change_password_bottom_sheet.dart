import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:ultrawash/app/resource.dart';
import 'package:ultrawash/app/widget_button.dart';
import 'package:ultrawash/app/winput_text.dart';
import 'package:ultrawash/app/wtext.dart';
import 'package:ultrawash/feature/profile/UI/controller/profile_controller.dart';

class ChangePasswordBottomSheet extends StatefulWidget {
  const ChangePasswordBottomSheet({super.key});

  @override
  State<ChangePasswordBottomSheet> createState() => _ChangePasswordBottomSheetState();
}

class _ChangePasswordBottomSheetState extends State<ChangePasswordBottomSheet> {
  final ProfileControllers _profileController = Get.find<ProfileControllers>();
  final TextEditingController _currentPasswordController = TextEditingController();
  final TextEditingController _newPasswordController = TextEditingController();
  final TextEditingController _confirmPasswordController = TextEditingController();

  @override
  void dispose() {
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleChangePassword() async {
    final currentPassword = _currentPasswordController.text.trim();
    final newPassword = _newPasswordController.text.trim();
    final confirmPassword = _confirmPasswordController.text.trim();

    if (currentPassword.isEmpty) {
      Get.snackbar('Error', 'Please enter current password',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.red,
          colorText: Colors.white);
      return;
    }
    if (newPassword.isEmpty) {
      Get.snackbar('Error', 'Please enter new password',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.red,
          colorText: Colors.white);
      return;
    }
    if (newPassword.length < 6) {
      Get.snackbar('Error', 'Password must be at least 6 characters',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.red,
          colorText: Colors.white);
      return;
    }
    if (confirmPassword.isEmpty) {
      Get.snackbar('Error', 'Please confirm new password',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.red,
          colorText: Colors.white);
      return;
    }
    if (newPassword != confirmPassword) {
      Get.snackbar('Error', 'Passwords do not match',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.red,
          colorText: Colors.white);
      return;
    }

    final success = await _profileController.changePassword(
      currentPassword: currentPassword,
      newPassword: newPassword,
      confirmPassword: confirmPassword,
    );

    if (success && mounted) {
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Container(
        width: 412.w,
        padding: EdgeInsets.only(
          top: 32.h,
          right: 32.w,
          bottom: 48.h,
          left: 32.w,
        ),
        decoration: BoxDecoration(
          color: R.color.deepTeal,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(32.r),
            topRight: Radius.circular(32.r),
          ),
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Title
              WText(
                text: 'Change Password',
                fontSize: 16.sp,
                fontWeight: FontWeight.w600,
                color: R.color.charcoal,
              ),
              SizedBox(height: 24.h),

              // Current Password Field
              InputFieldText(
                textEditingController: _currentPasswordController,
                labelText: 'Current Password',
                hintText: 'Enter current password',
                isPassword: true,
                height: 56,
              ),
              SizedBox(height: 16.h),

              // New Password Field
              InputFieldText(
                textEditingController: _newPasswordController,
                labelText: 'New Password',
                hintText: 'Enter new password',
                isPassword: true,
                height: 56,
              ),
              SizedBox(height: 16.h),

              // Confirm Password Field
              InputFieldText(
                textEditingController: _confirmPasswordController,
                labelText: 'Confirm Password',
                hintText: 'Confirm new password',
                isPassword: true,
                height: 56,
              ),
              SizedBox(height: 24.h),

              // Update Button
              Obx(() => WButton(
                onPressed: _handleChangePassword,
                label: 'Update',
                isLoading: _profileController.isChangingPassword.value,
              )),
            ],
          ),
        ),
      ),
    );
  }
}


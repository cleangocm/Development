import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:ultrawash/app/resource.dart';
import 'package:ultrawash/app/widget_button.dart';
import 'package:ultrawash/app/wtext.dart';
import 'package:ultrawash/feature/auth/ui/controller/auth_controller.dart';
import 'package:ultrawash/feature/auth/ui/screen/login_screen.dart';
import 'package:ultrawash/feature/profile/UI/controller/profile_controller.dart';
import 'package:ultrawash/feature/profile/UI/widgets/address_bottom_sheet.dart';
import 'package:ultrawash/feature/profile/UI/widgets/change_password_bottom_sheet.dart';
import 'package:ultrawash/feature/profile/UI/widgets/personal_information_bottom_sheet.dart';
import 'package:ultrawash/feature/profile/UI/screen/coupon_screen.dart';
import 'package:ultrawash/feature/profile/UI/widgets/profile_card.dart';
import 'package:ultrawash/feature/profile/UI/widgets/profile_menu_item.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _isDarkMode = false;
  final AuthController _authController = Get.find<AuthController>();
  final ProfileControllers _profileController = Get.find<ProfileControllers>();
  @override
  void initState() {
    super.initState();
    _isDarkMode = Get.isDarkMode;

    // Load profile data if not already loaded
    if (_profileController.profileData.value == null) {
      _profileController.getProfile();
    }
  }

  void _toggleTheme() {
    _isDarkMode = !_isDarkMode;
    if (_isDarkMode) {
      Get.changeThemeMode(ThemeMode.dark);
    } else {
      Get.changeThemeMode(ThemeMode.light);
    }
    // Force app update to apply theme changes immediately
    Get.forceAppUpdate();
    Future.delayed(Duration(milliseconds: 50), () {
      if (mounted) {
        setState(() {});
      }
    });
  }

  Future<void> _handleLogout() async {
    final success = await _authController.logout();
    if (success) {
      // Navigate to login screen and remove all previous routes
      Get.offAll(() => const LoginScreen());
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: R.color.background,
      body: Obx(() {
        // Show loading screen while profile data is loading
        if (_profileController.isLoading.value && _profileController.profileData.value == null) {
          return Center(
            child: CircularProgressIndicator(
              color: R.color.oceanBlue,
            ),
          );
        }

        return SingleChildScrollView(
          child: Column(
            children: [
              SizedBox(height: 70.h),
              // Profile Card
              const ProfileCard(),
              SizedBox(height: 24.h),
            // Menu Options
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 16.w),
              child: Column(
                children: [
                  // First Card - Personal Info, Address, Payment Methods
                  Container(
                    width: 380.w,
                    padding: EdgeInsets.symmetric(vertical: 16.h),
                    decoration: BoxDecoration(
                      color: R.color.deepTeal,
                      borderRadius: BorderRadius.circular(8.r),
                      boxShadow: [
                        BoxShadow(
                          color: Color(0x26000000),
                          blurRadius: 4,
                          offset: Offset(0, 0),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        ProfileMenuItem(
                          icon: Icons.person_outline,
                          title: 'Personal Information',
                          onTap: () => _showPersonalInformationBottomSheet(),
                          showBorder: true,
                        ),
                        ProfileMenuItem(
                          icon: Icons.location_on_outlined,
                          title: 'Address',
                          onTap: () => _showAddressBottomSheet(),
                          showBorder: true,
                        ),
                        ProfileMenuItem(
                          icon: Icons.account_balance_wallet_outlined,
                          title: 'Coupon',
                          onTap: () => Get.to(() => const CouponScreen()),
                          showBorder: false,
                        ),
                      ],
                    ),
                  ),
                  SizedBox(height: 16.h),
                  // Second Card - Rest of menu items
                  Container(
                    width: 380.w,
                    padding: EdgeInsets.symmetric(vertical: 16.h),
                    decoration: BoxDecoration(
                      color: R.color.deepTeal,
                      borderRadius: BorderRadius.circular(8.r),
                      boxShadow: [
                        BoxShadow(
                          color: Color(0x26000000),
                          blurRadius: 4,
                          offset: Offset(0, 0),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        ProfileMenuItem(
                          icon: Icons.lock_outline,
                          title: 'Change Password',
                          onTap: () => _showChangePasswordBottomSheet(),
                          showBorder: true,
                        ),
                        ProfileMenuItemWithValue(
                          icon: Icons.brightness_6_outlined,
                          title: 'Theme',
                          value: _isDarkMode ? 'Dark' : 'Light',
                          onTap: _toggleTheme,
                          showBorder: true,
                        ),
                        ProfileMenuItem(
                          icon: Icons.privacy_tip_outlined,
                          title: 'Privacy Policy',
                          onTap: () {},
                          showBorder: true,
                        ),
                        ProfileMenuItem(
                          icon: Icons.description_outlined,
                          title: 'Terms & condition',
                          onTap: () {},
                          showBorder: false,
                        ),
                      ],
                    ),
                  ),
                  SizedBox(height: 24.h),
                  // Logout Button
                  Obx(() => WButton(
                    onPressed: () => _handleLogout(),
                    label: 'Logout',
                    isLoading: _authController.isLoading.value,
                  )),
                  SizedBox(height: 120.h),
                ],
              ),
            ),
          ],
        ),
      );
      }),
    );
  }


  // Personal Information Bottom Sheet
  void _showPersonalInformationBottomSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (BuildContext context) => PersonalInformationBottomSheet(),
    );
  }

  // Address Bottom Sheet
  void _showAddressBottomSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (BuildContext context) => AddressBottomSheet(),
    );
  }

  // Change Password Bottom Sheet
  void _showChangePasswordBottomSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (BuildContext context) => ChangePasswordBottomSheet(),
    );
  }
}

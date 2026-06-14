import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:get/get.dart';
import 'package:ultrawash/app/assets.dart';
import 'package:ultrawash/app/resource.dart';
import 'package:ultrawash/feature/Add/UI/screen/add_screen.dart';
import 'package:ultrawash/feature/Chat%20Token/UI/Screen/chat_Token_List_screen.dart';
import 'package:ultrawash/feature/Home/ui/screen/home_screen.dart';
import 'package:ultrawash/feature/order/ui/screen/order_screen.dart';
import 'package:ultrawash/feature/profile/UI/screen/profile_screen.dart';

class BottomNavigation extends StatefulWidget {
  final int? selectedIndex;
  const BottomNavigation({super.key, this.selectedIndex});

  @override
  State<BottomNavigation> createState() => _BottomNavigationState();
}

class _BottomNavigationState extends State<BottomNavigation> {
  late final NavigationController controller;

  @override
  void initState() {
    super.initState();
    controller = Get.put(NavigationController());

    if (widget.selectedIndex != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        controller.selectedIndex.value = widget.selectedIndex!;
      });
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // This will be called when theme changes
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    // Get the current theme to force rebuild when it changes
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return SafeArea(
      // extendBody: true,
      child: Scaffold(
        bottomNavigationBar: Obx(
          () => Container(
            margin: EdgeInsets.only(left: 16.w, right: 16.w, bottom: 16.h),
            height: 88.h,
            padding: EdgeInsets.symmetric(vertical: 8.h, horizontal: 8.w),
            decoration: BoxDecoration(
              color: R.color.iceBlue,
              borderRadius: BorderRadius.circular(60.r),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                Expanded(child: _buildNavItem(Assets.home, "Home", 0, isDark)),
                Expanded(child: _buildNavItem(Assets.add, "Add", 1, isDark)),
                Expanded(child: _buildNavItem(Assets.order, "Orders", 2, isDark)),
                Expanded(child: _buildNavItem(Assets.chat, "Chat", 3, isDark)),
                Expanded(child: _buildNavItem(Assets.userS, "Profile", 4, isDark)),
              ],
            ),
          ),
        ),
        body: Obx(
          () => controller.screens[controller.selectedIndex.value],
        ),
      ),
    );
  }

  Widget _buildNavItem(String iconPath, String label, int index, bool isDark) {
    final isSelected = controller.selectedIndex.value == index;

    return GestureDetector(
      onTap: () {
        controller.selectedIndex.value = index;
      },
      child: Container(
        width: isSelected ? 80.w : 56.w,
        height: 72.h,
        decoration: isSelected
            ? BoxDecoration(
                color: R.color.oceanBlue,
                borderRadius: BorderRadius.circular(40.r),
              )
            : null,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            SvgPicture.asset(
              iconPath,
              width: 24.w,
              height: 24.h,
              colorFilter: ColorFilter.mode(
                isSelected ? R.color.white : R.color.coolGray,
                BlendMode.srcIn,
              ),
            ),
            SizedBox(height: 4.h),
            Text(
              label,
              style: TextStyle(
                fontSize: 10.sp,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                color: isSelected ? R.color.white : R.color.coolGray,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class NavigationController extends GetxController {
  final Rx<int> selectedIndex = 0.obs;
  final screens = [
    const HomeScreen(),
    const AddScreen(),
    const OrderScreen(),
    const ChatTokenListScreen(),
    const ProfileScreen(),
  ];
}

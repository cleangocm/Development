import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:ultrawash/app/assets.dart';
import 'package:ultrawash/app/resource.dart';
import 'package:ultrawash/app/wtext.dart';
import 'package:ultrawash/feature/Add/UI/controller/add_service_controller.dart';
import 'package:ultrawash/feature/auth/ui/controller/auth_controller.dart';
import 'package:ultrawash/feature/profile/UI/controller/profile_controller.dart';
import '../widget/home_service_card.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final PageController _pageController = PageController();
  final AddServiceControllers _serviceController = Get.find<AddServiceControllers>();
  final AuthController _authController = Get.find<AuthController>();
  final ProfileControllers _profileController = Get.find<ProfileControllers>();

  int _currentPage = 0;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    // Load services if not already loaded
    if (_serviceController.servicesData.value == null) {
      _serviceController.getAllServices();
    }
    // Load profile data if not already loaded
    if (_profileController.profileData.value == null) {
      _profileController.getProfile();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: R.color.background,
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Section
            Container(
              padding: EdgeInsets.only(left: 16.w, right: 16.w, top: 42.h, bottom: 24.h),
              decoration: BoxDecoration(
                color: R.color.header,
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(20.r),
                  bottomRight: Radius.circular(20.r),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      // Profile avatar
                      Obx(() {
                        final profileImage = _profileController.userProfileImage;
                        return Container(
                          width: 54.w,
                          height: 54.h,
                          decoration: BoxDecoration(
                            color: R.color.white,
                            borderRadius: BorderRadius.circular(16.r),
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(16.r),
                            child: profileImage != null && profileImage.isNotEmpty
                                ? Image.network(
                                    profileImage,
                                    width: 54.w,
                                    height: 54.h,
                                    fit: BoxFit.cover,
                                    errorBuilder: (context, error, stackTrace) {
                                      return Icon(
                                        Icons.person,
                                        size: 30.sp,
                                        color: R.color.header,
                                      );
                                    },
                                  )
                                : Image.network(
                                    'https://i.pravatar.cc/150?img=3',
                                    width: 54.w,
                                    height: 54.h,
                                    fit: BoxFit.cover,
                                    errorBuilder: (context, error, stackTrace) {
                                      return Icon(
                                        Icons.person,
                                        size: 30.sp,
                                        color: R.color.header,
                                      );
                                    },
                                  ),
                          ),
                        );
                      }),
                      SizedBox(width: 12.w),
                      Obx(() {
                        final userName = _profileController.userName;
                        final userEmail = _profileController.userEmail;
                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            WText(
                              text: userEmail.isNotEmpty ? userEmail : 'Hello',
                              fontSize: 12.sp,
                              fontWeight: FontWeight.w400,
                              color: R.color.white2,
                            ),
                            WText(
                              text: userName.isNotEmpty ? userName : 'User',
                              fontSize: 18.sp,
                              fontWeight: FontWeight.w600,
                              color: R.color.white2,
                            ),
                          ],
                        );
                      }),
                    ],
                  ),
                ],
              ),
            ),

            SizedBox(height: 16.h),

            // Promotional Banner Slider
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 16.w),
              child: Column(
                children: [
                  SizedBox(
                    width: 380.w,
                    height: 188.h,
                    child: PageView.builder(
                      controller: _pageController,
                      onPageChanged: (index) {
                        setState(() {
                          _currentPage = index;
                        });
                      },
                      itemCount: 3,
                      itemBuilder: (context, index) {
                        return ClipRRect(
                          borderRadius: BorderRadius.circular(16.r),
                          child: Image.asset(
                            Assets.Slider,
                            width: 380.w,
                            height: 188.h,
                            fit: BoxFit.cover,
                          ),
                        );
                      },
                    ),
                  ),
                  SizedBox(height: 8.h),
                  // Slider indicators
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(3, (index) {
                      return Container(
                        margin: EdgeInsets.symmetric(horizontal: 4.w),
                        width: _currentPage == index ? 24.w : 8.w,
                        height: 8.h,
                        decoration: BoxDecoration(
                          color: _currentPage == index
                              ? R.color.oceanBlue
                              : R.color.coolGray,
                          borderRadius: BorderRadius.circular(4.r),
                        ),
                      );
                    }),
                  ),
                ],
              ),
            ),

            SizedBox(height: 24.h),

            // Regular Services Section
            Obx(() {
              final regularServices = _serviceController.regularServices.toList();
              if (regularServices.isEmpty && _serviceController.isLoading.value) {
                return Padding(
                  padding: EdgeInsets.symmetric(horizontal: 16.w),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      WText(
                        text: 'Regular Services',
                        fontSize: 16.sp,
                        fontWeight: FontWeight.w600,
                        color: R.color.charcoal,
                      ),
                      SizedBox(height: 12.h),
                      Center(
                        child: CircularProgressIndicator(
                          color: R.color.oceanBlue,
                        ),
                      ),
                    ],
                  ),
                );
              }

              if (regularServices.isEmpty) {
                return SizedBox.shrink();
              }

              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16.w),
                    child: WText(
                      text: 'Regular Services',
                      fontSize: 16.sp,
                      fontWeight: FontWeight.w600,
                      color: R.color.charcoal,
                    ),
                  ),
                  SizedBox(height: 12.h),
                  ...regularServices.asMap().entries.map((entry) {
                    final index = entry.key;
                    final service = entry.value;
                    return HomeServiceCard(service: service, index: index);
                  }),
                ],
              );
            }),

            SizedBox(height: 24.h),

            // Special Services Section
            Obx(() {
              final specialServices = _serviceController.specialServices.toList();
              if (specialServices.isEmpty && _serviceController.isLoading.value) {
                return Padding(
                  padding: EdgeInsets.symmetric(horizontal: 16.w),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      WText(
                        text: 'Special Services',
                        fontSize: 16.sp,
                        fontWeight: FontWeight.w600,
                        color: R.color.charcoal,
                      ),
                      SizedBox(height: 12.h),
                      Center(
                        child: CircularProgressIndicator(
                          color: R.color.oceanBlue,
                        ),
                      ),
                    ],
                  ),
                );
              }

              if (specialServices.isEmpty) {
                return SizedBox.shrink();
              }

              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16.w),
                    child: WText(
                      text: 'Special Services',
                      fontSize: 16.sp,
                      fontWeight: FontWeight.w600,
                      color: R.color.charcoal,
                    ),
                  ),
                  SizedBox(height: 12.h),
                  ...specialServices.asMap().entries.map((entry) {
                    final index = entry.key;
                    final service = entry.value;
                    return HomeServiceCard(service: service, index: index);
                  }),
                ],
              );
            }),

            SizedBox(height: 100.h), // Space for bottom navigation
          ],
        ),
      ),
    );
  }
}

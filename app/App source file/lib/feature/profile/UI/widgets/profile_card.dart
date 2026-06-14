import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:ultrawash/app/assets.dart';
import 'package:ultrawash/app/resource.dart';
import 'package:ultrawash/app/wtext.dart';
import 'package:ultrawash/feature/order/ui/controller/order_controller.dart';
import 'package:ultrawash/feature/profile/UI/controller/profile_controller.dart';

class ProfileCard extends StatelessWidget {
  const ProfileCard({super.key});

  @override
  Widget build(BuildContext context) {
    final ProfileControllers profileController = Get.find<ProfileControllers>();
    final OrderControllers orderController = Get.find<OrderControllers>();

    return Obx(() {
      final isLoading = profileController.isLoading.value;
      final userName = profileController.userName;
      final userEmail = profileController.userEmail;
      final profileImage = profileController.userProfileImage;

      return Container(
        width: 380.w,
        height: 301.h,
        margin: EdgeInsets.symmetric(horizontal: 16.w),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            // ── Main Card ──────────────────────────────────────────────────
            Positioned(
              top: 40.h,
              left: 0,
              right: 0,
              child: Container(
                width: 380.w,
                height: 261.h,
                decoration: BoxDecoration(
                  color: R.color.oceanBlue,
                  borderRadius: BorderRadius.circular(32.r),
                ),
                child: Stack(
                  children: [
                    // Background vector image
                    Positioned(
                      bottom: 10,
                      right: 10,
                      child: ClipRRect(
                        borderRadius: BorderRadius.only(
                          bottomRight: Radius.circular(32.r),
                        ),
                        child: Image.asset(
                          Assets.profile_vector,
                          width: 189.w,
                          height: 158.h,
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),

                    // Profile content
                    Positioned.fill(
                      child: Padding(
                        padding: EdgeInsets.only(top: 50.h),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.start,
                          children: [
                            SizedBox(height: 12.h),

                            // Name
                            isLoading
                                ? Container(
                                    width: 150.w,
                                    height: 20.h,
                                    decoration: BoxDecoration(
                                      color: Colors.white24,
                                      borderRadius:
                                          BorderRadius.circular(4.r),
                                    ),
                                  )
                                : WText(
                                    text: userName,
                                    fontSize: 16.sp,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.white,
                                  ),
                            SizedBox(height: 4.h),

                            // Email
                            isLoading
                                ? Container(
                                    width: 200.w,
                                    height: 14.h,
                                    decoration: BoxDecoration(
                                      color: Colors.white24,
                                      borderRadius:
                                          BorderRadius.circular(4.r),
                                    ),
                                  )
                                : WText(
                                    text: userEmail,
                                    fontSize: 12.sp,
                                    fontWeight: FontWeight.w400,
                                    color: Colors.white70,
                                  ),
                            SizedBox(height: 20.h),

                            // Icons row
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.phone_outlined,
                                    color: Colors.white70, size: 16.sp),
                                SizedBox(width: 16.w),
                                Icon(Icons.email_outlined,
                                    color: Colors.white70, size: 16.sp),
                                SizedBox(width: 16.w),
                                Icon(Icons.location_on_outlined,
                                    color: Colors.white70, size: 16.sp),
                              ],
                            ),
                            SizedBox(height: 30.h),

                            // Stats row
                            Obx(() {
                              final orders =
                                  orderController.ordersData.value?.data ??
                                      [];
                              final ongoingCount = orders
                                  .where((o) =>
                                      o.status == 'pending' ||
                                      o.status == 'confirmed' ||
                                      o.status == 'processing' ||
                                      o.status == 'in_progress' ||
                                      o.status == 'picked_up' ||
                                      o.status == 'cleaning' ||
                                      o.status == 'cleaned' ||
                                      o.status == 'out_for_delivery')
                                  .length;
                              final completeCount = orders
                                  .where((o) => o.status == 'delivered')
                                  .length;

                              return Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  _statColumn('$ongoingCount', 'Ongoing Order'),
                                  SizedBox(width: 60.w),
                                  _statColumn(
                                      '$completeCount', 'Complete Order'),
                                ],
                              );
                            }),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // ── Profile Image (50% outside card) ──────────────────────────
            Positioned(
              top: -20,
              left: 0,
              right: 0,
              child: Center(
                child: Container(
                  key: ValueKey(profileImage ?? 'default'),
                  width: 113.w,
                  height: 113.h,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 3),
                  ),
                  child: ClipOval(
                    child: profileImage != null && profileImage.isNotEmpty
                        ? Image.network(
                            profileImage,
                            fit: BoxFit.cover,
                            width: 113.w,
                            height: 113.h,
                            errorBuilder: (_, __, ___) => Image.network(
                              'https://i.pravatar.cc/150?img=3',
                              fit: BoxFit.cover,
                              width: 113.w,
                              height: 113.h,
                            ),
                          )
                        : Image.network(
                            'https://i.pravatar.cc/150?img=3',
                            fit: BoxFit.cover,
                            width: 113.w,
                            height: 113.h,
                          ),
                  ),
                ),
              ),
            ),
          ],
        ),
      );
    });
  }

  Widget _statColumn(String count, String label) {
    return Column(
      children: [
        WText(
          text: count,
          fontSize: 20.sp,
          fontWeight: FontWeight.w700,
          color: Colors.white,
        ),
        SizedBox(height: 4.h),
        WText(
          text: label,
          fontSize: 10.sp,
          fontWeight: FontWeight.w400,
          color: Colors.white70,
        ),
      ],
    );
  }
}


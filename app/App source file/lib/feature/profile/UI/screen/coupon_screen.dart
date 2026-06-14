import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:ultrawash/app/resource.dart';
import 'package:ultrawash/app/wtext.dart';
import 'package:ultrawash/feature/profile/UI/controller/profile_controller.dart';
import 'package:ultrawash/feature/profile/model/coupon_model.dart';
import '../widgets/coupon_card.dart';
class CouponScreen extends StatefulWidget {
  const CouponScreen({super.key});
  @override
  State<CouponScreen> createState() => _CouponScreenState();
}
class _CouponScreenState extends State<CouponScreen> {
  final ProfileControllers _profileController = Get.find<ProfileControllers>();
  String _selectedTab = 'Available';
  @override
  void initState() {
    super.initState();
    _profileController.getActiveCoupons();
  }
  List<Data> _getFilteredCoupons() {
    final coupons = _profileController.allCoupons;
    final now = DateTime.now();
    switch (_selectedTab) {
      case 'Available':
        return coupons.where((c) {
          final isActive = c.isActive ?? false;
          if (!isActive) return false;
          if (c.expiryDate != null) {
            try {
              final expiry = DateTime.parse(c.expiryDate!);
              return expiry.isAfter(now);
            } catch (e) {
              return true;
            }
          }
          return true;
        }).toList();
      case 'Used':
        return coupons.where((c) {
          return (c.usedCount ?? 0) >= (c.usageLimit ?? 999999);
        }).toList();
      case 'Expired':
        return coupons.where((c) {
          if (c.expiryDate != null) {
            try {
              final expiry = DateTime.parse(c.expiryDate!);
              return expiry.isBefore(now);
            } catch (e) {
              return false;
            }
          }
          return !(c.isActive ?? true);
        }).toList();
      default:
        return coupons;
    }
  }
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: R.color.background,
      body: Column(
        children: [
          // Header
          Container(
            width: double.infinity,
            padding: EdgeInsets.only(
              top: MediaQuery.of(context).padding.top + 16.h,
              left: 16.w,
              right: 16.w,
              bottom: 16.h,
            ),
            decoration: BoxDecoration(
              color: R.color.iceBlue,
              borderRadius: BorderRadius.only(
                bottomLeft: Radius.circular(16.r),
                bottomRight: Radius.circular(16.r),
              ),
            ),
            child: Row(
              children: [
                GestureDetector(
                  onTap: () => Get.back(),
                  child: Icon(
                    Icons.arrow_back_ios,
                    color: R.color.charcoal,
                    size: 20.sp,
                  ),
                ),
                SizedBox(width: 8.w),
                WText(
                  text: 'Coupons',
                  fontSize: 16.sp,
                  fontWeight: FontWeight.w600,
                  color: R.color.charcoal,
                ),
              ],
            ),
          ),
          // Tab Bar
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 12.h),
            child: Row(
              children: [
                _buildTab('Available', Icons.local_offer_outlined),
                SizedBox(width: 16.w),
                _buildTab('Used', Icons.check),
                SizedBox(width: 16.w),
                _buildTab('Expired', Icons.access_time),
              ],
            ),
          ),
          // Coupon List
          Expanded(
            child: Obx(() {
              if (_profileController.isLoadingCoupons.value) {
                return Center(
                  child: CircularProgressIndicator(
                    color: R.color.oceanBlue,
                  ),
                );
              }
              final coupons = _getFilteredCoupons();
              if (coupons.isEmpty) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.local_offer_outlined,
                        size: 48.sp,
                        color: Colors.grey,
                      ),
                      SizedBox(height: 12.h),
                      WText(
                        text: 'No $_selectedTab coupons',
                        fontSize: 14.sp,
                        color: Colors.grey,
                      ),
                    ],
                  ),
                );
              }
              return RefreshIndicator(
                onRefresh: () => _profileController.getActiveCoupons(),
                color: R.color.oceanBlue,
                child: ListView.builder(
                  padding: EdgeInsets.symmetric(horizontal: 16.w),
                  itemCount: coupons.length,
                  itemBuilder: (context, index) {
                    return CouponCard(coupon: coupons[index]);
                  },
                ),
              );
            }),
          ),
        ],
      ),
    );
  }
  Widget _buildTab(String label, IconData icon) {
    final isSelected = _selectedTab == label;
    return GestureDetector(
      onTap: () => setState(() => _selectedTab = label),
      child: Row(
        children: [
          Icon(
            icon,
            size: 14.sp,
            color: isSelected ? R.color.oceanBlue : R.color.coolGray2,
          ),
          SizedBox(width: 4.w),
          WText(
            text: label,
            fontSize: 12.sp,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
            color: isSelected ? R.color.oceanBlue : R.color.coolGray2,
          ),
        ],
      ),
    );
  }
}

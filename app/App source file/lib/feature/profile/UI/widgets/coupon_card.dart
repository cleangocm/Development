import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:ultrawash/app/resource.dart';
import 'package:ultrawash/app/wtext.dart';
import 'package:ultrawash/feature/profile/model/coupon_model.dart';

class CouponCard extends StatelessWidget {
  final Data coupon;

  const CouponCard({super.key, required this.coupon});

  String _formatDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return 'N/A';
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('MMM dd, yyyy').format(date);
    } catch (e) {
      return dateStr;
    }
  }

  @override
  Widget build(BuildContext context) {
    final discountType = coupon.discountType ?? 'percentage';
    final discountValue = coupon.discountValue ?? 0;
    final isActive = coupon.isActive ?? false;
    final code = coupon.code ?? '';
    final usedCount = coupon.usedCount ?? 0;
    final usageLimit = coupon.usageLimit ?? 0;

    final String discountDisplay;
    const String discountSuffix = 'OFF';
    if (discountType == 'percentage') {
      discountDisplay = '$discountValue%';
    } else {
      final maxDiscount = coupon.maxDiscount ?? discountValue;
      discountDisplay = '\$$maxDiscount';
    }

    return Container(
      margin: EdgeInsets.only(bottom: 12.h),
      decoration: BoxDecoration(
        color: R.color.deepTeal,
        borderRadius: BorderRadius.circular(12.r),
        boxShadow: [
          BoxShadow(
            color: const Color(0x1A000000),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: IntrinsicHeight(
        child: Row(
          children: [
            // ── Left: Discount Badge ─────────────────────────────────────────
            Container(
              width: 80.w,
              padding: EdgeInsets.symmetric(vertical: 16.h),
              decoration: BoxDecoration(
                border: Border(
                  right: BorderSide(
                    color: R.color.oceanBlue.withValues(alpha: 0.2),
                    width: 1,
                  ),
                ),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  WText(
                    text: '%',
                    fontSize: 14.sp,
                    fontWeight: FontWeight.w400,
                    color: R.color.oceanBlue,
                  ),
                  SizedBox(height: 2.h),
                  WText(
                    text: discountDisplay,
                    fontSize: 20.sp,
                    fontWeight: FontWeight.w700,
                    color: R.color.oceanBlue,
                  ),
                  WText(
                    text: discountSuffix,
                    fontSize: 10.sp,
                    fontWeight: FontWeight.w400,
                    color: R.color.oceanBlue,
                  ),
                ],
              ),
            ),

            // ── Right: Details ───────────────────────────────────────────────
            Expanded(
              child: Padding(
                padding: EdgeInsets.all(12.w),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title + Active badge
                    Row(
                      children: [
                        Expanded(
                          child: WText(
                            text: coupon.title ?? '',
                            fontSize: 14.sp,
                            fontWeight: FontWeight.w700,
                            color: R.color.charcoal,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (isActive)
                          Container(
                            padding: EdgeInsets.symmetric(
                              horizontal: 8.w,
                              vertical: 3.h,
                            ),
                            decoration: BoxDecoration(
                              color: R.color.oceanBlue,
                              borderRadius: BorderRadius.circular(10.r),
                            ),
                            child: WText(
                              text: 'Active',
                              fontSize: 9.sp,
                              fontWeight: FontWeight.w500,
                              color: Colors.white,
                            ),
                          ),
                      ],
                    ),
                    SizedBox(height: 4.h),

                    // Description
                    WText(
                      text: coupon.description ?? '',
                      fontSize: 10.sp,
                      fontWeight: FontWeight.w400,
                      color: R.color.slateBlueGrey,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    SizedBox(height: 6.h),

                    // Min order · Max discount · Expiry
                    Row(
                      children: [
                        Icon(
                          Icons.shopping_bag_outlined,
                          size: 10.sp,
                          color: R.color.coolGray2,
                        ),
                        SizedBox(width: 2.w),
                        WText(
                          text: 'Min. order: \$${coupon.minOrderValue ?? 0}',
                          fontSize: 9.sp,
                          fontWeight: FontWeight.w400,
                          color: R.color.coolGray2,
                        ),
                        SizedBox(width: 8.w),
                        WText(
                          text: 'Max discount: \$${coupon.maxDiscount ?? 0}',
                          fontSize: 9.sp,
                          fontWeight: FontWeight.w400,
                          color: R.color.coolGray2,
                        ),
                        SizedBox(width: 8.w),
                        Icon(
                          Icons.calendar_today_outlined,
                          size: 10.sp,
                          color: R.color.coolGray2,
                        ),
                        SizedBox(width: 2.w),
                        Flexible(
                          child: WText(
                            text: 'Expires: ${_formatDate(coupon.expiryDate)}',
                            fontSize: 9.sp,
                            fontWeight: FontWeight.w400,
                            color: R.color.coolGray2,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 8.h),

                    // Code + Copy button
                    Row(
                      children: [
                        Container(
                          padding: EdgeInsets.symmetric(
                            horizontal: 10.w,
                            vertical: 5.h,
                          ),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(4.r),
                            border: Border.all(
                              color: R.color.oceanBlue,
                              width: 1,
                            ),
                          ),
                          child: WText(
                            text: code,
                            fontSize: 11.sp,
                            fontWeight: FontWeight.w700,
                            color: R.color.charcoal,
                          ),
                        ),
                        SizedBox(width: 8.w),
                        GestureDetector(
                          onTap: () {
                            Clipboard.setData(ClipboardData(text: code));
                            Get.snackbar(
                              'Copied!',
                              'Coupon code "$code" copied to clipboard',
                              snackPosition: SnackPosition.BOTTOM,
                              backgroundColor: R.color.oceanBlue,
                              colorText: Colors.white,
                              duration: const Duration(seconds: 2),
                            );
                          },
                          child: Row(
                            children: [
                              Icon(
                                Icons.copy,
                                size: 14.sp,
                                color: R.color.oceanBlue,
                              ),
                              SizedBox(width: 4.w),
                              WText(
                                text: 'Copy',
                                fontSize: 11.sp,
                                fontWeight: FontWeight.w500,
                                color: R.color.oceanBlue,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 6.h),

                    // Usage count
                    WText(
                      text: 'Used $usedCount/$usageLimit',
                      fontSize: 9.sp,
                      fontWeight: FontWeight.w400,
                      color: R.color.oceanBlue,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}


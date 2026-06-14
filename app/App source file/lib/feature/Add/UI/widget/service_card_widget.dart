import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:ultrawash/app/resource.dart';
import 'package:ultrawash/app/wtext.dart';
import 'package:ultrawash/feature/Add/model/add_service_model.dart';

class ServiceCardWidget extends StatelessWidget {
  final Data service;
  final List<Color> gradientColors;
  final VoidCallback onTap;

  const ServiceCardWidget({
    super.key,
    required this.service,
    required this.gradientColors,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final priceText = service.pricingType == 'per_kg'
        ? '\$${service.pricePerKg ?? 0}/kg'
        : '\$${service.pricePerItem ?? 0}/item';

    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 182.w,
        height: 177.h,
        padding: EdgeInsets.all(8.w),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: gradientColors,
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
          borderRadius: BorderRadius.circular(8.r),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Service Image
            Center(
              child: service.image != null && service.image!.isNotEmpty
                  ? Image.network(
                      service.image!,
                      width: 80.w,
                      height: 80.h,
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) {
                        return _buildPlaceholderImage();
                      },
                    )
                  : _buildPlaceholderImage(),
            ),
            SizedBox(height: 8.h),
            // Service Title
            WText(
              text: service.name ?? 'Service',
              fontSize: 14.sp,
              fontWeight: FontWeight.w600,
              color: R.color.charcoal,
            ),
            SizedBox(height: 4.h),
            // Service Price
            WText(
              text: priceText,
              fontSize: 12.sp,
              fontWeight: FontWeight.w400,
              color: R.color.slateBlueGrey,
            ),
            Spacer(),
            // Add Button
            Align(
              alignment: Alignment.bottomRight,
              child: Container(
                width: 24.w,
                height: 24.h,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: R.color.midnightBlue,
                    width: 1,
                  ),
                ),
                child: Center(
                  child: SizedBox(
                    width: 19.w,
                    height: 19.h,
                    child: Icon(
                      Icons.add,
                      size: 19.sp,
                      color: R.color.midnightBlue,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlaceholderImage() {
    return Container(
      width: 80.w,
      height: 80.h,
      decoration: BoxDecoration(
        color: R.color.white2.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(8.r),
      ),
      child: Icon(
        Icons.local_laundry_service,
        size: 40.sp,
        color: R.color.charcoal,
      ),
    );
  }
}


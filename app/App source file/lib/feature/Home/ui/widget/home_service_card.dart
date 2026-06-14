import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:ultrawash/app/resource.dart';
import 'package:ultrawash/app/wtext.dart';
import 'package:ultrawash/feature/Add/model/add_service_model.dart';
import 'package:ultrawash/feature/Cloth type/UI/screen/Select_Cloth_type_screen.dart';

class HomeServiceCard extends StatelessWidget {
  final Data service;
  final int index;

  static const List<String> _gradientKeys = [
    'lightSkyBlue',
    'lavender',
    'paleBlue',
    'creamYellow',
  ];

  const HomeServiceCard({
    super.key,
    required this.service,
    required this.index,
  });

  List<Color> _getGradientColors(String gradient) {
    switch (gradient) {
      case 'lightSkyBlue':
        return R.color.lightSkyBlue;
      case 'lavender':
        return R.color.lavender;
      case 'paleBlue':
        return R.color.paleBlue;
      case 'creamYellow':
        return R.color.creamYellow;
      default:
        return R.color.lightSkyBlue;
    }
  }

  String get _gradientKey => _gradientKeys[index % _gradientKeys.length];

  String get _priceText => service.pricingType == 'per_kg'
      ? '\$${service.pricePerKg?.toStringAsFixed(0) ?? 0}/kg'
      : '\$${service.pricePerItem?.toStringAsFixed(0) ?? 0}/item';

  @override
  Widget build(BuildContext context) {
    final colors = _getGradientColors(_gradientKey);

    return GestureDetector(
      onTap: () => Get.to(() => SelectClothTypeScreen(
            serviceSlug: service.slug ?? '',
          )),
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 8.h),
        child: Container(
          width: 380.w,
          height: 112.h,
          padding: EdgeInsets.all(16.w),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: colors,
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
            ),
            borderRadius: BorderRadius.circular(16.r),
          ),
          child: Row(
            children: [
              // Service image: 80x80
              SizedBox(
                width: 80.w,
                height: 80.h,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12.r),
                  child: service.image != null && service.image!.isNotEmpty
                      ? Image.network(
                          service.image!,
                          width: 80.w,
                          height: 80.h,
                          fit: BoxFit.contain,
                          errorBuilder: (_, __, ___) => Icon(
                            Icons.local_laundry_service,
                            size: 40.sp,
                            color: colors[1],
                          ),
                        )
                      : Icon(
                          Icons.local_laundry_service,
                          size: 40.sp,
                          color: colors[1],
                        ),
                ),
              ),
              SizedBox(width: 32.w),
              // Name and price
              Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    WText(
                      text: service.name ?? 'Service',
                      fontSize: 14.sp,
                      fontWeight: FontWeight.w600,
                      color: R.color.primaryText,
                    ),
                    SizedBox(height: 4.h),
                    WText(
                      text: _priceText,
                      fontSize: 12.sp,
                      fontWeight: FontWeight.w400,
                      color: R.color.secondaryText,
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.arrow_circle_right_outlined,
                size: 24.sp,
                color: R.color.primaryText,
              ),
            ],
          ),
        ),
      ),
    );
  }
}


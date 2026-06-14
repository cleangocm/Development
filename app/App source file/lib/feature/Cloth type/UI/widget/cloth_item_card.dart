import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:ultrawash/app/resource.dart';
import 'package:ultrawash/app/wtext.dart';
import 'package:ultrawash/feature/Add/model/AddServiceSlagModel.dart' as slug_model;

class ClothItemCard extends StatelessWidget {
  final slug_model.Items item;
  final int index;
  final int quantity;
  final VoidCallback onAdd;
  final VoidCallback onIncrease;
  final VoidCallback onDecrease;

  static const List<String> _gradientKeys = [
    'creamYellow',
    'lightSkyBlue',
    'lavender',
    'paleBlue',
  ];

  const ClothItemCard({
    super.key,
    required this.item,
    required this.index,
    required this.quantity,
    required this.onAdd,
    required this.onIncrease,
    required this.onDecrease,
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

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 182.w,
      height: 136.h,
      padding: EdgeInsets.all(8.w),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: _getGradientColors(_gradientKey),
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
        borderRadius: BorderRadius.circular(8.r),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image and Text Row
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Image
              item.image != null && item.image!.isNotEmpty
                  ? Image.network(
                      item.image!,
                      width: 60.w,
                      height: 60.h,
                      fit: BoxFit.contain,
                      errorBuilder: (_, __, ___) => _buildPlaceholderImage(),
                    )
                  : _buildPlaceholderImage(),
              SizedBox(width: 8.w),
              // Name and Price
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    WText(
                      text: item.name ?? 'Item',
                      fontSize: 12.sp,
                      fontWeight: FontWeight.w500,
                      color: R.color.charcoal1,
                    ),
                    SizedBox(height: 4.h),
                    WText(
                      text: '\$${item.price ?? 0}',
                      fontSize: 11.sp,
                      fontWeight: FontWeight.w400,
                      color: R.color.charcoal1,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const Spacer(),
          // Add button or Quantity controls
          quantity == 0
              ? _buildAddButton()
              : _buildQuantityControls(),
        ],
      ),
    );
  }

  Widget _buildAddButton() {
    return Center(
      child: GestureDetector(
        onTap: onAdd,
        child: Container(
          padding: EdgeInsets.symmetric(horizontal: 24.w, vertical: 6.h),
          decoration: BoxDecoration(
            color: R.color.oceanBlue,
            borderRadius: BorderRadius.circular(16.r),
          ),
          child: WText(
            text: 'Add',
            fontSize: 12.sp,
            fontWeight: FontWeight.w600,
            color: R.color.white2,
          ),
        ),
      ),
    );
  }

  Widget _buildQuantityControls() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        // Minus button
        GestureDetector(
          onTap: onDecrease,
          child: Container(
            width: 24.w,
            height: 24.h,
            decoration: BoxDecoration(
              border: Border.all(color: R.color.charcoal, width: 1.5),
              borderRadius: BorderRadius.circular(4.r),
            ),
            child: Icon(Icons.remove, size: 16.sp, color: R.color.charcoal),
          ),
        ),
        SizedBox(width: 16.w),
        // Quantity
        WText(
          text: quantity.toString(),
          fontSize: 16.sp,
          fontWeight: FontWeight.w700,
          color: R.color.charcoal,
        ),
        SizedBox(width: 16.w),
        // Plus button
        GestureDetector(
          onTap: onIncrease,
          child: Container(
            width: 24.w,
            height: 24.h,
            decoration: BoxDecoration(
              border: Border.all(color: R.color.charcoal, width: 1.5),
              borderRadius: BorderRadius.circular(4.r),
            ),
            child: Icon(Icons.add, size: 16.sp, color: R.color.charcoal),
          ),
        ),
      ],
    );
  }

  Widget _buildPlaceholderImage() {
    return Container(
      width: 60.w,
      height: 60.h,
      decoration: BoxDecoration(
        color: R.color.white2.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(8.r),
      ),
      child: Icon(Icons.checkroom, size: 30.sp, color: R.color.charcoal),
    );
  }
}


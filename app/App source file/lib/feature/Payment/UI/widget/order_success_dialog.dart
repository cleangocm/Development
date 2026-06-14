import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:ultrawash/app/widget_button.dart';
import 'package:ultrawash/app/wtext.dart';
import 'package:ultrawash/feature/bottomNavigation.dart';

class OrderSuccessDialog extends StatelessWidget {
  final Map<String, dynamic> orderData;
  final double totalAmount;

  const OrderSuccessDialog({
    super.key,
    required this.orderData,
    required this.totalAmount,
  });

  static void show({
    required BuildContext context,
    required Map<String, dynamic> orderData,
    required double totalAmount,
  }) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => OrderSuccessDialog(
        orderData: orderData,
        totalAmount: totalAmount,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16.r),
      ),
      child: Container(
        width: 324.w,
        padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 32.h),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16.r),
          boxShadow: const [
            BoxShadow(
              color: Color(0x33000000),
              blurRadius: 4,
              offset: Offset(0, 0),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.check_circle,
              color: const Color(0xFF0F7BA0),
              size: 64.sp,
            ),
            SizedBox(height: 16.h),
            WText(
              text: 'Order Placed!',
              fontSize: 20.sp,
              fontWeight: FontWeight.w700,
              color: const Color(0xFF333333),
            ),
            SizedBox(height: 8.h),
            WText(
              text:
                  'Order ID: ${orderData['orderId'] ?? orderData['_id'] ?? 'N/A'}',
              fontSize: 14.sp,
              fontWeight: FontWeight.w500,
              color: const Color(0xFF666666),
            ),
            SizedBox(height: 4.h),
            WText(
              text: 'Total: \$${totalAmount.toStringAsFixed(2)}',
              fontSize: 14.sp,
              fontWeight: FontWeight.w500,
              color: const Color(0xFF0F7BA0),
            ),
            SizedBox(height: 24.h),
            WButton(
              onPressed: () {
                Navigator.pop(context);
                Get.offAll(() => BottomNavigation());
              },
              label: 'Go to Home',
              height: 48.h,
              radius: 8.r,
              decorationType: DecorationType.solid,
              buttonColor: const Color(0xFF0A2647),
              textColor: Colors.white,
            ),
          ],
        ),
      ),
    );
  }
}

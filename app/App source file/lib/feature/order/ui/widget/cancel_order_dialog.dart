import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:ultrawash/app/resource.dart';
import 'package:ultrawash/app/widget_button.dart';
import 'package:ultrawash/app/wtext.dart';
import 'package:ultrawash/feature/order/ui/controller/order_controller.dart';

class CancelOrderDialog extends StatelessWidget {
  final String orderSId;
  final OrderControllers orderController;

  const CancelOrderDialog({
    super.key,
    required this.orderSId,
    required this.orderController,
  });

  static void show({
    required BuildContext context,
    required String orderSId,
    required OrderControllers orderController,
  }) {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (_) => CancelOrderDialog(
        orderSId: orderSId,
        orderController: orderController,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: R.color.background,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16.r),
      ),
      child: Container(
        padding: EdgeInsets.all(24.w),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Warning icon
            Container(
              width: 48.w,
              height: 48.h,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: R.color.crimsonRed,
                  width: 2,
                ),
              ),
              child: Icon(
                Icons.info_outline,
                color: R.color.crimsonRed,
                size: 28.sp,
              ),
            ),
            SizedBox(height: 16.h),
            WText(
              text: 'Do you want to cancel Order?',
              color: R.color.charcoal,
              textAlign: TextAlign.center,
            ),
            SizedBox(height: 24.h),
            Row(
              children: [
                Expanded(
                  child: WButton(
                    onPressed: () => Navigator.pop(context),
                    label: 'Cancel',
                    decorationType: DecorationType.stroke,
                    textColor: R.color.deepNavyBlue2,
                    buttonColor: R.color.deepNavyBlue2,
                  ),
                ),
                SizedBox(width: 12.w),
                Expanded(
                  child: Obx(() => WButton(
                        onPressed: () async {
                          final success =
                              await orderController.cancelOrder(orderSId);
                          if (success) {
                            Navigator.pop(context);
                          }
                        },
                        label: 'Confirm',
                        isLoading: orderController.isCancelling.value,
                        decorationType: DecorationType.solid,
                        buttonColor: R.color.crimsonRed,
                        textColor: R.color.white2,
                      )),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}


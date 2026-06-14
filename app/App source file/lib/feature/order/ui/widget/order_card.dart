import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:ultrawash/app/resource.dart';
import 'package:ultrawash/app/widget_button.dart';
import 'package:ultrawash/app/wtext.dart';
import 'package:ultrawash/feature/order/model/order_model.dart';
import 'package:ultrawash/feature/order/ui/controller/order_controller.dart';
import './cancel_order_dialog.dart';
import 'package:ultrawash/feature/track order/ui/screen/track_order.dart';

class OrderCard extends StatelessWidget {
  final Data order;
  final OrderControllers orderController;

  const OrderCard({
    super.key,
    required this.order,
    required this.orderController,
  });

  String _formatDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return 'N/A';
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('dd MMM yyyy').format(date);
    } catch (e) {
      return dateStr;
    }
  }

  bool _isOngoing(String status) {
    final s = status.toLowerCase();
    return s == 'pending' ||
        s == 'confirmed' ||
        s == 'picked_up' ||
        s == 'in_progress' ||
        s == 'ongoing';
  }

  String _getDisplayStatus(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Pending';
      case 'confirmed':
        return 'Confirmed';
      case 'picked_up':
        return 'Picked Up';
      case 'in_progress':
        return 'In Progress';
      case 'ongoing':
        return 'Ongoing';
      case 'completed':
      case 'complete':
        return 'Complete';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
      case 'canceled':
        return 'Canceled';
      default:
        return status;
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'confirmed':
      case 'picked_up':
      case 'in_progress':
      case 'ongoing':
        return R.color.mintGreen2;
      case 'cancelled':
      case 'canceled':
        return const Color(0xFFED9495);
      case 'completed':
      case 'complete':
      case 'delivered':
        return R.color.oceanBlue;
      default:
        return R.color.mintGreen2;
    }
  }

  @override
  Widget build(BuildContext context) {
    final status = order.status ?? 'pending';
    final displayStatus = _getDisplayStatus(status);
    final statusColor = _getStatusColor(status);
    final itemsSummary = order.itemsSummary ??
        '${order.itemCount ?? order.items?.length ?? 0} items ordered';

    return Container(
      margin: EdgeInsets.only(bottom: 16.h),
      padding: EdgeInsets.all(16.w),
      decoration: BoxDecoration(
        color: R.color.deepTeal,
        borderRadius: BorderRadius.circular(12.r),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Status Badge
          Container(
            padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 5.h),
            decoration: BoxDecoration(
              color: statusColor,
              borderRadius: BorderRadius.circular(10.r),
            ),
            child: WText(
              text: displayStatus,
              fontSize: 12.sp,
              fontWeight: FontWeight.w500,
              color: R.color.white2,
            ),
          ),
          SizedBox(height: 12.h),
          // Order Description
          WText(
            text: itemsSummary,
            fontSize: 14.sp,
            fontWeight: FontWeight.w600,
            color: R.color.charcoal,
          ),
          SizedBox(height: 16.h),
          // Order ID label
          WText(
            text: 'Order ID',
            fontSize: 12.sp,
            fontWeight: FontWeight.w400,
            color: R.color.slateBlueGrey,
          ),
          SizedBox(height: 4.h),
          WText(
            text: order.orderId ?? 'N/A',
            fontSize: 14.sp,
            fontWeight: FontWeight.w500,
            color: R.color.charcoal,
          ),
          SizedBox(height: 12.h),
          // Dates Row
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    WText(
                      text: 'Order Date',
                      color: R.color.slateBlueGrey,
                    ),
                    SizedBox(height: 4.h),
                    WText(
                      text: _formatDate(order.orderDate ?? order.createdAt),
                      fontSize: 14.sp,
                      fontWeight: FontWeight.w500,
                      color: R.color.charcoal,
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    WText(
                      text: 'Approximate Delivery Date',
                      color: R.color.slateBlueGrey,
                    ),
                    SizedBox(height: 4.h),
                    WText(
                      text: _formatDate(order.deliveryDate),
                      fontSize: 14.sp,
                      fontWeight: FontWeight.w500,
                      color: R.color.charcoal,
                    ),
                  ],
                ),
              ),
            ],
          ),
          SizedBox(height: 12.h),
          Divider(color: R.color.paleBlue2, height: 1),
          SizedBox(height: 12.h),
          // Payment Row
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    WText(
                      text: 'Discount',
                      color: R.color.slateBlueGrey,
                    ),
                    SizedBox(height: 4.h),
                    WText(
                      text: '\$${(order.discount ?? 0).toStringAsFixed(2)}',
                      fontSize: 14.sp,
                      fontWeight: FontWeight.w500,
                      color: R.color.charcoal,
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    WText(
                      text: 'Total Payment',
                      color: R.color.slateBlueGrey,
                    ),
                    SizedBox(height: 4.h),
                    WText(
                      text:
                          '\$${(order.totalPayment ?? 0).toStringAsFixed(2)}',
                      fontSize: 14.sp,
                      fontWeight: FontWeight.w600,
                      color: R.color.charcoal,
                    ),
                  ],
                ),
              ),
            ],
          ),
          SizedBox(height: 16.h),
          // Action Buttons
          if (_isOngoing(status))
            Row(
              children: [
                Expanded(
                  child: WButton(
                    onPressed: () => CancelOrderDialog.show(
                      context: context,
                      orderSId: order.sId ?? '',
                      orderController: orderController,
                    ),
                    label: 'Cancel',
                    height: 48.h,
                    radius: 8.r,
                    decorationType: DecorationType.stroke,
                    textColor: R.color.deepNavyBlue2,
                    buttonColor: R.color.deepNavyBlue2,
                    fontSize: 14.sp,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                SizedBox(width: 12.w),
                Expanded(
                  child: WButton(
                    onPressed: () => Get.to(() => TrackOrderScreen(
                          id: order.sId ?? '',
                          orderId: order.orderId ?? '',
                        )),
                    label: 'Track Order',
                    height: 48.h,
                    radius: 8.r,
                    decorationType: DecorationType.solid,
                    buttonColor: R.color.deepNavyBlue2,
                    textColor: R.color.white2,
                    fontSize: 14.sp,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            )
          else
            WButton(
              onPressed: () => Get.to(() => TrackOrderScreen(
                    id: order.sId ?? '',
                    orderId: order.orderId ?? '',
                  )),
              label: 'Track Order',
              height: 48.h,
              radius: 8.r,
              decorationType: DecorationType.solid,
              buttonColor: R.color.deepNavyBlue2,
              textColor: R.color.white2,
              fontSize: 14.sp,
              fontWeight: FontWeight.w600,
            ),
        ],
      ),
    );
  }
}


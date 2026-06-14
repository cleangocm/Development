import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:ultrawash/app/resource.dart';
import 'package:ultrawash/app/wtext.dart';
import 'package:ultrawash/feature/order/model/each_order_model.dart' as each;
import 'package:ultrawash/feature/order/ui/controller/order_controller.dart';
import 'package:ultrawash/feature/track order/ui/widget/expandable_order_section.dart';
import 'package:ultrawash/feature/track order/ui/widget/tracking_timeline_widget.dart';

class TrackOrderScreen extends StatefulWidget {
  final String id;
  final String orderId;

  const TrackOrderScreen({
    super.key,
    required this.id,
    this.orderId = '',
  });

  @override
  State<TrackOrderScreen> createState() => _TrackOrderScreenState();
}

class _TrackOrderScreenState extends State<TrackOrderScreen> {
  final OrderControllers _orderController = Get.find<OrderControllers>();

  @override
  void initState() {
    super.initState();
    _orderController.getOrderById(widget.id);
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return 'N/A';
    try {
      // Try ISO format first
      final date = DateTime.parse(dateStr);
      return DateFormat('dd MMM yyyy').format(date);
    } catch (e) {
      // Already formatted (e.g. "Feb 19, 2026") - return as is
      return dateStr;
    }
  }

  // Group items by service name (e.g. "Wash & Fold - Shirt" -> group by "Wash & Fold")
  List<Map<String, dynamic>> _groupItemsByService(List<each.Items> items) {
    final Map<String, List<each.Items>> grouped = {};

    for (var item in items) {
      final serviceName = item.serviceName ?? '';
      // Try to extract service category (before " - ")
      final parts = serviceName.split(' - ');
      final category = parts.isNotEmpty ? parts[0].trim() : serviceName;

      if (!grouped.containsKey(category)) {
        grouped[category] = [];
      }
      grouped[category]!.add(item);
    }

    return grouped.entries.map((entry) {
      final totalQty = entry.value.fold<int>(0, (sum, item) => sum + (item.quantity ?? 0));
      return {
        'title': '${entry.key} ($totalQty)',
        'items': entry.value,
      };
    }).toList();
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
              bottom: 16.h,
              left: 16.w,
              right: 16.w,
            ),
            decoration: BoxDecoration(
              color: R.color.iceBlue2,
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
                    size: 18.sp,
                  ),
                ),
                SizedBox(width: 8.w),
                Expanded(
                  child: Obx(() {
                    final order = _orderController.orderDetail.value?.data;
                    final displayId = order?.orderId ?? widget.orderId;
                    return WText(
                      text: 'Tracking $displayId',
                      color: R.color.charcoal,
                    );
                  }),
                ),
              ],
            ),
          ),
          // Content
          Expanded(
            child: Obx(() {
              if (_orderController.isLoadingDetail.value) {
                return Center(
                  child: CircularProgressIndicator(
                    color: R.color.oceanBlue,
                  ),
                );
              }

              final order = _orderController.orderDetail.value?.data;

              if (order == null) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.error_outline,
                        size: 48.sp,
                        color: Colors.grey,
                      ),
                      SizedBox(height: 12.h),
                      WText(
                        text: 'Order not found',
                        fontSize: 14.sp,
                        color: Colors.grey,
                      ),
                    ],
                  ),
                );
              }

              final trackingSteps = order.trackingSteps ?? [];
              final items = order.items ?? [];
              final groupedItems = _groupItemsByService(items);

              return SingleChildScrollView(
                padding: EdgeInsets.all(16.w),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Tracking Timeline
                    TrackingTimelineWidget(steps: trackingSteps),
                    SizedBox(height: 24.h),
                    // Order Detail Section
                    WText(
                      text: 'Order Detail',
                      color: R.color.charcoal,
                    ),
                    SizedBox(height: 12.h),
                    // Order Description
                    WText(
                      text: order.itemsSummary ??
                          '${order.itemCount ?? items.length} items ordered',
                      fontSize: 14.sp,
                      fontWeight: FontWeight.w600,
                      color: R.color.charcoal,
                    ),
                    SizedBox(height: 16.h),
                    // Order ID
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
                                fontSize: 12.sp,
                                fontWeight: FontWeight.w400,
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
                                fontSize: 12.sp,
                                fontWeight: FontWeight.w400,
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
                    // Payment Row
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              WText(
                                text: 'Discount',
                                fontSize: 12.sp,
                                fontWeight: FontWeight.w400,
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
                                fontSize: 12.sp,
                                fontWeight: FontWeight.w400,
                                color: R.color.slateBlueGrey,
                              ),
                              SizedBox(height: 4.h),
                              WText(
                                text: '\$${(order.totalPayment ?? 0).toStringAsFixed(2)}',
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
                    // Divider
                    Divider(color: Colors.grey.shade200, height: 1),
                    SizedBox(height: 8.h),
                    // Expandable Order Items
                    ...groupedItems.asMap().entries.map((entry) {
                      return ExpandableOrderSection(
                        index: entry.key,
                        section: entry.value,
                      );
                    }),
                    SizedBox(height: 24.h),
                  ],
                ),
              );
            }),
          ),
        ],
      ),
    );
  }
}


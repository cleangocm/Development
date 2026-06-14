import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:ultrawash/app/resource.dart';
import 'package:ultrawash/app/wtext.dart';
import 'package:ultrawash/feature/Cloth type/model/service_order_model.dart';

class OrderCategoryCard extends StatelessWidget {
  final ServiceOrder order;
  final int orderIndex;
  final VoidCallback onDelete;

  const OrderCategoryCard({
    super.key,
    required this.order,
    required this.orderIndex,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 380.w,
      constraints: BoxConstraints(minHeight: 122.h),
      margin: EdgeInsets.only(bottom: 16.h),
      decoration: BoxDecoration(
        color: R.color.deepTeal,
        borderRadius: BorderRadius.circular(16.r),
        boxShadow: [
          BoxShadow(
            color: Color(0x33000000),
            blurRadius: 4,
            offset: Offset(0, 0),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Category Header
          Padding(
            padding: EdgeInsets.all(12.w),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                WText(
                  text: '${order.serviceName} (${order.totalItems})',
                  fontSize: 14.sp,
                  fontWeight: FontWeight.w600,
                  color: R.color.charcoal,
                ),
                GestureDetector(
                  onTap: onDelete,
                  child: Icon(
                    Icons.delete_outline,
                    color: R.color.coolGray2,
                    size: 20.sp,
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12.0),
            child: Divider(
              color: Colors.grey.shade200,
              height: 1,
              thickness: 1,
            ),
          ),
          // Items
          Padding(
            padding: EdgeInsets.all(12.w),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: order.items
                  .where((item) => item.quantity > 0)
                  .map((item) => Padding(
                        padding: EdgeInsets.only(bottom: 4.h),
                        child: RichText(
                          text: TextSpan(
                            style: TextStyle(
                              fontSize: 14.sp,
                              fontFamily: 'Nunito',
                            ),
                            children: [
                              TextSpan(
                                text: '${item.quantity} X ',
                                style: TextStyle(
                                  color: R.color.oceanBlue,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              TextSpan(
                                text: item.itemName,
                                style: TextStyle(
                                  color: R.color.charcoal,
                                  fontWeight: FontWeight.w400,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ))
                  .toList(),
            ),
          ),
        ],
      ),
    );
  }
}


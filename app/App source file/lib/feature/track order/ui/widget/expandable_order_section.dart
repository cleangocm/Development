import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:ultrawash/app/resource.dart';
import 'package:ultrawash/app/wtext.dart';
import 'package:ultrawash/feature/order/model/each_order_model.dart' as each;

class ExpandableOrderSection extends StatefulWidget {
  final int index;
  final Map<String, dynamic> section;

  const ExpandableOrderSection({
    super.key,
    required this.index,
    required this.section,
  });

  @override
  State<ExpandableOrderSection> createState() => _ExpandableOrderSectionState();
}

class _ExpandableOrderSectionState extends State<ExpandableOrderSection> {
  bool _isExpanded = false;

  @override
  Widget build(BuildContext context) {
    final items = widget.section['items'] as List<each.Items>;

    return Padding(
      padding: EdgeInsets.only(bottom: 12.h),
      child: Container(
        width: 380.w,
        decoration: BoxDecoration(
          color: R.color.deepTeal,
          borderRadius: BorderRadius.circular(16.r),
          border: Border.all(
            color: Colors.grey.shade200,
            width: 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with title and arrow
            InkWell(
              onTap: () {
                setState(() {
                  _isExpanded = !_isExpanded;
                });
              },
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 16.h, horizontal: 16.w),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    WText(
                      text: widget.section['title'],
                      fontSize: 14.sp,
                      fontWeight: FontWeight.w500,
                      color: R.color.charcoal,
                    ),
                    Icon(
                      _isExpanded
                          ? Icons.keyboard_arrow_up
                          : Icons.keyboard_arrow_down,
                      color: R.color.charcoal,
                      size: 24.sp,
                    ),
                  ],
                ),
              ),
            ),
            // Items list (only visible when expanded)
            if (_isExpanded) ...[
              Divider(
                color: Colors.grey.shade200,
                height: 1,
                thickness: 1,
              ),
              Padding(
                padding: EdgeInsets.only(
                    left: 16.w, right: 16.w, top: 12.h, bottom: 16.h),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: items.map((item) {
                    // Extract item name from serviceName (after " - ")
                    final serviceName = item.serviceName ?? '';
                    final parts = serviceName.split(' - ');
                    final itemName =
                        parts.length > 1 ? parts[1].trim() : serviceName;

                    return Padding(
                      padding: EdgeInsets.only(bottom: 8.h),
                      child: RichText(
                        text: TextSpan(
                          style: TextStyle(
                            fontSize: 14.sp,
                            fontFamily: 'Nunito',
                          ),
                          children: [
                            TextSpan(
                              text: '${item.quantity ?? 0} X ',
                              style: TextStyle(
                                color: R.color.oceanBlue,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            TextSpan(
                              text: itemName,
                              style: TextStyle(
                                color: R.color.charcoal,
                                fontWeight: FontWeight.w400,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}


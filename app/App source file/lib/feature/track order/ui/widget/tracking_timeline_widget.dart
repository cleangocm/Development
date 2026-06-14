import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:intl/intl.dart';
import 'package:ultrawash/app/resource.dart';
import 'package:ultrawash/app/wtext.dart';
import 'package:ultrawash/feature/order/model/each_order_model.dart' as each;

class TrackingTimelineWidget extends StatelessWidget {
  final List<each.TrackingSteps> steps;

  const TrackingTimelineWidget({super.key, required this.steps});

  String _formatDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return 'N/A';
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('dd MMM yyyy').format(date);
    } catch (e) {
      return dateStr;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (steps.isEmpty) {
      return Padding(
        padding: EdgeInsets.symmetric(vertical: 16.h),
        child: WText(
          text: 'No tracking info available',
          fontSize: 14.sp,
          color: Colors.grey,
        ),
      );
    }

    return Column(
      children: steps.asMap().entries.map((entry) {
        int index = entry.key;
        each.TrackingSteps step = entry.value;
        bool isLast = index == steps.length - 1;

        final stepStatus = (step.status ?? '').toLowerCase();
        final isCompleted = stepStatus == 'completed' || stepStatus == 'done';

        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Timeline indicator column
            Column(
              children: [
                // Circle indicator
                Container(
                  width: 24.w,
                  height: 24.h,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white,
                    border: Border.all(
                      color: isCompleted
                          ? R.color.emeraldGreen
                          : R.color.coolGray2,
                      width: 2,
                    ),
                  ),
                  child: Icon(
                    Icons.check,
                    size: 14.sp,
                    color: isCompleted
                        ? R.color.emeraldGreen
                        : R.color.coolGray2,
                  ),
                ),
                // Vertical line
                if (!isLast)
                  Container(
                    width: 2,
                    height: 40.h,
                    color: isCompleted
                        ? R.color.emeraldGreen
                        : R.color.coolGray2,
                  ),
              ],
            ),
            SizedBox(width: 12.w),
            // Text content
            Expanded(
              child: Padding(
                padding: EdgeInsets.only(bottom: isLast ? 0 : 24.h),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    WText(
                      text: step.title ?? '',
                      fontSize: 14.sp,
                      fontWeight: FontWeight.w600,
                      color: isCompleted
                          ? R.color.emeraldGreen
                          : R.color.coolGray2,
                    ),
                    SizedBox(height: 2.h),
                    WText(
                      text: _formatDate(step.date),
                      fontSize: 12.sp,
                      fontWeight: FontWeight.w400,
                      color: Colors.grey.shade500,
                    ),
                  ],
                ),
              ),
            ),
          ],
        );
      }).toList(),
    );
  }
}


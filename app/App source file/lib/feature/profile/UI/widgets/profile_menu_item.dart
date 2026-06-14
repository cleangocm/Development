import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:ultrawash/app/resource.dart';
import 'package:ultrawash/app/wtext.dart';

/// Standard menu row — icon + title + arrow
class ProfileMenuItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback onTap;
  final bool showBorder;

  const ProfileMenuItem({
    super.key,
    required this.icon,
    required this.title,
    required this.onTap,
    this.showBorder = true,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.symmetric(vertical: 12.h, horizontal: 16.w),
        decoration: BoxDecoration(
          border: showBorder
              ? Border(
                  bottom: BorderSide(
                    color: R.color.lightGray1,
                    width: 1,
                  ),
                )
              : null,
        ),
        child: Row(
          children: [
            Icon(icon, color: R.color.oceanBlue, size: 20.sp),
            SizedBox(width: 12.w),
            Expanded(
              child: WText(
                text: title,
                fontSize: 14.sp,
                fontWeight: FontWeight.w400,
                color: R.color.charcoal,
              ),
            ),
            Icon(Icons.arrow_forward_ios,
                color: R.color.slateGray, size: 16.sp),
          ],
        ),
      ),
    );
  }
}

/// Menu row with an extra value label — icon + title + value + arrow
class ProfileMenuItemWithValue extends StatelessWidget {
  final IconData icon;
  final String title;
  final String value;
  final VoidCallback onTap;
  final bool showBorder;

  const ProfileMenuItemWithValue({
    super.key,
    required this.icon,
    required this.title,
    required this.value,
    required this.onTap,
    this.showBorder = true,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.symmetric(vertical: 12.h, horizontal: 16.w),
        decoration: BoxDecoration(
          border: showBorder
              ? Border(
                  bottom: BorderSide(
                    color: R.color.lightGray1,
                    width: 1,
                  ),
                )
              : null,
        ),
        child: Row(
          children: [
            Icon(icon, color: R.color.oceanBlue, size: 20.sp),
            SizedBox(width: 12.w),
            Expanded(
              child: WText(
                text: title,
                fontSize: 14.sp,
                fontWeight: FontWeight.w400,
                color: R.color.charcoal,
              ),
            ),
            WText(
              text: value,
              fontSize: 12.sp,
              fontWeight: FontWeight.w400,
              color: R.color.charcoal,
            ),
            SizedBox(width: 8.w),
            Icon(Icons.arrow_forward_ios,
                color: R.color.slateGray, size: 16.sp),
          ],
        ),
      ),
    );
  }
}


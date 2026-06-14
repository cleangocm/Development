import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:ultrawash/app/resource.dart';
import 'package:ultrawash/app/winput_text.dart';
import 'package:ultrawash/app/wtext.dart';
import 'package:ultrawash/feature/profile/UI/controller/profile_controller.dart';

class AddressBottomSheet extends StatefulWidget {
  const AddressBottomSheet({super.key});

  @override
  State<AddressBottomSheet> createState() => _AddressBottomSheetState();
}

class _AddressBottomSheetState extends State<AddressBottomSheet> {
  final ProfileControllers _profileController = Get.find<ProfileControllers>();
  late final TextEditingController _addressController;

  @override
  void initState() {
    super.initState();
    _addressController = TextEditingController(
      text: _profileController.userAddress,
    );
  }

  @override
  void dispose() {
    _addressController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Container(
        width: 412.w,
        height: 280.h,
        padding: EdgeInsets.only(
          top: 32.h,
          right: 32.w,
          bottom: 48.h,
          left: 32.w,
        ),
        decoration: BoxDecoration(
          color: R.color.deepTeal,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(32.r),
            topRight: Radius.circular(32.r),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Title
            Center(
              child: WText(
                text: 'Your Address',
                fontSize: 16.sp,
                fontWeight: FontWeight.w600,
                color: R.color.charcoal,
              ),
            ),
            SizedBox(height: 20.h),

            // Address Field
            InputFieldText(
              textEditingController: _addressController,
              labelText: 'Address',
              hintText: 'No address found',
              height: 80,
              maxLines: 3,
              readOnly: true,
            ),
          ],
        ),
      ),
    );
  }
}


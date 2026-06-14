import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:ultrawash/app/resource.dart';
import 'package:ultrawash/app/widget_button.dart';
import 'package:ultrawash/app/winput_text.dart';
import 'package:ultrawash/app/wtext.dart';
import '../../model/checkout_models.dart';

class ChangeBillingBottomSheet extends StatefulWidget {
  final BillingInfo billingInfo;
  final bool sameAsBilling;
  final void Function(BillingInfo updatedBilling, ShippingInfo? updatedShipping) onSave;

  const ChangeBillingBottomSheet({
    super.key,
    required this.billingInfo,
    required this.sameAsBilling,
    required this.onSave,
  });

  static void show({
    required BuildContext context,
    required BillingInfo billingInfo,
    required bool sameAsBilling,
    required void Function(BillingInfo updatedBilling, ShippingInfo? updatedShipping) onSave,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ChangeBillingBottomSheet(
        billingInfo: billingInfo,
        sameAsBilling: sameAsBilling,
        onSave: onSave,
      ),
    );
  }

  @override
  State<ChangeBillingBottomSheet> createState() =>
      _ChangeBillingBottomSheetState();
}

class _ChangeBillingBottomSheetState extends State<ChangeBillingBottomSheet> {
  late final TextEditingController _fullNameController;
  late final TextEditingController _emailController;
  late final TextEditingController _phoneController;
  late final TextEditingController _altPhoneController;
  late final TextEditingController _addressController;
  late final TextEditingController _instructionController;

  @override
  void initState() {
    super.initState();
    _fullNameController =
        TextEditingController(text: widget.billingInfo.fullName);
    _emailController =
        TextEditingController(text: widget.billingInfo.email);
    _phoneController =
        TextEditingController(text: widget.billingInfo.phone);
    _altPhoneController =
        TextEditingController(text: widget.billingInfo.alternativePhone);
    _addressController =
        TextEditingController(text: widget.billingInfo.address);
    _instructionController =
        TextEditingController(text: widget.billingInfo.additionalInstruction);
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _altPhoneController.dispose();
    _addressController.dispose();
    _instructionController.dispose();
    super.dispose();
  }

  void _onSave() {
    final updatedBilling = BillingInfo(
      fullName: _fullNameController.text,
      email: _emailController.text,
      phone: _phoneController.text,
      alternativePhone: _altPhoneController.text,
      address: _addressController.text,
      additionalInstruction: _instructionController.text,
    );

    // If same as billing, also return updated shipping
    ShippingInfo? updatedShipping;
    if (widget.sameAsBilling) {
      updatedShipping = ShippingInfo(
        fullName: _fullNameController.text,
        phone: _phoneController.text,
        alternativePhone: _altPhoneController.text,
        address: _addressController.text,
        additionalInstruction: _instructionController.text,
      );
    }

    widget.onSave(updatedBilling, updatedShipping);
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.75,
      decoration: BoxDecoration(
        color: R.color.white2,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(32.r),
          topRight: Radius.circular(32.r),
        ),
      ),
      child: Column(
        children: [
          // Handle bar
          Container(
            margin: EdgeInsets.only(top: 12.h),
            width: 40.w,
            height: 4.h,
            decoration: BoxDecoration(
              color: R.color.coolGray2,
              borderRadius: BorderRadius.circular(2.r),
            ),
          ),
          // Header
          Padding(
            padding: EdgeInsets.all(16.w),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                WText(
                  text: 'Update Billing Address',
                  fontSize: 18.sp,
                  fontWeight: FontWeight.w700,
                  color: R.color.charcoal,
                ),
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: Icon(
                    Icons.close,
                    color: R.color.charcoal,
                    size: 24.sp,
                  ),
                ),
              ],
            ),
          ),
          // Form content
          Expanded(
            child: SingleChildScrollView(
              padding: EdgeInsets.symmetric(horizontal: 16.w),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  InputFieldText(
                    textEditingController: _fullNameController,
                    labelText: 'Full Name',
                    hintText: 'Enter full name',
                  ),
                  SizedBox(height: 12.h),
                  InputFieldText(
                    textEditingController: _emailController,
                    labelText: 'Email',
                    hintText: 'Enter email',
                    keyboardType: TextInputType.emailAddress,
                  ),
                  SizedBox(height: 12.h),
                  InputFieldText(
                    textEditingController: _phoneController,
                    labelText: 'Phone',
                    hintText: 'Enter phone number',
                    keyboardType: TextInputType.phone,
                  ),
                  SizedBox(height: 12.h),
                  InputFieldText(
                    textEditingController: _altPhoneController,
                    labelText: 'Alternative Phone (Optional)',
                    hintText: 'Enter alternative phone',
                    keyboardType: TextInputType.phone,
                  ),
                  SizedBox(height: 12.h),
                  InputFieldText(
                    textEditingController: _addressController,
                    labelText: 'Address',
                    hintText: 'Enter full address',
                  ),
                  SizedBox(height: 12.h),
                  InputFieldText(
                    textEditingController: _instructionController,
                    labelText: 'Additional Instruction (Optional)',
                    hintText: 'e.g., Ring the doorbell',
                  ),
                  SizedBox(height: 24.h),
                  // Save Button
                  WButton(
                    onPressed: _onSave,
                    label: 'Save Billing Address',
                    decorationType: DecorationType.solid,
                    buttonColor: R.color.deepNavyBlue2,
                    textColor: R.color.white2,
                  ),
                  SizedBox(height: 32.h),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}


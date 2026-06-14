import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:ultrawash/app/resource.dart';
import 'package:ultrawash/app/widget_button.dart';
import 'package:ultrawash/app/winput_text.dart';
import 'package:ultrawash/app/wtext.dart';
import '../../model/checkout_models.dart';

class ChangeShippingBottomSheet extends StatefulWidget {
  final ShippingInfo shippingInfo;
  final BillingInfo billingInfo;
  final bool sameAsBilling;
  final void Function(ShippingInfo updatedShipping, bool sameAsBilling) onSave;

  const ChangeShippingBottomSheet({
    super.key,
    required this.shippingInfo,
    required this.billingInfo,
    required this.sameAsBilling,
    required this.onSave,
  });

  static void show({
    required BuildContext context,
    required ShippingInfo shippingInfo,
    required BillingInfo billingInfo,
    required bool sameAsBilling,
    required void Function(ShippingInfo updatedShipping, bool sameAsBilling) onSave,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ChangeShippingBottomSheet(
        shippingInfo: shippingInfo,
        billingInfo: billingInfo,
        sameAsBilling: sameAsBilling,
        onSave: onSave,
      ),
    );
  }

  @override
  State<ChangeShippingBottomSheet> createState() =>
      _ChangeShippingBottomSheetState();
}

class _ChangeShippingBottomSheetState extends State<ChangeShippingBottomSheet> {
  late final TextEditingController _nameController;
  late final TextEditingController _phoneController;
  late final TextEditingController _altPhoneController;
  late final TextEditingController _addressController;
  late final TextEditingController _instructionController;

  late bool _copyFromBilling;

  @override
  void initState() {
    super.initState();
    _copyFromBilling = widget.sameAsBilling;
    _nameController =
        TextEditingController(text: widget.shippingInfo.fullName);
    _phoneController =
        TextEditingController(text: widget.shippingInfo.phone);
    _altPhoneController =
        TextEditingController(text: widget.shippingInfo.alternativePhone);
    _addressController =
        TextEditingController(text: widget.shippingInfo.address);
    _instructionController =
        TextEditingController(text: widget.shippingInfo.additionalInstruction);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _altPhoneController.dispose();
    _addressController.dispose();
    _instructionController.dispose();
    super.dispose();
  }

  void _onCopyFromBillingToggle() {
    setState(() {
      _copyFromBilling = !_copyFromBilling;
      if (_copyFromBilling) {
        _nameController.text = widget.billingInfo.fullName;
        _phoneController.text = widget.billingInfo.phone;
        _altPhoneController.text = widget.billingInfo.alternativePhone;
        _addressController.text = widget.billingInfo.address;
        _instructionController.text = widget.billingInfo.additionalInstruction;
      }
    });
  }

  void _onSave() {
    final updatedShipping = ShippingInfo(
      fullName: _nameController.text,
      phone: _phoneController.text,
      alternativePhone: _altPhoneController.text,
      address: _addressController.text,
      additionalInstruction: _instructionController.text,
    );
    widget.onSave(updatedShipping, _copyFromBilling);
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
                  text: 'Update Shipping Address',
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
                  // Same as Billing Checkbox
                  GestureDetector(
                    onTap: _onCopyFromBillingToggle,
                    child: Container(
                      padding: EdgeInsets.all(12.w),
                      decoration: BoxDecoration(
                        color: _copyFromBilling
                            ? R.color.oceanBlue.withValues(alpha: 0.1)
                            : Colors.transparent,
                        border: Border.all(
                          color: _copyFromBilling
                              ? R.color.oceanBlue
                              : R.color.coolGray2,
                          width: 1,
                        ),
                        borderRadius: BorderRadius.circular(8.r),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 20.w,
                            height: 20.h,
                            decoration: BoxDecoration(
                              border: Border.all(
                                color: _copyFromBilling
                                    ? R.color.oceanBlue
                                    : R.color.coolGray2,
                                width: 2,
                              ),
                              borderRadius: BorderRadius.circular(4.r),
                              color: _copyFromBilling
                                  ? R.color.oceanBlue
                                  : Colors.transparent,
                            ),
                            child: _copyFromBilling
                                ? Icon(
                                    Icons.check,
                                    size: 14.sp,
                                    color: Colors.white,
                                  )
                                : null,
                          ),
                          SizedBox(width: 12.w),
                          WText(
                            text: 'Same as billing address',
                            fontSize: 14.sp,
                            fontWeight: FontWeight.w500,
                            color: R.color.charcoal,
                          ),
                        ],
                      ),
                    ),
                  ),
                  SizedBox(height: 16.h),

                  InputFieldText(
                    textEditingController: _nameController,
                    labelText: 'Full Name',
                    hintText: 'Enter full name',
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
                    hintText: 'e.g., Leave at door',
                  ),
                  SizedBox(height: 24.h),

                  // Save Button
                  WButton(
                    onPressed: _onSave,
                    label: 'Save Shipping Address',
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


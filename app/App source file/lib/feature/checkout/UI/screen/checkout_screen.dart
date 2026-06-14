import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:ultrawash/app/resource.dart';
import 'package:ultrawash/app/widget_button.dart';
import 'package:ultrawash/app/wtext.dart';
import 'package:ultrawash/feature/Add/UI/controller/add_service_controller.dart';
import 'package:ultrawash/feature/Cloth type/model/service_order_model.dart';
import 'package:ultrawash/feature/Payment/UI/screen/Payment_screen.dart';
import 'package:ultrawash/feature/profile/UI/controller/profile_controller.dart';
import '../widget/change_shipping_bottom_sheet.dart';
import '../widget/change_billing_bottom_sheet.dart';
import '../../model/checkout_models.dart';



class CheckoutScreen extends StatefulWidget {
  final List<ServiceOrder> orders;

  const CheckoutScreen({super.key, required this.orders});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final TextEditingController _voucherController = TextEditingController();
  final ProfileControllers _profileController = Get.find<ProfileControllers>();
  final AddServiceControllers _addServiceController = Get.find<AddServiceControllers>();

  // Billing and Shipping Info
  late BillingInfo _billingInfo;
  late ShippingInfo _shippingInfo;
  bool _sameAsBilling = true;

  // Static shipping fee
  static const double _shippingFee = 10.00;

  // Computed values
  int get _totalItems => widget.orders.fold(0, (sum, order) => sum + order.totalItems);
  double get _subtotal => widget.orders.fold(0.0, (sum, order) => sum + order.totalPrice);
  double get _discount => _addServiceController.couponDiscount.value;
  double get _total => (_subtotal + _shippingFee - _discount).clamp(0, double.infinity);

  @override
  void initState() {
    super.initState();
    _initializeInfoFromProfile();
  }

  void _initializeInfoFromProfile() {
    final profile = _profileController.profileData.value?.data;

    // Initialize billing info from profile
    _billingInfo = BillingInfo(
      fullName: profile?.name ?? '',
      email: profile?.email ?? '',
      phone: profile?.phone ?? '',
      alternativePhone: '',
      address: profile?.address ?? '',
      additionalInstruction: '',
    );

    // Initialize shipping info same as billing
    _shippingInfo = ShippingInfo(
      fullName: profile?.name ?? '',
      phone: profile?.phone ?? '',
      alternativePhone: '',
      address: profile?.address ?? '',
      additionalInstruction: '',
    );
  }

  @override
  void dispose() {
    _voucherController.dispose();
    // Reset coupon when leaving checkout
    _addServiceController.removeCoupon();
    super.dispose();
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
                WText(
                  text: "CHECKOUT",
                  fontSize: 16.sp,
                  fontWeight: FontWeight.w600,
                  color: R.color.charcoal,
                ),
              ],
            ),
          ),

          // Content
          Expanded(
            child: SingleChildScrollView(
              child: Padding(
                padding: EdgeInsets.all(16.w),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Billing Address Card
                    Container(
                      width: 380.w,
                      padding: EdgeInsets.all(20.w),
                      decoration: BoxDecoration(
                        color: R.color.deepTeal,
                        borderRadius: BorderRadius.circular(10.r),
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
                          // Billing Address header with Change button
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              WText(
                                text: 'Billing Address',
                                fontSize: 18.sp,
                                fontWeight: FontWeight.w700,
                                color: R.color.charcoal,
                              ),
                              GestureDetector(
                                onTap: () => ChangeBillingBottomSheet.show(
                                  context: context,
                                  billingInfo: _billingInfo,
                                  sameAsBilling: _sameAsBilling,
                                  onSave: (updatedBilling, updatedShipping) {
                                    setState(() {
                                      _billingInfo = updatedBilling;
                                      if (updatedShipping != null) {
                                        _shippingInfo = updatedShipping;
                                      }
                                    });
                                  },
                                ),
                                child: WText(
                                  text: 'Change',
                                  fontSize: 14.sp,
                                  fontWeight: FontWeight.w500,
                                  color: R.color.oceanBlue,
                                ),
                              ),
                            ],
                          ),
                          SizedBox(height: 12.h),
                          // Name
                          WText(
                            text: _billingInfo.fullName.isNotEmpty
                                ? _billingInfo.fullName
                                : 'No name provided',
                            fontSize: 14.sp,
                            fontWeight: FontWeight.w600,
                            color: R.color.charcoal,
                          ),
                          SizedBox(height: 4.h),
                          // Email
                          WText(
                            text: _billingInfo.email.isNotEmpty
                                ? _billingInfo.email
                                : 'No email provided',
                            fontSize: 12.sp,
                            fontWeight: FontWeight.w400,
                            color: R.color.coolGray2,
                          ),
                          SizedBox(height: 4.h),
                          // Phone
                          WText(
                            text: _billingInfo.phone.isNotEmpty
                                ? _billingInfo.phone
                                : 'No phone provided',
                            fontSize: 12.sp,
                            fontWeight: FontWeight.w400,
                            color: R.color.coolGray2,
                          ),
                          SizedBox(height: 4.h),
                          // Full Address
                          WText(
                            text: _billingInfo.address.isNotEmpty
                                ? 'Address: ${_billingInfo.address}'
                                : 'No address provided',
                            fontSize: 12.sp,
                            fontWeight: FontWeight.w400,
                            color: R.color.coolGray2,
                            maxLines: 2,
                          ),
                          if (_billingInfo.additionalInstruction.isNotEmpty) ...[
                            SizedBox(height: 4.h),
                            WText(
                              text: 'Note: ${_billingInfo.additionalInstruction}',
                              fontSize: 12.sp,
                              fontWeight: FontWeight.w400,
                              color: R.color.coolGray2,
                            ),
                          ],
                        ],
                      ),
                    ),
                    SizedBox(height: 16.h),

                    // Shipping Address Card
                    Container(
                      width: 380.w,
                      padding: EdgeInsets.all(20.w),
                      decoration: BoxDecoration(
                        color: R.color.deepTeal,
                        borderRadius: BorderRadius.circular(10.r),
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
                          // Shipping Address header with Change button
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  WText(
                                    text: 'Shipping Address',
                                    fontSize: 18.sp,
                                    fontWeight: FontWeight.w700,
                                    color: R.color.charcoal,
                                  ),
                                  if (_sameAsBilling) ...[
                                    SizedBox(width: 8.w),
                                    Container(
                                      padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 4.h),
                                      decoration: BoxDecoration(
                                        color: R.color.oceanBlue.withValues(alpha: 0.1),
                                        borderRadius: BorderRadius.circular(4.r),
                                      ),
                                      child: WText(
                                        text: 'Same as billing',
                                        fontSize: 10.sp,
                                        fontWeight: FontWeight.w500,
                                        color: R.color.oceanBlue,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                              GestureDetector(
                                onTap: () => ChangeShippingBottomSheet.show(
                                  context: context,
                                  shippingInfo: _shippingInfo,
                                  billingInfo: _billingInfo,
                                  sameAsBilling: _sameAsBilling,
                                  onSave: (updatedShipping, sameAsBilling) {
                                    setState(() {
                                      _shippingInfo = updatedShipping;
                                      _sameAsBilling = sameAsBilling;
                                    });
                                  },
                                ),
                                child: WText(
                                  text: 'Change',
                                  fontSize: 14.sp,
                                  fontWeight: FontWeight.w500,
                                  color: R.color.oceanBlue,
                                ),
                              ),
                            ],
                          ),
                          SizedBox(height: 12.h),
                          // Name
                          WText(
                            text: _shippingInfo.fullName.isNotEmpty
                                ? _shippingInfo.fullName
                                : 'No name provided',
                            fontSize: 14.sp,
                            fontWeight: FontWeight.w600,
                            color: R.color.charcoal,
                          ),
                          SizedBox(height: 4.h),
                          // Phone
                          WText(
                            text: _shippingInfo.phone.isNotEmpty
                                ? _shippingInfo.phone
                                : 'No phone provided',
                            fontSize: 12.sp,
                            fontWeight: FontWeight.w400,
                            color: R.color.coolGray2,
                          ),
                          if (_shippingInfo.alternativePhone.isNotEmpty) ...[
                            SizedBox(height: 4.h),
                            WText(
                              text: 'Alt Phone: ${_shippingInfo.alternativePhone}',
                              fontSize: 12.sp,
                              fontWeight: FontWeight.w400,
                              color: R.color.coolGray2,
                            ),
                          ],
                          SizedBox(height: 4.h),
                          // Full Address
                          WText(
                            text: _shippingInfo.address.isNotEmpty
                                ? 'Address: ${_shippingInfo.address}'
                                : 'No address provided',
                            fontSize: 12.sp,
                            fontWeight: FontWeight.w400,
                            color: R.color.coolGray2,
                            maxLines: 2,
                          ),
                          if (_shippingInfo.additionalInstruction.isNotEmpty) ...[
                            SizedBox(height: 4.h),
                            WText(
                              text: 'Note: ${_shippingInfo.additionalInstruction}',
                              fontSize: 12.sp,
                              fontWeight: FontWeight.w400,
                              color: R.color.coolGray2,
                            ),
                          ],
                        ],
                      ),
                    ),
                    SizedBox(height: 16.h),

                    // Order Summary Card
                    Obx(() => Container(
                      width: 380.w,
                      padding: EdgeInsets.all(20.w),
                      decoration: BoxDecoration(
                        color: R.color.deepTeal,
                        borderRadius: BorderRadius.circular(10.r),
                        boxShadow: [
                          BoxShadow(
                            color: R.color.blackOverlay,
                            blurRadius: 4,
                            offset: Offset(0, 0),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Order Summary title
                          WText(
                            text: 'Order Summary',
                            fontSize: 18.sp,
                            fontWeight: FontWeight.w700,
                            color: R.color.charcoal,
                          ),
                          SizedBox(height: 20.h),
                          // Subtotal
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              WText(
                                text: 'Subtotal ($_totalItems items)',
                                fontWeight: FontWeight.w400,
                                color: R.color.charcoal,
                              ),
                              WText(
                                text: '\$${_subtotal.toStringAsFixed(2)}',
                                fontWeight: FontWeight.w400,
                                color: R.color.charcoal,
                              ),
                            ],
                          ),
                          SizedBox(height: 9.h),
                          // Shipping Fee
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              WText(
                                text: 'Shipping Fee',
                                fontWeight: FontWeight.w400,
                                color: R.color.charcoal,
                              ),
                              WText(
                                text: '\$${_shippingFee.toStringAsFixed(2)}',
                                fontWeight: FontWeight.w400,
                                color: R.color.charcoal,
                              ),
                            ],
                          ),
                          // Coupon Discount (if applied)
                          if (_addServiceController.isCouponApplied.value) ...[
                            SizedBox(height: 9.h),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    WText(
                                      text: 'Coupon (${_addServiceController.couponCode.value})',
                                      fontWeight: FontWeight.w400,
                                      color: R.color.emeraldGreen1,
                                    ),
                                    SizedBox(width: 8.w),
                                    GestureDetector(
                                      onTap: () {
                                        _addServiceController.removeCoupon();
                                        _voucherController.clear();
                                      },
                                      child: Icon(
                                        Icons.close,
                                        size: 16.sp,
                                        color: Colors.red,
                                      ),
                                    ),
                                  ],
                                ),
                                WText(
                                  text: '-\$${_discount.toStringAsFixed(2)}',
                                  fontWeight: FontWeight.w400,
                                  color: R.color.emeraldGreen1,
                                ),
                              ],
                            ),
                          ],
                          SizedBox(height: 25.h),
                          // Voucher Code Input
                          Row(
                            children: [
                              Expanded(
                                child: Container(
                                  height: 48.h,
                                  padding: EdgeInsets.symmetric(horizontal: 16.w),
                                  decoration: BoxDecoration(
                                    border: Border.all(
                                      color: R.color.coolGray2,
                                      width: 1,
                                    ),
                                    borderRadius: BorderRadius.circular(8.r),
                                  ),
                                  child: TextField(
                                    controller: _voucherController,
                                    enabled: !_addServiceController.isCouponApplied.value,
                                    decoration: InputDecoration(
                                      hintText: _addServiceController.isCouponApplied.value
                                          ? _addServiceController.couponCode.value
                                          : 'Enter Voucher Code',
                                      hintStyle: TextStyle(
                                        fontSize: 14.sp,
                                        fontWeight: FontWeight.w400,
                                        color: R.color.coolGray2,
                                      ),
                                      border: InputBorder.none,
                                    ),
                                  ),
                                ),
                              ),
                              SizedBox(width: 12.w),
                              WButton(
                                onPressed: () {
                                  if (_addServiceController.isCouponApplied.value) {
                                    // Remove coupon
                                    _addServiceController.removeCoupon();
                                    _voucherController.clear();
                                  } else {
                                    // Apply coupon
                                    final code = _voucherController.text.trim();
                                    if (code.isNotEmpty) {
                                      _addServiceController.validateCoupon(code, _subtotal);
                                    }
                                  }
                                },
                                label: _addServiceController.isCouponApplied.value ? 'Remove' : 'Apply',
                                width: 106.w,
                                height: 48.h,
                                isLoading: _addServiceController.isValidatingCoupon.value,
                                decorationType: DecorationType.solid,
                                buttonColor: _addServiceController.isCouponApplied.value
                                    ? Colors.red
                                    : R.color.cyanBlue,
                              ),
                            ],
                          ),
                          SizedBox(height: 25.h),
                          // Total
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              WText(
                                text: 'Total',
                                fontSize: 16.sp,
                                fontWeight: FontWeight.w600,
                                color: R.color.charcoal,
                              ),
                              WText(
                                text: '\$${_total.toStringAsFixed(2)}',
                                fontSize: 18.sp,
                                fontWeight: FontWeight.w700,
                                color: R.color.emeraldGreen1,
                              ),
                            ],
                          ),
                          SizedBox(height: 10.h),
                          // Checkout Button
                          WButton(
                            onPressed: () {
                              // Navigate to PaymentScreen with all order data
                              Get.to(() => PaymentScreen(
                                orders: widget.orders,
                                billingInfo: _billingInfo.toJson(),
                                shippingInfo: _shippingInfo.toJson(),
                                subtotal: _subtotal,
                                shippingFee: _shippingFee,
                                couponDiscount: _discount,
                                couponCode: _addServiceController.isCouponApplied.value
                                    ? _addServiceController.couponCode.value
                                    : null,
                                totalAmount: _total,
                                totalItems: _totalItems,
                              ));
                            },
                            label: 'CHECKOUT',
                            decorationType: DecorationType.solid,
                            buttonColor: R.color.deepNavyBlue2,
                            textColor: R.color.white2,
                          ),
                        ],
                      ),
                    )),
                    SizedBox(height: 120.h),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

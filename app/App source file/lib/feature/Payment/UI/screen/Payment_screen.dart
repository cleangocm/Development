import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:ultrawash/app/resource.dart';
import 'package:ultrawash/app/widget_button.dart';
import 'package:ultrawash/app/wtext.dart';
import 'package:ultrawash/feature/Add/UI/controller/add_service_controller.dart';
import 'package:ultrawash/feature/Cloth type/model/service_order_model.dart';
import '../widget/add_card_bottom_sheet.dart';
import '../widget/order_success_dialog.dart';

class PaymentScreen extends StatefulWidget {
  final List<ServiceOrder> orders;
  final Map<String, dynamic> billingInfo;
  final Map<String, dynamic> shippingInfo;
  final double subtotal;
  final double shippingFee;
  final double couponDiscount;
  final String? couponCode;
  final double totalAmount;
  final int totalItems;

  const PaymentScreen({
    super.key,
    required this.orders,
    required this.billingInfo,
    required this.shippingInfo,
    required this.subtotal,
    required this.shippingFee,
    this.couponDiscount = 0,
    this.couponCode,
    required this.totalAmount,
    required this.totalItems,
  });

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  final AddServiceControllers _addServiceController = Get.find<AddServiceControllers>();

  int _selectedPaymentIndex = 0;
  bool _isProcessing = false;

  // Payment methods
  final List<Map<String, dynamic>> _paymentMethods = [
    {
      'type': 'cod',
      'name': 'Cash on Delivery',
      'icon': Icons.money,
    },
    {
      'type': 'stripe',
      'name': 'Pay with Card (Stripe)',
      'icon': Icons.credit_card,
    },
  ];

  static const String _webAppUrl = String.fromEnvironment(
    'CLEANGO_WEB_APP_URL',
    defaultValue: 'http://localhost:3001',
  );

  @override
  void dispose() {
    super.dispose();
  }

  // Create Stripe Payment Intent
  Future<Map<String, dynamic>?> _createPaymentIntent() async {
    try {
      final response = await http.post(
        Uri.parse('$_webAppUrl/api/create-payment-intent'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'amount': widget.totalAmount,
          'currency': 'usd',
        }),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
      return null;
    } catch (e) {
      debugPrint('Error creating payment intent: $e');
      return null;
    }
  }

  // Process Stripe Payment
  Future<bool> _processStripePayment() async {
    try {
      if (mounted) setState(() => _isProcessing = true);

      // 1. Create payment intent
      final paymentIntent = await _createPaymentIntent();
      if (paymentIntent == null) {
        _showError('Failed to create payment intent');
        if (mounted) setState(() => _isProcessing = false);
        return false;
      }

      // 2. Initialize payment sheet
      await Stripe.instance.initPaymentSheet(
        paymentSheetParameters: SetupPaymentSheetParameters(
          paymentIntentClientSecret: paymentIntent['clientSecret'],
          merchantDisplayName: 'Ultra Wash',
          style: ThemeMode.light,
          billingDetails: BillingDetails(
            name: widget.billingInfo['fullName'],
            email: widget.billingInfo['email'],
            phone: widget.billingInfo['phone'],
            address: Address(
              city: '',
              country: 'US',
              line1: widget.billingInfo['address'] ?? '',
              line2: '',
              postalCode: '',
              state: '',
            ),
          ),
        ),
      );

      if (mounted) setState(() => _isProcessing = false);

      // 3. Present payment sheet
      await Stripe.instance.presentPaymentSheet();

      // Payment completed successfully
      return true;
    } on StripeException catch (e) {
      if (e.error.code != FailureCode.Canceled) {
        _showError(e.error.localizedMessage ?? 'Payment failed');
      }
      if (mounted) setState(() => _isProcessing = false);
      return false;
    } catch (e) {
      _showError('Payment error: $e');
      if (mounted) setState(() => _isProcessing = false);
      return false;
    }
  }

  // Place order after payment
  Future<void> _placeOrder(String paymentMethod) async {
    if (mounted) setState(() => _isProcessing = true);

    final orderData = await _addServiceController.placeOrder(
      orders: widget.orders,
      billingInfo: widget.billingInfo,
      shippingInfo: widget.shippingInfo,
      paymentMethod: paymentMethod,
      couponCode: widget.couponCode,
      couponDiscount: widget.couponDiscount,
    );

    if (mounted) setState(() => _isProcessing = false);

    if (orderData != null) {
      _showOrderSuccessDialog(orderData);
    }
  }

  // Handle Pay Now
  Future<void> _handlePayNow() async {
    if (_isProcessing) return;

    final selectedMethod = _paymentMethods[_selectedPaymentIndex];

    if (selectedMethod['type'] == 'cod') {
      // Cash on Delivery - place order directly
      await _placeOrder('cod');
    } else if (selectedMethod['type'] == 'stripe') {
      // Stripe - process payment then place order
      final success = await _processStripePayment();
      if (success) {
        await _placeOrder('stripe');
      }
    }
  }

  void _showError(String message) {
    Get.snackbar(
      'Error',
      message,
      snackPosition: SnackPosition.BOTTOM,
      backgroundColor: Colors.red,
      colorText: Colors.white,
      duration: const Duration(seconds: 3),
    );
  }

  void _showOrderSuccessDialog(Map<String, dynamic> orderData) {
    OrderSuccessDialog.show(
      context: context,
      orderData: orderData,
      totalAmount: widget.totalAmount,
    );
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
                  text: "Payment",
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
                    // Order Summary Card
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
                          // Order Summary title
                          WText(
                            text: 'Order Summary',
                            fontSize: 18.sp,
                            fontWeight: FontWeight.w700,
                            color: R.color.charcoal,
                          ),
                          SizedBox(height: 16.h),
                          // Subtotal
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              WText(
                                text: 'Subtotal (${widget.totalItems} items)',
                                fontSize: 14.sp,
                                fontWeight: FontWeight.w400,
                                color: R.color.charcoal,
                              ),
                              WText(
                                text: '\$${widget.subtotal.toStringAsFixed(2)}',
                                fontSize: 14.sp,
                                fontWeight: FontWeight.w600,
                                color: R.color.charcoal,
                              ),
                            ],
                          ),
                          SizedBox(height: 8.h),
                          // Shipping Fee
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              WText(
                                text: 'Shipping Fee',
                                fontSize: 14.sp,
                                fontWeight: FontWeight.w400,
                                color: R.color.charcoal,
                              ),
                              WText(
                                text: '\$${widget.shippingFee.toStringAsFixed(2)}',
                                fontSize: 14.sp,
                                fontWeight: FontWeight.w600,
                                color: R.color.charcoal,
                              ),
                            ],
                          ),
                          // Coupon discount
                          if (widget.couponDiscount > 0) ...[
                            SizedBox(height: 8.h),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                WText(
                                  text: 'Coupon${widget.couponCode != null ? ' (${widget.couponCode})' : ''}',
                                  fontSize: 14.sp,
                                  fontWeight: FontWeight.w400,
                                  color: R.color.emeraldGreen1,
                                ),
                                WText(
                                  text: '-\$${widget.couponDiscount.toStringAsFixed(2)}',
                                  fontSize: 14.sp,
                                  fontWeight: FontWeight.w600,
                                  color: R.color.emeraldGreen1,
                                ),
                              ],
                            ),
                          ],
                          SizedBox(height: 12.h),
                          Divider(
                            color: Colors.grey.shade300,
                            height: 1,
                            thickness: 1,
                          ),
                          SizedBox(height: 12.h),
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
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  WText(
                                    text: '\$${widget.totalAmount.toStringAsFixed(2)}',
                                    fontSize: 18.sp,
                                    fontWeight: FontWeight.w700,
                                    color: R.color.emeraldGreen1,
                                  ),
                                  WText(
                                    text: 'VAT included, where applicable',
                                    fontSize: 10.sp,
                                    fontWeight: FontWeight.w400,
                                    color: R.color.coolGray2,
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    SizedBox(height: 16.h),

                    // Payment Methods
                    ..._paymentMethods.asMap().entries.map((entry) {
                      int index = entry.key;
                      Map<String, dynamic> method = entry.value;
                      return _buildPaymentMethodCard(index, method);
                    }),

                    SizedBox(height: 16.h),
                    // Pay Now Button
                    WButton(
                      onPressed: _handlePayNow,
                      label: 'Pay Now',
                      height: 48.h,
                      radius: 8.r,
                      isLoading: _isProcessing,
                      decorationType: DecorationType.solid,
                      buttonColor: R.color.deepNavyBlue2,
                      textColor: R.color.white2,
                      fontSize: 16.sp,
                      fontWeight: FontWeight.w600,
                    ),
                    SizedBox(height: 16.h),

                    // OR Divider
                    // Row(
                    //   children: [
                    //     Expanded(
                    //       child: Container(
                    //         height: 1,
                    //         decoration: BoxDecoration(
                    //           gradient: LinearGradient(
                    //             colors: [
                    //               Colors.transparent,
                    //               Colors.grey.shade300,
                    //             ],
                    //           ),
                    //         ),
                    //       ),
                    //     ),
                    //     Padding(
                    //       padding: EdgeInsets.symmetric(horizontal: 16.w),
                    //       child: WText(
                    //         text: 'OR',
                    //         fontSize: 12.sp,
                    //         fontWeight: FontWeight.w400,
                    //         color: R.color.coolGray2,
                    //       ),
                    //     ),
                    //     Expanded(
                    //       child: Container(
                    //         height: 1,
                    //         decoration: BoxDecoration(
                    //           gradient: LinearGradient(
                    //             colors: [
                    //               Colors.grey.shade300,
                    //               Colors.transparent,
                    //             ],
                    //           ),
                    //         ),
                    //       ),
                    //     ),
                    //   ],
                    // ),
                    // SizedBox(height: 16.h),
                    //
                    // // Pay with another card Button
                    // WButton(
                    //   onPressed: () {
                    //     _showAddCardBottomSheet();
                    //   },
                    //   label: 'Pay with another card',
                    //   height: 48.h,
                    //   radius: 8.r,
                    //   decorationType: DecorationType.stroke,
                    //   textColor: R.color.deepNavyBlue2,
                    //   buttonColor: R.color.deepNavyBlue2,
                    //   fontSize: 14.sp,
                    //   fontWeight: FontWeight.w600,
                    // ),
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

  Widget _buildPaymentMethodCard(int index, Map<String, dynamic> method) {
    bool isSelected = _selectedPaymentIndex == index;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedPaymentIndex = index;
        });
      },
      child: Container(
        width: 380.w,
        margin: EdgeInsets.only(bottom: 12.h),
        padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 12.h),
        decoration: BoxDecoration(
          color: R.color.deepTeal,
          borderRadius: BorderRadius.circular(8.r),
          border: Border.all(
            color: isSelected ? R.color.oceanBlue : Colors.grey.shade200,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            // Radio button
            Container(
              width: 20.w,
              height: 20.h,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: isSelected ? R.color.oceanBlue : R.color.coolGray2,
                  width: 2,
                ),
              ),
              child: isSelected
                  ? Center(
                      child: Container(
                        width: 10.w,
                        height: 10.h,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: R.color.oceanBlue,
                        ),
                      ),
                    )
                  : null,
            ),
            SizedBox(width: 12.w),
            // Icon
            Icon(
              method['icon'] as IconData,
              color: isSelected ? R.color.oceanBlue : R.color.coolGray2,
              size: 24.sp,
            ),
            SizedBox(width: 12.w),
            // Name
            Expanded(
              child: WText(
                text: method['name'],
                fontSize: 14.sp,
                fontWeight: FontWeight.w500,
                color: R.color.charcoal,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showAddCardBottomSheet() {
    AddCardBottomSheet.show(
      context: context,
      totalAmount: widget.totalAmount,
      onPay: () async {
        final success = await _processStripePayment();
        if (success) {
          await _placeOrder('stripe');
        }
      },
    );
  }

}


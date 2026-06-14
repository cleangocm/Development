import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:ultrawash/app/resource.dart';
import 'package:ultrawash/app/widget_button.dart';
import 'package:ultrawash/app/wtext.dart';
import 'package:ultrawash/feature/Add/UI/screen/add_screen.dart';
import 'package:ultrawash/feature/Cloth type/model/service_order_model.dart';
import 'package:ultrawash/feature/checkout/UI/screen/checkout_screen.dart';
import 'package:ultrawash/feature/your Order/UI/widget/order_category_card.dart';

class PlaceYourOrderScreen extends StatefulWidget {
  final List<ServiceOrder> orders;

  const PlaceYourOrderScreen({super.key, required this.orders});

  @override
  State<PlaceYourOrderScreen> createState() => _PlaceYourOrderScreenState();
}

class _PlaceYourOrderScreenState extends State<PlaceYourOrderScreen> {
  bool _hideUnselectedCategories = false;
  late List<ServiceOrder> _orders;

  @override
  void initState() {
    super.initState();
    _orders = List.from(widget.orders);
  }

  int _getTotalItems() {
    return _orders.fold(0, (sum, order) => sum + order.totalItems);
  }

  double _getTotalPrice() {
    return _orders.fold(0.0, (sum, order) => sum + order.totalPrice);
  }

  void _deleteOrder(int index) {
    setState(() {
      _orders.removeAt(index);
    });
  }

  void _addMore() {
    // Navigate to AddScreen to select a new service, passing existing orders
    Get.off(() => AddScreen(existingOrders: _orders));
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
                  text: "Place your Order",
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
                    // Build your Order section
                    Container(
                      width: 380.w,
                      height: 89.h,
                      padding: EdgeInsets.all(8.w),
                      decoration: BoxDecoration(
                        color: R.color.deepTeal1,
                        borderRadius: BorderRadius.circular(8.r),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              WText(
                                text: 'Build your Order',
                                fontWeight: FontWeight.w500,
                                color: R.color.charcoal,
                              ),
                              SizedBox(height: 8.h),
                              // Checkbox
                              Row(
                                children: [
                                  GestureDetector(
                                    onTap: () {
                                      setState(() {
                                        _hideUnselectedCategories = !_hideUnselectedCategories;
                                      });
                                    },
                                    child: Container(
                                      width: 20.w,
                                      height: 20.h,
                                      decoration: BoxDecoration(
                                        border: Border.all(
                                          color: R.color.coolGray2,
                                          width: 2,
                                        ),
                                        borderRadius: BorderRadius.circular(4.r),
                                      ),
                                      child: _hideUnselectedCategories
                                          ? Icon(
                                              Icons.check,
                                              size: 16.sp,
                                              color: R.color.oceanBlue,
                                            )
                                          : null,
                                    ),
                                  ),
                                  SizedBox(width: 8.w),
                                  WText(
                                    text: 'Hide unselected categories',
                                    fontSize: 12.sp,
                                    fontWeight: FontWeight.w400,
                                    color: R.color.charcoal,
                                  ),
                                ],
                              ),
                            ],
                          ),
                          // Price tag
                          Container(
                            padding: EdgeInsets.symmetric(
                              horizontal: 16.w,
                              vertical: 8.h,
                            ),
                            decoration: BoxDecoration(
                              color: R.color.coolGray12,
                              borderRadius: BorderRadius.circular(16.r),
                            ),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                WText(
                                  text: '\$${_getTotalPrice().toStringAsFixed(2)}',
                                  fontSize: 18.sp,
                                  color: R.color.charcoal,
                                ),
                                WText(
                                  text: '${_getTotalItems()} items',
                                  fontSize: 10.sp,
                                  fontWeight: FontWeight.w400,
                                  color: R.color.charcoal,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    SizedBox(height: 16.h),

                    // Order categories from passed data
                    if (_orders.isEmpty)
                      Center(
                        child: Padding(
                          padding: EdgeInsets.symmetric(vertical: 40.h),
                          child: WText(
                            text: 'No items in your order',
                            fontSize: 14.sp,
                            color: R.color.charcoal,
                          ),
                        ),
                      )
                    else
                      ..._orders.asMap().entries.map((entry) {
                        final index = entry.key;
                        final order = entry.value;
                        return OrderCategoryCard(
                          order: order,
                          orderIndex: index,
                          onDelete: () => _deleteOrder(index),
                        );
                      }),

                    SizedBox(height: 16.h),
                    // Buttons
                    Row(
                      children: [
                        Expanded(
                          child: WButton(
                            onPressed: _addMore,
                            label: '+ Add More',
                            height: 48.h,
                            radius: 8.r,
                            decorationType: DecorationType.stroke,
                            textColor: R.color.midnightBlue1,
                            buttonColor: R.color.deepNavyBlue2,
                            fontSize: 14.sp,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        SizedBox(width: 12.w),
                        Expanded(
                          child: WButton(
                            onPressed: () {
                              if (_orders.isNotEmpty) {
                                // Navigate to CheckoutScreen with order data
                                Get.to(() => CheckoutScreen(orders: _orders));
                              } else {
                                Get.snackbar(
                                  'Error',
                                  'Please add items to your order',
                                  snackPosition: SnackPosition.BOTTOM,
                                  backgroundColor: Colors.red,
                                  colorText: Colors.white,
                                );
                              }
                            },
                            label: 'Place Order',
                            height: 48.h,
                            radius: 8.r,
                            decorationType: DecorationType.solid,
                            buttonColor: R.color.deepNavyBlue2,
                            textColor: R.color.white2,
                            fontSize: 14.sp,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
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



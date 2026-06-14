import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:ultrawash/app/resource.dart';
import 'package:ultrawash/app/wtext.dart';
import 'package:ultrawash/feature/order/ui/controller/order_controller.dart';
import '../widget/order_card.dart';

class OrderScreen extends StatefulWidget {
  const OrderScreen({super.key});

  @override
  State<OrderScreen> createState() => _OrderScreenState();
}

class _OrderScreenState extends State<OrderScreen> {
  final OrderControllers _orderController = Get.find<OrderControllers>();
  String _selectedFilter = 'All';

  @override
  void initState() {
    super.initState();
    _orderController.getMyOrders();
  }

  void _showFilterBottomSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: R.color.deepTeal,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16.r)),
      ),
      builder: (context) {
        return Container(
          padding: EdgeInsets.symmetric(vertical: 24.h, horizontal: 16.w),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildFilterOption('All'),
              _buildFilterOption('Ongoing'),
              _buildFilterOption('Canceled'),
              _buildFilterOption('Complete'),
              SizedBox(height: 16.h),
            ],
          ),
        );
      },
    );
  }

  Widget _buildFilterOption(String option) {
    final isSelected = _selectedFilter == option;

    Color optionColor;
    switch (option) {
      case 'Canceled':
        optionColor = const Color(0xFFED9495);
        break;
      case 'Complete':
        optionColor = const Color(0xFF0F7BA0);
        break;
      default:
        optionColor = const Color(0xFF0F7BA0);
    }

    return InkWell(
      onTap: () {
        setState(() => _selectedFilter = option);
        Navigator.pop(context);
      },
      child: Padding(
        padding: EdgeInsets.symmetric(vertical: 12.h),
        child: Row(
          children: [
            Container(
              width: 20.w,
              height: 20.h,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: isSelected ? optionColor : const Color(0xFFE0E0E0),
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
                          color: optionColor,
                        ),
                      ),
                    )
                  : null,
            ),
            SizedBox(width: 12.w),
            WText(
              text: option,
              fontSize: 14.sp,
              fontWeight: FontWeight.w500,
              color: isSelected ? optionColor : R.color.charcoal,
            ),
          ],
        ),
      ),
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
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                WText(
                  text: 'My Orders',
                  fontSize: 18.sp,
                  fontWeight: FontWeight.w700,
                  color: R.color.charcoal,
                ),
                GestureDetector(
                  onTap: _showFilterBottomSheet,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      WText(
                        text: _selectedFilter,
                        fontSize: 14.sp,
                        fontWeight: FontWeight.w500,
                        color: R.color.charcoal,
                      ),
                      SizedBox(width: 4.w),
                      Icon(
                        Icons.keyboard_arrow_down,
                        color: R.color.charcoal,
                        size: 20.sp,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Orders List
          Expanded(
            child: Obx(() {
              if (_orderController.isLoading.value) {
                return Center(
                  child: CircularProgressIndicator(
                    color: R.color.oceanBlue,
                  ),
                );
              }

              final filteredOrders =
                  _orderController.getFilteredOrders(_selectedFilter);

              if (filteredOrders.isEmpty) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.shopping_bag_outlined,
                        size: 48.sp,
                        color: Colors.grey,
                      ),
                      SizedBox(height: 12.h),
                      WText(
                        text: 'No orders found',
                        fontSize: 14.sp,
                        color: Colors.grey,
                      ),
                    ],
                  ),
                );
              }

              return RefreshIndicator(
                onRefresh: () => _orderController.getMyOrders(),
                color: R.color.oceanBlue,
                child: ListView.builder(
                  padding:
                      EdgeInsets.fromLTRB(16.w, 16.h, 16.w, 120.h),
                  itemCount: filteredOrders.length,
                  itemBuilder: (context, index) {
                    return OrderCard(
                      order: filteredOrders[index],
                      orderController: _orderController,
                    );
                  },
                ),
              );
            }),
          ),
        ],
      ),
    );
  }
}


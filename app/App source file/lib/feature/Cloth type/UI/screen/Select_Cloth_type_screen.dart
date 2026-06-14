import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:ultrawash/app/resource.dart';
import 'package:ultrawash/app/widget_button.dart';
import 'package:ultrawash/app/wtext.dart';
import 'package:ultrawash/feature/Add/UI/controller/add_service_controller.dart';
import 'package:ultrawash/feature/Cloth type/model/service_order_model.dart';
import 'package:ultrawash/feature/your Order/UI/screen/Place_your_Order_screen.dart';
import '../widget/cloth_item_card.dart';


class SelectClothTypeScreen extends StatefulWidget {
  final String serviceSlug;
  final List<ServiceOrder>? existingOrders; // Existing orders when coming from "Add More"

  const SelectClothTypeScreen({
    super.key,
    required this.serviceSlug,
    this.existingOrders,
  });

  @override
  State<SelectClothTypeScreen> createState() => _SelectClothTypeScreenState();
}

class _SelectClothTypeScreenState extends State<SelectClothTypeScreen> {
  final AddServiceControllers _serviceController = Get.find<AddServiceControllers>();
  bool _hideUnselectedCategories = false;

  // Track quantities for each item
  final Map<String, int> _itemQuantities = {};

  @override
  void initState() {
    super.initState();
    // Fetch service details by slug
    _serviceController.getServiceBySlug(widget.serviceSlug);

    // Load existing quantities if coming from "Add More"
    _loadExistingQuantities();
  }

  void _loadExistingQuantities() {
    if (widget.existingOrders != null) {
      // Find if this service already has items in existing orders
      final existingOrder = widget.existingOrders!.firstWhereOrNull(
        (order) => order.serviceSlug == widget.serviceSlug,
      );

      if (existingOrder != null) {
        // Load existing quantities
        for (var item in existingOrder.items) {
          _itemQuantities[item.itemId] = item.quantity;
        }
      }
    }
  }

  int _getQuantity(String itemId) {
    return _itemQuantities[itemId] ?? 0;
  }

  void _addItem(String itemId) {
    setState(() {
      _itemQuantities[itemId] = 1;
    });
  }

  void _increaseQuantity(String itemId) {
    setState(() {
      _itemQuantities[itemId] = (_itemQuantities[itemId] ?? 0) + 1;
    });
  }

  void _decreaseQuantity(String itemId) {
    setState(() {
      if ((_itemQuantities[itemId] ?? 0) > 0) {
        _itemQuantities[itemId] = (_itemQuantities[itemId] ?? 0) - 1;
      }
    });
  }

  int _getTotalItems() {
    return _itemQuantities.values.fold(0, (sum, qty) => sum + qty);
  }

  double _getTotalPrice() {
    double total = 0;
    final items = _serviceController.serviceItems;
    for (var item in items) {
      final qty = _itemQuantities[item.sId ?? ''] ?? 0;
      final price = (item.price is int) ? (item.price as int).toDouble() : (item.price ?? 0.0);
      total += price * qty;
    }
    return total;
  }

  void _confirmOrder() {
    if (_getTotalItems() > 0) {
      // Create ServiceOrder from selected items
      final items = _serviceController.serviceItems;
      final orderItems = <OrderItem>[];

      for (var item in items) {
        final qty = _itemQuantities[item.sId ?? ''] ?? 0;
        if (qty > 0) {
          final price = (item.price is int) ? (item.price as int).toDouble() : (item.price ?? 0.0);
          orderItems.add(OrderItem(
            itemId: item.sId ?? '',
            itemName: item.name ?? 'Item',
            price: price,
            image: item.image,
            quantity: qty,
          ));
        }
      }

      final newOrder = ServiceOrder(
        serviceId: _serviceController.serviceDetails.value?.data?.sId ?? '',
        serviceName: _serviceController.serviceName,
        serviceSlug: widget.serviceSlug,
        items: orderItems,
      );

      // Combine with existing orders if any
      final allOrders = <ServiceOrder>[...?widget.existingOrders];

      // Check if this service already exists in orders - replace it
      final existingIndex = allOrders.indexWhere((o) => o.serviceSlug == widget.serviceSlug);
      if (existingIndex != -1) {
        // Replace existing order with new one (quantities are already updated)
        allOrders[existingIndex] = newOrder;
      } else {
        allOrders.add(newOrder);
      }

      Get.off(() => PlaceYourOrderScreen(orders: allOrders));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Please select at least one item'),
          backgroundColor: Colors.red,
        ),
      );
    }
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
                Obx(() => WText(
                  text: _serviceController.serviceName.isNotEmpty
                      ? _serviceController.serviceName
                      : "Select Cloth type",
                  fontSize: 16.sp,
                  fontWeight: FontWeight.w600,
                  color: R.color.charcoal,
                )),
              ],
            ),
          ),

          // Content
          Expanded(
            child: Obx(() {
              // Show loading state
              if (_serviceController.isLoadingDetails.value) {
                return Center(
                  child: CircularProgressIndicator(
                    color: R.color.oceanBlue,
                  ),
                );
              }

              final items = _serviceController.serviceItems;

              if (items.isEmpty) {
                return Center(
                  child: WText(
                    text: 'No items available',
                    fontSize: 16.sp,
                    color: R.color.charcoal,
                  ),
                );
              }

              return SingleChildScrollView(
                child: Padding(
                  padding: EdgeInsets.all(16.w),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Build your Order header card
                      Container(
                        width: 380.w,
                        padding: EdgeInsets.all(12.w),
                        decoration: BoxDecoration(
                          color: R.color.deepTeal1,
                          borderRadius: BorderRadius.circular(8.r),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                WText(
                                  text: 'Build your Order',
                                  color: R.color.charcoal,
                                ),
                                // Price tag
                                Container(
                                  padding: EdgeInsets.symmetric(
                                    horizontal: 16.w,
                                    vertical: 8.h,
                                  ),
                                  decoration: BoxDecoration(
                                    color: R.color.oceanBlue,
                                    borderRadius: BorderRadius.circular(16.r),
                                  ),
                                  child: Column(
                                    children: [
                                      WText(
                                        text: '\$${_getTotalPrice().toStringAsFixed(2)}',
                                        fontSize: 18.sp,
                                        color: R.color.white2,
                                      ),
                                      WText(
                                        text: '${_getTotalItems()} items',
                                        fontSize: 10.sp,
                                        fontWeight: FontWeight.w400,
                                        color: R.color.white2,
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            SizedBox(height: 8.h),
                            // Checkbox
                            GestureDetector(
                              onTap: () {
                                setState(() {
                                  _hideUnselectedCategories = !_hideUnselectedCategories;
                                });
                              },
                              child: Row(
                                children: [
                                  Container(
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
                                  SizedBox(width: 8.w),
                                  WText(
                                    text: 'Hide unselected categories',
                                    fontSize: 12.sp,
                                    fontWeight: FontWeight.w400,
                                    color: R.color.slateBlueGrey,
                                  ),
                                ],
                              ),
                            ),
                            SizedBox(height: 12.h),
                            // Order summary text
                            WText(
                              text: _serviceController.serviceDescription.isNotEmpty
                                  ? _serviceController.serviceDescription
                                  : 'Select items to add to your order',
                              fontSize: 14.sp,
                              fontWeight: FontWeight.w500,
                              color: R.color.charcoal,
                              maxLines: 3,
                            ),
                          ],
                        ),
                      ),
                      SizedBox(height: 16.h),

                      // Category header
                      Container(
                        width: 380.w,
                        height: 39.h,
                        padding: EdgeInsets.all(10.w),
                        decoration: BoxDecoration(
                          color: R.color.lightSkyBlue2,
                          borderRadius: BorderRadius.circular(8.r),
                        ),
                        child: WText(
                          text: _serviceController.serviceName,
                          fontWeight: FontWeight.w500,
                          color: R.color.charcoal1,
                        ),
                      ),

                      // Items Grid
                      GridView.builder(
                        shrinkWrap: true,
                        physics: NeverScrollableScrollPhysics(),
                        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          crossAxisSpacing: 8.w,
                          mainAxisSpacing: 8.h,
                          childAspectRatio: 182 / 136,
                        ),
                        itemCount: items.length,
                        itemBuilder: (context, index) {
                          final item = items[index];
                          final itemId = item.sId ?? '';
                          if (_hideUnselectedCategories && _getQuantity(itemId) == 0) {
                            return SizedBox.shrink();
                          }
                          return ClothItemCard(
                            item: item,
                            index: index,
                            quantity: _getQuantity(itemId),
                            onAdd: () => _addItem(itemId),
                            onIncrease: () => _increaseQuantity(itemId),
                            onDecrease: () => _decreaseQuantity(itemId),
                          );
                        },
                      ),

                      SizedBox(height: 16.h),
                      // Confirm Button
                      WButton(
                        onPressed: _confirmOrder,
                        label: 'Confirm',
                        decorationType: DecorationType.solid,
                        buttonColor: R.color.deepNavyBlue2,
                        textColor: R.color.white2,
                      ),
                      SizedBox(height: 120.h),
                    ],
                  ),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

}

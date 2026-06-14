import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ultrawash/core/service/api_service/api_service.dart';
import 'package:ultrawash/feature/order/model/order_model.dart';
import 'package:ultrawash/feature/order/model/each_order_model.dart' as each;

class OrderControllers extends GetxController {
  final NetworkService _networkService = NetworkService();

  // Observable states
  final RxBool isLoading = false.obs;
  final RxBool isLoadingDetail = false.obs;
  final RxString errorMessage = ''.obs;
  final Rx<AllOrderModel?> ordersData = Rx<AllOrderModel?>(null);
  final Rx<each.EachOrderMOdel?> orderDetail = Rx<each.EachOrderMOdel?>(null);

  /// Clear all cached data (call on logout or before new login)
  void clearData() {
    ordersData.value = null;
    orderDetail.value = null;
    errorMessage.value = '';
  }

  // GET /orders/my-orders - Get all user orders
  Future<bool> getMyOrders() async {
    try {
      isLoading.value = true;
      errorMessage.value = '';

      final response = await _networkService.client.getRequest('/orders/my-orders');

      if (response.isSuccess && response.responseData != null) {
        ordersData.value = AllOrderModel.fromJson(response.responseData);
        return true;
      }

      errorMessage.value = response.errorMessage ?? 'Failed to get orders';
      _showErrorSnackbar(errorMessage.value);
      return false;
    } catch (e) {
      errorMessage.value = e.toString();
      _showErrorSnackbar(errorMessage.value);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  // GET /orders/:id - Get single order details
  Future<bool> getOrderById(String id) async {
    try {
      isLoadingDetail.value = true;
      errorMessage.value = '';

      final response = await _networkService.client.getRequest('/orders/$id');

      if (response.isSuccess && response.responseData != null) {
        orderDetail.value = each.EachOrderMOdel.fromJson(response.responseData);
        return true;
      }

      errorMessage.value = response.errorMessage ?? 'Failed to get order details';
      _showErrorSnackbar(errorMessage.value);
      return false;
    } catch (e) {
      errorMessage.value = e.toString();
      _showErrorSnackbar(errorMessage.value);
      return false;
    } finally {
      isLoadingDetail.value = false;
    }
  }

  // Order cancellation state
  final RxBool isCancelling = false.obs;

  // PUT /orders/:id/cancel - Cancel an order
  Future<bool> cancelOrder(String id) async {
    try {
      isCancelling.value = true;
      errorMessage.value = '';

      final response = await _networkService.client.putRequest(
        '/orders/$id/cancel',
        body: {},
      );

      if (response.isSuccess && response.responseData != null) {
        final status = response.responseData['status'];
        if (status == 'success') {
          // Refresh orders list
          await getMyOrders();
          Get.snackbar(
            'Success',
            response.responseData['message'] ?? 'Order cancelled successfully',
            snackPosition: SnackPosition.BOTTOM,
            backgroundColor: Colors.green,
            colorText: Colors.white,
            duration: const Duration(seconds: 2),
          );
          return true;
        }
      }

      errorMessage.value = response.errorMessage ?? 'Failed to cancel order';
      _showErrorSnackbar(errorMessage.value);
      return false;
    } catch (e) {
      errorMessage.value = e.toString();
      _showErrorSnackbar(errorMessage.value);
      return false;
    } finally {
      isCancelling.value = false;
    }
  }

  // Helper getters
  List<Data> get allOrders => ordersData.value?.data ?? [];

  List<Data> getFilteredOrders(String filter) {
    final orders = allOrders;
    if (filter == 'All') return orders;

    return orders.where((order) {
      final status = (order.status ?? '').toLowerCase();
      switch (filter) {
        case 'Ongoing':
          return status == 'pending' ||
              status == 'confirmed' ||
              status == 'picked_up' ||
              status == 'in_progress' ||
              status == 'ongoing';
        case 'Canceled':
          return status == 'cancelled' || status == 'canceled';
        case 'Complete':
          return status == 'completed' ||
              status == 'complete' ||
              status == 'delivered';
        default:
          return true;
      }
    }).toList();
  }

  void _showErrorSnackbar(String message) {
    Get.snackbar(
      'Error',
      message,
      snackPosition: SnackPosition.BOTTOM,
      backgroundColor: Colors.red,
      colorText: Colors.white,
      duration: const Duration(seconds: 3),
    );
  }
}


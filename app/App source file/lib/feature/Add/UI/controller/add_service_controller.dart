import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ultrawash/core/service/api_service/api_service.dart';
import 'package:ultrawash/feature/Add/model/add_service_model.dart';
import 'package:ultrawash/feature/Add/model/AddServiceSlagModel.dart' as slug_model;
import 'package:ultrawash/feature/Cloth type/model/service_order_model.dart';

class AddServiceControllers extends GetxController {
  final NetworkService _networkService = NetworkService();

  // Observable states
  final RxBool isLoading = false.obs;
  final RxBool isLoadingDetails = false.obs;
  final RxString errorMessage = ''.obs;

  // Services data
  final Rx<ServiceModel?> servicesData = Rx<ServiceModel?>(null);
  final Rx<slug_model.AddServiceSlagModel?> serviceDetails = Rx<slug_model.AddServiceSlagModel?>(null);

  // Filtered lists for Regular and Special services
  final RxList<Data> regularServices = <Data>[].obs;
  final RxList<Data> specialServices = <Data>[].obs;

  @override
  void onInit() {
    super.onInit();
    getAllServices();
  }

  // GET /services - Get all services
  Future<bool> getAllServices() async {
    try {
      isLoading.value = true;
      errorMessage.value = '';

      final response = await _networkService.client.getRequest('/services');

      if (response.isSuccess && response.responseData != null) {
        servicesData.value = ServiceModel.fromJson(response.responseData);
        _filterServices();
        return true;
      }

      errorMessage.value = response.errorMessage ?? 'Failed to get services';
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

  // Filter services into Regular and Special categories
  void _filterServices() {
    final allServicesList = servicesData.value?.data ?? [];

    // Special services: category is 'special' or 'premium'
    specialServices.value = allServicesList.where((service) {
      final category = service.category?.toLowerCase() ?? '';
      return category == 'special' || category == 'premium';
    }).toList();

    // Regular services: all other categories (washing, dry_cleaning, ironing, etc.)
    regularServices.value = allServicesList.where((service) {
      final category = service.category?.toLowerCase() ?? '';
      return category != 'special' && category != 'premium';
    }).toList();
  }

  // GET /services/:slug - Get service details by slug
  Future<bool> getServiceBySlug(String slug) async {
    try {
      isLoadingDetails.value = true;
      errorMessage.value = '';

      final response = await _networkService.client.getRequest('/services/$slug');

      if (response.isSuccess && response.responseData != null) {
        serviceDetails.value = slug_model.AddServiceSlagModel.fromJson(response.responseData);
        return true;
      }

      errorMessage.value = response.errorMessage ?? 'Failed to get service details';
      _showErrorSnackbar(errorMessage.value);
      return false;
    } catch (e) {
      errorMessage.value = e.toString();
      _showErrorSnackbar(errorMessage.value);
      return false;
    } finally {
      isLoadingDetails.value = false;
    }
  }

  // Coupon states
  final RxBool isValidatingCoupon = false.obs;
  final RxBool isCouponApplied = false.obs;
  final RxDouble couponDiscount = 0.0.obs;
  final RxString couponCode = ''.obs;
  final RxString couponDiscountType = ''.obs;
  final RxDouble couponDiscountValue = 0.0.obs;

  // POST /coupons/validate - Validate coupon
  Future<bool> validateCoupon(String code, double orderAmount) async {
    try {
      isValidatingCoupon.value = true;
      errorMessage.value = '';

      final response = await _networkService.client.postRequest(
        '/coupons/validate',
        body: {
          'code': code,
          'orderAmount': orderAmount,
        },
      );

      if (response.isSuccess && response.responseData != null) {
        final status = response.responseData['status'];
        final data = response.responseData['data'];

        if (status == 'success' && data != null) {
          // Check minOrderValue
          final minOrderValue = (data['minOrderValue'] ?? 0).toDouble();
          if (orderAmount < minOrderValue) {
            _showErrorSnackbar('Minimum order amount is \$${minOrderValue.toStringAsFixed(0)} to use this coupon');
            return false;
          }

          isCouponApplied.value = true;
          couponDiscount.value = (data['discount'] ?? 0).toDouble();
          couponCode.value = data['code'] ?? code;
          couponDiscountType.value = data['discountType'] ?? '';
          couponDiscountValue.value = (data['discountValue'] ?? 0).toDouble();

          _showSuccessSnackbar('Coupon applied! You saved \$${couponDiscount.value.toStringAsFixed(2)}');
          return true;
        } else {
          final msg = response.responseData['message'] ?? 'Invalid coupon code';
          _showErrorSnackbar(msg);
          return false;
        }
      }

      errorMessage.value = response.errorMessage ?? 'Failed to validate coupon';
      _showErrorSnackbar(errorMessage.value);
      return false;
    } catch (e) {
      errorMessage.value = e.toString();
      _showErrorSnackbar(errorMessage.value);
      return false;
    } finally {
      isValidatingCoupon.value = false;
    }
  }

  // Remove applied coupon
  void removeCoupon() {
    isCouponApplied.value = false;
    couponDiscount.value = 0.0;
    couponCode.value = '';
    couponDiscountType.value = '';
    couponDiscountValue.value = 0.0;
  }

  // Order placement states
  final RxBool isPlacingOrder = false.obs;

  // POST /orders - Place an order
  Future<Map<String, dynamic>?> placeOrder({
    required List<ServiceOrder> orders,
    required Map<String, dynamic> billingInfo,
    required Map<String, dynamic> shippingInfo,
    required String paymentMethod,
    String? couponCode,
    double couponDiscount = 0,
    double deliverySpeedCharge = 0,
    String deliveryType = 'standard',
    String notes = '',
  }) async {
    try {
      isPlacingOrder.value = true;
      errorMessage.value = '';

      // Build items array from orders
      final List<Map<String, dynamic>> items = [];
      for (var order in orders) {
        for (var item in order.items) {
          if (item.quantity > 0) {
            items.add({
              'service': order.serviceId,
              'serviceName': '${order.serviceName} - ${item.itemName}',
              'quantity': item.quantity,
              'price': item.price,
              'subtotal': item.price * item.quantity,
            });
          }
        }
      }

      final body = <String, dynamic>{
        'items': items,
        'billingInfo': billingInfo,
        'shippingInfo': shippingInfo,
        'deliveryType': deliveryType,
        'deliverySpeedCharge': deliverySpeedCharge,
        'address': billingInfo['address'] ?? '',
        'notes': notes,
        'paymentMethod': paymentMethod,
      };

      if (couponCode != null && couponCode.isNotEmpty) {
        body['couponCode'] = couponCode;
        body['couponDiscount'] = couponDiscount;
      }

      final response = await _networkService.client.postRequest(
        '/orders',
        body: body,
      );

      if (response.isSuccess && response.responseData != null) {
        return response.responseData['data'];
      }

      errorMessage.value = response.errorMessage ?? 'Failed to place order';
      _showErrorSnackbar(errorMessage.value);
      return null;
    } catch (e) {
      errorMessage.value = e.toString();
      _showErrorSnackbar(errorMessage.value);
      return null;
    } finally {
      isPlacingOrder.value = false;
    }
  }

  // Helper getters
  List<Data> get allServices => servicesData.value?.data ?? [];

  // Get service items from details
  List<slug_model.Items> get serviceItems => serviceDetails.value?.data?.items ?? [];
  String get serviceName => serviceDetails.value?.data?.name ?? '';
  String get serviceDescription => serviceDetails.value?.data?.description ?? '';
  double get servicePricePerKg => (serviceDetails.value?.data?.pricePerKg ?? 0).toDouble();
  double get servicePricePerItem => (serviceDetails.value?.data?.pricePerItem ?? 0).toDouble();

  void _showSuccessSnackbar(String message) {
    Get.snackbar(
      'Success',
      message,
      snackPosition: SnackPosition.BOTTOM,
      backgroundColor: Colors.green,
      colorText: Colors.white,
      duration: const Duration(seconds: 2),
    );
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
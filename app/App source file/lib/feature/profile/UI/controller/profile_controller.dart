import 'dart:convert';
import 'dart:io';
import 'package:dio/dio.dart' as dio;
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ultrawash/core/service/api_service/api_service.dart';
import 'package:ultrawash/core/service/session/session.dart';
import 'package:ultrawash/feature/profile/model/ProfileModel.dart';
import 'package:ultrawash/feature/profile/model/coupon_model.dart' as coupon;

class ProfileControllers extends GetxController {
  final NetworkService _networkService = NetworkService();

  // Observable states
  final RxBool isLoading = false.obs;
  final RxBool isUploading = false.obs;
  final RxBool isUpdating = false.obs;
  final RxBool isLoadingCoupons = false.obs;
  final RxString errorMessage = ''.obs;
  final Rx<ProfileModel?> profileData = Rx<ProfileModel?>(null);
  final Rx<coupon.CoupomModel?> couponsData = Rx<coupon.CoupomModel?>(null);

  @override
  void onInit() {
    super.onInit();
    // Only fetch profile if user is already logged in (token exists)
    if (Session.accessToken != null && Session.accessToken!.isNotEmpty) {
      getProfile();
    }
  }

  /// Clear all cached data (call on logout or before new login)
  void clearData() {
    profileData.value = null;
    couponsData.value = null;
    errorMessage.value = '';
  }

  // GET /auth/profile - Get user profile
  Future<bool> getProfile() async {
    try {
      isLoading.value = true;
      errorMessage.value = '';

      final response = await _networkService.client.getRequest('/auth/profile');

      if (response.isSuccess && response.responseData != null) {
        profileData.value = ProfileModel.fromJson(response.responseData);
        return true;
      }

      errorMessage.value = response.errorMessage ?? 'Failed to get profile';
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

  // PUT /auth/profile - Update user profile
  Future<bool> updateProfile({
    required String name,
    required String phone,
    required String address,
    String? profileImage,
  }) async {
    try {
      isUpdating.value = true;
      errorMessage.value = '';

      final Map<String, dynamic> body = {
        'name': name,
        'phone': phone,
        'address': address,
      };

      if (profileImage != null && profileImage.isNotEmpty) {
        body['profileImage'] = profileImage;
      }

      final response = await _networkService.client.putRequest(
        '/auth/profile',
        body: body,
      );

      if (response.isSuccess && response.responseData != null) {
        // Refresh profile data after update
        await getProfile();
        _showSuccessSnackbar(response.responseData['message'] ?? 'Profile updated successfully');
        return true;
      }

      errorMessage.value = response.errorMessage ?? 'Failed to update profile';
      _showErrorSnackbar(errorMessage.value);
      return false;
    } catch (e) {
      errorMessage.value = e.toString();
      _showErrorSnackbar(errorMessage.value);
      return false;
    } finally {
      isUpdating.value = false;
    }
  }

  // Upload image directly to ImgBB and get URL
  Future<String?> uploadImage(File imageFile) async {
    try {
      isUploading.value = true;

      final bytes = await imageFile.readAsBytes();
      final base64Image = base64Encode(bytes);

      final imgbbDio = dio.Dio(dio.BaseOptions(
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        sendTimeout: const Duration(seconds: 30),
        validateStatus: (status) => status != null && status < 600,
      ));

      final imgbbResponse = await imgbbDio.post(
        'https://api.imgbb.com/1/upload',
        data: dio.FormData.fromMap({
          'key': '062499640037b87a330cb09793b95435',
          'image': base64Image,
        }),
      );

      if (imgbbResponse.statusCode == 200 && imgbbResponse.data != null) {
        final imgData = imgbbResponse.data['data'];
        if (imgData != null) {
          final url = imgData['display_url'] ?? imgData['url'];
          if (url != null) {
            return url as String;
          }
        }
      }

      _showErrorSnackbar('Failed to upload image');
      return null;
    } catch (e) {
      _showErrorSnackbar('Failed to upload image');
      return null;
    } finally {
      isUploading.value = false;
    }
  }

  // GET /coupons/active - Get active coupons
  Future<bool> getActiveCoupons() async {
    try {
      isLoadingCoupons.value = true;
      errorMessage.value = '';

      final response = await _networkService.client.getRequest('/coupons/active');

      if (response.isSuccess && response.responseData != null) {
        couponsData.value = coupon.CoupomModel.fromJson(response.responseData);
        return true;
      }

      errorMessage.value = response.errorMessage ?? 'Failed to get coupons';
      _showErrorSnackbar(errorMessage.value);
      return false;
    } catch (e) {
      errorMessage.value = e.toString();
      _showErrorSnackbar(errorMessage.value);
      return false;
    } finally {
      isLoadingCoupons.value = false;
    }
  }

  // Coupon helper
  List<coupon.Data> get allCoupons => couponsData.value?.data ?? [];

  // PUT /auth/change-password
  final RxBool isChangingPassword = false.obs;

  Future<bool> changePassword({
    required String currentPassword,
    required String newPassword,
    required String confirmPassword,
  }) async {
    try {
      isChangingPassword.value = true;
      errorMessage.value = '';

      final response = await _networkService.client.putRequest(
        '/auth/change-password',
        body: {
          'currentPassword': currentPassword,
          'newPassword': newPassword,
          'confirmPassword': confirmPassword,
        },
      );

      if (response.isSuccess) {
        _showSuccessSnackbar(response.responseData?['message'] ?? 'Password changed successfully');
        return true;
      }

      errorMessage.value = response.errorMessage ?? 'Failed to change password';
      _showErrorSnackbar(errorMessage.value);
      return false;
    } catch (e) {
      errorMessage.value = e.toString();
      _showErrorSnackbar(errorMessage.value);
      return false;
    } finally {
      isChangingPassword.value = false;
    }
  }

  // Helper getters
  String get userName => profileData.value?.data?.name ?? 'User';
  String get userEmail => profileData.value?.data?.email ?? '';
  String get userPhone => profileData.value?.data?.phone ?? '';
  String get userAddress => profileData.value?.data?.address ?? '';
  String? get userProfileImage => profileData.value?.data?.profileImage;
  bool get isVerified => profileData.value?.data?.isVerified ?? false;

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
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:ultrawash/core/service/api_service/api_service.dart';
import 'package:ultrawash/core/service/session/session.dart';
import 'package:ultrawash/core/service/shared_preferance/shared_prefarance.dart';
import 'package:ultrawash/feature/profile/UI/controller/profile_controller.dart';
import 'package:ultrawash/feature/order/ui/controller/order_controller.dart';
import 'package:ultrawash/feature/Chat Token/UI/controller/chat_token_conteroller.dart';

class AuthController extends GetxController {
  final NetworkService _networkService = NetworkService();
  final SharedPrefs _sharedPrefs = SharedPrefs();
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
  );

  // Observable states
  final RxBool isLoading = false.obs;
  final RxString errorMessage = ''.obs;
  final Rx<Map<String, dynamic>?> currentUser = Rx<Map<String, dynamic>?>(null);

  // Forgot password states
  final RxString resetToken = ''.obs;
  final RxString forgotPasswordEmail = ''.obs;

  /// Clear all permanent controllers' cached data
  void _clearAllControllersData() {
    try {
      if (Get.isRegistered<ProfileControllers>()) {
        Get.find<ProfileControllers>().clearData();
      }
    } catch (_) {}
    try {
      if (Get.isRegistered<OrderControllers>()) {
        Get.find<OrderControllers>().clearData();
      }
    } catch (_) {}
    try {
      if (Get.isRegistered<ChatTokenControllers>()) {
        Get.find<ChatTokenControllers>().clearData();
      }
    } catch (_) {}
  }

  // Login method
  Future<bool> login({
    required String emailOrPhone,
    required String password,
  }) async {
    try {
      isLoading.value = true;
      errorMessage.value = '';

      // Clear any existing session token before login
      // so the old Authorization header is NOT sent
      await _sharedPrefs.clear();
      Session.clear();
      currentUser.value = null;
      _clearAllControllersData();

      final response = await _networkService.client.postRequest(
        '/auth/login',
        body: {
          'emailOrPhone': emailOrPhone,
          'password': password,
        },
      );

      if (response.isSuccess && response.responseData != null) {
        final responseData = response.responseData;
        final token = responseData['token'] as String?;
        final user = responseData['user'] as Map<String, dynamic>?;

        if (token != null) {
          await _sharedPrefs.saveToken(token);
        }
        if (user != null) {
          await _sharedPrefs.saveUser(user);
          currentUser.value = user;
        }

        // Force re-fetch profile with the NEW token
        _forceRefreshProfile();

        _showSuccessSnackbar(responseData['message'] ?? 'Login successful');
        return true;
      }

      errorMessage.value = response.errorMessage ?? 'Login failed';
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

  // Register method
  Future<bool> register({
    required String name,
    required String email,
    required String phone,
    required String password,
    required String confirmPassword,
  }) async {
    try {
      isLoading.value = true;
      errorMessage.value = '';

      final response = await _networkService.client.postRequest(
        '/auth/register',
        body: {
          'name': name,
          'email': email,
          'phone': phone,
          'password': password,
          'confirmPassword': confirmPassword,
        },
      );

      if (response.isSuccess && response.responseData != null) {
        final responseData = response.responseData;
        final token = responseData['token'] as String?;
        final user = responseData['user'] as Map<String, dynamic>?;

        if (token != null) {
          await _sharedPrefs.saveToken(token);
        }
        if (user != null) {
          await _sharedPrefs.saveUser(user);
          currentUser.value = user;
        }

        _showSuccessSnackbar(responseData['message'] ?? 'Registration successful');
        return true;
      }

      errorMessage.value = response.errorMessage ?? 'Registration failed';
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

  // Google Sign-In method
  Future<bool> googleLogin() async {
    try {
      isLoading.value = true;
      errorMessage.value = '';

      // Clear old session data before new login
      await _sharedPrefs.clear();
      Session.clear();
      currentUser.value = null;
      _clearAllControllersData();

      // Sign out from any previous session
      await _googleSignIn.signOut();

      // Trigger Google Sign-In flow
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();

      if (googleUser == null) {
        // User cancelled the sign-in
        isLoading.value = false;
        return false;
      }

      // Get Google Auth credentials
      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;

      // Get the Google ID token
      final String? idToken = googleAuth.idToken;

      if (idToken == null) {
        errorMessage.value = 'Failed to get ID token';
        _showErrorSnackbar(errorMessage.value);
        return false;
      }

      // Call backend API with the Google ID token
      final response = await _networkService.client.postRequest(
        '/auth/google',
        body: {
          'idToken': idToken,
        },
      );

      if (response.isSuccess && response.responseData != null) {
        final responseData = response.responseData;
        final token = responseData['token'] as String?;
        final user = responseData['user'] as Map<String, dynamic>?;

        if (token != null) {
          await _sharedPrefs.saveToken(token);
        }
        if (user != null) {
          await _sharedPrefs.saveUser(user);
          currentUser.value = user;
        }

        // Force re-fetch profile with the NEW token
        _forceRefreshProfile();

        _showSuccessSnackbar(responseData['message'] ?? 'Google login successful');
        return true;
      }

      errorMessage.value = response.errorMessage ?? 'Google login failed';
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

  // Forgot Password - Send OTP
  Future<bool> forgotPassword({
    required String emailOrPhone,
  }) async {
    try {
      isLoading.value = true;
      errorMessage.value = '';

      final response = await _networkService.client.postRequest(
        '/auth/forgot-password',
        body: {
          'emailOrPhone': emailOrPhone,
        },
      );

      if (response.isSuccess && response.responseData != null) {
        final responseData = response.responseData;
        // Store email for later use in OTP verification and reset password
        forgotPasswordEmail.value = emailOrPhone;

        _showSuccessSnackbar(responseData['message'] ?? 'OTP sent to your email');
        return true;
      }

      errorMessage.value = response.errorMessage ?? 'Failed to send OTP';
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

  // Verify Forgot Password OTP
  Future<bool> verifyForgotOtp({
    required String otp,
  }) async {
    try {
      isLoading.value = true;
      errorMessage.value = '';

      final response = await _networkService.client.postRequest(
        '/auth/verify-forgot-otp',
        body: {
          'emailOrPhone': forgotPasswordEmail.value,
          'otp': otp,
        },
      );

      if (response.isSuccess && response.responseData != null) {
        final responseData = response.responseData;
        // Store reset token for password reset
        resetToken.value = responseData['resetToken'] as String? ?? '';

        _showSuccessSnackbar(responseData['message'] ?? 'OTP verified successfully');
        return true;
      }

      errorMessage.value = response.errorMessage ?? 'OTP verification failed';
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

  // Reset Password
  Future<bool> resetPassword({
    required String newPassword,
    required String confirmPassword,
  }) async {
    try {
      isLoading.value = true;
      errorMessage.value = '';

      final response = await _networkService.client.postRequest(
        '/auth/reset-password',
        body: {
          'emailOrPhone': forgotPasswordEmail.value,
          'newPassword': newPassword,
          'confirmPassword': confirmPassword,
          'resetToken': resetToken.value,
        },
      );

      if (response.isSuccess && response.responseData != null) {
        final responseData = response.responseData;

        // Clear stored data after successful reset
        resetToken.value = '';
        forgotPasswordEmail.value = '';

        _showSuccessSnackbar(responseData['message'] ?? 'Password reset successfully');
        return true;
      }

      errorMessage.value = response.errorMessage ?? 'Password reset failed';
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

  // Logout method
  Future<bool> logout() async {
    try {
      isLoading.value = true;

      // Call logout API
      final response = await _networkService.client.postRequest(
        '/auth/logout',
        body: {},
      );

      // Clear local data regardless of API response
      await _sharedPrefs.clear();
      Session.clear();
      currentUser.value = null;
      _clearAllControllersData();

      if (response.isSuccess) {
        _showSuccessSnackbar(response.responseData?['message'] ?? 'Logged out successfully');
      }

      return true;
    } catch (e) {
      // Even if API fails, clear local data
      await _sharedPrefs.clear();
      Session.clear();
      currentUser.value = null;
      _clearAllControllersData();
      return true;
    } finally {
      isLoading.value = false;
    }}

  // Check if user is logged in
  Future<bool> isLoggedIn() async {
    final token = await _sharedPrefs.getToken();
    if (token != null && token.isNotEmpty) {
      final user = await _sharedPrefs.getUser();
      currentUser.value = user;
      return true;
    }
    return false;
  }

  // Load current user from storage
  Future<void> loadCurrentUser() async {
    final user = await _sharedPrefs.getUser();
    currentUser.value = user;
  }

  /// Force re-fetch profile data after a new login
  void _forceRefreshProfile() {
    try {
      if (Get.isRegistered<ProfileControllers>()) {
        final profileCtrl = Get.find<ProfileControllers>();
        profileCtrl.clearData(); // clear old data first
        profileCtrl.getProfile(); // fetch new profile
      }
    } catch (_) {}
  }

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
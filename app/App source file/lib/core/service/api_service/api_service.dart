

import 'package:get/get.dart';
import 'package:ultrawash/core/service/network/network_client.dart';
import 'package:ultrawash/core/service/session/session.dart';
import 'package:ultrawash/core/service/shared_preferance/shared_prefarance.dart';
import 'package:ultrawash/feature/auth/ui/screen/login_screen.dart';

class NetworkService {
  late final NetworkClient client;

  NetworkService() {
    client = NetworkClient(
      baseUrl: 'https://laundry-service-booking-app-backend.onrender.com/api/v1',
      onUnAuthorize: _handleUnauthorized,
      commonHeaders: _buildHeaders,
    );
  }

  Map<String, String> _buildHeaders() {
    final h = <String, String>{
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    final t = Session.accessToken;        // <- sync from cache
    if (t != null && t.isNotEmpty) {
      h['Authorization'] = 'Bearer $t';
    }
    return h;
  }

  void _handleUnauthorized() async {
    // Don't handle if no token was set (prevents startup race condition)
    if (Session.accessToken == null || Session.accessToken!.isEmpty) {
      return;
    }

    // Clear local storage and session
    final sharedPrefs = SharedPrefs();
    await sharedPrefs.clear();
    Session.accessToken = null;

    // Navigate to login screen
    Get.offAll(() => const LoginScreen());

    Get.snackbar(
      'Session Expired',
      'Please login again',
      snackPosition: SnackPosition.BOTTOM,
    );
  }
}
import 'package:dio/dio.dart';
import 'package:ultrawash/core/cleango/session/session_store.dart';
import 'package:ultrawash/core/cleango/session/shared_preferences_session_store.dart';
import 'package:ultrawash/core/service/network/network_client.dart';
import 'package:ultrawash/core/service/session/session.dart';

class NetworkService {
  static const _baseUrl =
      'https://laundry-service-booking-app-backend.onrender.com/api/v1';

  NetworkService({SessionStore? sessionStore})
      : _sessionStore = sessionStore ?? SharedPreferencesSessionStore() {
    _refreshClient = Dio(
      BaseOptions(
        baseUrl: _baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 20),
        sendTimeout: const Duration(seconds: 20),
        responseType: ResponseType.json,
        validateStatus: (status) =>
            status != null && status >= 100 && status < 600,
      ),
    );
    client = NetworkClient(
      baseUrl: _baseUrl,
      onUnAuthorize: _handleUnauthorized,
      refreshSession: _refreshSession,
      commonHeaders: _buildHeaders,
    );
  }

  final SessionStore _sessionStore;
  late final Dio _refreshClient;
  late final NetworkClient client;

  Future<bool>? _refreshInFlight;

  Map<String, String> _buildHeaders() {
    final headers = <String, String>{
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    final token = Session.accessToken;
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  Future<bool> _refreshSession() {
    final activeRefresh = _refreshInFlight;
    if (activeRefresh != null) return activeRefresh;

    final refresh = _performRefresh();
    _refreshInFlight = refresh;
    return refresh.whenComplete(() {
      if (identical(_refreshInFlight, refresh)) {
        _refreshInFlight = null;
      }
    });
  }

  Future<bool> _performRefresh() async {
    final refreshToken = await _sessionStore.readRefreshToken();
    if (refreshToken == null || refreshToken.isEmpty) return false;

    try {
      final response = await _refreshClient.post<Map<String, dynamic>>(
        '/auth/refresh-token',
        data: {'refreshToken': refreshToken},
      );
      final data = response.data;
      final accessToken = data?['token'] as String?;
      final rotatedRefreshToken = data?['refreshToken'] as String?;

      if (response.statusCode != 200 ||
          data?['status'] != 'success' ||
          accessToken == null ||
          accessToken.isEmpty ||
          rotatedRefreshToken == null ||
          rotatedRefreshToken.isEmpty) {
        return false;
      }

      await _sessionStore.saveSession(
        accessToken: accessToken,
        refreshToken: rotatedRefreshToken,
      );
      return true;
    } on DioException {
      return false;
    }
  }

  Future<void> _handleUnauthorized() async {
    await _sessionStore.clear();
  }
}
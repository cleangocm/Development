import 'dart:convert';

import 'package:ultrawash/core/cleango/session/current_customer_provider.dart';
import 'package:ultrawash/core/cleango/session/session_store.dart';

class RestCurrentCustomerProvider implements CurrentCustomerProvider {
  RestCurrentCustomerProvider({required this.sessionStore});

  final SessionStore sessionStore;

  String? _currentCustomerId;
  bool _loggedIn = false;

  @override
  Future<String?> getCurrentCustomerId() async {
    await refresh();
    return _currentCustomerId;
  }

  @override
  Future<bool> isLoggedIn() async {
    await refresh();
    return _loggedIn;
  }

  @override
  Future<void> refresh() async {
    final accessToken = (await sessionStore.readAccessToken())?.trim();
    if (accessToken == null || accessToken.isEmpty) {
      _clearState();
      return;
    }

    final claims = _decodeJwtClaims(accessToken);
    if (_isExpired(claims)) {
      _clearState();
      return;
    }

    final user = await sessionStore.readUser();
    _currentCustomerId = _readCustomerId(user) ?? _readCustomerId(claims);
    _loggedIn = true;
  }

  void _clearState() {
    _currentCustomerId = null;
    _loggedIn = false;
  }

  static String? _readCustomerId(Map<String, dynamic>? data) {
    if (data == null) return null;

    for (final key in const [
      'id',
      '_id',
      'customerId',
      'userId',
      'user_id',
      'sub',
    ]) {
      final value = data[key];
      if (value != null && value.toString().trim().isNotEmpty) {
        return value.toString();
      }
    }
    return null;
  }

  static Map<String, dynamic>? _decodeJwtClaims(String token) {
    final segments = token.split('.');
    if (segments.length != 3) return null;

    try {
      final payload = utf8.decode(
        base64Url.decode(base64Url.normalize(segments[1])),
      );
      final decoded = jsonDecode(payload);
      return decoded is Map<String, dynamic> ? decoded : null;
    } on FormatException {
      return null;
    }
  }

  static bool _isExpired(Map<String, dynamic>? claims) {
    final expiry = claims?['exp'];
    if (expiry is! num) return false;

    final nowInSeconds = DateTime.now().millisecondsSinceEpoch ~/ 1000;
    return nowInSeconds >= expiry.toInt();
  }
}

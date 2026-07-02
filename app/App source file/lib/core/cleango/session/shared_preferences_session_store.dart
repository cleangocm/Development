import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';
import 'package:ultrawash/core/cleango/session/session_store.dart';
import 'package:ultrawash/core/service/session/session.dart';

class SharedPreferencesSessionStore implements SessionStore {
  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _userKey = 'user';

  @override
  Future<String?> readAccessToken() async {
    final preferences = await SharedPreferences.getInstance();
    final token = preferences.getString(_accessTokenKey);
    Session.setToken(token);
    return token;
  }

  @override
  Future<String?> readRefreshToken() async {
    final preferences = await SharedPreferences.getInstance();
    return preferences.getString(_refreshTokenKey);
  }

  @override
  Future<Map<String, dynamic>?> readUser() async {
    final preferences = await SharedPreferences.getInstance();
    final encodedUser = preferences.getString(_userKey);
    if (encodedUser == null || encodedUser.isEmpty) return null;

    try {
      final decodedUser = jsonDecode(encodedUser);
      return decodedUser is Map<String, dynamic> ? decodedUser : null;
    } on FormatException {
      return null;
    }
  }

  @override
  Future<void> saveSession({
    required String accessToken,
    String? refreshToken,
    Map<String, dynamic>? user,
  }) async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.setString(_accessTokenKey, accessToken);

    if (refreshToken == null || refreshToken.isEmpty) {
      await preferences.remove(_refreshTokenKey);
    } else {
      await preferences.setString(_refreshTokenKey, refreshToken);
    }

    if (user != null) {
      await preferences.setString(_userKey, jsonEncode(user));
    }

    Session.setToken(accessToken);
  }

  @override
  Future<void> clear() async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.remove(_accessTokenKey);
    await preferences.remove(_refreshTokenKey);
    await preferences.remove(_userKey);
    Session.clear();
  }
}

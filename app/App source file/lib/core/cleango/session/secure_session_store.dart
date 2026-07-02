import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:ultrawash/core/cleango/session/session_store.dart';
import 'package:ultrawash/core/cleango/session/shared_preferences_session_store.dart';
import 'package:ultrawash/core/service/session/session.dart';

class SecureSessionStore implements SessionStore {
  SecureSessionStore({
    FlutterSecureStorage? storage,
    SharedPreferencesSessionStore? legacyStore,
  }) : _storage = storage ?? const FlutterSecureStorage(),
       _legacyStore = legacyStore ?? SharedPreferencesSessionStore();

  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _userKey = 'user';

  final FlutterSecureStorage _storage;
  final SharedPreferencesSessionStore _legacyStore;

  Future<void>? _migration;

  Future<void> _ensureMigrated() {
    return _migration ??= _migrateLegacySession();
  }

  Future<void> _migrateLegacySession() async {
    var accessToken = await _storage.read(key: _accessTokenKey);
    var refreshToken = await _storage.read(key: _refreshTokenKey);
    var encodedUser = await _storage.read(key: _userKey);

    final legacyAccessToken = await _legacyStore.readAccessToken();
    final legacyRefreshToken = await _legacyStore.readRefreshToken();
    final legacyUser = await _legacyStore.readUser();

    if ((accessToken == null || accessToken.isEmpty) &&
        legacyAccessToken != null &&
        legacyAccessToken.isNotEmpty) {
      accessToken = legacyAccessToken;
      await _storage.write(key: _accessTokenKey, value: accessToken);
    }

    if ((refreshToken == null || refreshToken.isEmpty) &&
        legacyRefreshToken != null &&
        legacyRefreshToken.isNotEmpty) {
      refreshToken = legacyRefreshToken;
      await _storage.write(key: _refreshTokenKey, value: refreshToken);
    }

    if ((encodedUser == null || encodedUser.isEmpty) && legacyUser != null) {
      encodedUser = jsonEncode(legacyUser);
      await _storage.write(key: _userKey, value: encodedUser);
    }

    if (legacyAccessToken != null ||
        legacyRefreshToken != null ||
        legacyUser != null) {
      await _legacyStore.clear();
    }

    Session.setToken(accessToken);
  }

  @override
  Future<String?> readAccessToken() async {
    await _ensureMigrated();
    final token = await _storage.read(key: _accessTokenKey);
    Session.setToken(token);
    return token;
  }

  @override
  Future<String?> readRefreshToken() async {
    await _ensureMigrated();
    return _storage.read(key: _refreshTokenKey);
  }

  @override
  Future<Map<String, dynamic>?> readUser() async {
    await _ensureMigrated();
    final encodedUser = await _storage.read(key: _userKey);
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
    await _ensureMigrated();
    await _storage.write(key: _accessTokenKey, value: accessToken);

    if (refreshToken == null || refreshToken.isEmpty) {
      await _storage.delete(key: _refreshTokenKey);
    } else {
      await _storage.write(key: _refreshTokenKey, value: refreshToken);
    }

    if (user != null) {
      await _storage.write(key: _userKey, value: jsonEncode(user));
    }

    Session.setToken(accessToken);
  }

  @override
  Future<void> clear() async {
    await Future.wait([
      _storage.delete(key: _accessTokenKey),
      _storage.delete(key: _refreshTokenKey),
      _storage.delete(key: _userKey),
    ]);
    await _legacyStore.clear();
    Session.clear();
  }
}

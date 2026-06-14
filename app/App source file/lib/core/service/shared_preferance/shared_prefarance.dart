import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../session/session.dart';

class SharedPrefs {
  static const _kAccess = 'access_token';
  static const _kUser = 'user';

  Future<void> saveToken(String token) async {
    final p = await SharedPreferences.getInstance();
    await p.setString(_kAccess, token);
    Session.setToken(token);          // <- keep cache in sync
  }

  Future<String?> getToken() async {
    final p = await SharedPreferences.getInstance();
    final t = p.getString(_kAccess);
    Session.setToken(t);              // <- prime cache if needed
    return t;
  }

  // if you need a sync getter for already-primed cache:
  String? get tokenSync => Session.accessToken;

  Future<void> saveUser(Map<String, dynamic> user) async {
    final p = await SharedPreferences.getInstance();
    await p.setString(_kUser, jsonEncode(user));
  }

  Future<Map<String, dynamic>?> getUser() async {
    final p = await SharedPreferences.getInstance();
    final s = p.getString(_kUser);
    return s == null ? null : jsonDecode(s);
  }

  Future<void> clear() async {
    final p = await SharedPreferences.getInstance();
    await p.clear();
    Session.clear();                   // <- clear cache
  }
}
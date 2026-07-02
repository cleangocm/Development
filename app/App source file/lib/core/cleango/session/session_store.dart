abstract interface class SessionStore {
  Future<String?> readAccessToken();

  Future<String?> readRefreshToken();

  Future<Map<String, dynamic>?> readUser();

  Future<void> saveSession({
    required String accessToken,
    String? refreshToken,
    Map<String, dynamic>? user,
  });

  Future<void> clear();
}

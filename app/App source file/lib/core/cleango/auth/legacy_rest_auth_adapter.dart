import 'package:ultrawash/core/cleango/auth/cleango_auth_failure.dart';
import 'package:ultrawash/core/cleango/auth/cleango_auth_result.dart';
import 'package:ultrawash/core/cleango/session/current_customer_provider.dart';
import 'package:ultrawash/core/cleango/session/session_store.dart';
import 'package:ultrawash/core/service/api_service/api_service.dart';
import 'package:ultrawash/core/service/network/network_client.dart';

class LegacyRestAuthSession {
  const LegacyRestAuthSession({
    required this.accessToken,
    required this.user,
    this.refreshToken,
  });

  final String accessToken;
  final String? refreshToken;
  final Map<String, dynamic> user;
}

class LegacyRestAuthAdapter {
  LegacyRestAuthAdapter({
    required SessionStore sessionStore,
    CurrentCustomerProvider? currentCustomerProvider,
    NetworkService? networkService,
  }) : _sessionStore = sessionStore,
       _currentCustomerProvider = currentCustomerProvider,
       _networkService =
           networkService ?? NetworkService(sessionStore: sessionStore);

  final SessionStore _sessionStore;
  final CurrentCustomerProvider? _currentCustomerProvider;
  final NetworkService _networkService;

  Future<CleangoAuthResult<LegacyRestAuthSession>> signInWithEmailPassword(
    String email,
    String password,
  ) async {
    final identifier = email.trim();
    if (identifier.isEmpty || password.isEmpty) {
      return _validationFailure('Email or phone and password are required.');
    }

    await _sessionStore.clear();
    return _authenticate(
      endpoint: '/auth/login',
      body: {'emailOrPhone': identifier, 'password': password},
    );
  }

  Future<CleangoAuthResult<LegacyRestAuthSession>> registerWithEmailPassword({
    required String name,
    required String email,
    required String phone,
    required String password,
    required String confirmPassword,
  }) async {
    if (name.trim().isEmpty ||
        email.trim().isEmpty ||
        phone.trim().isEmpty ||
        password.isEmpty ||
        confirmPassword.isEmpty) {
      return _validationFailure('All registration fields are required.');
    }
    if (password != confirmPassword) {
      return _validationFailure('Password confirmation does not match.');
    }

    return _authenticate(
      endpoint: '/auth/register',
      body: {
        'name': name.trim(),
        'email': email.trim(),
        'phone': phone.trim(),
        'password': password,
        'confirmPassword': confirmPassword,
      },
    );
  }

  Future<CleangoAuthResult<void>> signOutLegacy() async {
    final accessToken = (await _sessionStore.readAccessToken())?.trim();
    if (accessToken == null || accessToken.isEmpty) {
      await _sessionStore.clear();
      await _currentCustomerProvider?.refresh();
      return const CleangoAuthResult<void>.success();
    }

    NetworkResponse? response;
    Object? requestError;
    try {
      response = await _networkService.client.postRequest(
        '/auth/logout',
        body: const {},
      );
    } catch (error) {
      requestError = error;
    } finally {
      await _sessionStore.clear();
      await _currentCustomerProvider?.refresh();
    }

    if (requestError != null) {
      return CleangoAuthResult<void>.failure(
        CleangoAuthFailure.network(
          'Signed out locally, but the server could not be reached.',
          cause: requestError,
        ),
      );
    }
    if (response != null && !response.isSuccess) {
      return CleangoAuthResult<void>.failure(_failureFromResponse(response));
    }
    return const CleangoAuthResult<void>.success();
  }

  Future<CleangoAuthResult<LegacyRestAuthSession>> _authenticate({
    required String endpoint,
    required Map<String, dynamic> body,
  }) async {
    try {
      final response = await _networkService.client.postRequest(
        endpoint,
        body: body,
      );
      if (!response.isSuccess) {
        return CleangoAuthResult<LegacyRestAuthSession>.failure(
          _failureFromResponse(response),
        );
      }

      final data = _asStringMap(response.responseData);
      final accessToken = data?['token']?.toString().trim();
      final user = _asStringMap(data?['user']);
      if (accessToken == null || accessToken.isEmpty || user == null) {
        return const CleangoAuthResult<LegacyRestAuthSession>.failure(
          CleangoAuthFailure(
            code: CleangoAuthFailureCode.server,
            message: 'The authentication response was incomplete.',
          ),
        );
      }

      final refreshToken = data?['refreshToken']?.toString().trim();
      await _sessionStore.saveSession(
        accessToken: accessToken,
        refreshToken: refreshToken?.isEmpty == true ? null : refreshToken,
        user: user,
      );
      await _currentCustomerProvider?.refresh();

      return CleangoAuthResult<LegacyRestAuthSession>.success(
        LegacyRestAuthSession(
          accessToken: accessToken,
          refreshToken: refreshToken?.isEmpty == true ? null : refreshToken,
          user: user,
        ),
      );
    } catch (error) {
      return CleangoAuthResult<LegacyRestAuthSession>.failure(
        CleangoAuthFailure.network(
          'The authentication service could not be reached.',
          cause: error,
        ),
      );
    }
  }

  CleangoAuthResult<LegacyRestAuthSession> _validationFailure(String message) {
    return CleangoAuthResult<LegacyRestAuthSession>.failure(
      CleangoAuthFailure(
        code: CleangoAuthFailureCode.validation,
        message: message,
      ),
    );
  }

  CleangoAuthFailure _failureFromResponse(NetworkResponse response) {
    final code = switch (response.statusCode) {
      400 || 422 => CleangoAuthFailureCode.validation,
      401 => CleangoAuthFailureCode.invalidCredentials,
      403 => CleangoAuthFailureCode.unauthorized,
      409 => CleangoAuthFailureCode.accountConflict,
      -1 => CleangoAuthFailureCode.network,
      >= 500 => CleangoAuthFailureCode.server,
      _ => CleangoAuthFailureCode.unknown,
    };
    return CleangoAuthFailure(
      code: code,
      message: response.errorMessage ?? 'Authentication failed.',
      cause: response.responseData,
    );
  }

  static Map<String, dynamic>? _asStringMap(Object? value) {
    if (value is Map<String, dynamic>) return value;
    if (value is Map) {
      return value.map((key, item) => MapEntry(key.toString(), item));
    }
    return null;
  }
}

import 'package:ultrawash/core/cleango/auth/cleango_auth_provider.dart';

enum CleangoAuthFailureCode {
  cancelled,
  invalidCredentials,
  validation,
  unauthorized,
  invalidPhoneNumber,
  invalidSmsCode,
  verificationExpired,
  accountConflict,
  quotaExceeded,
  network,
  unavailable,
  server,
  unknown,
}

class CleangoAuthFailure {
  const CleangoAuthFailure({
    required this.code,
    required this.message,
    this.cause,
  });

  factory CleangoAuthFailure.fromException(CleangoAuthException exception) {
    return CleangoAuthFailure(
      code: CleangoAuthFailureCode.values.byName(exception.code.name),
      message: exception.message,
      cause: exception.cause,
    );
  }

  factory CleangoAuthFailure.unknown(Object error) {
    return CleangoAuthFailure(
      code: CleangoAuthFailureCode.unknown,
      message: 'Authentication could not be completed.',
      cause: error,
    );
  }

  factory CleangoAuthFailure.network(String message, {Object? cause}) {
    return CleangoAuthFailure(
      code: CleangoAuthFailureCode.network,
      message: message,
      cause: cause,
    );
  }

  final CleangoAuthFailureCode code;
  final String message;
  final Object? cause;
}

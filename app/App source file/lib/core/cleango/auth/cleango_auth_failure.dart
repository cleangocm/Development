import 'package:ultrawash/core/cleango/auth/cleango_auth_provider.dart';

enum CleangoAuthFailureCode {
  cancelled,
  invalidPhoneNumber,
  invalidSmsCode,
  verificationExpired,
  accountConflict,
  quotaExceeded,
  network,
  unavailable,
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

  final CleangoAuthFailureCode code;
  final String message;
  final Object? cause;
}

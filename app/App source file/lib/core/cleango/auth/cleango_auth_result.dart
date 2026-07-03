import 'package:ultrawash/core/cleango/auth/cleango_auth_failure.dart';

class CleangoAuthResult<T> {
  const CleangoAuthResult._({this.value, this.failure});

  const CleangoAuthResult.success([T? value]) : this._(value: value);

  const CleangoAuthResult.failure(CleangoAuthFailure failure)
    : this._(failure: failure);

  final T? value;
  final CleangoAuthFailure? failure;

  bool get isSuccess => failure == null;
  bool get isFailure => failure != null;
}

import 'package:ultrawash/core/cleango/auth/cleango_auth_failure.dart';
import 'package:ultrawash/core/cleango/auth/cleango_auth_provider.dart';
import 'package:ultrawash/core/cleango/auth/cleango_auth_result.dart';
import 'package:ultrawash/core/cleango/session/current_customer_provider.dart';
import 'package:ultrawash/core/cleango/session/session_store.dart';

class CleangoAuthService {
  const CleangoAuthService({
    required CleangoAuthProvider authProvider,
    required SessionStore sessionStore,
    CurrentCustomerProvider? currentCustomerProvider,
  }) : _authProvider = authProvider,
       _sessionStore = sessionStore,
       _currentCustomerProvider = currentCustomerProvider;

  final CleangoAuthProvider _authProvider;
  final SessionStore _sessionStore;
  final CurrentCustomerProvider? _currentCustomerProvider;

  Stream<bool> get authStateChanges => _authProvider.authStateChanges;

  Future<CleangoAuthResult<CleangoAuthUser>> signInWithGoogle() {
    return _guard(_authProvider.signInWithGoogle);
  }

  Future<CleangoAuthResult<PhoneVerificationSession>> startPhoneVerification(
    String e164PhoneNumber,
  ) {
    return _guard(() => _authProvider.startPhoneVerification(e164PhoneNumber));
  }

  Future<CleangoAuthResult<CleangoAuthUser>> verifyPhoneCode(
    String verificationId,
    String smsCode,
  ) {
    return _guard(() => _authProvider.verifyPhoneCode(verificationId, smsCode));
  }

  Future<CleangoAuthResult<void>> signOut() async {
    try {
      await _authProvider.signOut();
      await _sessionStore.clear();
      await _currentCustomerProvider?.refresh();
      return const CleangoAuthResult<void>.success();
    } on CleangoAuthException catch (error) {
      return CleangoAuthResult<void>.failure(
        CleangoAuthFailure.fromException(error),
      );
    } catch (error) {
      return CleangoAuthResult<void>.failure(CleangoAuthFailure.unknown(error));
    }
  }

  Future<CleangoAuthResult<String?>> getFirebaseIdToken() {
    return _guard(_authProvider.getFirebaseIdToken);
  }

  Future<CleangoAuthResult<String?>> getCurrentUid() {
    return _guard(_authProvider.getCurrentUid);
  }

  Future<CleangoAuthResult<bool>> isSignedIn() async {
    try {
      if ((await _authProvider.getCurrentUid()) != null) {
        return const CleangoAuthResult<bool>.success(true);
      }

      final accessToken = (await _sessionStore.readAccessToken())?.trim();
      if (accessToken == null || accessToken.isEmpty) {
        return const CleangoAuthResult<bool>.success(false);
      }

      final customerProvider = _currentCustomerProvider;
      final legacySignedIn = customerProvider == null
          ? true
          : await customerProvider.isLoggedIn();
      return CleangoAuthResult<bool>.success(legacySignedIn);
    } on CleangoAuthException catch (error) {
      return CleangoAuthResult<bool>.failure(
        CleangoAuthFailure.fromException(error),
      );
    } catch (error) {
      return CleangoAuthResult<bool>.failure(CleangoAuthFailure.unknown(error));
    }
  }

  Future<CleangoAuthResult<T>> _guard<T>(Future<T> Function() operation) async {
    try {
      return CleangoAuthResult<T>.success(await operation());
    } on CleangoAuthException catch (error) {
      return CleangoAuthResult<T>.failure(
        CleangoAuthFailure.fromException(error),
      );
    } catch (error) {
      return CleangoAuthResult<T>.failure(CleangoAuthFailure.unknown(error));
    }
  }
}

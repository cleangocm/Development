import 'dart:async';

import 'package:ultrawash/core/cleango/auth/cleango_auth_provider.dart';

class MockCleangoAuthProvider implements CleangoAuthProvider {
  MockCleangoAuthProvider({
    this.uid = 'customer-demo-001',
    bool loggedIn = true,
  }) : _loggedIn = loggedIn;

  final String uid;
  final StreamController<bool> _authStateController =
      StreamController<bool>.broadcast();
  bool _loggedIn;

  @override
  Stream<bool> get authStateChanges async* {
    yield _loggedIn;
    yield* _authStateController.stream;
  }

  @override
  Future<CleangoAuthUser> signInWithGoogle() async {
    return _signIn(
      email: 'preview@cleangocm.com',
      displayName: 'Preview Customer',
    );
  }

  @override
  Future<PhoneVerificationSession> startPhoneVerification(
    String e164PhoneNumber,
  ) async {
    if (!RegExp(r'^\+[1-9]\d{7,14}$').hasMatch(e164PhoneNumber.trim())) {
      throw const CleangoAuthException(
        code: CleangoAuthErrorCode.invalidPhoneNumber,
        message: 'Enter a valid phone number in E.164 format.',
      );
    }
    return const PhoneVerificationSession(
      verificationId: 'mock-verification-id',
    );
  }

  @override
  Future<CleangoAuthUser> verifyPhoneCode(
    String verificationId,
    String smsCode,
  ) async {
    if (verificationId != 'mock-verification-id' ||
        !RegExp(r'^\d{6}$').hasMatch(smsCode)) {
      throw const CleangoAuthException(
        code: CleangoAuthErrorCode.invalidSmsCode,
        message: 'Enter the complete 6-digit verification code.',
      );
    }
    return _signIn(phoneNumber: '+237650000000');
  }

  @override
  Future<String?> getCurrentUid() async => _loggedIn ? uid : null;

  @override
  Future<String?> getFirebaseIdToken() async => null;

  @override
  Future<void> signOut() async {
    _loggedIn = false;
    _authStateController.add(false);
  }

  CleangoAuthUser _signIn({
    String? email,
    String? phoneNumber,
    String? displayName,
  }) {
    final wasLoggedIn = _loggedIn;
    _loggedIn = true;
    _authStateController.add(true);
    return CleangoAuthUser(
      uid: uid,
      isNewUser: !wasLoggedIn,
      email: email,
      phoneNumber: phoneNumber,
      displayName: displayName,
    );
  }
}

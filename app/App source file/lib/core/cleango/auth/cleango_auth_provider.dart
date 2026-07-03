enum CleangoAuthErrorCode {
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

class CleangoAuthException implements Exception {
  const CleangoAuthException({
    required this.code,
    required this.message,
    this.cause,
  });

  final CleangoAuthErrorCode code;
  final String message;
  final Object? cause;

  @override
  String toString() => 'CleangoAuthException(${code.name}): $message';
}

class CleangoAuthUser {
  const CleangoAuthUser({
    required this.uid,
    required this.isNewUser,
    this.email,
    this.phoneNumber,
    this.displayName,
  });

  final String uid;
  final bool isNewUser;
  final String? email;
  final String? phoneNumber;
  final String? displayName;
}

class PhoneVerificationSession {
  const PhoneVerificationSession({
    required this.verificationId,
    this.resendToken,
    this.autoVerified = false,
    this.user,
  });

  final String verificationId;
  final int? resendToken;
  final bool autoVerified;
  final CleangoAuthUser? user;
}

abstract interface class CleangoAuthProvider {
  Stream<bool> get authStateChanges;

  Future<CleangoAuthUser> signInWithGoogle();

  Future<PhoneVerificationSession> startPhoneVerification(
    String e164PhoneNumber,
  );

  Future<CleangoAuthUser> verifyPhoneCode(
    String verificationId,
    String smsCode,
  );

  Future<String?> getFirebaseIdToken();

  Future<String?> getCurrentUid();

  Future<void> signOut();
}

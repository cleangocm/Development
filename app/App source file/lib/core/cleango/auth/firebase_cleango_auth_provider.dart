import 'dart:async';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/services.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:ultrawash/core/cleango/auth/cleango_auth_provider.dart';

class FirebaseCleangoAuthProvider implements CleangoAuthProvider {
  FirebaseCleangoAuthProvider({
    FirebaseAuth? firebaseAuth,
    GoogleSignIn? googleSignIn,
  }) : _firebaseAuth = firebaseAuth ?? FirebaseAuth.instance,
       _googleSignIn =
           googleSignIn ?? GoogleSignIn(scopes: ['email', 'profile']);

  final FirebaseAuth _firebaseAuth;
  final GoogleSignIn _googleSignIn;

  @override
  Stream<bool> get authStateChanges =>
      _firebaseAuth.authStateChanges().map((user) => user != null);

  @override
  Future<CleangoAuthUser> signInWithGoogle() async {
    // TODO(auth): Register Android SHA-1/SHA-256 fingerprints in Firebase.
    // TODO(auth): Add the iOS reversed client ID and URL scheme before iOS use.
    // TODO(auth): Define duplicate phone/Google account linking policy.
    try {
      final googleUser = await _googleSignIn.signIn();
      if (googleUser == null) {
        throw const CleangoAuthException(
          code: CleangoAuthErrorCode.cancelled,
          message: 'Google sign-in was cancelled.',
        );
      }

      final googleAuth = await googleUser.authentication;
      if (googleAuth.idToken == null && googleAuth.accessToken == null) {
        throw const CleangoAuthException(
          code: CleangoAuthErrorCode.unavailable,
          message: 'Google did not return a usable credential.',
        );
      }

      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );
      final result = await _firebaseAuth.signInWithCredential(credential);
      return _toAuthUser(result);
    } on CleangoAuthException {
      rethrow;
    } on FirebaseAuthException catch (error) {
      throw _mapFirebaseError(error);
    } on PlatformException catch (error) {
      throw CleangoAuthException(
        code: error.code == 'network_error'
            ? CleangoAuthErrorCode.network
            : CleangoAuthErrorCode.unavailable,
        message: error.message ?? 'Google sign-in failed.',
        cause: error,
      );
    } catch (error) {
      throw CleangoAuthException(
        code: CleangoAuthErrorCode.unknown,
        message: 'Google sign-in failed.',
        cause: error,
      );
    }
  }

  @override
  Future<PhoneVerificationSession> startPhoneVerification(
    String e164PhoneNumber,
  ) async {
    // TODO(auth): Test Cameroon (+237) SMS delivery, quota, and billing.
    // TODO(auth): Register Android SHA-1/SHA-256 fingerprints in Firebase.
    final phoneNumber = e164PhoneNumber.trim();
    if (!RegExp(r'^\+[1-9]\d{7,14}$').hasMatch(phoneNumber)) {
      throw const CleangoAuthException(
        code: CleangoAuthErrorCode.invalidPhoneNumber,
        message: 'Enter a valid phone number in E.164 format.',
      );
    }

    final completer = Completer<PhoneVerificationSession>();
    try {
      await _firebaseAuth.verifyPhoneNumber(
        phoneNumber: phoneNumber,
        timeout: const Duration(seconds: 60),
        verificationCompleted: (credential) async {
          try {
            final result = await _firebaseAuth.signInWithCredential(credential);
            if (!completer.isCompleted) {
              completer.complete(
                PhoneVerificationSession(
                  verificationId: credential.verificationId ?? '',
                  autoVerified: true,
                  user: _toAuthUser(result),
                ),
              );
            }
          } on FirebaseAuthException catch (error) {
            if (!completer.isCompleted) {
              completer.completeError(_mapFirebaseError(error));
            }
          }
        },
        verificationFailed: (error) {
          if (!completer.isCompleted) {
            completer.completeError(_mapFirebaseError(error));
          }
        },
        codeSent: (verificationId, resendToken) {
          if (!completer.isCompleted) {
            completer.complete(
              PhoneVerificationSession(
                verificationId: verificationId,
                resendToken: resendToken,
              ),
            );
          }
        },
        codeAutoRetrievalTimeout: (verificationId) {
          if (!completer.isCompleted) {
            completer.complete(
              PhoneVerificationSession(verificationId: verificationId),
            );
          }
        },
      );
      return completer.future;
    } on FirebaseAuthException catch (error) {
      throw _mapFirebaseError(error);
    } on CleangoAuthException {
      rethrow;
    } catch (error) {
      throw CleangoAuthException(
        code: CleangoAuthErrorCode.unknown,
        message: 'Phone verification could not be started.',
        cause: error,
      );
    }
  }

  @override
  Future<CleangoAuthUser> verifyPhoneCode(
    String verificationId,
    String smsCode,
  ) async {
    if (verificationId.trim().isEmpty ||
        !RegExp(r'^\d{6}$').hasMatch(smsCode)) {
      throw const CleangoAuthException(
        code: CleangoAuthErrorCode.invalidSmsCode,
        message: 'Enter the complete 6-digit verification code.',
      );
    }

    try {
      final credential = PhoneAuthProvider.credential(
        verificationId: verificationId.trim(),
        smsCode: smsCode,
      );
      final result = await _firebaseAuth.signInWithCredential(credential);
      return _toAuthUser(result);
    } on FirebaseAuthException catch (error) {
      throw _mapFirebaseError(error);
    }
  }

  @override
  Future<String?> getCurrentUid() async => _firebaseAuth.currentUser?.uid;

  @override
  Future<String?> getFirebaseIdToken() async {
    return _firebaseAuth.currentUser?.getIdToken();
  }

  @override
  Future<void> signOut() async {
    try {
      await _googleSignIn.signOut();
    } finally {
      await _firebaseAuth.signOut();
    }
  }

  CleangoAuthUser _toAuthUser(UserCredential credential) {
    final user = credential.user;
    if (user == null) {
      throw const CleangoAuthException(
        code: CleangoAuthErrorCode.unavailable,
        message: 'Firebase did not return an authenticated user.',
      );
    }
    return CleangoAuthUser(
      uid: user.uid,
      isNewUser: credential.additionalUserInfo?.isNewUser ?? false,
      email: user.email,
      phoneNumber: user.phoneNumber,
      displayName: user.displayName,
    );
  }

  CleangoAuthException _mapFirebaseError(FirebaseAuthException error) {
    final code = switch (error.code) {
      'invalid-phone-number' => CleangoAuthErrorCode.invalidPhoneNumber,
      'invalid-verification-code' => CleangoAuthErrorCode.invalidSmsCode,
      'session-expired' ||
      'invalid-verification-id' => CleangoAuthErrorCode.verificationExpired,
      'account-exists-with-different-credential' ||
      'credential-already-in-use' ||
      'provider-already-linked' => CleangoAuthErrorCode.accountConflict,
      'too-many-requests' ||
      'quota-exceeded' => CleangoAuthErrorCode.quotaExceeded,
      'network-request-failed' => CleangoAuthErrorCode.network,
      'operation-not-allowed' => CleangoAuthErrorCode.unavailable,
      _ => CleangoAuthErrorCode.unknown,
    };
    return CleangoAuthException(
      code: code,
      message: error.message ?? 'Firebase authentication failed.',
      cause: error,
    );
  }
}

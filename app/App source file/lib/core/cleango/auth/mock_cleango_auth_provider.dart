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
  Future<String?> getCurrentUid() async => _loggedIn ? uid : null;

  @override
  Future<String?> getFirebaseIdToken() async => null;

  @override
  Future<void> signOut() async {
    _loggedIn = false;
    _authStateController.add(false);
  }
}

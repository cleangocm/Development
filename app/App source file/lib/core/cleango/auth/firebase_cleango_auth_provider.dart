import 'package:firebase_auth/firebase_auth.dart';
import 'package:ultrawash/core/cleango/auth/cleango_auth_provider.dart';

class FirebaseCleangoAuthProvider implements CleangoAuthProvider {
  FirebaseCleangoAuthProvider({FirebaseAuth? firebaseAuth})
    : _firebaseAuth = firebaseAuth ?? FirebaseAuth.instance;

  final FirebaseAuth _firebaseAuth;

  @override
  Stream<bool> get authStateChanges =>
      _firebaseAuth.authStateChanges().map((user) => user != null);

  @override
  Future<String?> getCurrentUid() async => _firebaseAuth.currentUser?.uid;

  @override
  Future<String?> getFirebaseIdToken() async {
    return _firebaseAuth.currentUser?.getIdToken();
  }

  @override
  Future<void> signOut() => _firebaseAuth.signOut();
}

import 'package:firebase_auth/firebase_auth.dart';
import 'package:ultrawash/core/cleango/session/current_customer_provider.dart';

class FirebaseCurrentCustomerProvider implements CurrentCustomerProvider {
  FirebaseCurrentCustomerProvider({FirebaseAuth? firebaseAuth})
    : _firebaseAuth = firebaseAuth ?? FirebaseAuth.instance;

  final FirebaseAuth _firebaseAuth;

  @override
  Future<String?> getCurrentCustomerId() async {
    return _firebaseAuth.currentUser?.uid;
  }

  @override
  Future<bool> isLoggedIn() async {
    return _firebaseAuth.currentUser != null;
  }

  @override
  Future<void> refresh() async {
    await _firebaseAuth.currentUser?.getIdToken(true);
  }

  Future<String?> getFirebaseIdToken({bool forceRefresh = false}) async {
    return _firebaseAuth.currentUser?.getIdToken(forceRefresh);
  }
}

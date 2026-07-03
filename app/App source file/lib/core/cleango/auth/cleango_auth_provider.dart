abstract interface class CleangoAuthProvider {
  Stream<bool> get authStateChanges;

  Future<String?> getFirebaseIdToken();

  Future<String?> getCurrentUid();

  Future<void> signOut();
}

abstract interface class CurrentCustomerProvider {
  Future<String?> getCurrentCustomerId();

  Future<bool> isLoggedIn();

  Future<void> refresh();
}

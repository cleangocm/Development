import 'package:ultrawash/core/cleango/models/address.dart';
import 'package:ultrawash/core/cleango/models/customer.dart';
import 'package:ultrawash/core/cleango/models/subscription.dart';
import 'package:ultrawash/core/cleango/repositories/customer_repository.dart';
import 'package:ultrawash/core/cleango/repositories/subscription_repository.dart';

class MockCustomerService
    implements CustomerRepository, SubscriptionRepository {
  MockCustomerService();

  static const _customerId = 'customer-demo-001';

  Customer _customer = const Customer(
    id: _customerId,
    fullName: 'Emmanuel Lavet',
    phoneNumber: '+237 6 50 00 00 00',
    email: 'emmanuel@example.com',
    serviceArea: 'Yaounde, Centre Region',
    primaryAddress: Address(
      id: 'address-demo-001',
      label: 'Home',
      street: 'Bastos',
      city: 'Yaounde',
      region: 'Centre',
      country: 'Cameroon',
      latitude: 3.884,
      longitude: 11.502,
      serviceZone: 'Yaounde Central Zone',
      isWithinServiceArea: true,
      isPrimary: true,
    ),
  );

  final List<Subscription> _subscriptions = [
    Subscription(
      id: 'subscription-demo-001',
      customerId: _customerId,
      plan: SubscriptionPlan.standard,
      renewalDate: DateTime(2026, 7, 12),
      remainingCollections: 6,
      status: SubscriptionStatus.active,
      monthlyPriceXaf: 5000,
    ),
  ];

  @override
  Future<Customer?> getCurrentCustomer() async => _customer;

  @override
  Future<Customer?> getCustomerById(String customerId) async {
    return customerId == _customer.id ? _customer : null;
  }

  @override
  Future<Customer> updateCustomer(Customer customer) async {
    _customer = customer;
    return _customer;
  }

  @override
  Future<Subscription?> getActiveSubscription(String customerId) async {
    for (final subscription in _subscriptions) {
      if (subscription.customerId == customerId && subscription.isActive) {
        return subscription;
      }
    }
    return null;
  }

  @override
  Future<List<Subscription>> getSubscriptionHistory(String customerId) async {
    return List.unmodifiable(
      _subscriptions.where(
        (subscription) => subscription.customerId == customerId,
      ),
    );
  }

  @override
  Future<Subscription> updateSubscription(Subscription subscription) async {
    final index = _subscriptions.indexWhere(
      (item) => item.id == subscription.id,
    );
    if (index == -1) {
      _subscriptions.add(subscription);
    } else {
      _subscriptions[index] = subscription;
    }
    return subscription;
  }
}

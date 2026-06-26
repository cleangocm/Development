import 'package:ultrawash/core/cleango/models/customer.dart';

abstract interface class CustomerRepository {
  Future<Customer?> getCurrentCustomer();

  Future<Customer?> getCustomerById(String customerId);

  Future<Customer> updateCustomer(Customer customer);
}

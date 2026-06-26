import 'package:ultrawash/core/cleango/models/address.dart';

class Customer {
  const Customer({
    required this.id,
    required this.fullName,
    required this.phoneNumber,
    required this.email,
    required this.serviceArea,
    required this.primaryAddress,
    this.avatarUrl,
  });

  final String id;
  final String fullName;
  final String phoneNumber;
  final String email;
  final String? avatarUrl;
  final String serviceArea;
  final Address primaryAddress;

  Customer copyWith({
    String? id,
    String? fullName,
    String? phoneNumber,
    String? email,
    String? avatarUrl,
    String? serviceArea,
    Address? primaryAddress,
  }) {
    return Customer(
      id: id ?? this.id,
      fullName: fullName ?? this.fullName,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      email: email ?? this.email,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      serviceArea: serviceArea ?? this.serviceArea,
      primaryAddress: primaryAddress ?? this.primaryAddress,
    );
  }
}

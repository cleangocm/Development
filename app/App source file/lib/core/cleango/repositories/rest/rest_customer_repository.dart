import 'package:ultrawash/core/cleango/models/address.dart';
import 'package:ultrawash/core/cleango/models/customer.dart';
import 'package:ultrawash/core/cleango/repositories/customer_repository.dart';
import 'package:ultrawash/core/service/api_service/api_service.dart';

class RestCustomerRepository implements CustomerRepository {
  RestCustomerRepository({NetworkService? networkService})
    : _networkService = networkService ?? NetworkService();

  final NetworkService _networkService;

  @override
  Future<Customer?> getCurrentCustomer() async {
    final response = await _networkService.client.getRequest('/auth/profile');
    if (!response.isSuccess) {
      if (response.statusCode == 404) return null;
      throw StateError(
        response.errorMessage ?? 'Unable to load customer profile',
      );
    }

    return _customerFromResponse(response.responseData);
  }

  @override
  Future<Customer?> getCustomerById(String customerId) async {
    final customer = await getCurrentCustomer();
    return customer?.id == customerId ? customer : null;
  }

  @override
  Future<Customer> updateCustomer(Customer customer) async {
    final response = await _networkService.client.putRequest(
      '/auth/profile',
      body: {
        'name': customer.fullName,
        'phone': customer.phoneNumber,
        'email': customer.email,
        'profileImage': customer.avatarUrl,
        'address': customer.primaryAddress.formattedAddress,
      },
    );

    if (!response.isSuccess) {
      throw StateError(
        response.errorMessage ?? 'Unable to update customer profile',
      );
    }

    final updatedCustomer = _customerFromResponse(response.responseData);
    if (updatedCustomer == null) {
      throw const FormatException('Customer profile response is missing data');
    }
    return updatedCustomer;
  }

  Customer? _customerFromResponse(dynamic responseData) {
    final envelope = _asMap(responseData);
    final data = _asMap(envelope?['data']);
    if (data == null) return null;
    return _CustomerDto.fromJson(data).toDomain();
  }
}

class _CustomerDto {
  const _CustomerDto({
    required this.id,
    required this.fullName,
    required this.phoneNumber,
    required this.email,
    required this.serviceArea,
    required this.address,
    this.avatarUrl,
  });

  factory _CustomerDto.fromJson(Map<String, dynamic> json) {
    final id = _stringValue(json['_id'] ?? json['id']);
    if (id.isEmpty) {
      throw const FormatException('Customer profile is missing an id');
    }

    final address = _AddressDto.fromJson(
      json['address'],
      customerId: id,
      rootJson: json,
    );

    return _CustomerDto(
      id: id,
      fullName: _stringValue(json['name'] ?? json['fullName']),
      phoneNumber: _stringValue(json['phone'] ?? json['phoneNumber']),
      email: _stringValue(json['email']),
      avatarUrl: _nullableString(json['profileImage'] ?? json['avatarUrl']),
      serviceArea: _firstNonEmpty([
        json['serviceArea'],
        json['serviceZone'],
        address.serviceZone,
        address.city,
        'Service area pending',
      ]),
      address: address,
    );
  }

  final String id;
  final String fullName;
  final String phoneNumber;
  final String email;
  final String? avatarUrl;
  final String serviceArea;
  final _AddressDto address;

  Customer toDomain() {
    return Customer(
      id: id,
      fullName: fullName,
      phoneNumber: phoneNumber,
      email: email,
      avatarUrl: avatarUrl,
      serviceArea: serviceArea,
      primaryAddress: address.toDomain(),
    );
  }
}

class _AddressDto {
  const _AddressDto({
    required this.id,
    required this.label,
    required this.street,
    required this.city,
    required this.region,
    required this.country,
    required this.latitude,
    required this.longitude,
    required this.serviceZone,
    required this.isWithinServiceArea,
    required this.isPrimary,
  });

  factory _AddressDto.fromJson(
    dynamic rawAddress, {
    required String customerId,
    required Map<String, dynamic> rootJson,
  }) {
    final address = _asMap(rawAddress);
    final location = _asMap(address?['location'] ?? rootJson['location']);
    final coordinates = location?['coordinates'];
    final longitude = _coordinate(
      address?['longitude'] ?? rootJson['longitude'],
      coordinates,
      0,
    );
    final latitude = _coordinate(
      address?['latitude'] ?? rootJson['latitude'],
      coordinates,
      1,
    );

    final street = address == null
        ? _stringValue(rawAddress)
        : _firstNonEmpty([
            address['street'],
            address['line1'],
            address['address'],
          ]);

    return _AddressDto(
      id: _firstNonEmpty([
        address?['_id'],
        address?['id'],
        '$customerId-primary-address',
      ]),
      label: _firstNonEmpty([address?['label'], 'Primary address']),
      street: street.isEmpty ? 'Address pending' : street,
      city: _firstNonEmpty([address?['city'], rootJson['city']]),
      region: _firstNonEmpty([address?['region'], rootJson['region']]),
      country: _firstNonEmpty([
        address?['country'],
        rootJson['country'],
        'Cameroon',
      ]),
      latitude: latitude,
      longitude: longitude,
      serviceZone: _firstNonEmpty([
        address?['serviceZone'],
        rootJson['serviceZone'],
      ]),
      isWithinServiceArea:
          _boolValue(
            address?['isWithinServiceArea'] ?? rootJson['isWithinServiceArea'],
          ) ??
          false,
      isPrimary: _boolValue(address?['isPrimary']) ?? true,
    );
  }

  final String id;
  final String label;
  final String street;
  final String city;
  final String region;
  final String country;
  final double latitude;
  final double longitude;
  final String serviceZone;
  final bool isWithinServiceArea;
  final bool isPrimary;

  Address toDomain() {
    return Address(
      id: id,
      label: label,
      street: street,
      city: city,
      region: region,
      country: country,
      latitude: latitude,
      longitude: longitude,
      serviceZone: serviceZone,
      isWithinServiceArea: isWithinServiceArea,
      isPrimary: isPrimary,
    );
  }
}

Map<String, dynamic>? _asMap(dynamic value) {
  if (value is Map<String, dynamic>) return value;
  if (value is Map) return Map<String, dynamic>.from(value);
  return null;
}

String _stringValue(dynamic value) => value?.toString().trim() ?? '';

String? _nullableString(dynamic value) {
  final string = _stringValue(value);
  return string.isEmpty ? null : string;
}

String _firstNonEmpty(List<dynamic> values) {
  for (final value in values) {
    final string = _stringValue(value);
    if (string.isNotEmpty) return string;
  }
  return '';
}

bool? _boolValue(dynamic value) {
  if (value is bool) return value;
  if (value is String) {
    if (value.toLowerCase() == 'true') return true;
    if (value.toLowerCase() == 'false') return false;
  }
  return null;
}

double _coordinate(dynamic directValue, dynamic coordinates, int index) {
  if (directValue is num) return directValue.toDouble();
  if (directValue is String) return double.tryParse(directValue) ?? 0;

  if (coordinates is List && coordinates.length > index) {
    final value = coordinates[index];
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0;
  }
  return 0;
}

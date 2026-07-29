import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:ultrawash/core/cleango/models/address.dart';
import 'package:ultrawash/core/cleango/models/customer.dart';
import 'package:ultrawash/core/cleango/repositories/customer_repository.dart';

class FirebaseCustomerRepository implements CustomerRepository {
  FirebaseCustomerRepository({
    FirebaseFirestore? firestore,
    FirebaseAuth? firebaseAuth,
  }) : _firestore = firestore ?? FirebaseFirestore.instance,
       _firebaseAuth = firebaseAuth ?? FirebaseAuth.instance;

  final FirebaseFirestore _firestore;
  final FirebaseAuth _firebaseAuth;

  @override
  Future<Customer?> getCurrentCustomer() async {
    final uid = _firebaseAuth.currentUser?.uid;
    if (uid == null || uid.isEmpty) return null;
    return getCustomerById(uid);
  }

  @override
  Future<Customer?> getCustomerById(String customerId) async {
    try {
      final customerSnapshot = await _firestore
          .collection('customers')
          .doc(customerId)
          .get();
      final customerData = customerSnapshot.data() ?? <String, dynamic>{};
      final userData = await _readOptionalDocument('users', customerId);
      if (!customerSnapshot.exists) {
        return _authBackedCustomer(customerId: customerId, userData: userData);
      }
      final addressData = await _readPrimaryAddress(customerId, customerData);

      return _FirebaseCustomerDto.fromFirestore(
        id: customerSnapshot.id,
        customerData: customerData,
        userData: userData,
        addressData: addressData,
      ).toDomain();
    } on FirebaseException catch (error) {
      if (_isOptionalReadFailure(error)) {
        return _authBackedCustomer(customerId: customerId);
      }
      rethrow;
    }
  }

  @override
  Future<Customer> updateCustomer(Customer customer) async {
    final uid = _firebaseAuth.currentUser?.uid;
    if (uid == null || uid != customer.id) {
      throw StateError('Cannot update another customer profile.');
    }

    await _firestore.collection('customers').doc(customer.id).set({
      'fullName': customer.fullName,
      'name': customer.fullName,
      'phoneNumber': customer.phoneNumber,
      'phone': customer.phoneNumber,
      'email': customer.email,
      'avatarUrl': customer.avatarUrl,
      'profileImage': customer.avatarUrl,
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));

    await _updatePrimaryAddress(customer.primaryAddress, customer.id);

    final updated = await getCustomerById(customer.id);
    if (updated == null) {
      throw StateError('Customer profile was not found after update.');
    }
    return updated;
  }

  Future<Map<String, dynamic>?> _readOptionalDocument(
    String collection,
    String id,
  ) async {
    try {
      final snapshot = await _firestore.collection(collection).doc(id).get();
      return snapshot.data();
    } on FirebaseException catch (error) {
      if (_isOptionalReadFailure(error) || error.code == 'not-found') {
        return null;
      }
      rethrow;
    }
  }

  Future<Map<String, dynamic>?> _readPrimaryAddress(
    String customerId,
    Map<String, dynamic> customerData,
  ) async {
    final embedded = _asMap(
      customerData['primaryAddress'] ?? customerData['address'],
    );
    if (embedded != null) return embedded;

    return _queryPrimaryAddress(customerId);
  }

  Future<Map<String, dynamic>?> _queryPrimaryAddress(String customerId) async {
    try {
      final primary = await _firestore
          .collection('addresses')
          .where('customerId', isEqualTo: customerId)
          .where('isPrimary', isEqualTo: true)
          .limit(1)
          .get();
      if (primary.docs.isNotEmpty) {
        return {...primary.docs.first.data(), 'id': primary.docs.first.id};
      }

      final first = await _firestore
          .collection('addresses')
          .where('customerId', isEqualTo: customerId)
          .limit(1)
          .get();
      if (first.docs.isEmpty) return null;
      return {...first.docs.first.data(), 'id': first.docs.first.id};
    } on FirebaseException catch (error) {
      if (_isOptionalReadFailure(error) ||
          error.code == 'failed-precondition') {
        return null;
      }
      rethrow;
    }
  }

  Customer? _authBackedCustomer({
    required String customerId,
    Map<String, dynamic>? userData,
  }) {
    final authData = _firebaseAuthUserData(customerId);
    if (userData == null && authData == null) return null;
    return _FirebaseCustomerDto.fromFirestore(
      id: customerId,
      customerData: const <String, dynamic>{},
      userData: {...?userData, ...?authData},
      addressData: null,
    ).toDomain();
  }

  bool _isOptionalReadFailure(FirebaseException error) {
    return error.code == 'permission-denied' ||
        error.code == 'unavailable' ||
        error.code == 'deadline-exceeded';
  }

  Map<String, dynamic>? _firebaseAuthUserData(String customerId) {
    final user = _firebaseAuth.currentUser;
    if (user == null || user.uid != customerId) return null;
    return <String, dynamic>{
      'fullName': user.displayName,
      'name': user.displayName,
      'email': user.email,
      'phoneNumber': user.phoneNumber,
      'phone': user.phoneNumber,
      'avatarUrl': user.photoURL,
      'photoURL': user.photoURL,
    };
  }

  Future<void> _updatePrimaryAddress(Address address, String customerId) async {
    if (address.id.isEmpty || address.id.endsWith('-primary-address')) return;

    await _firestore.collection('addresses').doc(address.id).set({
      'customerId': customerId,
      'label': address.label,
      'street': address.street,
      'city': address.city,
      'region': address.region,
      'country': address.country,
      'latitude': address.latitude,
      'longitude': address.longitude,
      'isPrimary': address.isPrimary,
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }
}

class _FirebaseCustomerDto {
  const _FirebaseCustomerDto({
    required this.id,
    required this.fullName,
    required this.phoneNumber,
    required this.email,
    required this.serviceArea,
    required this.address,
    this.avatarUrl,
  });

  factory _FirebaseCustomerDto.fromFirestore({
    required String id,
    required Map<String, dynamic> customerData,
    required Map<String, dynamic>? userData,
    required Map<String, dynamic>? addressData,
  }) {
    final address = _FirebaseAddressDto.fromFirestore(
      id: id,
      customerData: customerData,
      addressData: addressData,
    );

    return _FirebaseCustomerDto(
      id: id,
      fullName: _firstNonEmpty([
        customerData['fullName'],
        customerData['name'],
        userData?['fullName'],
        userData?['name'],
        userData?['displayName'],
        'CLEANGO Customer',
      ]),
      phoneNumber: _firstNonEmpty([
        customerData['phoneNumber'],
        customerData['phone'],
        userData?['phoneNumber'],
        userData?['phone'],
      ]),
      email: _firstNonEmpty([customerData['email'], userData?['email']]),
      avatarUrl: _nullableString(
        customerData['avatarUrl'] ??
            customerData['profileImage'] ??
            userData?['avatarUrl'] ??
            userData?['photoURL'],
      ),
      serviceArea: _firstNonEmpty([
        customerData['serviceArea'],
        customerData['serviceZone'],
        customerData['zoneName'],
        address.serviceZone,
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
  final _FirebaseAddressDto address;

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

class _FirebaseAddressDto {
  const _FirebaseAddressDto({
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

  factory _FirebaseAddressDto.fromFirestore({
    required String id,
    required Map<String, dynamic> customerData,
    required Map<String, dynamic>? addressData,
  }) {
    final location = _asMap(
      addressData?['location'] ?? customerData['location'],
    );
    final geoPoint = addressData?['geoPoint'] ?? customerData['geoPoint'];
    final coordinates = location?['coordinates'];

    final latitude = _coordinate(
      addressData?['latitude'] ?? customerData['latitude'],
      coordinates,
      1,
      geoPoint,
    );
    final longitude = _coordinate(
      addressData?['longitude'] ?? customerData['longitude'],
      coordinates,
      0,
      geoPoint,
    );

    return _FirebaseAddressDto(
      id: _firstNonEmpty([
        addressData?['id'],
        addressData?['_id'],
        '$id-primary-address',
      ]),
      label: _firstNonEmpty([
        addressData?['label'],
        customerData['addressLabel'],
        'Primary address',
      ]),
      street: _firstNonEmpty([
        addressData?['street'],
        addressData?['line1'],
        addressData?['address'],
        customerData['street'],
        customerData['address'],
        'Address pending',
      ]),
      city: _firstNonEmpty([addressData?['city'], customerData['city']]),
      region: _firstNonEmpty([addressData?['region'], customerData['region']]),
      country: _firstNonEmpty([
        addressData?['country'],
        customerData['country'],
        'Cameroon',
      ]),
      latitude: latitude,
      longitude: longitude,
      serviceZone: _firstNonEmpty([
        addressData?['serviceZone'],
        customerData['serviceZone'],
        customerData['serviceArea'],
      ]),
      isWithinServiceArea:
          _boolValue(
            addressData?['isWithinServiceArea'] ??
                customerData['isWithinServiceArea'],
          ) ??
          false,
      isPrimary: _boolValue(addressData?['isPrimary']) ?? true,
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
    final normalized = value.toLowerCase();
    if (normalized == 'true') return true;
    if (normalized == 'false') return false;
  }
  return null;
}

double _coordinate(
  dynamic directValue,
  dynamic coordinates,
  int coordinateIndex,
  dynamic geoPoint,
) {
  if (directValue is num) return directValue.toDouble();
  if (directValue is String) return double.tryParse(directValue) ?? 0;
  if (geoPoint is GeoPoint) {
    return coordinateIndex == 1 ? geoPoint.latitude : geoPoint.longitude;
  }
  if (coordinates is List && coordinates.length > coordinateIndex) {
    final value = coordinates[coordinateIndex];
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0;
  }
  return 0;
}

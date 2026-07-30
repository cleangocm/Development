import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:ultrawash/core/cleango/onboarding/service_zone_validator.dart';

class CustomerAddressInput {
  const CustomerAddressInput({
    required this.label,
    required this.addressLine,
    required this.city,
    required this.district,
    required this.latitude,
    required this.longitude,
    required this.serviceZone,
    this.displayName,
    this.accuracyMeters,
  });

  final String label;
  final String addressLine;
  final String city;
  final String district;
  final double? latitude;
  final double? longitude;
  final String serviceZone;
  final String? displayName;
  final double? accuracyMeters;
}

class CustomerOnboardingState {
  const CustomerOnboardingState({
    required this.customerExists,
    required this.onboardingCompleted,
    required this.hasDefaultAddress,
    required this.accountStatus,
  });

  final bool customerExists;
  final bool onboardingCompleted;
  final bool hasDefaultAddress;
  final String accountStatus;

  bool get isDisabled => accountStatus == 'disabled';
  bool get isComplete => hasDefaultAddress && !isDisabled;
}

class CustomerAddressService {
  CustomerAddressService({
    FirebaseFirestore? firestore,
    FirebaseAuth? firebaseAuth,
    ServiceZoneValidator validator = const ServiceZoneValidator(),
  }) : _firestore = firestore ?? FirebaseFirestore.instance,
       _firebaseAuth = firebaseAuth ?? FirebaseAuth.instance,
       _validator = validator;

  final FirebaseFirestore _firestore;
  final FirebaseAuth _firebaseAuth;
  final ServiceZoneValidator _validator;

  Future<CustomerOnboardingState> readState() async {
    final uid = _requireUid();
    final customer = await _firestore.collection('customers').doc(uid).get();
    if (!customer.exists) {
      return const CustomerOnboardingState(
        customerExists: false,
        onboardingCompleted: false,
        hasDefaultAddress: false,
        accountStatus: 'active',
      );
    }
    final address = await _firestore
        .collection('addresses')
        .where('customerId', isEqualTo: uid)
        .get();
    final data = customer.data() ?? const <String, dynamic>{};
    return CustomerOnboardingState(
      customerExists: true,
      onboardingCompleted: data['onboardingCompleted'] == true,
      hasDefaultAddress: address.docs.any(_isDefaultAddress),
      accountStatus: _string(data['accountStatus'], fallback: 'active'),
    );
  }

  Future<String> saveDefaultAddress(CustomerAddressInput input) async {
    final uid = _requireUid();
    final validated = input.latitude != null && input.longitude != null
        ? _validator.validateCoordinates(
            latitude: input.latitude,
            longitude: input.longitude,
            accuracyMeters: input.accuracyMeters,
          )
        : _validator.validateManualCity(input.city);
    if (!validated.isSupported || validated.zoneId != input.serviceZone) {
      throw const UnsupportedServiceAreaException();
    }
    if (input.addressLine.trim().isEmpty) {
      throw const InvalidAddressException('Enter a complete address.');
    }

    final existingDefault = await _firestore
        .collection('addresses')
        .where('customerId', isEqualTo: uid)
        .get();
    final defaultAddresses = existingDefault.docs.where(_isDefaultAddress);
    final customerRef = _firestore.collection('customers').doc(uid);
    final addressRef = defaultAddresses.isEmpty
        ? _firestore.collection('addresses').doc()
        : defaultAddresses.first.reference;

    await _firestore.runTransaction((transaction) async {
      final customer = await transaction.get(customerRef);
      if (!customer.exists) {
        throw StateError('Customer profile must be provisioned first.');
      }
      transaction.set(addressRef, {
        'customerId': uid,
        'label': input.label.trim().isEmpty ? 'Home' : input.label.trim(),
        'addressLine': input.addressLine.trim(),
        'street': input.addressLine.trim(),
        'city': validated.city,
        'district': input.district.trim(),
        'neighborhood': input.district.trim(),
        'latitude': input.latitude,
        'longitude': input.longitude,
        'serviceZone': validated.zoneId,
        'serviceZoneId': validated.zoneId,
        'region': input.district.trim(),
        'country': 'Cameroon',
        'isWithinServiceArea': true,
        'isDefault': true,
        'isPrimary': true,
        if (defaultAddresses.isEmpty) 'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: defaultAddresses.isNotEmpty));
      transaction.update(customerRef, {
        'onboardingCompleted': true,
        'serviceArea': validated.city,
        'serviceZone': validated.zoneId,
        if (input.displayName != null && input.displayName!.trim().isNotEmpty)
          'displayName': input.displayName!.trim(),
        if (input.displayName != null && input.displayName!.trim().isNotEmpty)
          'fullName': input.displayName!.trim(),
        'updatedAt': FieldValue.serverTimestamp(),
      });
    });
    return addressRef.id;
  }

  bool _isDefaultAddress(QueryDocumentSnapshot<Map<String, dynamic>> document) {
    final data = document.data();
    return data['isDefault'] == true || data['isPrimary'] == true;
  }

  String _requireUid() {
    final uid = _firebaseAuth.currentUser?.uid;
    if (uid == null || uid.isEmpty) {
      throw StateError('A Firebase-authenticated customer is required.');
    }
    return uid;
  }
}

class UnsupportedServiceAreaException implements Exception {
  const UnsupportedServiceAreaException();
}

class InvalidAddressException implements Exception {
  const InvalidAddressException(this.message);
  final String message;
}

String _string(Object? value, {required String fallback}) {
  return value is String && value.trim().isNotEmpty ? value.trim() : fallback;
}

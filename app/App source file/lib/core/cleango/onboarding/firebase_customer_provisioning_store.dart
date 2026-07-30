import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:ultrawash/core/cleango/onboarding/customer_provisioning_service.dart';

class FirebaseCustomerProvisioningStore implements CustomerProvisioningStore {
  FirebaseCustomerProvisioningStore({FirebaseFirestore? firestore})
    : _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firestore;

  @override
  Future<Map<String, dynamic>?> readCustomer(String uid) async {
    final snapshot = await _firestore.collection('customers').doc(uid).get();
    return snapshot.data();
  }

  @override
  Future<void> createCustomer(String uid, Map<String, dynamic> values) async {
    await _firestore.collection('customers').doc(uid).set({
      ...values,
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }

  @override
  Future<void> mergeCustomer(String uid, Map<String, dynamic> values) async {
    await _firestore.collection('customers').doc(uid).set({
      ...values,
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }
}

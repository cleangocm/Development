import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:ultrawash/core/cleango/models/support_request.dart';
import 'package:ultrawash/core/cleango/repositories/support_request_repository.dart';

class FirebaseSupportRequestRepository implements SupportRequestRepository {
  FirebaseSupportRequestRepository({
    FirebaseFirestore? firestore,
    FirebaseAuth? firebaseAuth,
  }) : _firestore = firestore ?? FirebaseFirestore.instance,
       _firebaseAuth = firebaseAuth ?? FirebaseAuth.instance;

  final FirebaseFirestore _firestore;
  final FirebaseAuth _firebaseAuth;

  @override
  Future<SupportRequestResult> createRequest(
    SupportRequestDraft request,
  ) async {
    final uid = _firebaseAuth.currentUser?.uid;
    if (uid == null || uid.isEmpty) {
      throw StateError('Sign in before contacting support.');
    }

    final subject = request.subject.trim();
    final message = request.message.trim();
    if (subject.length < 3 || subject.length > 120) {
      throw StateError('Enter a support subject between 3 and 120 characters.');
    }
    if (message.length < 10 || message.length > 2000) {
      throw StateError(
        'Enter a support message between 10 and 2000 characters.',
      );
    }

    final collectionId = request.collectionId?.trim();
    if (collectionId != null && collectionId.isNotEmpty) {
      final collection = await _firestore
          .collection('collections')
          .doc(collectionId)
          .get();
      if (!collection.exists || collection.data()?['customerId'] != uid) {
        throw StateError('The selected collection is unavailable.');
      }
    }

    final reference = _firestore.collection('supportRequests').doc();
    await reference.set(<String, Object?>{
      'customerId': uid,
      'category': request.category.wireValue,
      'subject': subject,
      'message': message,
      'collectionId': collectionId?.isEmpty == true ? null : collectionId,
      'status': 'open',
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
      'closedAt': null,
      'assignedTo': null,
      'adminNotes': null,
      'metadataVersion': 1,
    });
    return SupportRequestResult(id: reference.id);
  }
}

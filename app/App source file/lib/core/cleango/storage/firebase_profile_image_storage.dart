import 'dart:typed_data';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:ultrawash/core/cleango/storage/profile_image_storage.dart';

class FirebaseProfileImageStorage implements ProfileImageStorage {
  FirebaseProfileImageStorage({
    FirebaseAuth? firebaseAuth,
    FirebaseFirestore? firestore,
    FirebaseStorage? storage,
  }) : _firebaseAuth = firebaseAuth ?? FirebaseAuth.instance,
       _firestore = firestore ?? FirebaseFirestore.instance,
       _storage = storage ?? FirebaseStorage.instance;

  final FirebaseAuth _firebaseAuth;
  final FirebaseFirestore _firestore;
  final FirebaseStorage _storage;

  @override
  int get maxFileSizeBytes => 4 * 1024 * 1024;

  @override
  Set<String> get supportedExtensions => const {'jpg', 'jpeg', 'png', 'webp'};

  @override
  Future<String> uploadCurrentCustomerAvatar({
    required Uint8List bytes,
    required String fileName,
  }) async {
    final user = _firebaseAuth.currentUser;
    final uid = user?.uid;
    if (uid == null || uid.isEmpty) {
      throw StateError('A Firebase-authenticated customer is required.');
    }

    if (bytes.isEmpty) {
      throw ArgumentError.value(bytes.length, 'bytes', 'Image file is empty.');
    }
    if (bytes.lengthInBytes > maxFileSizeBytes) {
      throw StateError('Image file is larger than the allowed limit.');
    }

    final extension = _extensionFor(fileName);
    final contentType = _contentTypeFor(extension);
    final reference = _storage.ref('profileImages/$uid/avatar.$extension');

    final uploadTask = await reference.putData(
      bytes,
      SettableMetadata(
        contentType: contentType,
        cacheControl: 'public,max-age=3600',
        customMetadata: const {
          'purpose': 'customer-profile-avatar',
          'managedBy': 'cleango-mobile',
        },
      ),
    );

    final downloadUrl = await uploadTask.ref.getDownloadURL();
    await _firestore.collection('customers').doc(uid).set({
      'userId': uid,
      'avatarUrl': downloadUrl,
      'profileImage': downloadUrl,
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));

    return downloadUrl;
  }

  String _extensionFor(String fileName) {
    final sanitized = fileName.trim().toLowerCase();
    final index = sanitized.lastIndexOf('.');
    final extension = index == -1 ? '' : sanitized.substring(index + 1);
    if (!supportedExtensions.contains(extension)) {
      throw ArgumentError.value(
        fileName,
        'fileName',
        'Unsupported profile image type.',
      );
    }
    return extension == 'jpeg' ? 'jpg' : extension;
  }

  String _contentTypeFor(String extension) {
    return switch (extension) {
      'jpg' || 'jpeg' => 'image/jpeg',
      'png' => 'image/png',
      'webp' => 'image/webp',
      _ => 'application/octet-stream',
    };
  }
}

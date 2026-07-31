import 'package:crypto/crypto.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:ultrawash/core/cleango/collections/collection_booking_policy.dart';
import 'package:ultrawash/core/cleango/storage/collection_quote_image_storage.dart';

class FirebaseCollectionQuoteImageStorage
    implements CollectionQuoteImageStorage {
  FirebaseCollectionQuoteImageStorage({
    FirebaseAuth? firebaseAuth,
    FirebaseStorage? storage,
  }) : _firebaseAuth = firebaseAuth ?? FirebaseAuth.instance,
       _storage = storage ?? FirebaseStorage.instance;

  final FirebaseAuth _firebaseAuth;
  final FirebaseStorage _storage;

  @override
  int get maxFileSizeBytes => CollectionBookingPolicy.maxQuoteImageBytes;

  @override
  int get maxImageCount => CollectionBookingPolicy.maxQuoteImageCount;

  @override
  Set<String> get supportedExtensions => const {'jpg', 'jpeg', 'png', 'webp'};

  @override
  Future<List<String>> uploadQuoteImages({
    required String bookingId,
    required List<CollectionQuoteImageInput> images,
  }) async {
    final uid = _currentUid();
    if (!RegExp(r'^collection_[a-f0-9]{64}$').hasMatch(bookingId)) {
      throw ArgumentError.value(bookingId, 'bookingId', 'Invalid booking ID.');
    }
    if (images.isEmpty || images.length > maxImageCount) {
      throw StateError('Select between 1 and $maxImageCount quotation photos.');
    }

    final uploadedPaths = <String>[];
    try {
      for (var index = 0; index < images.length; index++) {
        final image = images[index];
        if (image.bytes.isEmpty) {
          throw StateError('A selected quotation image is empty.');
        }
        if (image.bytes.lengthInBytes > maxFileSizeBytes) {
          throw StateError('A quotation image exceeds the 4 MB limit.');
        }
        final extension = _extensionFor(image.fileName);
        final digest = sha256.convert(image.bytes).toString().substring(0, 16);
        final fileName = 'quote_${index + 1}_$digest.$extension';
        final path = 'collection-quotes/$uid/$bookingId/$fileName';
        final reference = _storage.ref(path);
        await reference.putData(
          image.bytes,
          SettableMetadata(
            contentType: _contentTypeFor(extension),
            cacheControl: 'private,max-age=3600',
            customMetadata: const {
              'purpose': 'collection-photo-quotation',
              'managedBy': 'cleango-mobile',
            },
          ),
        );
        uploadedPaths.add(path);
      }
      return List.unmodifiable(uploadedPaths);
    } catch (_) {
      await deleteQuoteImages(uploadedPaths);
      rethrow;
    }
  }

  @override
  Future<void> deleteQuoteImages(List<String> storagePaths) async {
    final uid = _currentUid();
    final ownerPrefix = 'collection-quotes/$uid/';
    for (final path in storagePaths) {
      if (!path.startsWith(ownerPrefix)) continue;
      try {
        await _storage.ref(path).delete();
      } on FirebaseException {
        // Best-effort orphan cleanup; the original upload/booking error wins.
      }
    }
  }

  String _currentUid() {
    final uid = _firebaseAuth.currentUser?.uid;
    if (uid == null || uid.isEmpty) {
      throw StateError('A Firebase-authenticated customer is required.');
    }
    return uid;
  }

  String _extensionFor(String fileName) {
    final normalized = fileName.trim().toLowerCase();
    final dot = normalized.lastIndexOf('.');
    final extension = dot == -1 ? '' : normalized.substring(dot + 1);
    if (!supportedExtensions.contains(extension)) {
      throw ArgumentError.value(
        fileName,
        'fileName',
        'Quotation photos must be JPG, PNG, or WebP images.',
      );
    }
    return extension == 'jpeg' ? 'jpg' : extension;
  }

  String _contentTypeFor(String extension) => switch (extension) {
    'jpg' => 'image/jpeg',
    'png' => 'image/png',
    'webp' => 'image/webp',
    _ => 'application/octet-stream',
  };
}

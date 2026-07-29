import 'dart:typed_data';

abstract interface class ProfileImageStorage {
  int get maxFileSizeBytes;

  Set<String> get supportedExtensions;

  Future<String> uploadCurrentCustomerAvatar({
    required Uint8List bytes,
    required String fileName,
  });
}

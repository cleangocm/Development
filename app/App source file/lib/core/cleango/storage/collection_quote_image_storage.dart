import 'dart:typed_data';

class CollectionQuoteImageInput {
  const CollectionQuoteImageInput({
    required this.bytes,
    required this.fileName,
  });

  final Uint8List bytes;
  final String fileName;
}

abstract interface class CollectionQuoteImageStorage {
  int get maxFileSizeBytes;

  int get maxImageCount;

  Set<String> get supportedExtensions;

  Future<List<String>> uploadQuoteImages({
    required String bookingId,
    required List<CollectionQuoteImageInput> images,
  });

  Future<void> deleteQuoteImages(List<String> storagePaths);
}

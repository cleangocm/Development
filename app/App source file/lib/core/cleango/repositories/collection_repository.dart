import 'package:ultrawash/core/cleango/models/collection.dart';

abstract interface class CollectionRepository {
  Future<List<WasteCollection>> getUpcomingCollections(String customerId);

  Future<List<WasteCollection>> getCollectionHistory(String customerId);

  Future<WasteCollection?> getCollectionById(String collectionId);

  Future<WasteCollection> rescheduleCollection(
    String collectionId,
    DateTime scheduledDate,
    String timeWindow,
  );

  Future<WasteCollection> reportMissedCollection(String collectionId);
}

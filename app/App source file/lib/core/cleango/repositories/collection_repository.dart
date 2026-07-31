import 'package:ultrawash/core/cleango/models/address.dart';
import 'package:ultrawash/core/cleango/models/collection.dart';

abstract interface class CollectionRepository {
  Future<List<Address>> getSavedAddresses(String customerId);

  CollectionPricing quoteCollection({
    required CollectionBookingMode bookingMode,
    required int? declaredBagCount,
    required String serviceZone,
  });

  Future<CollectionBookingResult> bookCollection(
    CollectionBookingRequest request,
  );

  Future<List<WasteCollection>> getUpcomingCollections(String customerId);

  Future<List<WasteCollection>> getCollectionHistory(String customerId);

  Future<WasteCollection?> getCollectionById(String collectionId);

  Future<WasteCollection> rescheduleCollection(
    String collectionId,
    DateTime scheduledDate,
    String timeWindow,
  );

  Future<WasteCollection> reportMissedCollection(String collectionId);

  Future<WasteCollection> cancelCollection(String collectionId);

  Future<WasteCollection> acceptQuotation(String collectionId);
}

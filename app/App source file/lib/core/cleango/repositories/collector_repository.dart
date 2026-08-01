import 'package:ultrawash/core/cleango/collectors/collector.dart';
import 'package:ultrawash/core/cleango/models/collection.dart';

abstract interface class CollectorRepository {
  Future<CollectorProfile?> getCurrentCollector();

  Future<List<CollectorAssignment>> getAssignedCollections();

  Future<CollectorProfile> updateAvailability(
    CollectorAvailability availability, {
    String? reason,
  });

  Future<CollectorAssignment> updateCollectionStatus(
    String collectionId,
    CollectionStatus nextStatus, {
    String? missedReason,
  });
}

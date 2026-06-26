import 'package:ultrawash/core/cleango/models/collection.dart';
import 'package:ultrawash/core/cleango/repositories/collection_repository.dart';
import 'package:ultrawash/core/cleango/services/mock_collection_service.dart';

class CollectionsTabController {
  CollectionsTabController({
    required this.collectionRepository,
    this.customerId = _demoCustomerId,
  });

  factory CollectionsTabController.mock() {
    return CollectionsTabController(
      collectionRepository: MockCollectionService(),
    );
  }

  static const _demoCustomerId = 'customer-demo-001';

  final CollectionRepository collectionRepository;
  final String customerId;

  Future<CollectionsTabViewData> load() async {
    final upcoming = await collectionRepository.getUpcomingCollections(
      customerId,
    );
    final history = await collectionRepository.getCollectionHistory(customerId);

    final sortedUpcoming = [
      ...upcoming,
    ]..sort((left, right) => left.scheduledDate.compareTo(right.scheduledDate));
    final sortedHistory = [
      ...history,
    ]..sort((left, right) => right.scheduledDate.compareTo(left.scheduledDate));

    return CollectionsTabViewData(
      upcomingCollections: List.unmodifiable(sortedUpcoming),
      collectionHistory: List.unmodifiable(sortedHistory),
    );
  }
}

class CollectionsTabViewData {
  const CollectionsTabViewData({
    required this.upcomingCollections,
    required this.collectionHistory,
  });

  factory CollectionsTabViewData.empty() {
    return const CollectionsTabViewData(
      upcomingCollections: [],
      collectionHistory: [],
    );
  }

  final List<WasteCollection> upcomingCollections;
  final List<WasteCollection> collectionHistory;
}

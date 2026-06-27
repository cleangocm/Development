import 'package:ultrawash/core/cleango/models/collection.dart';
import 'package:ultrawash/core/cleango/repositories/collection_repository.dart';
import 'package:ultrawash/core/cleango/services/mock_collection_service.dart';
import 'package:ultrawash/core/cleango/session/current_customer_provider.dart';
import 'package:ultrawash/core/cleango/session/mock_current_customer_provider.dart';

class CollectionsTabController {
  CollectionsTabController({
    required this.currentCustomerProvider,
    required this.collectionRepository,
  });

  factory CollectionsTabController.mock() {
    return CollectionsTabController(
      currentCustomerProvider: MockCurrentCustomerProvider(),
      collectionRepository: MockCollectionService(),
    );
  }

  final CurrentCustomerProvider currentCustomerProvider;
  final CollectionRepository collectionRepository;

  Future<CollectionsTabViewData> load() async {
    final customerId = await currentCustomerProvider.getCurrentCustomerId();
    if (customerId == null || customerId.isEmpty) {
      return CollectionsTabViewData.empty();
    }

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

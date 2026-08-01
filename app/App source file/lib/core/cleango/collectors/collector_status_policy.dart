import 'package:ultrawash/core/cleango/models/collection.dart';

class CollectorStatusPolicy {
  const CollectorStatusPolicy._();

  static bool canTransition(
    CollectionStatus current,
    CollectionStatus next, {
    String? missedReason,
  }) {
    if (next == CollectionStatus.missed) {
      return _canMarkMissed(current) &&
          (missedReason?.trim().isNotEmpty ?? false);
    }

    return switch (current) {
      CollectionStatus.assigned => next == CollectionStatus.onTheWay,
      CollectionStatus.onTheWay => next == CollectionStatus.arrived,
      CollectionStatus.arrived => next == CollectionStatus.inProgress,
      CollectionStatus.inProgress => next == CollectionStatus.completed,
      _ => false,
    };
  }

  static bool _canMarkMissed(CollectionStatus current) {
    return current == CollectionStatus.assigned ||
        current == CollectionStatus.onTheWay ||
        current == CollectionStatus.arrived ||
        current == CollectionStatus.inProgress;
  }

  static List<CollectionStatus> actionsFor(CollectionStatus current) {
    final next = switch (current) {
      CollectionStatus.assigned => CollectionStatus.onTheWay,
      CollectionStatus.onTheWay => CollectionStatus.arrived,
      CollectionStatus.arrived => CollectionStatus.inProgress,
      CollectionStatus.inProgress => CollectionStatus.completed,
      _ => null,
    };
    return [
      if (next != null) next,
      if (_canMarkMissed(current)) CollectionStatus.missed,
    ];
  }
}

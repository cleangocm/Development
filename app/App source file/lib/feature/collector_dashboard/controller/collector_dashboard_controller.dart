import 'package:ultrawash/core/cleango/collections/collection_schedule_service.dart';
import 'package:ultrawash/core/cleango/collectors/collector.dart';
import 'package:ultrawash/core/cleango/models/collection.dart';
import 'package:ultrawash/core/cleango/repositories/collector_repository.dart';
import 'package:ultrawash/core/cleango/repositories/firebase/firebase_collector_repository.dart';

class CollectorDashboardController {
  CollectorDashboardController({required this.repository});

  factory CollectorDashboardController.firebase() {
    return CollectorDashboardController(
      repository: FirebaseCollectorRepository(),
    );
  }

  final CollectorRepository repository;

  Future<CollectorDashboardViewData> load() async {
    final profile = await repository.getCurrentCollector();
    if (profile == null || !profile.canOperate) {
      throw StateError('An approved active collector account is required.');
    }
    final assignments = await repository.getAssignedCollections();
    final serviceNow = const CollectionScheduleService().toServiceLocalDate(
      DateTime.now().toUtc(),
    );

    final today = <CollectorAssignment>[];
    final upcoming = <CollectorAssignment>[];
    final completedToday = <CollectorAssignment>[];
    final missed = <CollectorAssignment>[];

    for (final assignment in assignments) {
      final scheduled = assignment.scheduledDate;
      final isToday = scheduled != null && _sameDay(scheduled, serviceNow);
      if (assignment.isCompleted && isToday) {
        completedToday.add(assignment);
      } else if (assignment.isMissed) {
        missed.add(assignment);
      } else if (isToday) {
        today.add(assignment);
      } else if (scheduled == null || scheduled.isAfter(serviceNow)) {
        upcoming.add(assignment);
      }
    }

    return CollectorDashboardViewData(
      profile: profile,
      today: List.unmodifiable(today),
      upcoming: List.unmodifiable(upcoming),
      completedToday: List.unmodifiable(completedToday),
      missed: List.unmodifiable(missed),
      assignedToday: today.length + completedToday.length,
      completedCount: completedToday.length,
      remainingCount: today.length,
      missedCount: missed.length,
    );
  }

  Future<void> updateAvailability(
    CollectorAvailability availability, {
    String? reason,
  }) {
    return repository
        .updateAvailability(availability, reason: reason)
        .then((_) {});
  }

  Future<CollectorAssignment> updateCollectionStatus(
    String collectionId,
    CollectionStatus nextStatus, {
    String? missedReason,
  }) {
    return repository.updateCollectionStatus(
      collectionId,
      nextStatus,
      missedReason: missedReason,
    );
  }

  bool _sameDay(DateTime left, DateTime right) {
    return left.year == right.year &&
        left.month == right.month &&
        left.day == right.day;
  }
}

class CollectorDashboardViewData {
  const CollectorDashboardViewData({
    required this.profile,
    required this.today,
    required this.upcoming,
    required this.completedToday,
    required this.missed,
    required this.assignedToday,
    required this.completedCount,
    required this.remainingCount,
    required this.missedCount,
  });

  final CollectorProfile profile;
  final List<CollectorAssignment> today;
  final List<CollectorAssignment> upcoming;
  final List<CollectorAssignment> completedToday;
  final List<CollectorAssignment> missed;
  final int assignedToday;
  final int completedCount;
  final int remainingCount;
  final int missedCount;
}

import 'package:flutter/material.dart';

enum CollectionStatus {
  scheduled,
  collectorAssigned,
  inProgress,
  completed,
  missed,
}

extension CollectionStatusStyle on CollectionStatus {
  String get label => switch (this) {
    CollectionStatus.scheduled => 'Scheduled',
    CollectionStatus.collectorAssigned => 'Collector Assigned',
    CollectionStatus.inProgress => 'In Progress',
    CollectionStatus.completed => 'Completed',
    CollectionStatus.missed => 'Missed',
  };

  Color get foreground => switch (this) {
    CollectionStatus.scheduled => const Color(0xFF1D4ED8),
    CollectionStatus.collectorAssigned => const Color(0xFF6D28D9),
    CollectionStatus.inProgress => const Color(0xFFB45309),
    CollectionStatus.completed => const Color(0xFF15803D),
    CollectionStatus.missed => const Color(0xFFB91C1C),
  };

  Color get background => switch (this) {
    CollectionStatus.scheduled => const Color(0xFFDBEAFE),
    CollectionStatus.collectorAssigned => const Color(0xFFEDE9FE),
    CollectionStatus.inProgress => const Color(0xFFFEF3C7),
    CollectionStatus.completed => const Color(0xFFDDF7E5),
    CollectionStatus.missed => const Color(0xFFFEE2E2),
  };
}

class CollectionStatusCard extends StatelessWidget {
  const CollectionStatusCard({required this.status, super.key});

  final CollectionStatus status;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: status.background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        status.label,
        style: TextStyle(
          color: status.foreground,
          fontSize: 12,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

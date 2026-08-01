import 'package:flutter/material.dart';
import 'package:ultrawash/core/cleango/models/collection.dart';

extension CollectionStatusStyle on CollectionStatus {
  Color get foreground => switch (this) {
    CollectionStatus.quotationRequested => const Color(0xFF92400E),
    CollectionStatus.pending => const Color(0xFFB45309),
    CollectionStatus.confirmed => const Color(0xFF1D4ED8),
    CollectionStatus.assigned => const Color(0xFF6D28D9),
    CollectionStatus.onTheWay => const Color(0xFF0369A1),
    CollectionStatus.arrived => const Color(0xFF0F766E),
    CollectionStatus.inProgress => const Color(0xFFB45309),
    CollectionStatus.completed => const Color(0xFF15803D),
    CollectionStatus.missed => const Color(0xFFB91C1C),
    CollectionStatus.cancelled => const Color(0xFF475569),
  };

  Color get background => switch (this) {
    CollectionStatus.quotationRequested => const Color(0xFFFEF3C7),
    CollectionStatus.pending => const Color(0xFFFFF7ED),
    CollectionStatus.confirmed => const Color(0xFFDBEAFE),
    CollectionStatus.assigned => const Color(0xFFEDE9FE),
    CollectionStatus.onTheWay => const Color(0xFFE0F2FE),
    CollectionStatus.arrived => const Color(0xFFCCFBF1),
    CollectionStatus.inProgress => const Color(0xFFFEF3C7),
    CollectionStatus.completed => const Color(0xFFDDF7E5),
    CollectionStatus.missed => const Color(0xFFFEE2E2),
    CollectionStatus.cancelled => const Color(0xFFE2E8F0),
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

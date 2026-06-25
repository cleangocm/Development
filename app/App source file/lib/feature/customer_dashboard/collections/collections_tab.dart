import 'package:flutter/material.dart';
import 'package:ultrawash/feature/customer_dashboard/collections/widgets/collection_history_card.dart';
import 'package:ultrawash/feature/customer_dashboard/collections/widgets/collection_status_card.dart';
import 'package:ultrawash/feature/customer_dashboard/collections/widgets/collection_timeline_card.dart';
import 'package:ultrawash/feature/customer_dashboard/collections/widgets/empty_collections_state.dart';

class CollectionsTab extends StatelessWidget {
  const CollectionsTab({super.key});

  static const _history = [
    CollectionHistoryCard(
      date: '20 June 2026',
      timeWindow: '8:00 AM - 11:00 AM',
      address: 'Bastos, Yaounde',
      wasteType: 'Household waste',
      status: CollectionStatus.completed,
    ),
    CollectionHistoryCard(
      date: '13 June 2026',
      timeWindow: '1:00 PM - 4:00 PM',
      address: 'Bastos, Yaounde',
      wasteType: 'Recyclable waste',
      status: CollectionStatus.missed,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 120),
      children: [
        const Text(
          'My collections',
          style: TextStyle(
            color: Color(0xFF0F172A),
            fontSize: 26,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 6),
        const Text(
          'Track upcoming pickups and review your collection history.',
          style: TextStyle(color: Color(0xFF64748B)),
        ),
        const SizedBox(height: 24),
        const _SectionTitle(title: 'Upcoming collections'),
        const SizedBox(height: 12),
        const CollectionTimelineCard(
          date: '27 June 2026',
          timeWindow: '8:00 AM - 11:00 AM',
          address: 'Bastos, Yaounde',
          wasteType: 'Household waste',
          status: CollectionStatus.collectorAssigned,
        ),
        const SizedBox(height: 28),
        const _SectionTitle(title: 'Collection history'),
        const SizedBox(height: 12),
        if (_history.isEmpty)
          const EmptyCollectionsState()
        else
          LayoutBuilder(
            builder: (context, constraints) {
              final twoColumns = constraints.maxWidth >= 760;
              if (!twoColumns) {
                return Column(
                  children: [
                    for (final card in _history) ...[
                      card,
                      const SizedBox(height: 14),
                    ],
                  ],
                );
              }

              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(child: _history[0]),
                  const SizedBox(width: 16),
                  Expanded(child: _history[1]),
                ],
              );
            },
          ),
      ],
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: const TextStyle(
        color: Color(0xFF0F172A),
        fontSize: 20,
        fontWeight: FontWeight.w800,
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:ultrawash/core/cleango/models/collection.dart';
import 'package:ultrawash/feature/customer_dashboard/collections/widgets/collection_status_card.dart';

class CollectionHistoryCard extends StatelessWidget {
  const CollectionHistoryCard({required this.collection, super.key});

  final WasteCollection collection;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  _dateLabel(collection.scheduledDate),
                  style: const TextStyle(
                    color: Color(0xFF0F172A),
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              CollectionStatusCard(status: collection.status),
            ],
          ),
          const SizedBox(height: 14),
          _HistoryDetail(icon: Icons.schedule, text: collection.timeWindow),
          const SizedBox(height: 9),
          _HistoryDetail(
            icon: Icons.location_on_outlined,
            text: collection.address.formattedAddress,
          ),
          const SizedBox(height: 9),
          _HistoryDetail(
            icon: Icons.delete_outline,
            text: _wasteTypeLabel(collection.wasteType),
          ),
          const SizedBox(height: 18),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              OutlinedButton(
                onPressed: () {},
                child: const Text('View Details'),
              ),
              if (collection.status == CollectionStatus.missed)
                TextButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.report_problem_outlined),
                  label: const Text('Report Missed Pickup'),
                  style: TextButton.styleFrom(
                    foregroundColor: const Color(0xFFB91C1C),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _HistoryDetail extends StatelessWidget {
  const _HistoryDetail({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18, color: const Color(0xFF64748B)),
        const SizedBox(width: 8),
        Expanded(
          child: Text(text, style: const TextStyle(color: Color(0xFF475569))),
        ),
      ],
    );
  }
}

String _dateLabel(DateTime date) {
  return '${date.day} ${_monthName(date.month)} ${date.year}';
}

String _wasteTypeLabel(WasteType wasteType) {
  return switch (wasteType) {
    WasteType.household => 'Household waste',
    WasteType.recyclable => 'Recyclable waste',
    WasteType.organic => 'Organic waste',
    WasteType.commercial => 'Commercial waste',
    WasteType.medical => 'Medical waste',
    WasteType.bulky => 'Bulky waste',
  };
}

String _monthName(int month) {
  const names = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return names[month - 1];
}

import 'package:flutter/material.dart';
import 'package:ultrawash/core/cleango/models/collection.dart';
import 'package:ultrawash/feature/customer_dashboard/collections/widgets/collection_status_card.dart';

class CollectionTimelineCard extends StatelessWidget {
  const CollectionTimelineCard({required this.collection, super.key});

  final WasteCollection collection;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFBFDBFE)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0D0F172A),
            blurRadius: 18,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(
                  Icons.local_shipping_outlined,
                  color: Color(0xFF1073E6),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  _dateLabel(collection.scheduledDate),
                  style: const TextStyle(
                    color: Color(0xFF0F172A),
                    fontSize: 19,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              CollectionStatusCard(status: collection.status),
            ],
          ),
          const SizedBox(height: 18),
          Wrap(
            spacing: 20,
            runSpacing: 12,
            children: [
              _CollectionDetail(
                icon: Icons.schedule,
                text: collection.timeWindow,
              ),
              _CollectionDetail(
                icon: Icons.location_on_outlined,
                text: collection.address.formattedAddress,
              ),
              _CollectionDetail(
                icon: Icons.delete_outline,
                text: _wasteTypeLabel(collection.wasteType),
              ),
            ],
          ),
          const SizedBox(height: 22),
          _CollectionTimeline(currentStatus: collection.status),
          const SizedBox(height: 20),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              OutlinedButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.edit_calendar_outlined),
                label: const Text('Reschedule'),
              ),
              FilledButton.tonalIcon(
                onPressed: () {},
                icon: const Icon(Icons.visibility_outlined),
                label: const Text('View Details'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _CollectionTimeline extends StatelessWidget {
  const _CollectionTimeline({required this.currentStatus});

  final CollectionStatus currentStatus;

  static const _steps = [
    CollectionStatus.scheduled,
    CollectionStatus.collectorAssigned,
    CollectionStatus.inProgress,
    CollectionStatus.completed,
  ];

  @override
  Widget build(BuildContext context) {
    final currentIndex = _steps.indexOf(currentStatus);
    return Row(
      children: [
        for (var index = 0; index < _steps.length; index++) ...[
          Expanded(
            child: Column(
              children: [
                Icon(
                  index <= currentIndex
                      ? Icons.check_circle
                      : Icons.radio_button_unchecked,
                  color: index <= currentIndex
                      ? const Color(0xFF16A34A)
                      : const Color(0xFFCBD5E1),
                  size: 22,
                ),
                const SizedBox(height: 6),
                Text(
                  _steps[index].label,
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  style: const TextStyle(
                    color: Color(0xFF64748B),
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          if (index < _steps.length - 1)
            Container(
              width: 20,
              height: 2,
              color: index < currentIndex
                  ? const Color(0xFF16A34A)
                  : const Color(0xFFE2E8F0),
            ),
        ],
      ],
    );
  }
}

class _CollectionDetail extends StatelessWidget {
  const _CollectionDetail({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 18, color: const Color(0xFF64748B)),
        const SizedBox(width: 6),
        Text(text, style: const TextStyle(color: Color(0xFF475569))),
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

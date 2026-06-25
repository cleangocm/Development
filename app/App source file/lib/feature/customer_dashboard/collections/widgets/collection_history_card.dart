import 'package:flutter/material.dart';
import 'package:ultrawash/feature/customer_dashboard/collections/widgets/collection_status_card.dart';

class CollectionHistoryCard extends StatelessWidget {
  const CollectionHistoryCard({
    required this.date,
    required this.timeWindow,
    required this.address,
    required this.wasteType,
    required this.status,
    super.key,
  });

  final String date;
  final String timeWindow;
  final String address;
  final String wasteType;
  final CollectionStatus status;

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
                  date,
                  style: const TextStyle(
                    color: Color(0xFF0F172A),
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              CollectionStatusCard(status: status),
            ],
          ),
          const SizedBox(height: 14),
          _HistoryDetail(icon: Icons.schedule, text: timeWindow),
          const SizedBox(height: 9),
          _HistoryDetail(icon: Icons.location_on_outlined, text: address),
          const SizedBox(height: 9),
          _HistoryDetail(icon: Icons.delete_outline, text: wasteType),
          const SizedBox(height: 18),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              OutlinedButton(
                onPressed: () {},
                child: const Text('View Details'),
              ),
              if (status == CollectionStatus.missed)
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

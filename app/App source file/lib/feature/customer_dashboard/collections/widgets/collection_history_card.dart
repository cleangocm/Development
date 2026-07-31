import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:ultrawash/core/cleango/models/collection.dart';
import 'package:ultrawash/feature/customer_dashboard/collections/widgets/collection_status_card.dart';

class CollectionHistoryCard extends StatelessWidget {
  const CollectionHistoryCard({
    required this.collection,
    required this.onViewDetails,
    super.key,
  });

  final WasteCollection collection;
  final VoidCallback onViewDetails;

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
                  _dateLabel(collection),
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
            text: collection.addressSnapshot.formattedAddress,
          ),
          const SizedBox(height: 9),
          _HistoryDetail(
            icon: Icons.delete_outline,
            text: collection.wasteCategory.label,
          ),
          const SizedBox(height: 9),
          _HistoryDetail(
            icon: Icons.payments_outlined,
            text:
                '${_priceLabel(collection)} - '
                '${collection.paymentStatus.label}',
          ),
          const SizedBox(height: 18),
          OutlinedButton.icon(
            onPressed: onViewDetails,
            icon: const Icon(Icons.visibility_outlined),
            label: const Text('View details'),
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

String _dateLabel(WasteCollection collection) {
  final scheduledDate = collection.scheduledDate;
  return scheduledDate == null
      ? 'Schedule pending'
      : DateFormat('d MMMM yyyy').format(scheduledDate);
}

String _priceLabel(WasteCollection collection) {
  final amount = collection.displayAmount;
  if (amount == null) return 'Quotation pending';
  return '${NumberFormat.decimalPattern('fr').format(amount)} FCFA';
}

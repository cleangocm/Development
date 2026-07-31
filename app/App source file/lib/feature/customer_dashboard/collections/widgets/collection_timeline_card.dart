import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:ultrawash/core/cleango/models/collection.dart';
import 'package:ultrawash/feature/customer_dashboard/collections/widgets/collection_status_card.dart';

class CollectionTimelineCard extends StatelessWidget {
  const CollectionTimelineCard({
    required this.collection,
    required this.onViewDetails,
    super.key,
  });

  final WasteCollection collection;
  final VoidCallback onViewDetails;

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
                  _dateLabel(collection),
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
              _Detail(icon: Icons.schedule, text: collection.timeWindow),
              _Detail(
                icon: Icons.location_on_outlined,
                text: collection.addressSnapshot.formattedAddress,
              ),
              _Detail(
                icon: Icons.delete_outline,
                text: collection.wasteCategory.label,
              ),
              _Detail(
                icon: Icons.payments_outlined,
                text:
                    '${_priceLabel(collection)} - '
                    '${collection.paymentStatus.label}',
              ),
            ],
          ),
          const SizedBox(height: 22),
          _Timeline(currentStatus: collection.status),
          const SizedBox(height: 20),
          Align(
            alignment: Alignment.centerRight,
            child: FilledButton.tonalIcon(
              onPressed: onViewDetails,
              icon: const Icon(Icons.visibility_outlined),
              label: const Text('View details'),
            ),
          ),
        ],
      ),
    );
  }
}

class _Timeline extends StatelessWidget {
  const _Timeline({required this.currentStatus});

  final CollectionStatus currentStatus;

  static const _steps = [
    CollectionStatus.pending,
    CollectionStatus.confirmed,
    CollectionStatus.assigned,
    CollectionStatus.inProgress,
    CollectionStatus.completed,
  ];

  @override
  Widget build(BuildContext context) {
    final currentIndex = _steps.indexOf(currentStatus);
    final terminalWithoutProgress =
        currentStatus == CollectionStatus.cancelled ||
        currentStatus == CollectionStatus.missed;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (currentStatus == CollectionStatus.quotationRequested)
          const Text(
            'CLEANGO is reviewing this photo quotation request.',
            style: TextStyle(color: Color(0xFF92400E)),
          )
        else if (terminalWithoutProgress)
          Text(
            currentStatus == CollectionStatus.cancelled
                ? 'This booking was cancelled.'
                : 'This collection was marked missed.',
            style: const TextStyle(color: Color(0xFF64748B)),
          )
        else
          Row(
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
                          fontSize: 9,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
                if (index < _steps.length - 1)
                  Container(
                    width: 12,
                    height: 2,
                    color: index < currentIndex
                        ? const Color(0xFF16A34A)
                        : const Color(0xFFE2E8F0),
                  ),
              ],
            ],
          ),
      ],
    );
  }
}

class _Detail extends StatelessWidget {
  const _Detail({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 18, color: const Color(0xFF64748B)),
        const SizedBox(width: 6),
        Flexible(
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

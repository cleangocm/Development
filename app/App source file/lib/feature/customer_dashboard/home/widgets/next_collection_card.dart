import 'package:flutter/material.dart';

class NextCollectionCard extends StatelessWidget {
  const NextCollectionCard({
    required this.scheduledDate,
    required this.pickupStatus,
    required this.address,
    super.key,
  });

  final String scheduledDate;
  final String pickupStatus;
  final String address;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFFF0F7FF),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFBFDBFE)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.local_shipping_outlined,
                color: Color(0xFF1073E6),
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Text(
                  'Next collection',
                  style: TextStyle(
                    color: Color(0xFF475569),
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 5,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFDDF7E5),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  pickupStatus,
                  style: const TextStyle(
                    color: Color(0xFF15803D),
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Text(
            scheduledDate,
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              const Icon(
                Icons.location_on_outlined,
                size: 18,
                color: Color(0xFF64748B),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  address,
                  style: const TextStyle(color: Color(0xFF475569)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

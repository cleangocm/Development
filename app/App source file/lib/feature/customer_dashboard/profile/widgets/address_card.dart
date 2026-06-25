import 'package:flutter/material.dart';

class AddressCard extends StatelessWidget {
  const AddressCard({
    required this.primaryAddress,
    required this.serviceZone,
    required this.isWithinServiceZone,
    super.key,
  });

  final String primaryAddress;
  final String serviceZone;
  final bool isWithinServiceZone;

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
          const Row(
            children: [
              Icon(Icons.home_work_outlined, color: Color(0xFF1073E6)),
              SizedBox(width: 10),
              Text(
                'Pickup address',
                style: TextStyle(
                  color: Color(0xFF0F172A),
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Text(
            primaryAddress,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(
                isWithinServiceZone
                    ? Icons.gps_fixed
                    : Icons.gps_not_fixed_outlined,
                color: isWithinServiceZone
                    ? const Color(0xFF16A34A)
                    : const Color(0xFFB45309),
                size: 19,
              ),
              const SizedBox(width: 7),
              Expanded(
                child: Text(
                  serviceZone,
                  style: TextStyle(
                    color: isWithinServiceZone
                        ? const Color(0xFF15803D)
                        : const Color(0xFFB45309),
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.edit_location_alt_outlined),
              label: const Text('Edit Address'),
            ),
          ),
        ],
      ),
    );
  }
}

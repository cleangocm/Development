import 'package:flutter/material.dart';
import 'package:ultrawash/core/cleango/models/address.dart';

class AddressCard extends StatelessWidget {
  const AddressCard({required this.address, required this.onEdit, super.key});

  final Address address;
  final VoidCallback onEdit;

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
            address.formattedAddress,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(
                address.isWithinServiceArea
                    ? Icons.gps_fixed
                    : Icons.gps_not_fixed_outlined,
                color: address.isWithinServiceArea
                    ? const Color(0xFF16A34A)
                    : const Color(0xFFB45309),
                size: 19,
              ),
              const SizedBox(width: 7),
              Expanded(
                child: Text(
                  address.serviceZone,
                  style: TextStyle(
                    color: address.isWithinServiceArea
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
              onPressed: onEdit,
              icon: const Icon(Icons.edit_location_alt_outlined),
              label: const Text('Edit Address'),
            ),
          ),
        ],
      ),
    );
  }
}

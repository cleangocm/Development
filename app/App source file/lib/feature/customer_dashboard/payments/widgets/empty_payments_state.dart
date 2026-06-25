import 'package:flutter/material.dart';

class EmptyPaymentsState extends StatelessWidget {
  const EmptyPaymentsState({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(30),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: const Column(
        children: [
          Icon(Icons.receipt_long_outlined, color: Color(0xFF94A3B8), size: 42),
          SizedBox(height: 12),
          Text(
            'No payment activity',
            style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
          ),
          SizedBox(height: 6),
          Text(
            'Payments, invoices, and receipts will appear here.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Color(0xFF64748B)),
          ),
        ],
      ),
    );
  }
}

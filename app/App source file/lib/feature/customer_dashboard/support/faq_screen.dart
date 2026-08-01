import 'package:flutter/material.dart';

class FaqScreen extends StatelessWidget {
  const FaqScreen({super.key});

  static const _items = <({String question, String answer})>[
    (
      question: 'How is a one-time collection priced?',
      answer:
          'One-time bag bookings use CLEANGO 60L bags at 500 FCFA per declared bag. Photo quotation requests remain unpriced until CLEANGO reviews them.',
    ),
    (
      question: 'When does a subscription become active?',
      answer:
          'A subscription remains pending until CLEANGO receives trusted payment confirmation. Selecting cash never activates it automatically.',
    ),
    (
      question: 'Can I cancel a collection?',
      answer:
          'Eligible pending or confirmed requests can be cancelled from collection details. Paid refunds require CLEANGO review.',
    ),
    (
      question: 'When is cash payment confirmed?',
      answer:
          'Only an authorized CLEANGO administrator can confirm cash after it is received.',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('CLEANGO FAQs')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          for (final item in _items)
            Card(
              child: ExpansionTile(
                title: Text(
                  item.question,
                  style: const TextStyle(fontWeight: FontWeight.w800),
                ),
                childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                children: [
                  Text(
                    item.answer,
                    style: const TextStyle(
                      color: Color(0xFF475569),
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';

class HomeTab extends StatelessWidget {
  const HomeTab({super.key});

  @override
  Widget build(BuildContext context) {
    return const _HomeContent();
  }
}

class _HomeContent extends StatelessWidget {
  const _HomeContent();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 120),
      children: const [
        Text('Welcome to CLEANGO CM', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800)),
        SizedBox(height: 8),
        Text('Your subscription, next pickup, and service updates will appear here.'),
        SizedBox(height: 24),
        _PreviewCard(icon: Icons.recycling, title: 'My subscription', subtitle: 'Plan information will be connected in a later phase.'),
        SizedBox(height: 14),
        _PreviewCard(icon: Icons.local_shipping_outlined, title: 'Next collection', subtitle: 'Upcoming pickup details will appear here.'),
      ],
    );
  }
}

class _PreviewCard extends StatelessWidget {
  const _PreviewCard({required this.icon, required this.title, required this.subtitle});
  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Row(
          children: [
            Icon(icon, size: 34, color: const Color(0xFF16A34A)),
            const SizedBox(width: 16),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
              const SizedBox(height: 5),
              Text(subtitle),
            ])),
          ],
        ),
      ),
    );
  }
}
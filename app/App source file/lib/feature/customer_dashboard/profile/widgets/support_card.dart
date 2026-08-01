import 'package:flutter/material.dart';

class SupportCard extends StatelessWidget {
  const SupportCard({
    required this.onContactSupport,
    required this.onReportMissedCollection,
    required this.onFaq,
    super.key,
  });

  final VoidCallback onContactSupport;
  final VoidCallback onReportMissedCollection;
  final VoidCallback onFaq;

  @override
  Widget build(BuildContext context) {
    final actions = <_ActionItem>[
      _ActionItem(
        icon: Icons.chat_outlined,
        label: 'Contact Support',
        onTap: onContactSupport,
      ),
      _ActionItem(
        icon: Icons.report_problem_outlined,
        label: 'Report Missed Collection',
        onTap: onReportMissedCollection,
      ),
      _ActionItem(icon: Icons.help_outline, label: 'FAQs', onTap: onFaq),
    ];
    return _ActionCard(
      title: 'Support',
      icon: Icons.support_agent,
      actions: actions,
    );
  }
}

class _ActionCard extends StatelessWidget {
  const _ActionCard({
    required this.title,
    required this.icon,
    required this.actions,
  });

  final String title;
  final IconData icon;
  final List<_ActionItem> actions;

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
              Icon(icon, color: const Color(0xFF16A34A)),
              const SizedBox(width: 10),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          for (final action in actions)
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Icon(action.icon, color: const Color(0xFF64748B)),
              title: Text(
                action.label,
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
              trailing: const Icon(Icons.chevron_right),
              onTap: action.onTap,
            ),
        ],
      ),
    );
  }
}

class _ActionItem {
  const _ActionItem({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
}

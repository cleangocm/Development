import 'package:flutter/material.dart';

class AccountCard extends StatelessWidget {
  const AccountCard({super.key});

  static const _actions = [
    _AccountAction(icon: Icons.privacy_tip_outlined, label: 'Privacy Policy'),
    _AccountAction(icon: Icons.description_outlined, label: 'Terms of Service'),
    _AccountAction(icon: Icons.lock_outline, label: 'Change Password'),
    _AccountAction(
      icon: Icons.logout,
      label: 'Logout',
      color: Color(0xFFB91C1C),
    ),
  ];

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
              Icon(Icons.manage_accounts_outlined, color: Color(0xFF1073E6)),
              SizedBox(width: 10),
              Text(
                'Account',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
              ),
            ],
          ),
          const SizedBox(height: 10),
          for (final action in _actions)
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Icon(action.icon, color: action.color),
              title: Text(
                action.label,
                style: TextStyle(
                  color: action.color,
                  fontWeight: FontWeight.w700,
                ),
              ),
              trailing: Icon(Icons.chevron_right, color: action.color),
              onTap: () {},
            ),
        ],
      ),
    );
  }
}

class _AccountAction {
  const _AccountAction({
    required this.icon,
    required this.label,
    this.color = const Color(0xFF475569),
  });

  final IconData icon;
  final String label;
  final Color color;
}

import 'package:flutter/material.dart';

class AccountCard extends StatelessWidget {
  const AccountCard({
    required this.onPrivacyPolicy,
    required this.onTermsOfService,
    required this.onChangePassword,
    required this.onLogout,
    super.key,
  });

  final VoidCallback onPrivacyPolicy;
  final VoidCallback onTermsOfService;
  final VoidCallback onChangePassword;
  final VoidCallback? onLogout;

  @override
  Widget build(BuildContext context) {
    final actions = <_AccountAction>[
      _AccountAction(
        icon: Icons.privacy_tip_outlined,
        label: 'Privacy Policy',
        onTap: onPrivacyPolicy,
      ),
      _AccountAction(
        icon: Icons.description_outlined,
        label: 'Terms of Service',
        onTap: onTermsOfService,
      ),
      _AccountAction(
        icon: Icons.lock_outline,
        label: 'Change Password',
        onTap: onChangePassword,
      ),
      _AccountAction(
        icon: Icons.logout,
        label: 'Logout',
        color: const Color(0xFFB91C1C),
        onTap: onLogout,
      ),
    ];

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
          for (final action in actions)
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
              onTap: action.onTap,
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
    required this.onTap,
    this.color = const Color(0xFF475569),
  });

  final IconData icon;
  final String label;
  final VoidCallback? onTap;
  final Color color;
}

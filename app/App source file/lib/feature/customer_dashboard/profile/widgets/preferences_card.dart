import 'package:flutter/material.dart';

class PreferencesCard extends StatefulWidget {
  const PreferencesCard({super.key});

  @override
  State<PreferencesCard> createState() => _PreferencesCardState();
}

class _PreferencesCardState extends State<PreferencesCard> {
  bool biometricsEnabled = true;
  bool notificationsEnabled = true;
  bool darkModeEnabled = false;
  String language = 'English';

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
          const Text(
            'Preferences',
            style: TextStyle(
              color: Color(0xFF0F172A),
              fontSize: 18,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 10),
          _PreferenceSwitch(
            icon: Icons.fingerprint,
            title: 'Biometrics',
            value: biometricsEnabled,
            onChanged: (value) => setState(() => biometricsEnabled = value),
          ),
          _PreferenceSwitch(
            icon: Icons.notifications_outlined,
            title: 'Notifications',
            value: notificationsEnabled,
            onChanged: (value) => setState(() => notificationsEnabled = value),
          ),
          _PreferenceSwitch(
            icon: Icons.dark_mode_outlined,
            title: 'Dark mode',
            value: darkModeEnabled,
            onChanged: (value) => setState(() => darkModeEnabled = value),
          ),
          const Divider(),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.language, color: Color(0xFF1073E6)),
            title: const Text(
              'Language',
              style: TextStyle(fontWeight: FontWeight.w700),
            ),
            trailing: DropdownButton<String>(
              value: language,
              underline: const SizedBox.shrink(),
              items: const [
                DropdownMenuItem(value: 'English', child: Text('English')),
                DropdownMenuItem(value: 'French', child: Text('French')),
              ],
              onChanged: (value) {
                if (value != null) setState(() => language = value);
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _PreferenceSwitch extends StatelessWidget {
  const _PreferenceSwitch({
    required this.icon,
    required this.title,
    required this.value,
    required this.onChanged,
  });

  final IconData icon;
  final String title;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return SwitchListTile(
      contentPadding: EdgeInsets.zero,
      secondary: Icon(icon, color: const Color(0xFF1073E6)),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
      value: value,
      activeThumbColor: const Color(0xFF16A34A),
      onChanged: onChanged,
    );
  }
}

import 'package:flutter/material.dart';

class ProfileHeaderCard extends StatelessWidget {
  const ProfileHeaderCard({
    required this.name,
    required this.phoneNumber,
    required this.email,
    required this.serviceArea,
    this.avatarUrl,
    super.key,
  });

  final String name;
  final String phoneNumber;
  final String email;
  final String serviceArea;
  final String? avatarUrl;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF0F172A), Color(0xFF123B68)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final compact = constraints.maxWidth < 520;
          final avatar = CircleAvatar(
            radius: 38,
            backgroundColor: const Color(0xFFDDF7E5),
            backgroundImage: avatarUrl == null
                ? null
                : NetworkImage(avatarUrl!),
            child: avatarUrl == null
                ? Text(
                    name.substring(0, 1).toUpperCase(),
                    style: const TextStyle(
                      color: Color(0xFF0F172A),
                      fontSize: 29,
                      fontWeight: FontWeight.w800,
                    ),
                  )
                : null,
          );
          final details = Column(
            crossAxisAlignment: compact
                ? CrossAxisAlignment.center
                : CrossAxisAlignment.start,
            children: [
              Text(
                name,
                textAlign: compact ? TextAlign.center : TextAlign.start,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 10),
              _ContactLine(icon: Icons.phone_outlined, value: phoneNumber),
              const SizedBox(height: 7),
              _ContactLine(icon: Icons.email_outlined, value: email),
              const SizedBox(height: 7),
              _ContactLine(
                icon: Icons.location_on_outlined,
                value: serviceArea,
                iconColor: const Color(0xFF86EFAC),
              ),
            ],
          );

          if (compact) {
            return Column(
              children: [avatar, const SizedBox(height: 16), details],
            );
          }
          return Row(
            children: [
              avatar,
              const SizedBox(width: 18),
              Expanded(child: details),
            ],
          );
        },
      ),
    );
  }
}

class _ContactLine extends StatelessWidget {
  const _ContactLine({
    required this.icon,
    required this.value,
    this.iconColor = const Color(0xFF93C5FD),
  });

  final IconData icon;
  final String value;
  final Color iconColor;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 17, color: iconColor),
        const SizedBox(width: 7),
        Flexible(
          child: Text(value, style: const TextStyle(color: Color(0xFFE2E8F0))),
        ),
      ],
    );
  }
}

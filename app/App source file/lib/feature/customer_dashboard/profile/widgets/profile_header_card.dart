import 'package:flutter/material.dart';
import 'package:ultrawash/core/cleango/models/customer.dart';

class ProfileHeaderCard extends StatelessWidget {
  const ProfileHeaderCard({
    required this.customer,
    this.onChangePhoto,
    this.isUploadingAvatar = false,
    super.key,
  });

  final Customer customer;
  final VoidCallback? onChangePhoto;
  final bool isUploadingAvatar;

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
          final avatar = _ProfileAvatar(
            customer: customer,
            onChangePhoto: onChangePhoto,
            isUploading: isUploadingAvatar,
          );
          final details = Column(
            crossAxisAlignment: compact
                ? CrossAxisAlignment.center
                : CrossAxisAlignment.start,
            children: [
              Text(
                customer.fullName,
                textAlign: compact ? TextAlign.center : TextAlign.start,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 10),
              _ContactLine(
                icon: Icons.phone_outlined,
                value: customer.phoneNumber,
              ),
              const SizedBox(height: 7),
              _ContactLine(icon: Icons.email_outlined, value: customer.email),
              const SizedBox(height: 7),
              _ContactLine(
                icon: Icons.location_on_outlined,
                value: customer.serviceArea,
                iconColor: const Color(0xFF86EFAC),
              ),
              if (onChangePhoto != null) ...[
                const SizedBox(height: 16),
                _ChangePhotoButton(
                  onPressed: isUploadingAvatar ? null : onChangePhoto,
                  isUploading: isUploadingAvatar,
                ),
              ],
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

class _ChangePhotoButton extends StatelessWidget {
  const _ChangePhotoButton({
    required this.onPressed,
    required this.isUploading,
  });

  final VoidCallback? onPressed;
  final bool isUploading;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: 'Change profile photo',
      child: OutlinedButton.icon(
        onPressed: onPressed,
        icon: isUploading
            ? const SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Colors.white,
                ),
              )
            : const Icon(Icons.camera_alt_outlined, size: 18),
        label: Text(
          isUploading ? 'Uploading photo...' : 'Change profile photo',
        ),
        style: OutlinedButton.styleFrom(
          foregroundColor: Colors.white,
          side: const BorderSide(color: Color(0x6686EFAC)),
          disabledForegroundColor: const Color(0xFFCBD5E1),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        ),
      ),
    );
  }
}

class _ProfileAvatar extends StatelessWidget {
  const _ProfileAvatar({
    required this.customer,
    required this.onChangePhoto,
    required this.isUploading,
  });

  final Customer customer;
  final VoidCallback? onChangePhoto;
  final bool isUploading;

  @override
  Widget build(BuildContext context) {
    final avatar = CircleAvatar(
      radius: 38,
      backgroundColor: const Color(0xFFDDF7E5),
      backgroundImage: customer.avatarUrl == null
          ? null
          : NetworkImage(customer.avatarUrl!),
      child: customer.avatarUrl == null
          ? Text(
              customer.fullName.substring(0, 1).toUpperCase(),
              style: const TextStyle(
                color: Color(0xFF0F172A),
                fontSize: 29,
                fontWeight: FontWeight.w800,
              ),
            )
          : null,
    );

    if (onChangePhoto == null) return avatar;

    return Stack(
      clipBehavior: Clip.none,
      children: [
        avatar,
        if (isUploading)
          const Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: Color(0x990F172A),
                shape: BoxShape.circle,
              ),
              child: Padding(
                padding: EdgeInsets.all(22),
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  color: Colors.white,
                ),
              ),
            ),
          ),
        Positioned(
          right: -2,
          bottom: -2,
          child: Material(
            color: const Color(0xFF16A34A),
            shape: const CircleBorder(),
            child: InkWell(
              customBorder: const CircleBorder(),
              onTap: isUploading ? null : onChangePhoto,
              child: const Padding(
                padding: EdgeInsets.all(8),
                child: Icon(
                  Icons.camera_alt_outlined,
                  color: Colors.white,
                  size: 18,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

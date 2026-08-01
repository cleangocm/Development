import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

class LegalDocumentScreen extends StatelessWidget {
  const LegalDocumentScreen({
    required this.title,
    required this.uri,
    super.key,
  });

  final String title;
  final Uri? uri;

  @override
  Widget build(BuildContext context) {
    final configured = uri != null;
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                configured ? Icons.policy_outlined : Icons.policy_outlined,
                size: 54,
                color: const Color(0xFF16A34A),
              ),
              const SizedBox(height: 16),
              Text(
                configured
                    ? '$title is available on the CLEANGO website.'
                    : '$title is not configured in this build.',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                configured
                    ? 'Open the official document in your browser.'
                    : 'Set the matching CLEANGO dart-define before release. No placeholder legal text is shown as final policy.',
                textAlign: TextAlign.center,
                style: const TextStyle(color: Color(0xFF64748B), height: 1.4),
              ),
              if (configured) ...[
                const SizedBox(height: 20),
                FilledButton.icon(
                  onPressed: () =>
                      launchUrl(uri!, mode: LaunchMode.externalApplication),
                  icon: const Icon(Icons.open_in_new),
                  label: const Text('Open official document'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

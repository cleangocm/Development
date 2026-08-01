import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:ultrawash/core/cleango/di/cleango_service_locator.dart';
import 'package:ultrawash/core/cleango/models/support_request.dart';
import 'package:ultrawash/core/cleango/repositories/support_request_repository.dart';
import 'package:ultrawash/core/config/support_config.dart';

class SupportScreen extends StatefulWidget {
  const SupportScreen({
    super.key,
    this.initialCategory = SupportRequestCategory.general,
    this.collectionId,
    SupportRequestRepository? repository,
  }) : _repository = repository;

  final SupportRequestCategory initialCategory;
  final String? collectionId;
  final SupportRequestRepository? _repository;

  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  final _formKey = GlobalKey<FormState>();
  final _subject = TextEditingController();
  final _message = TextEditingController();
  late final SupportRequestRepository? _repository =
      widget._repository ??
      CleanGoServiceLocator
          .instance
          .dashboardDependencies
          .supportRequestRepository;
  late SupportRequestCategory _category = widget.initialCategory;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    if (_category == SupportRequestCategory.missedCollection) {
      _subject.text = 'Report a missed collection';
    }
  }

  @override
  void dispose() {
    _subject.dispose();
    _message.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        title: const Text('CLEANGO Support'),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
        children: [
          const Text(
            'How can we help?',
            style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 6),
          const Text(
            'Choose a configured contact channel or send a secure in-app request.',
            style: TextStyle(color: Color(0xFF64748B)),
          ),
          const SizedBox(height: 20),
          _SupportChannel(
            icon: Icons.chat_outlined,
            title: 'WhatsApp',
            subtitle: SupportConfig.hasWhatsApp
                ? 'Open CLEANGO WhatsApp support'
                : 'Not configured: CLEANGO_SUPPORT_WHATSAPP',
            enabled: SupportConfig.hasWhatsApp,
            onTap: () => _launch(SupportConfig.whatsappUri),
          ),
          _SupportChannel(
            icon: Icons.call_outlined,
            title: 'Call support',
            subtitle: SupportConfig.hasPhone
                ? 'Call the configured CLEANGO support line'
                : 'Not configured: CLEANGO_SUPPORT_PHONE',
            enabled: SupportConfig.hasPhone,
            onTap: () => _launch(SupportConfig.phoneUri),
          ),
          _SupportChannel(
            icon: Icons.email_outlined,
            title: 'Email support',
            subtitle: SupportConfig.hasEmail
                ? 'Compose an email to CLEANGO Support'
                : 'Not configured: CLEANGO_SUPPORT_EMAIL',
            enabled: SupportConfig.hasEmail,
            onTap: () => _launch(SupportConfig.emailUri),
          ),
          const SizedBox(height: 20),
          _SupportFormCard(
            formKey: _formKey,
            category: _category,
            subjectController: _subject,
            messageController: _message,
            submitting: _submitting,
            enabled: _repository != null,
            onCategoryChanged: (value) => setState(() => _category = value),
            onSubmit: _submit,
          ),
        ],
      ),
    );
  }

  Future<void> _launch(Uri? uri) async {
    if (uri == null) return;
    final opened = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!opened && mounted) {
      _showMessage('This support channel could not be opened.');
    }
  }

  Future<void> _submit() async {
    final repository = _repository;
    if (_submitting || repository == null) return;
    if (!_formKey.currentState!.validate()) return;

    setState(() => _submitting = true);
    try {
      await repository.createRequest(
        SupportRequestDraft(
          category: _category,
          subject: _subject.text,
          message: _message.text,
          collectionId: widget.collectionId,
        ),
      );
      if (!mounted) return;
      _subject.clear();
      _message.clear();
      _showMessage('Your CLEANGO support request was submitted.');
    } catch (error) {
      if (!mounted) return;
      _showMessage(
        error is StateError
            ? error.message
            : 'Unable to submit the support request. Please retry.',
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }
}

class _SupportChannel extends StatelessWidget {
  const _SupportChannel({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.enabled,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final bool enabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        enabled: enabled,
        leading: Icon(
          icon,
          color: enabled ? const Color(0xFF16A34A) : const Color(0xFF94A3B8),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w800)),
        subtitle: Text(subtitle),
        trailing: Icon(enabled ? Icons.open_in_new : Icons.lock_outline),
        onTap: enabled ? onTap : null,
      ),
    );
  }
}

class _SupportFormCard extends StatelessWidget {
  const _SupportFormCard({
    required this.formKey,
    required this.category,
    required this.subjectController,
    required this.messageController,
    required this.submitting,
    required this.enabled,
    required this.onCategoryChanged,
    required this.onSubmit,
  });

  final GlobalKey<FormState> formKey;
  final SupportRequestCategory category;
  final TextEditingController subjectController;
  final TextEditingController messageController;
  final bool submitting;
  final bool enabled;
  final ValueChanged<SupportRequestCategory> onCategoryChanged;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Form(
          key: formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'In-app support request',
                style: TextStyle(fontSize: 19, fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 6),
              Text(
                enabled
                    ? 'Your request is stored securely for CLEANGO support staff.'
                    : 'In-app support is available in Firebase data mode.',
                style: const TextStyle(color: Color(0xFF64748B)),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<SupportRequestCategory>(
                initialValue: category,
                decoration: const InputDecoration(labelText: 'Category'),
                items: [
                  for (final value in SupportRequestCategory.values)
                    DropdownMenuItem(value: value, child: Text(value.label)),
                ],
                onChanged: enabled && !submitting
                    ? (value) {
                        if (value != null) onCategoryChanged(value);
                      }
                    : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: subjectController,
                enabled: enabled && !submitting,
                maxLength: 120,
                decoration: const InputDecoration(labelText: 'Subject'),
                validator: (value) {
                  final length = value?.trim().length ?? 0;
                  return length < 3 ? 'Enter a clear subject.' : null;
                },
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: messageController,
                enabled: enabled && !submitting,
                minLines: 4,
                maxLines: 7,
                maxLength: 2000,
                decoration: const InputDecoration(
                  labelText: 'How can CLEANGO help?',
                  alignLabelWithHint: true,
                ),
                validator: (value) {
                  final length = value?.trim().length ?? 0;
                  return length < 10 ? 'Add a little more detail.' : null;
                },
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: enabled && !submitting ? onSubmit : null,
                  icon: submitting
                      ? const SizedBox.square(
                          dimension: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.send_outlined),
                  label: Text(
                    submitting ? 'Submitting...' : 'Submit support request',
                  ),
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF16A34A),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

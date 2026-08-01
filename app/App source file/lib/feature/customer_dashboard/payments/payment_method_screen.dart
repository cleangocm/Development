import 'package:flutter/material.dart';
import 'package:ultrawash/core/cleango/di/cleango_service_locator.dart';
import 'package:ultrawash/core/cleango/models/payment.dart';
import 'package:ultrawash/core/cleango/payments/payment_request_context.dart';
import 'package:ultrawash/core/cleango/payments/payment_service.dart';

class PaymentMethodScreen extends StatefulWidget {
  const PaymentMethodScreen({super.key, required this.paymentContext});

  final PaymentRequestContext paymentContext;

  @override
  State<PaymentMethodScreen> createState() => _PaymentMethodScreenState();
}

class _PaymentMethodScreenState extends State<PaymentMethodScreen> {
  late final PaymentService _service = PaymentService(
    paymentRepository:
        CleanGoServiceLocator.instance.dashboardDependencies.paymentRepository,
  );
  PaymentMethod _selected = PaymentMethod.cash;
  Payment? _createdPayment;
  bool _submitting = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Choose payment method')),
      body: SafeArea(
        child: _createdPayment == null
            ? _selectionContent()
            : _pendingCashContent(_createdPayment!),
      ),
    );
  }

  Widget _selectionContent() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text(
          widget.paymentContext.title,
          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 8),
        Text(
          _money(widget.paymentContext.amountXaf),
          style: const TextStyle(
            color: Color(0xFF15803D),
            fontSize: 28,
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(height: 8),
        const Text(
          'The amount comes from the protected CLEANGO booking or subscription price.',
          style: TextStyle(color: Color(0xFF64748B)),
        ),
        const SizedBox(height: 24),
        for (final method in _service.visibleMethods) ...[
          _PaymentMethodTile(
            method: method,
            selected: _selected == method,
            available: _service.isConfigured(method),
            unavailableMessage: _service.availabilityMessage(method),
            onTap: () => _selectMethod(method),
          ),
          const SizedBox(height: 12),
        ],
        const SizedBox(height: 12),
        FilledButton.icon(
          onPressed: _submitting || !_service.isConfigured(_selected)
              ? null
              : _submit,
          icon: _submitting
              ? const SizedBox.square(
                  dimension: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(Icons.lock_outline),
          label: Text(_submitting ? 'Creating request...' : 'Continue safely'),
          style: FilledButton.styleFrom(
            backgroundColor: const Color(0xFF16A34A),
            minimumSize: const Size.fromHeight(52),
          ),
        ),
      ],
    );
  }

  Widget _pendingCashContent(Payment payment) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        const Icon(
          Icons.hourglass_top_rounded,
          size: 68,
          color: Color(0xFFF59E0B),
        ),
        const SizedBox(height: 20),
        const Text(
          'Cash confirmation pending',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900),
        ),
        const SizedBox(height: 12),
        const Text(
          'Your cash payment will be confirmed after payment is received by an authorized CLEANGO representative.\n\n'
          'Votre paiement en espèces sera confirmé après réception par un représentant CLEANGO autorisé.',
          textAlign: TextAlign.center,
          style: TextStyle(color: Color(0xFF475569), height: 1.45),
        ),
        const SizedBox(height: 20),
        _SummaryRow(label: 'Amount', value: _money(payment.amountXaf)),
        _SummaryRow(label: 'Method', value: payment.method.label()),
        _SummaryRow(label: 'Status', value: payment.status.label),
        _SummaryRow(label: 'Service', value: payment.relatedServiceLabel),
        const SizedBox(height: 28),
        FilledButton(
          onPressed: () => Navigator.of(context).pop(true),
          child: const Text('Done'),
        ),
      ],
    );
  }

  void _selectMethod(PaymentMethod method) {
    if (!_service.isConfigured(method)) {
      showDialog<void>(
        context: context,
        builder: (context) => AlertDialog(
          title: Text(method.label()),
          content: Text(_service.availabilityMessage(method)),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Close'),
            ),
          ],
        ),
      );
      return;
    }
    setState(() => _selected = method);
  }

  Future<void> _submit() async {
    if (_submitting || _selected != PaymentMethod.cash) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Create a pending cash request?'),
        content: const Text(
          'This does not mark the booking or subscription paid. An authorized CLEANGO representative must confirm receipt of cash.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Not now'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Create request'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    setState(() => _submitting = true);
    final result = await _service.initiate(
      widget.paymentContext.request(method: _selected),
    );
    if (!mounted) return;
    setState(() {
      _submitting = false;
      _createdPayment = result.payment;
    });
    if (!result.isSuccess) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            result.failure?.message ?? 'Unable to create the payment request.',
          ),
        ),
      );
    }
  }
}

class _PaymentMethodTile extends StatelessWidget {
  const _PaymentMethodTile({
    required this.method,
    required this.selected,
    required this.available,
    required this.unavailableMessage,
    required this.onTap,
  });

  final PaymentMethod method;
  final bool selected;
  final bool available;
  final String unavailableMessage;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      enabled: available,
      label: method.label(),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: selected && available
                    ? const Color(0xFF16A34A)
                    : const Color(0xFFE2E8F0),
                width: selected && available ? 2 : 1,
              ),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  backgroundColor: _methodColor(method).withValues(alpha: .12),
                  foregroundColor: _methodColor(method),
                  child: Icon(_methodIcon(method)),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        method.label(),
                        style: const TextStyle(fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        available ? 'Available' : unavailableMessage,
                        style: TextStyle(
                          color: available
                              ? const Color(0xFF15803D)
                              : const Color(0xFF64748B),
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(
                  available && selected
                      ? Icons.radio_button_checked
                      : available
                      ? Icons.radio_button_off
                      : Icons.info_outline,
                  color: available
                      ? const Color(0xFF16A34A)
                      : const Color(0xFF94A3B8),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: const TextStyle(color: Color(0xFF64748B)),
            ),
          ),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: const TextStyle(fontWeight: FontWeight.w800),
            ),
          ),
        ],
      ),
    );
  }
}

IconData _methodIcon(PaymentMethod method) => switch (method) {
  PaymentMethod.mtnMobileMoney => Icons.phone_android,
  PaymentMethod.orangeMoney => Icons.phone_iphone,
  PaymentMethod.cash => Icons.payments_outlined,
};

Color _methodColor(PaymentMethod method) => switch (method) {
  PaymentMethod.mtnMobileMoney => const Color(0xFFF5C400),
  PaymentMethod.orangeMoney => const Color(0xFFFF7900),
  PaymentMethod.cash => const Color(0xFF16A34A),
};

String _money(int amount) {
  final digits = amount.toString();
  final buffer = StringBuffer();
  for (var index = 0; index < digits.length; index++) {
    if (index > 0 && (digits.length - index) % 3 == 0) buffer.write(' ');
    buffer.write(digits[index]);
  }
  return '${buffer.toString()} FCFA';
}

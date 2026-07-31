import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:ultrawash/core/cleango/models/address.dart';
import 'package:ultrawash/core/cleango/models/subscription.dart';
import 'package:ultrawash/core/cleango/subscriptions/subscription_request_service.dart';
import 'package:ultrawash/feature/customer_dashboard/collections/controller/subscription_plans_controller.dart';

class SubscriptionPlansScreen extends StatefulWidget {
  const SubscriptionPlansScreen({
    super.key,
    SubscriptionPlansController? controller,
  }) : _controller = controller;

  final SubscriptionPlansController? _controller;

  @override
  State<SubscriptionPlansScreen> createState() =>
      _SubscriptionPlansScreenState();
}

class _SubscriptionPlansScreenState extends State<SubscriptionPlansScreen> {
  late final SubscriptionPlansController _controller =
      widget._controller ?? SubscriptionPlansController.fromLocator();
  late Future<SubscriptionPlansViewData> _data = _controller.load();
  final Map<String, String> _requestIds = {};
  String? _submittingPlanId;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        title: const Text('CLEANGO subscriptions'),
      ),
      body: FutureBuilder<SubscriptionPlansViewData>(
        future: _data,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(
              child: CircularProgressIndicator(color: Color(0xFF16A34A)),
            );
          }
          if (snapshot.hasError) {
            return _LoadError(onRetry: _retry);
          }
          final data = snapshot.data;
          if (data == null || data.plans.isEmpty) {
            return _LoadError(onRetry: _retry);
          }
          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 18, 16, 36),
            children: [
              const Text(
                'Choose a collection plan',
                style: TextStyle(
                  color: Color(0xFF0F172A),
                  fontSize: 26,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Chaque limite correspond à un sac CLEANGO de 60L. Aucun forfait ne couvre un volume illimité.',
                style: TextStyle(color: Color(0xFF475569), height: 1.4),
              ),
              const SizedBox(height: 18),
              for (final plan in data.plans) ...[
                _PlanCard(
                  plan: plan,
                  isSubmitting: _submittingPlanId == plan.id,
                  onChoose: _submittingPlanId == null
                      ? () => _choosePlan(plan, data.addresses)
                      : null,
                ),
                const SizedBox(height: 14),
              ],
              const _GlobalBagNote(),
            ],
          );
        },
      ),
    );
  }

  void _retry() {
    setState(() => _data = _controller.load());
  }

  Future<void> _choosePlan(
    SubscriptionPlanDefinition plan,
    List<Address> addresses,
  ) async {
    if (addresses.isEmpty) {
      _showMessage(
        'Add a supported CLEANGO service address before choosing a plan.',
      );
      return;
    }
    final address = await showModalBottomSheet<Address>(
      context: context,
      showDragHandle: true,
      builder: (context) => SafeArea(
        child: ListView(
          shrinkWrap: true,
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
          children: [
            const Text(
              'Select a service address',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 10),
            for (final address in addresses)
              ListTile(
                leading: const Icon(
                  Icons.location_on_outlined,
                  color: Color(0xFF16A34A),
                ),
                title: Text(address.label),
                subtitle: Text(address.formattedAddress),
                enabled: address.isWithinServiceArea,
                trailing: address.isWithinServiceArea
                    ? const Icon(Icons.chevron_right)
                    : const Text(
                        'Outside zone',
                        style: TextStyle(color: Color(0xFFB91C1C)),
                      ),
                onTap: address.isWithinServiceArea
                    ? () => Navigator.of(context).pop(address)
                    : null,
              ),
          ],
        ),
      ),
    );
    if (address == null || !mounted) return;

    setState(() => _submittingPlanId = plan.id);
    try {
      final result = await _controller.requestPlan(
        requestId: _requestIds.putIfAbsent(
          plan.id,
          _controller.createRequestId,
        ),
        planId: plan.id,
        addressId: address.id,
      );
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        builder: (context) => AlertDialog(
          title: Text(
            plan.requiresQuotation
                ? 'Review request submitted'
                : 'Subscription request submitted',
          ),
          content: Text(
            plan.requiresQuotation
                ? 'CLEANGO will review your needs before setting a final price. The plan is not active and no payment has been recorded.'
                : 'Your request is pending payment. The plan is not active and no payment has been recorded.${result.wasDuplicate ? ' This was the existing request.' : ''}',
          ),
          actions: [
            FilledButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Done'),
            ),
          ],
        ),
      );
      _requestIds.remove(plan.id);
    } catch (error) {
      if (mounted) _showMessage(_message(error));
    } finally {
      if (mounted) setState(() => _submittingPlanId = null);
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }
}

class _PlanCard extends StatelessWidget {
  const _PlanCard({
    required this.plan,
    required this.isSubmitting,
    required this.onChoose,
  });

  final SubscriptionPlanDefinition plan;
  final bool isSubmitting;
  final VoidCallback? onChoose;

  @override
  Widget build(BuildContext context) {
    final popular = plan.id == 'popular';
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: popular ? const Color(0xFF16A34A) : const Color(0xFFE2E8F0),
          width: popular ? 2 : 1,
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0D0F172A),
            blurRadius: 18,
            offset: Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      plan.frenchName,
                      style: const TextStyle(
                        color: Color(0xFF0F172A),
                        fontSize: 21,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      plan.englishName,
                      style: const TextStyle(color: Color(0xFF64748B)),
                    ),
                  ],
                ),
              ),
              if (popular)
                const Chip(
                  label: Text('Populaire'),
                  backgroundColor: Color(0xFFDCFCE7),
                  side: BorderSide.none,
                ),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            _priceLabel(plan),
            style: const TextStyle(
              color: Color(0xFF15803D),
              fontSize: 22,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 14),
          for (final line in _details(plan)) ...[
            _FeatureLine(text: line),
            const SizedBox(height: 8),
          ],
          const _FeatureLine(text: 'Sac supplémentaire de 60L : 500 FCFA'),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: onChoose,
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF16A34A),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: isSubmitting
                  ? const SizedBox.square(
                      dimension: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : Text(
                      plan.requiresQuotation
                          ? 'Demander une étude'
                          : 'Choisir ce forfait',
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FeatureLine extends StatelessWidget {
  const _FeatureLine({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.only(top: 2),
          child: Icon(Icons.check_circle, color: Color(0xFF16A34A), size: 18),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(color: Color(0xFF334155), height: 1.35),
          ),
        ),
      ],
    );
  }
}

class _GlobalBagNote extends StatelessWidget {
  const _GlobalBagNote();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFBEB),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFFDE68A)),
      ),
      child: const Text(
        'Sac supplémentaire de 60L : 500 FCFA. Les frais supplémentaires sont calculés en FCFA entiers.',
        style: TextStyle(color: Color(0xFF92400E), fontWeight: FontWeight.w700),
      ),
    );
  }
}

class _LoadError extends StatelessWidget {
  const _LoadError({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off_outlined, size: 42),
            const SizedBox(height: 12),
            const Text(
              'Unable to load CLEANGO plans.',
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 14),
            FilledButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}

String _priceLabel(SubscriptionPlanDefinition plan) {
  final formatter = NumberFormat.decimalPattern('fr');
  if (plan.requiresQuotation) {
    return 'À partir de ${formatter.format(plan.startingPriceXaf)} FCFA/mois';
  }
  return '${formatter.format(plan.monthlyPriceXaf)} FCFA/mois';
}

List<String> _details(SubscriptionPlanDefinition plan) {
  if (plan.requiresQuotation) {
    return [
      'Planning flexible',
      'Ramassage urgent',
      'Jusqu’à ${plan.includedBagsPerPickup} sacs CLEANGO de 60L par collecte',
      'Tarif final après étude de vos besoins',
    ];
  }
  final pickupWord = plan.pickupsPerWeek == 1 ? 'ramassage' : 'ramassages';
  return [
    '${plan.pickupsPerWeek} $pickupWord par semaine — ${plan.pickupsPerMonth} par mois',
    'Jusqu’à ${plan.includedBagsPerPickup} sacs CLEANGO de 60L par collecte',
    if (plan.bagsSupplied) 'Sacs fournis',
  ];
}

String _message(Object error) {
  if (error is SubscriptionRequestException) return error.message;
  return 'Unable to submit this subscription request. Please try again.';
}

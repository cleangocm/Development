import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:ultrawash/core/cleango/collections/collection_booking_service.dart';
import 'package:ultrawash/core/cleango/models/collection.dart';
import 'package:ultrawash/feature/customer_dashboard/collections/controller/collections_tab_controller.dart';
import 'package:ultrawash/feature/customer_dashboard/collections/widgets/collection_status_card.dart';

class CollectionDetailsScreen extends StatefulWidget {
  const CollectionDetailsScreen({
    required this.controller,
    required this.initialCollection,
    super.key,
  });

  final CollectionsTabController controller;
  final WasteCollection initialCollection;

  @override
  State<CollectionDetailsScreen> createState() =>
      _CollectionDetailsScreenState();
}

class _CollectionDetailsScreenState extends State<CollectionDetailsScreen> {
  late WasteCollection _collection = widget.initialCollection;
  bool _cancelling = false;
  bool _accepting = false;
  bool _changed = false;
  bool _canPop = false;

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: _canPop,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) _pop();
      },
      child: Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        appBar: AppBar(
          backgroundColor: Colors.white,
          title: const Text('Collection details'),
          leading: IconButton(
            onPressed: _pop,
            icon: const Icon(Icons.arrow_back),
          ),
        ),
        body: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _Header(collection: _collection),
            if (_collection.isQuotationPending) ...[
              const SizedBox(height: 16),
              const _QuotationPendingCard(),
            ],
            const SizedBox(height: 16),
            _Section(
              title: 'Request',
              rows: [
                _RowValue('Mode', _collection.bookingMode.label),
                _RowValue('Waste category', _collection.wasteCategory.label),
                if (_collection.declaredBagCount != null)
                  _RowValue(
                    'Declared volume',
                    '${_collection.declaredBagCount} CLEANGO 60L bag${_collection.declaredBagCount == 1 ? '' : 's'}',
                  ),
                if (_collection.photoStoragePaths.isNotEmpty)
                  _RowValue(
                    'Quotation photos',
                    '${_collection.photoStoragePaths.length} submitted',
                  ),
              ],
            ),
            const SizedBox(height: 16),
            _Section(
              title: 'Schedule',
              rows: _collection.scheduledDate == null
                  ? const [
                      _RowValue(
                        'Status',
                        'Scheduling follows quotation review and acceptance.',
                      ),
                    ]
                  : [
                      _RowValue('Date', _date(_collection.scheduledDate!)),
                      _RowValue('Time window', _collection.timeWindow),
                      _RowValue('Frequency', _collection.frequency.label),
                    ],
            ),
            const SizedBox(height: 16),
            _Section(
              title: 'Collection address',
              rows: [
                _RowValue('Label', _collection.addressSnapshot.label),
                _RowValue(
                  'Address',
                  _collection.addressSnapshot.formattedAddress,
                ),
                _RowValue('Service zone', _collection.serviceZone),
              ],
            ),
            const SizedBox(height: 16),
            _Section(
              title: 'Pricing and payment',
              rows: _pricingRows(_collection),
            ),
            if (_collection.customerNotes.isNotEmpty) ...[
              const SizedBox(height: 16),
              _Section(
                title: 'Collection notes',
                rows: [_RowValue('', _collection.customerNotes)],
              ),
            ],
            if (_collection.canAcceptQuotation) ...[
              const SizedBox(height: 20),
              FilledButton.icon(
                onPressed: _accepting || _cancelling
                    ? null
                    : _confirmQuotationAcceptance,
                icon: _accepting
                    ? const SizedBox.square(
                        dimension: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.task_alt),
                label: Text(
                  _accepting ? 'Accepting...' : 'Accept CLEANGO quotation',
                ),
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFF16A34A),
                  padding: const EdgeInsets.symmetric(vertical: 15),
                ),
              ),
            ],
            if (_collection.canCancel) ...[
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: _cancelling || _accepting
                    ? null
                    : _confirmCancellation,
                icon: _cancelling
                    ? const SizedBox.square(
                        dimension: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.cancel_outlined),
                label: Text(
                  _cancelling ? 'Cancelling...' : 'Cancel collection',
                ),
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFFB91C1C),
                  side: const BorderSide(color: Color(0xFFFCA5A5)),
                  padding: const EdgeInsets.symmetric(vertical: 15),
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Cancellation does not trigger an automatic refund in this phase.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Color(0xFF64748B), fontSize: 12),
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _pop() {
    if (_canPop) return;
    setState(() => _canPop = true);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) Navigator.of(context).pop(_changed);
    });
  }

  Future<void> _confirmQuotationAcceptance() async {
    final amount = _collection.quotedAmount;
    if (amount == null) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Accept this quotation?'),
        content: Text(
          'You are accepting the CLEANGO quotation of ${_money(amount)}. This does not mark the request paid.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Not now'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Accept quotation'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    setState(() => _accepting = true);
    try {
      final accepted = await widget.controller.acceptQuotation(_collection.id);
      if (!mounted) return;
      setState(() {
        _collection = accepted;
        _accepting = false;
        _changed = true;
      });
      _showMessage('Quotation accepted. Payment is still unpaid.');
    } catch (error) {
      if (!mounted) return;
      setState(() => _accepting = false);
      _showMessage(_message(error, action: 'accept this quotation'));
    }
  }

  Future<void> _confirmCancellation() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel this collection?'),
        content: const Text(
          'The request will be retained and marked cancelled. No automatic refund is issued.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Keep request'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: FilledButton.styleFrom(
              backgroundColor: const Color(0xFFB91C1C),
            ),
            child: const Text('Cancel collection'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    setState(() => _cancelling = true);
    try {
      final cancelled = await widget.controller.cancel(_collection.id);
      if (!mounted) return;
      setState(() {
        _collection = cancelled;
        _cancelling = false;
        _changed = true;
      });
      _showMessage('Collection cancelled.');
    } catch (error) {
      if (!mounted) return;
      setState(() => _cancelling = false);
      _showMessage(_message(error, action: 'cancel this collection'));
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.collection});

  final WasteCollection collection;

  @override
  Widget build(BuildContext context) {
    return _Card(
      child: Row(
        children: [
          const CircleAvatar(
            backgroundColor: Color(0xFFDCFCE7),
            child: Icon(Icons.recycling, color: Color(0xFF15803D)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Booking reference',
                  style: TextStyle(color: Color(0xFF64748B)),
                ),
                Text(
                  _reference(collection.id),
                  style: const TextStyle(fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 4),
                Text(
                  collection.paymentStatus.label,
                  style: const TextStyle(color: Color(0xFFB45309)),
                ),
              ],
            ),
          ),
          CollectionStatusCard(status: collection.status),
        ],
      ),
    );
  }
}

class _QuotationPendingCard extends StatelessWidget {
  const _QuotationPendingCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFBEB),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFFDE68A)),
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Quotation pending',
            style: TextStyle(fontWeight: FontWeight.w900),
          ),
          SizedBox(height: 5),
          Text(
            'CLEANGO is reviewing your photos. No final price or payment has been recorded.',
            style: TextStyle(color: Color(0xFF92400E)),
          ),
        ],
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.rows});

  final String title;
  final List<_RowValue> rows;

  @override
  Widget build(BuildContext context) {
    return _Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 10),
          for (final row in rows)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 5),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (row.label.isNotEmpty)
                    SizedBox(
                      width: 116,
                      child: Text(
                        row.label,
                        style: const TextStyle(color: Color(0xFF64748B)),
                      ),
                    ),
                  Expanded(
                    child: Text(
                      row.value,
                      textAlign: row.label.isEmpty
                          ? TextAlign.left
                          : TextAlign.right,
                      style: TextStyle(
                        fontWeight: row.strong
                            ? FontWeight.w900
                            : FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _Card extends StatelessWidget {
  const _Card({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: child,
    );
  }
}

class _RowValue {
  const _RowValue(this.label, this.value, {this.strong = false});

  final String label;
  final String value;
  final bool strong;
}

List<_RowValue> _pricingRows(WasteCollection collection) {
  final rows = <_RowValue>[
    _RowValue('Payment', collection.paymentStatus.label),
  ];
  if (collection.bookingMode == CollectionBookingMode.oneTimePhotoQuote) {
    rows.add(_RowValue('Quotation', collection.quotationStatus.label));
    rows.add(
      _RowValue(
        'Quoted amount',
        collection.quotedAmount == null
            ? 'Pending CLEANGO review'
            : _money(collection.quotedAmount!),
        strong: collection.quotedAmount != null,
      ),
    );
    return rows;
  }
  rows.addAll([
    _RowValue('Bag rate', '${_money(collection.extraBagRate)} per 60L bag'),
    _RowValue('Base amount', _money(collection.pricing.baseAmount ?? 0)),
    if (collection.pricing.serviceFee > 0)
      _RowValue('Service fee', _money(collection.pricing.serviceFee)),
    if (collection.pricing.discount > 0)
      _RowValue('Discount', '-${_money(collection.pricing.discount)}'),
    _RowValue(
      'Estimated total',
      _money(collection.pricing.totalAmount ?? 0),
      strong: true,
    ),
  ]);
  return rows;
}

String _reference(String id) =>
    id.length <= 12 ? id : '#${id.substring(id.length - 12).toUpperCase()}';

String _date(DateTime value) => DateFormat('EEE, d MMM yyyy').format(value);

String _money(int amount) =>
    '${NumberFormat.decimalPattern('fr').format(amount)} FCFA';

String _message(Object error, {required String action}) {
  if (error is CollectionBookingException) return error.message;
  return 'Unable to $action. Please try again.';
}

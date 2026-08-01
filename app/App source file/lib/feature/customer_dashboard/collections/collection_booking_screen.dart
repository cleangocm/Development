import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:ultrawash/core/cleango/collections/collection_booking_service.dart';
import 'package:ultrawash/core/cleango/collections/collection_pricing_service.dart';
import 'package:ultrawash/core/cleango/models/address.dart';
import 'package:ultrawash/core/cleango/models/collection.dart';
import 'package:ultrawash/core/cleango/payments/payment_request_context.dart';
import 'package:ultrawash/core/cleango/storage/collection_quote_image_storage.dart';
import 'package:ultrawash/feature/customer_dashboard/collections/controller/collections_tab_controller.dart';
import 'package:ultrawash/feature/customer_dashboard/payments/payment_method_screen.dart';

class CollectionBookingScreen extends StatefulWidget {
  const CollectionBookingScreen({required this.controller, super.key});

  final CollectionsTabController controller;

  @override
  State<CollectionBookingScreen> createState() =>
      _CollectionBookingScreenState();
}

class _CollectionBookingScreenState extends State<CollectionBookingScreen> {
  final _notesController = TextEditingController();
  final _imagePicker = ImagePicker();
  late Future<CollectionBookingViewData> _data;
  late String _requestId;
  Address? _address;
  CollectionBookingMode _mode = CollectionBookingMode.oneTimeBagCount;
  WasteCategory _wasteCategory = WasteCategory.household;
  CollectionTimeWindow _timeWindow = CollectionTimeWindow.morningEarly;
  DateTime? _date;
  int _bagCount = 1;
  List<XFile> _images = const [];
  bool _submitting = false;
  bool _selectingImages = false;

  @override
  void initState() {
    super.initState();
    _requestId = widget.controller.createRequestId();
    _data = widget.controller.loadBooking();
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        title: const Text('Book a collection'),
      ),
      body: FutureBuilder<CollectionBookingViewData>(
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
          if (data == null || data.addresses.isEmpty) {
            return const _EmptyAddressState();
          }
          _address ??= _preferredAddress(data.addresses);
          _date ??= data.firstAvailableDate;
          return _BookingForm(
            data: data,
            address: _address!,
            mode: _mode,
            wasteCategory: _wasteCategory,
            date: _date!,
            timeWindow: _timeWindow,
            bagCount: _bagCount,
            images: _images,
            notesController: _notesController,
            photoQuotationEnabled: widget.controller.photoQuotationEnabled,
            selectingImages: _selectingImages,
            submitting: _submitting,
            pricing: _currentPricing(),
            onAddressChanged: _submitting
                ? null
                : (value) => setState(() => _address = value),
            onModeChanged: _submitting ? null : _setMode,
            onWasteCategoryChanged: _submitting
                ? null
                : (value) => setState(() => _wasteCategory = value),
            onDateTap: _submitting ? null : () => _pickDate(data),
            onTimeWindowChanged: _submitting
                ? null
                : (value) => setState(() => _timeWindow = value),
            onBagCountChanged: _submitting
                ? null
                : (value) => setState(() => _bagCount = value),
            onSelectImages: _submitting || _selectingImages
                ? null
                : _selectImages,
            onRemoveImage: _submitting
                ? null
                : (index) => setState(
                    () => _images = List.of(_images)..removeAt(index),
                  ),
            onSubmit: _submitting ? null : _submit,
          );
        },
      ),
    );
  }

  CollectionPricing? _currentPricing() {
    final address = _address;
    if (address == null) return null;
    try {
      return _mode == CollectionBookingMode.oneTimeBagCount
          ? widget.controller.quoteBagCount(
              address: address,
              declaredBagCount: _bagCount,
            )
          : widget.controller.pendingPhotoQuote(address: address);
    } on CollectionPricingException {
      return null;
    }
  }

  void _setMode(CollectionBookingMode mode) {
    if (mode == CollectionBookingMode.oneTimePhotoQuote &&
        !widget.controller.photoQuotationEnabled) {
      _showMessage('Photo quotations require Firebase data mode.');
      return;
    }
    setState(() => _mode = mode);
  }

  Future<void> _pickDate(CollectionBookingViewData data) async {
    final selected = await showDatePicker(
      context: context,
      initialDate: _date ?? data.firstAvailableDate,
      firstDate: data.firstAvailableDate,
      lastDate: data.firstAvailableDate.add(const Duration(days: 120)),
      selectableDayPredicate: widget.controller.isAvailableDate,
    );
    if (selected != null && mounted) setState(() => _date = selected);
  }

  Future<void> _selectImages() async {
    setState(() => _selectingImages = true);
    try {
      final selected = await _imagePicker.pickMultiImage(
        imageQuality: 85,
        maxWidth: 1920,
      );
      if (!mounted || selected.isEmpty) return;
      if (selected.length > widget.controller.maxQuoteImageCount) {
        _showMessage(
          'Select no more than ${widget.controller.maxQuoteImageCount} photos.',
        );
        return;
      }
      for (final image in selected) {
        final extension = _extension(image.name);
        if (!widget.controller.supportedQuoteImageExtensions.contains(
          extension,
        )) {
          _showMessage('Quotation photos must be JPG, PNG, or WebP images.');
          return;
        }
        if (await image.length() > widget.controller.maxQuoteImageBytes) {
          _showMessage('Each quotation photo must be 4 MB or smaller.');
          return;
        }
      }
      if (mounted) setState(() => _images = List.unmodifiable(selected));
    } catch (_) {
      if (mounted) _showMessage('Unable to open the image picker.');
    } finally {
      if (mounted) setState(() => _selectingImages = false);
    }
  }

  Future<void> _submit() async {
    final address = _address;
    if (address == null) return;
    if (!address.isWithinServiceArea) {
      _showMessage('CLEANGO collection is not available at this address yet.');
      return;
    }
    if (_notesController.text.trim().length > 500) {
      _showMessage('Collection notes must be 500 characters or fewer.');
      return;
    }
    if (_mode == CollectionBookingMode.oneTimePhotoQuote && _images.isEmpty) {
      _showMessage('Select at least one waste photo for the quotation.');
      return;
    }

    setState(() => _submitting = true);
    try {
      late final CollectionBookingResult result;
      if (_mode == CollectionBookingMode.oneTimeBagCount) {
        result = await widget.controller.bookBagCount(
          CollectionBookingRequest(
            requestId: _requestId,
            addressId: address.id,
            bookingMode: _mode,
            wasteCategory: _wasteCategory,
            scheduledDate: _date,
            scheduledTimeWindow: _timeWindow,
            declaredBagCount: _bagCount,
            customerNotes: _notesController.text,
          ),
        );
      } else {
        final inputs = <CollectionQuoteImageInput>[];
        for (final image in _images) {
          inputs.add(
            CollectionQuoteImageInput(
              bytes: await image.readAsBytes(),
              fileName: image.name,
            ),
          );
        }
        result = await widget.controller.bookPhotoQuotation(
          requestId: _requestId,
          addressId: address.id,
          wasteCategory: _wasteCategory,
          images: inputs,
          customerNotes: _notesController.text,
        );
      }
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
          icon: const Icon(
            Icons.check_circle,
            color: Color(0xFF16A34A),
            size: 42,
          ),
          title: Text(
            result.collection.isQuotationPending
                ? 'Votre demande de devis a été envoyée.'
                : 'Booking submitted',
          ),
          content: Text(
            result.collection.isQuotationPending
                ? 'Your quotation request has been submitted. CLEANGO will review the photos before setting a final price. No payment has been requested.'
                : result.wasDuplicate
                ? 'This request was already received. No duplicate booking was created.'
                : 'Your collection request was created. Continue to choose cash, MTN Mobile Money, or Orange Money. Unavailable methods will not create a payment.',
          ),
          actions: [
            FilledButton(
              onPressed: () => Navigator.of(context).pop(),
              child: Text(
                result.collection.isQuotationPending ? 'Done' : 'Continue',
              ),
            ),
          ],
        ),
      );
      if (!mounted) return;
      if (!result.collection.isQuotationPending) {
        await Navigator.of(context).push<bool>(
          MaterialPageRoute(
            builder: (_) => PaymentMethodScreen(
              paymentContext: PaymentRequestContext.forCollection(
                result.collection,
              ),
            ),
          ),
        );
      }
      if (mounted) Navigator.of(context).pop(true);
    } catch (error) {
      if (mounted) _showMessage(_message(error));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _retry() {
    setState(() => _data = widget.controller.loadBooking());
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }
}

class _BookingForm extends StatelessWidget {
  const _BookingForm({
    required this.data,
    required this.address,
    required this.mode,
    required this.wasteCategory,
    required this.date,
    required this.timeWindow,
    required this.bagCount,
    required this.images,
    required this.notesController,
    required this.photoQuotationEnabled,
    required this.selectingImages,
    required this.submitting,
    required this.pricing,
    required this.onAddressChanged,
    required this.onModeChanged,
    required this.onWasteCategoryChanged,
    required this.onDateTap,
    required this.onTimeWindowChanged,
    required this.onBagCountChanged,
    required this.onSelectImages,
    required this.onRemoveImage,
    required this.onSubmit,
  });

  final CollectionBookingViewData data;
  final Address address;
  final CollectionBookingMode mode;
  final WasteCategory wasteCategory;
  final DateTime date;
  final CollectionTimeWindow timeWindow;
  final int bagCount;
  final List<XFile> images;
  final TextEditingController notesController;
  final bool photoQuotationEnabled;
  final bool selectingImages;
  final bool submitting;
  final CollectionPricing? pricing;
  final ValueChanged<Address>? onAddressChanged;
  final ValueChanged<CollectionBookingMode>? onModeChanged;
  final ValueChanged<WasteCategory>? onWasteCategoryChanged;
  final VoidCallback? onDateTap;
  final ValueChanged<CollectionTimeWindow>? onTimeWindowChanged;
  final ValueChanged<int>? onBagCountChanged;
  final VoidCallback? onSelectImages;
  final ValueChanged<int>? onRemoveImage;
  final VoidCallback? onSubmit;

  @override
  Widget build(BuildContext context) {
    final isBagCount = mode == CollectionBookingMode.oneTimeBagCount;
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 18, 16, 36),
      children: [
        _Section(
          title: 'Booking method',
          child: Column(
            children: [
              _ModeTile(
                selected: isBagCount,
                title: 'Declare 60L bags',
                subtitle: '500 FCFA × the number of CLEANGO 60L bags',
                icon: Icons.shopping_bag_outlined,
                onTap: onModeChanged == null
                    ? null
                    : () =>
                          onModeChanged!(CollectionBookingMode.oneTimeBagCount),
              ),
              const SizedBox(height: 10),
              _ModeTile(
                selected: !isBagCount,
                title: 'Request a photo quotation',
                subtitle: photoQuotationEnabled
                    ? 'Send photos for CLEANGO review. No price or payment yet.'
                    : 'Available only in Firebase data mode.',
                icon: Icons.photo_camera_back_outlined,
                onTap: onModeChanged == null || !photoQuotationEnabled
                    ? null
                    : () => onModeChanged!(
                        CollectionBookingMode.oneTimePhotoQuote,
                      ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        _Section(
          title: 'Collection address',
          child: DropdownButtonFormField<Address>(
            initialValue: address,
            decoration: const InputDecoration(
              border: OutlineInputBorder(),
              prefixIcon: Icon(Icons.location_on_outlined),
            ),
            items: data.addresses
                .map(
                  (item) => DropdownMenuItem(
                    value: item,
                    enabled: item.isWithinServiceArea,
                    child: Text(
                      item.isWithinServiceArea
                          ? item.label
                          : '${item.label} (outside service zone)',
                    ),
                  ),
                )
                .toList(growable: false),
            onChanged: onAddressChanged == null
                ? null
                : (value) {
                    if (value != null) onAddressChanged!(value);
                  },
          ),
        ),
        const SizedBox(height: 14),
        _Section(
          title: 'Waste category',
          child: DropdownButtonFormField<WasteCategory>(
            initialValue: wasteCategory,
            decoration: const InputDecoration(border: OutlineInputBorder()),
            items: WasteCategory.values
                .map(
                  (item) =>
                      DropdownMenuItem(value: item, child: Text(item.label)),
                )
                .toList(growable: false),
            onChanged: onWasteCategoryChanged == null
                ? null
                : (value) {
                    if (value != null) onWasteCategoryChanged!(value);
                  },
          ),
        ),
        const SizedBox(height: 14),
        if (isBagCount) ...[
          _Section(
            title: 'CLEANGO 60L bags',
            child: _BagCounter(value: bagCount, onChanged: onBagCountChanged),
          ),
          const SizedBox(height: 14),
          _Section(
            title: 'Schedule',
            child: Column(
              children: [
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.calendar_today_outlined),
                  title: const Text('Collection date'),
                  subtitle: Text(DateFormat('EEE, d MMM yyyy').format(date)),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: onDateTap,
                ),
                DropdownButtonFormField<CollectionTimeWindow>(
                  initialValue: timeWindow,
                  decoration: const InputDecoration(
                    labelText: 'Time window',
                    border: OutlineInputBorder(),
                  ),
                  items: data.firstAvailableDate == date
                      ? CollectionTimeWindow.values
                            .map(
                              (item) => DropdownMenuItem(
                                value: item,
                                child: Text(item.label),
                              ),
                            )
                            .toList(growable: false)
                      : CollectionTimeWindow.values
                            .map(
                              (item) => DropdownMenuItem(
                                value: item,
                                child: Text(item.label),
                              ),
                            )
                            .toList(growable: false),
                  onChanged: onTimeWindowChanged == null
                      ? null
                      : (value) {
                          if (value != null) onTimeWindowChanged!(value);
                        },
                ),
              ],
            ),
          ),
        ] else ...[
          _Section(
            title: 'Waste photos',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                OutlinedButton.icon(
                  onPressed: onSelectImages,
                  icon: selectingImages
                      ? const SizedBox.square(
                          dimension: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.add_photo_alternate_outlined),
                  label: Text(
                    images.isEmpty
                        ? 'Select 1 to 4 photos'
                        : 'Replace selected photos',
                  ),
                ),
                if (images.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  for (var index = 0; index < images.length; index++)
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: const Icon(
                        Icons.image_outlined,
                        color: Color(0xFF16A34A),
                      ),
                      title: Text('Waste photo ${index + 1}'),
                      trailing: IconButton(
                        tooltip: 'Remove photo',
                        onPressed: onRemoveImage == null
                            ? null
                            : () => onRemoveImage!(index),
                        icon: const Icon(Icons.close),
                      ),
                    ),
                ],
                const Text(
                  'JPG, PNG, or WebP. Maximum 4 MB per image. CLEANGO sets the final quotation after review.',
                  style: TextStyle(color: Color(0xFF64748B), fontSize: 12),
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 14),
        _Section(
          title: 'Optional notes',
          child: TextField(
            controller: notesController,
            maxLength: 500,
            maxLines: 3,
            enabled: !submitting,
            decoration: const InputDecoration(
              hintText: 'Add collection instructions or a short description',
              border: OutlineInputBorder(),
            ),
          ),
        ),
        const SizedBox(height: 14),
        _PricingSummary(mode: mode, pricing: pricing, bagCount: bagCount),
        const SizedBox(height: 18),
        FilledButton(
          onPressed: onSubmit,
          style: FilledButton.styleFrom(
            backgroundColor: const Color(0xFF16A34A),
            padding: const EdgeInsets.symmetric(vertical: 16),
          ),
          child: submitting
              ? const SizedBox.square(
                  dimension: 21,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                )
              : Text(isBagCount ? 'Confirm booking' : 'Request quotation'),
        ),
      ],
    );
  }
}

class _ModeTile extends StatelessWidget {
  const _ModeTile({
    required this.selected,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.onTap,
  });

  final bool selected;
  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: selected ? const Color(0xFFDCFCE7) : const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: selected ? const Color(0xFF16A34A) : const Color(0xFFE2E8F0),
          ),
        ),
        child: Row(
          children: [
            Icon(icon, color: selected ? const Color(0xFF15803D) : null),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      color: Color(0xFF64748B),
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              selected ? Icons.radio_button_checked : Icons.radio_button_off,
            ),
          ],
        ),
      ),
    );
  }
}

class _BagCounter extends StatelessWidget {
  const _BagCounter({required this.value, required this.onChanged});

  final int value;
  final ValueChanged<int>? onChanged;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        IconButton.filledTonal(
          tooltip: 'Remove one 60L bag',
          onPressed: onChanged == null || value <= 1
              ? null
              : () => onChanged!(value - 1),
          icon: const Icon(Icons.remove),
        ),
        Expanded(
          child: Column(
            children: [
              Text(
                '$value',
                style: const TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const Text(
                'CLEANGO bags of 60L',
                style: TextStyle(color: Color(0xFF64748B)),
              ),
            ],
          ),
        ),
        IconButton.filledTonal(
          tooltip: 'Add one 60L bag',
          onPressed: onChanged == null || value >= 50
              ? null
              : () => onChanged!(value + 1),
          icon: const Icon(Icons.add),
        ),
      ],
    );
  }
}

class _PricingSummary extends StatelessWidget {
  const _PricingSummary({
    required this.mode,
    required this.pricing,
    required this.bagCount,
  });

  final CollectionBookingMode mode;
  final CollectionPricing? pricing;
  final int bagCount;

  @override
  Widget build(BuildContext context) {
    final pending = mode == CollectionBookingMode.oneTimePhotoQuote;
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: pending ? const Color(0xFFFFFBEB) : const Color(0xFFECFDF5),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: pending ? const Color(0xFFFDE68A) : const Color(0xFFA7F3D0),
        ),
      ),
      child: pending
          ? const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Quotation pending',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
                ),
                SizedBox(height: 6),
                Text(
                  'No final price is calculated by the mobile app. Payment remains unpaid until CLEANGO reviews your request and you accept the quotation.',
                  style: TextStyle(color: Color(0xFF92400E), height: 1.4),
                ),
              ],
            )
          : Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Estimated total',
                        style: TextStyle(color: Color(0xFF475569)),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '$bagCount × 500 FCFA',
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                    ],
                  ),
                ),
                Text(
                  pricing?.totalAmount == null
                      ? 'Unavailable'
                      : _money(pricing!.totalAmount!),
                  style: const TextStyle(
                    color: Color(0xFF15803D),
                    fontSize: 21,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ],
            ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

class _EmptyAddressState extends StatelessWidget {
  const _EmptyAddressState();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(28),
        child: Text(
          'Add a supported CLEANGO service address before booking a collection.',
          textAlign: TextAlign.center,
          style: TextStyle(color: Color(0xFF64748B), fontSize: 16),
        ),
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
      child: FilledButton.icon(
        onPressed: onRetry,
        icon: const Icon(Icons.refresh),
        label: const Text('Retry booking setup'),
      ),
    );
  }
}

Address _preferredAddress(List<Address> addresses) {
  for (final address in addresses) {
    if (address.isPrimary && address.isWithinServiceArea) return address;
  }
  for (final address in addresses) {
    if (address.isWithinServiceArea) return address;
  }
  return addresses.first;
}

String _extension(String fileName) {
  final normalized = fileName.trim().toLowerCase();
  final dot = normalized.lastIndexOf('.');
  return dot == -1 ? '' : normalized.substring(dot + 1);
}

String _money(int amount) =>
    '${NumberFormat.decimalPattern('fr').format(amount)} FCFA';

String _message(Object error) {
  if (error is CollectionBookingException) return error.message;
  if (error is CollectionPricingException) return error.message;
  if (error is StateError || error is ArgumentError) {
    return error.toString().replaceFirst(
      RegExp(r'^(Bad state|Invalid argument):\s*'),
      '',
    );
  }
  return 'Unable to submit this collection request. Please try again.';
}

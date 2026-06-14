import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:ultrawash/app/resource.dart';
import 'package:ultrawash/app/widget_button.dart';
import 'package:ultrawash/app/wtext.dart';

// ─── Input Formatters ────────────────────────────────────────────────────────

class CardNumberInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    var text = newValue.text;
    if (newValue.selection.baseOffset == 0) return newValue;
    var buffer = StringBuffer();
    for (int i = 0; i < text.length; i++) {
      buffer.write(text[i]);
      var nonZeroIndex = i + 1;
      if (nonZeroIndex % 4 == 0 && nonZeroIndex != text.length) {
        buffer.write(' ');
      }
    }
    var string = buffer.toString();
    return newValue.copyWith(
      text: string,
      selection: TextSelection.collapsed(offset: string.length),
    );
  }
}

class ExpiryDateInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    var text = newValue.text;
    if (newValue.selection.baseOffset == 0) return newValue;
    var buffer = StringBuffer();
    for (int i = 0; i < text.length; i++) {
      buffer.write(text[i]);
      var nonZeroIndex = i + 1;
      if (nonZeroIndex % 2 == 0 && nonZeroIndex != text.length) {
        buffer.write('/');
      }
    }
    var string = buffer.toString();
    return newValue.copyWith(
      text: string,
      selection: TextSelection.collapsed(offset: string.length),
    );
  }
}

// ─── Add Card Bottom Sheet ────────────────────────────────────────────────────

class AddCardBottomSheet extends StatefulWidget {
  final double totalAmount;
  final VoidCallback onPay;

  const AddCardBottomSheet({
    super.key,
    required this.totalAmount,
    required this.onPay,
  });

  static void show({
    required BuildContext context,
    required double totalAmount,
    required VoidCallback onPay,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => AddCardBottomSheet(
        totalAmount: totalAmount,
        onPay: onPay,
      ),
    );
  }

  @override
  State<AddCardBottomSheet> createState() => _AddCardBottomSheetState();
}

class _AddCardBottomSheetState extends State<AddCardBottomSheet> {
  final TextEditingController _cardNumberController = TextEditingController();
  final TextEditingController _cardNameController = TextEditingController();
  final TextEditingController _expiryController = TextEditingController();
  final TextEditingController _cvvController = TextEditingController();
  bool _saveCard = true;

  @override
  void dispose() {
    _cardNumberController.dispose();
    _cardNameController.dispose();
    _expiryController.dispose();
    _cvvController.dispose();
    super.dispose();
  }

  void _validate() {
    final cardNumber = _cardNumberController.text.replaceAll(' ', '');
    final expiry = _expiryController.text;
    final cvv = _cvvController.text;
    final name = _cardNameController.text.trim();

    if (cardNumber.length < 16) {
      _showError('Please enter a valid card number');
      return;
    }
    if (expiry.length < 5) {
      _showError('Please enter a valid expiry date');
      return;
    }
    if (cvv.length < 3) {
      _showError('Please enter a valid CVV');
      return;
    }
    if (name.isEmpty) {
      _showError('Please enter the name on card');
      return;
    }

    Navigator.pop(context);
    widget.onPay();
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  // ── Field builders ──────────────────────────────────────────────────────────

  Widget _buildTextField(
    TextEditingController controller,
    String hint, {
    bool obscure = false,
  }) {
    return Container(
      height: 48.h,
      padding: EdgeInsets.symmetric(horizontal: 16.w),
      decoration: BoxDecoration(
        border: Border.all(color: R.color.coolGray2, width: 1),
        borderRadius: BorderRadius.circular(8.r),
      ),
      child: TextField(
        controller: controller,
        obscureText: obscure,
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(
            fontSize: 14.sp,
            fontWeight: FontWeight.w400,
            color: R.color.coolGray2,
          ),
          border: InputBorder.none,
        ),
      ),
    );
  }

  Widget _buildCardNumberField(
      TextEditingController controller, String hint) {
    return Container(
      height: 48.h,
      padding: EdgeInsets.symmetric(horizontal: 16.w),
      decoration: BoxDecoration(
        border: Border.all(color: R.color.coolGray2, width: 1),
        borderRadius: BorderRadius.circular(8.r),
      ),
      child: TextField(
        controller: controller,
        keyboardType: TextInputType.number,
        inputFormatters: [
          FilteringTextInputFormatter.digitsOnly,
          LengthLimitingTextInputFormatter(16),
          CardNumberInputFormatter(),
        ],
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(
            fontSize: 14.sp,
            fontWeight: FontWeight.w400,
            color: R.color.coolGray2,
          ),
          border: InputBorder.none,
        ),
      ),
    );
  }

  Widget _buildExpiryField(TextEditingController controller, String hint) {
    return Container(
      height: 48.h,
      padding: EdgeInsets.symmetric(horizontal: 16.w),
      decoration: BoxDecoration(
        border: Border.all(color: R.color.coolGray2, width: 1),
        borderRadius: BorderRadius.circular(8.r),
      ),
      child: TextField(
        controller: controller,
        keyboardType: TextInputType.number,
        inputFormatters: [
          FilteringTextInputFormatter.digitsOnly,
          LengthLimitingTextInputFormatter(4),
          ExpiryDateInputFormatter(),
        ],
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(
            fontSize: 14.sp,
            fontWeight: FontWeight.w400,
            color: R.color.coolGray2,
          ),
          border: InputBorder.none,
        ),
      ),
    );
  }

  Widget _buildCVVField(TextEditingController controller, String hint) {
    return Container(
      height: 48.h,
      padding: EdgeInsets.symmetric(horizontal: 16.w),
      decoration: BoxDecoration(
        border: Border.all(color: R.color.coolGray2, width: 1),
        borderRadius: BorderRadius.circular(8.r),
      ),
      child: TextField(
        controller: controller,
        keyboardType: TextInputType.number,
        obscureText: true,
        inputFormatters: [
          FilteringTextInputFormatter.digitsOnly,
          LengthLimitingTextInputFormatter(4),
        ],
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(
            fontSize: 14.sp,
            fontWeight: FontWeight.w400,
            color: R.color.coolGray2,
          ),
          border: InputBorder.none,
        ),
      ),
    );
  }

  // ── Build ───────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      decoration: BoxDecoration(
        color: R.color.deepTeal,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(24.r),
          topRight: Radius.circular(24.r),
        ),
      ),
      child: Padding(
        padding: EdgeInsets.all(24.w),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Title
            Center(
              child: WText(
                text: 'Credit/Debit Card',
                fontSize: 18.sp,
                fontWeight: FontWeight.w700,
                color: R.color.charcoal,
              ),
            ),
            SizedBox(height: 16.h),

            // Card brand icons
            Center(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Padding(
                    padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 4.h),
                    child: WText(
                      text: 'VISA',
                      fontSize: 14.sp,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF1A1F71),
                    ),
                  ),
                  SizedBox(width: 16.w),
                  Row(
                    children: [
                      Container(
                        width: 20.w,
                        height: 20.h,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: Color(0xFFEB001B),
                        ),
                      ),
                      Transform.translate(
                        offset: Offset(-8.w, 0),
                        child: Container(
                          width: 20.w,
                          height: 20.h,
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            color: Color(0xFFF79E1B),
                          ),
                        ),
                      ),
                    ],
                  ),
                  SizedBox(width: 8.w),
                  Container(
                    padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 4.h),
                    decoration: BoxDecoration(
                      color: const Color(0xFF006FCF),
                      borderRadius: BorderRadius.circular(4.r),
                    ),
                    child: WText(
                      text: 'AMEX',
                      fontSize: 10.sp,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(height: 24.h),

            // Card number
            WText(
              text: 'Card number',
              fontSize: 12.sp,
              fontWeight: FontWeight.w400,
              color: R.color.coolGray2,
            ),
            SizedBox(height: 8.h),
            _buildCardNumberField(_cardNumberController, '2222 2222 2222 2222'),
            SizedBox(height: 16.h),

            // Name on card
            WText(
              text: 'Name on card',
              fontSize: 12.sp,
              fontWeight: FontWeight.w400,
              color: R.color.coolGray2,
            ),
            SizedBox(height: 8.h),
            _buildTextField(_cardNameController, 'Type Here'),
            SizedBox(height: 16.h),

            // Expiry date
            WText(
              text: 'Expiry date',
              fontSize: 12.sp,
              fontWeight: FontWeight.w400,
              color: R.color.coolGray2,
            ),
            SizedBox(height: 8.h),
            _buildExpiryField(_expiryController, '11/22'),
            SizedBox(height: 16.h),

            // CVV
            WText(
              text: 'CVV',
              fontSize: 12.sp,
              fontWeight: FontWeight.w400,
              color: R.color.coolGray2,
            ),
            SizedBox(height: 8.h),
            _buildCVVField(_cvvController, '1234'),
            SizedBox(height: 16.h),

            // Save card checkbox
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                GestureDetector(
                  onTap: () => setState(() => _saveCard = !_saveCard),
                  child: Container(
                    width: 24.w,
                    height: 24.h,
                    decoration: BoxDecoration(
                      color: _saveCard
                          ? R.color.deepNavyBlue2
                          : Colors.transparent,
                      border: Border.all(
                        color: R.color.deepNavyBlue2,
                        width: 2,
                      ),
                      borderRadius: BorderRadius.circular(4.r),
                    ),
                    child: _saveCard
                        ? Icon(Icons.check, size: 16.sp, color: R.color.white2)
                        : null,
                  ),
                ),
                SizedBox(width: 12.w),
                Expanded(
                  child: RichText(
                    text: TextSpan(
                      style: TextStyle(
                          fontSize: 12.sp, fontFamily: 'Nunito'),
                      children: [
                        TextSpan(
                          text: 'Save Card ',
                          style: TextStyle(
                            color: R.color.charcoal,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        TextSpan(
                          text:
                              '(We will save this card for your convenience. If required, you can remove the card in the "Payment Options" section in the "Account" menu.)',
                          style: TextStyle(
                            color: R.color.slateBlueGrey,
                            fontWeight: FontWeight.w400,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: 24.h),

            // Pay button
            WButton(
              onPressed: _validate,
              label: 'Pay \$${widget.totalAmount.toStringAsFixed(2)}',
              height: 48.h,
              radius: 8.r,
              decorationType: DecorationType.solid,
              buttonColor: R.color.oceanBlue,
              textColor: R.color.white2,
              fontSize: 16.sp,
              fontWeight: FontWeight.w600,
            ),
          ],
        ),
      ),
    );
  }
}


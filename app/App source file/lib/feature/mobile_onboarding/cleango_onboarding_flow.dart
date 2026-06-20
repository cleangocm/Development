import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:ultrawash/app/assets.dart';

const _blue = Color(0xFF1073E6);
const _green = Color(0xFF16A34A);
const _navy = Color(0xFF0F172A);
const _soft = Color(0xFFF1F5F9);

class CleanGoOnboardingFlow extends StatefulWidget {
  const CleanGoOnboardingFlow({super.key});

  @override
  State<CleanGoOnboardingFlow> createState() => _CleanGoOnboardingFlowState();
}

class _CleanGoOnboardingFlowState extends State<CleanGoOnboardingFlow> {
  var _step = 0;
  var _otpPhone = '+237 6 53 33 25 26';

  @override
  void initState() {
    super.initState();
    Timer(const Duration(milliseconds: 2300), () {
      if (mounted && _step == 0) setState(() => _step = 1);
    });
  }

  void _go(int step) => setState(() => _step = step);

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: _step == 0 ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark,
      child: switch (_step) {
        0 => _SplashScreen(),
        1 => _WelcomeScreen(onContinue: () => _go(2)),
        2 => _PhoneRegistrationScreen(
            onContinue: (phone) {
              _otpPhone = phone;
              _go(3);
            },
          ),
        3 => _OtpScreen(phone: _otpPhone, onVerified: () => _go(4), onBack: () => _go(2)),
        4 => _BiometricSetupScreen(onNext: () => _go(5)),
        5 => _AccountLocationScreen(
            onDashboard: () => Get.offAll(() => const _DashboardPreviewScreen()),
            onWaitlist: () => _go(6),
          ),
        _ => _WaitlistScreen(onDone: () => Get.offAll(() => const _DashboardPreviewScreen())),
      },
    );
  }
}

class _DashboardPreviewScreen extends StatelessWidget {
  const _DashboardPreviewScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _soft,
      body: SafeArea(
        child: Padding(
          padding: EdgeInsets.all(22.w),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _LogoWordmark(height: 62.h),
              SizedBox(height: 28.h),
              Text(
                'Welcome to CLEANGO CM',
                style: TextStyle(fontSize: 30.sp, fontWeight: FontWeight.w900, color: _navy),
              ),
              SizedBox(height: 10.h),
              Text(
                'Your mobile onboarding preview is ready. The full customer dashboard can be connected after Android builds cleanly.',
                style: TextStyle(fontSize: 16.sp, height: 1.4, color: Colors.black54),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SplashScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF0F2744), Color(0xFF1073E6), Color(0xFF16A34A)],
          ),
        ),
        child: SafeArea(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Spacer(),
              Container(
                width: 138.w,
                height: 138.w,
                padding: EdgeInsets.all(10.w),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(34.r),
                  boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 28, offset: Offset(0, 16))],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(26.r),
                  child: Image.asset(Assets.cleangoAppIcon, fit: BoxFit.cover),
                ),
              ),
              SizedBox(height: 28.h),
              Text(
                'CLEANGO CM',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 34.sp,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.8,
                ),
              ),
              SizedBox(height: 12.h),
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 42.w),
                child: Text(
                  'Making Waste Collection Simple and Reliable',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.white.withValues(alpha: .88), fontSize: 16.sp, height: 1.35),
                ),
              ),
              const Spacer(),
              SizedBox(
                width: 42.w,
                height: 42.w,
                child: const CircularProgressIndicator(color: Colors.white, strokeWidth: 3),
              ),
              SizedBox(height: 42.h),
            ],
          ),
        ),
      ),
    );
  }
}

class _WelcomeScreen extends StatelessWidget {
  const _WelcomeScreen({required this.onContinue});

  final VoidCallback onContinue;

  @override
  Widget build(BuildContext context) {
    return _OnboardingScaffold(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(child: _LogoWordmark(height: 76.h)),
          const Spacer(),
          Text(
            'Clean Environment,\nBetter Communities',
            style: TextStyle(fontSize: 42.sp, height: .95, fontWeight: FontWeight.w900, color: _navy),
          ),
          SizedBox(height: 18.h),
          Text(
            'Fast, Affordable, and Eco-Friendly Waste Pickup Near You',
            style: TextStyle(fontSize: 18.sp, height: 1.35, color: Colors.black87, fontWeight: FontWeight.w600),
          ),
          SizedBox(height: 28.h),
          Wrap(
            spacing: 10.w,
            runSpacing: 10.h,
            children: const [
              _FeatureChip(icon: Icons.calendar_month, label: 'Scheduled waste pickup'),
              _FeatureChip(icon: Icons.notifications_active_outlined, label: 'Real-time service updates'),
              _FeatureChip(icon: Icons.lock_outline, label: 'Secure payments'),
              _FeatureChip(icon: Icons.recycling, label: 'Professional waste management'),
            ],
          ),
          const Spacer(),
          Text('Enter your mobile number to get started.', style: TextStyle(fontSize: 15.sp, color: Colors.black54)),
          SizedBox(height: 14.h),
          _PrimaryButton(label: 'Continue with phone number', onPressed: onContinue),
        ],
      ),
    );
  }
}

class _PhoneRegistrationScreen extends StatefulWidget {
  const _PhoneRegistrationScreen({required this.onContinue});

  final ValueChanged<String> onContinue;

  @override
  State<_PhoneRegistrationScreen> createState() => _PhoneRegistrationScreenState();
}

class _PhoneRegistrationScreenState extends State<_PhoneRegistrationScreen> {
  final _phone = TextEditingController();

  @override
  void dispose() {
    _phone.dispose();
    super.dispose();
  }

  void _submit() {
    final value = _phone.text.trim().isEmpty ? '6 53 33 25 26' : _phone.text.trim();
    widget.onContinue('+237 $value');
  }

  @override
  Widget build(BuildContext context) {
    return _OnboardingScaffold(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(child: _LogoWordmark(height: 70.h)),
          SizedBox(height: 64.h),
          Text('Enter your mobile number', style: TextStyle(fontSize: 30.sp, fontWeight: FontWeight.w900, color: _navy)),
          SizedBox(height: 12.h),
          Text(
            'Enter your mobile number to create your CLEANGO CM account.',
            style: TextStyle(fontSize: 16.sp, height: 1.35, color: Colors.black54),
          ),
          SizedBox(height: 34.h),
          Container(
            padding: EdgeInsets.symmetric(horizontal: 18.w, vertical: 16.h),
            decoration: BoxDecoration(color: _soft, borderRadius: BorderRadius.circular(18.r)),
            child: Row(
              children: [
                Container(
                  width: 40.w,
                  height: 40.w,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: _green,
                    borderRadius: BorderRadius.circular(12.r),
                  ),
                  child: Text(
                    'CM',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 14.sp,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
                SizedBox(width: 12.w),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Cameroon', style: TextStyle(fontSize: 15.sp, fontWeight: FontWeight.w800, color: _navy)),
                      Text('+237 selected automatically', style: TextStyle(fontSize: 12.sp, color: Colors.black54)),
                    ],
                  ),
                ),
                const Icon(Icons.keyboard_arrow_down, color: _navy),
              ],
            ),
          ),
          SizedBox(height: 18.h),
          TextField(
            controller: _phone,
            keyboardType: TextInputType.phone,
            style: TextStyle(fontSize: 20.sp, fontWeight: FontWeight.w700),
            decoration: InputDecoration(
              prefixText: '+237  ',
              hintText: '6 53 33 25 26',
              filled: true,
              fillColor: Colors.white,
              contentPadding: EdgeInsets.symmetric(horizontal: 18.w, vertical: 20.h),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(18.r), borderSide: const BorderSide(color: Color(0xFFE5E7EB))),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(18.r), borderSide: const BorderSide(color: _green, width: 2)),
            ),
          ),
          const Spacer(),
          _PrimaryButton(label: 'Continue', onPressed: _submit),
        ],
      ),
    );
  }
}

class _OtpScreen extends StatelessWidget {
  const _OtpScreen({required this.phone, required this.onVerified, required this.onBack});

  final String phone;
  final VoidCallback onVerified;
  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    return _OnboardingScaffold(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          IconButton(onPressed: onBack, icon: const Icon(Icons.arrow_back), padding: EdgeInsets.zero),
          Center(child: _LogoWordmark(height: 58.h)),
          SizedBox(height: 46.h),
          Text('Enter the 6-digit code', style: TextStyle(fontSize: 30.sp, fontWeight: FontWeight.w900, color: _navy)),
          SizedBox(height: 10.h),
          Text('We sent it to $phone via SMS', style: TextStyle(fontSize: 16.sp, color: Colors.black87)),
          SizedBox(height: 22.h),
          Container(
            padding: EdgeInsets.all(18.w),
            decoration: BoxDecoration(color: _soft, borderRadius: BorderRadius.circular(18.r)),
            child: Row(
              children: [
                const Icon(Icons.sms, color: _green),
                SizedBox(width: 12.w),
                Expanded(
                  child: Text(
                    'Check your messages\nThe message may have no notification sound',
                    style: TextStyle(fontSize: 15.sp, height: 1.35, fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          ),
          SizedBox(height: 24.h),
          _OtpBoxes(),
          const Spacer(),
          Text("Didn't receive it? 00:58", style: TextStyle(fontSize: 15.sp, color: Colors.black87)),
          SizedBox(height: 14.h),
          Row(
            children: [
              Expanded(child: _SecondaryButton(label: 'Resend code', onPressed: () {})),
              SizedBox(width: 10.w),
              Expanded(child: _SecondaryButton(label: 'Send in WhatsApp', onPressed: () {})),
            ],
          ),
          SizedBox(height: 14.h),
          _PrimaryButton(label: 'Verify code', onPressed: onVerified),
        ],
      ),
    );
  }
}

class _BiometricSetupScreen extends StatelessWidget {
  const _BiometricSetupScreen({required this.onNext});

  final VoidCallback onNext;

  String get _label {
    if (defaultTargetPlatform == TargetPlatform.iOS) return 'Face ID';
    return 'Fingerprint Authentication';
  }

  IconData get _icon {
    if (defaultTargetPlatform == TargetPlatform.iOS) return Icons.face_retouching_natural;
    return Icons.fingerprint;
  }

  @override
  Widget build(BuildContext context) {
    return _OnboardingScaffold(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(child: _LogoWordmark(height: 64.h)),
          SizedBox(height: 70.h),
          Center(
            child: Container(
              width: 150.w,
              height: 150.w,
              decoration: BoxDecoration(color: _soft, borderRadius: BorderRadius.circular(40.r)),
              child: Icon(_icon, size: 86.sp, color: _green),
            ),
          ),
          SizedBox(height: 34.h),
          Text('Making sign-in easier', style: TextStyle(fontSize: 30.sp, height: 1, fontWeight: FontWeight.w900, color: _navy)),
          SizedBox(height: 12.h),
          Text(
            'Secure your account with biometric authentication for faster and safer access.',
            style: TextStyle(fontSize: 16.sp, height: 1.35, color: Colors.black54),
          ),
          SizedBox(height: 18.h),
          _FeatureChip(icon: _icon, label: _label),
          const Spacer(),
          _PrimaryButton(label: 'Enable Now', onPressed: onNext),
          SizedBox(height: 12.h),
          _SecondaryButton(label: 'Maybe Later', onPressed: onNext),
        ],
      ),
    );
  }
}

class _AccountLocationScreen extends StatefulWidget {
  const _AccountLocationScreen({required this.onDashboard, required this.onWaitlist});

  final VoidCallback onDashboard;
  final VoidCallback onWaitlist;

  @override
  State<_AccountLocationScreen> createState() => _AccountLocationScreenState();
}

class _AccountLocationScreenState extends State<_AccountLocationScreen> {
  final _name = TextEditingController();
  final _area = TextEditingController(text: 'Yaounde');
  var _checking = true;
  var _available = true;

  @override
  void initState() {
    super.initState();
    Timer(const Duration(milliseconds: 1200), () {
      if (mounted) setState(() => _checking = false);
    });
  }

  @override
  void dispose() {
    _name.dispose();
    _area.dispose();
    super.dispose();
  }

  void _checkArea(String value) {
    final normalized = value.toLowerCase();
    setState(() {
      _available = normalized.contains('yaounde') || normalized.contains('douala');
    });
  }

  @override
  Widget build(BuildContext context) {
    return _OnboardingScaffold(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(child: _LogoWordmark(height: 60.h)),
          SizedBox(height: 34.h),
          Text('Set up your account', style: TextStyle(fontSize: 30.sp, fontWeight: FontWeight.w900, color: _navy)),
          SizedBox(height: 10.h),
          Text('We will detect your location and check CLEANGO CM service availability.', style: TextStyle(fontSize: 16.sp, color: Colors.black54, height: 1.35)),
          SizedBox(height: 24.h),
          _Input(controller: _name, label: 'Full name', hint: 'Your name'),
          SizedBox(height: 14.h),
          _Input(controller: _area, label: 'Detected location', hint: 'City or neighborhood', onChanged: _checkArea),
          SizedBox(height: 18.h),
          Container(
            width: double.infinity,
            padding: EdgeInsets.all(18.w),
            decoration: BoxDecoration(
              color: _checking ? _soft : (_available ? _green.withValues(alpha: .12) : Colors.orange.withValues(alpha: .12)),
              borderRadius: BorderRadius.circular(20.r),
              border: Border.all(color: _checking ? const Color(0xFFE5E7EB) : (_available ? _green : Colors.orange)),
            ),
            child: _checking
                ? Row(
                    children: [
                      const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: _green)),
                      SizedBox(width: 12.w),
                      const Expanded(child: Text('Checking service coverage near you...')),
                    ],
                  )
                : Text(
                    _available
                        ? 'Great news! CLEANGO CM services are available in your area.'
                        : 'CLEANGO CM is not yet available in your region. We are expanding our services and will notify you when we become available in your area.',
                    style: TextStyle(fontSize: 15.sp, height: 1.4, fontWeight: FontWeight.w700, color: _navy),
                  ),
          ),
          const Spacer(),
          _PrimaryButton(label: _available ? 'Go to dashboard' : 'Join waiting list', onPressed: _available ? widget.onDashboard : widget.onWaitlist),
        ],
      ),
    );
  }
}

class _WaitlistScreen extends StatelessWidget {
  const _WaitlistScreen({required this.onDone});

  final VoidCallback onDone;

  @override
  Widget build(BuildContext context) {
    return _OnboardingScaffold(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(child: _LogoWordmark(height: 68.h)),
          const Spacer(),
          Icon(Icons.location_on, color: _blue, size: 82.sp),
          SizedBox(height: 24.h),
          Text('You are on the CLEANGO CM waiting list', style: TextStyle(fontSize: 32.sp, height: 1.05, fontWeight: FontWeight.w900, color: _navy)),
          SizedBox(height: 16.h),
          Text(
            'We saved your location for future service expansion planning. You will receive launch updates when CLEANGO CM becomes available in your area.',
            style: TextStyle(fontSize: 16.sp, height: 1.4, color: Colors.black54),
          ),
          const Spacer(),
          _PrimaryButton(label: 'Continue', onPressed: onDone),
        ],
      ),
    );
  }
}

class _OnboardingScaffold extends StatelessWidget {
  const _OnboardingScaffold({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: EdgeInsets.fromLTRB(22.w, 18.h, 22.w, 24.h),
          child: child,
        ),
      ),
    );
  }
}

class _LogoWordmark extends StatelessWidget {
  const _LogoWordmark({required this.height});

  final double height;

  @override
  Widget build(BuildContext context) {
    return Image.asset(Assets.cleangoWordmark, height: height, fit: BoxFit.contain);
  }
}

class _FeatureChip extends StatelessWidget {
  const _FeatureChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 10.h),
      decoration: BoxDecoration(color: _soft, borderRadius: BorderRadius.circular(16.r)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 18.sp, color: _green),
          SizedBox(width: 8.w),
          Text(label, style: TextStyle(fontSize: 13.sp, fontWeight: FontWeight.w700, color: _navy)),
        ],
      ),
    );
  }
}

class _PrimaryButton extends StatelessWidget {
  const _PrimaryButton({required this.label, required this.onPressed});

  final String label;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 58.h,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: _green,
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18.r)),
        ),
        child: Text(label, style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w800)),
      ),
    );
  }
}

class _SecondaryButton extends StatelessWidget {
  const _SecondaryButton({required this.label, required this.onPressed});

  final String label;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 54.h,
      child: TextButton(
        onPressed: onPressed,
        style: TextButton.styleFrom(
          backgroundColor: _soft,
          foregroundColor: _navy,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16.r)),
        ),
        child: Text(label, style: TextStyle(fontSize: 15.sp, fontWeight: FontWeight.w800)),
      ),
    );
  }
}

class _OtpBoxes extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      height: 78.h,
      decoration: BoxDecoration(
        border: Border.all(color: _navy, width: 2),
        borderRadius: BorderRadius.circular(18.r),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: List.generate(
          6,
          (index) => Container(
            margin: EdgeInsets.symmetric(horizontal: 7.w),
            width: 20.w,
            height: 3.h,
            decoration: BoxDecoration(
              color: index == 0 ? _navy : const Color(0xFFC7CDD8),
              borderRadius: BorderRadius.circular(4.r),
            ),
          ),
        ),
      ),
    );
  }
}

class _Input extends StatelessWidget {
  const _Input({required this.controller, required this.label, required this.hint, this.onChanged});

  final TextEditingController controller;
  final String label;
  final String hint;
  final ValueChanged<String>? onChanged;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      onChanged: onChanged,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        filled: true,
        fillColor: Colors.white,
        contentPadding: EdgeInsets.symmetric(horizontal: 18.w, vertical: 18.h),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(18.r), borderSide: const BorderSide(color: Color(0xFFE5E7EB))),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(18.r), borderSide: const BorderSide(color: _green, width: 2)),
      ),
    );
  }
}

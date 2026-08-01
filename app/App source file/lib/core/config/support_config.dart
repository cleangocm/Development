class SupportConfig {
  const SupportConfig._();

  static const whatsappNumber = String.fromEnvironment(
    'CLEANGO_SUPPORT_WHATSAPP',
  );
  static const phoneNumber = String.fromEnvironment('CLEANGO_SUPPORT_PHONE');
  static const emailAddress = String.fromEnvironment('CLEANGO_SUPPORT_EMAIL');
  static const privacyPolicyUrl = String.fromEnvironment(
    'CLEANGO_PRIVACY_POLICY_URL',
  );
  static const termsOfServiceUrl = String.fromEnvironment(
    'CLEANGO_TERMS_OF_SERVICE_URL',
  );

  static bool get hasWhatsApp => _digits(whatsappNumber).isNotEmpty;
  static bool get hasPhone => phoneNumber.trim().isNotEmpty;
  static bool get hasEmail => emailAddress.trim().contains('@');
  static bool get hasPrivacyPolicy => _httpUri(privacyPolicyUrl) != null;
  static bool get hasTermsOfService => _httpUri(termsOfServiceUrl) != null;

  static Uri? get whatsappUri {
    final number = _digits(whatsappNumber);
    if (number.isEmpty) return null;
    return Uri.https('wa.me', '/$number', <String, String>{
      'text': 'Hello CLEANGO Support, I need assistance.',
    });
  }

  static Uri? get phoneUri {
    final phone = phoneNumber.trim();
    return phone.isEmpty ? null : Uri(scheme: 'tel', path: phone);
  }

  static Uri? get emailUri {
    final email = emailAddress.trim();
    if (!email.contains('@')) return null;
    return Uri(
      scheme: 'mailto',
      path: email,
      queryParameters: const <String, String>{
        'subject': 'CLEANGO customer support',
      },
    );
  }

  static Uri? get privacyPolicyUri => _httpUri(privacyPolicyUrl);
  static Uri? get termsOfServiceUri => _httpUri(termsOfServiceUrl);

  static String _digits(String value) => value.replaceAll(RegExp('[^0-9]'), '');

  static Uri? _httpUri(String value) {
    final uri = Uri.tryParse(value.trim());
    if (uri == null || !uri.hasScheme) return null;
    if (uri.scheme != 'https' && uri.scheme != 'http') return null;
    return uri;
  }
}

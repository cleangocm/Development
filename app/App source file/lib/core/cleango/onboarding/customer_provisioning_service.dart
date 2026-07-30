import 'package:firebase_auth/firebase_auth.dart';

enum CustomerProvisioningStatus { created, updated, unchanged }

class CustomerIdentity {
  const CustomerIdentity({
    required this.uid,
    required this.authProviders,
    this.phoneNumber,
    this.email,
    this.displayName,
    this.avatarUrl,
  });

  final String uid;
  final String? phoneNumber;
  final String? email;
  final String? displayName;
  final String? avatarUrl;
  final Set<String> authProviders;

  factory CustomerIdentity.fromFirebaseUser(User user) {
    return CustomerIdentity(
      uid: user.uid,
      phoneNumber: user.phoneNumber,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.photoURL,
      authProviders: user.providerData
          .map((provider) => provider.providerId)
          .where((provider) => provider.isNotEmpty)
          .toSet(),
    );
  }
}

class CustomerProvisioningResult {
  const CustomerProvisioningResult({
    required this.status,
    required this.onboardingCompleted,
    required this.accountStatus,
  });

  final CustomerProvisioningStatus status;
  final bool onboardingCompleted;
  final String accountStatus;

  bool get isDisabled => accountStatus == 'disabled';
}

abstract interface class CustomerProvisioningStore {
  Future<Map<String, dynamic>?> readCustomer(String uid);

  Future<void> createCustomer(String uid, Map<String, dynamic> values);

  Future<void> mergeCustomer(String uid, Map<String, dynamic> values);
}

class CustomerProvisioningException implements Exception {
  const CustomerProvisioningException(this.message, [this.cause]);

  final String message;
  final Object? cause;
}

class CustomerProvisioningService {
  CustomerProvisioningService({
    required CustomerProvisioningStore store,
    FirebaseAuth? firebaseAuth,
  }) : _store = store,
       _firebaseAuth = firebaseAuth;

  final CustomerProvisioningStore _store;
  final FirebaseAuth? _firebaseAuth;

  Future<CustomerProvisioningResult> provisionCurrentUser() async {
    final user = _firebaseAuth?.currentUser;
    if (user == null) {
      throw const CustomerProvisioningException(
        'Your Firebase session has expired. Please sign in again.',
      );
    }
    return provision(CustomerIdentity.fromFirebaseUser(user));
  }

  Future<CustomerProvisioningResult> provision(
    CustomerIdentity identity,
  ) async {
    if (identity.uid.trim().isEmpty) {
      throw const CustomerProvisioningException(
        'A valid authenticated customer is required.',
      );
    }

    try {
      final existing = await _store.readCustomer(identity.uid);
      if (existing == null) {
        await _store.createCustomer(identity.uid, {
          'uid': identity.uid,
          'userId': identity.uid,
          ..._identityValues(identity),
          'onboardingCompleted': false,
          'accountStatus': 'active',
          'authProviders': identity.authProviders.toList()..sort(),
        });
        return const CustomerProvisioningResult(
          status: CustomerProvisioningStatus.created,
          onboardingCompleted: false,
          accountStatus: 'active',
        );
      }

      final patch = <String, dynamic>{};
      if (_string(existing['uid']).isEmpty) patch['uid'] = identity.uid;
      if (_string(existing['userId']).isEmpty) patch['userId'] = identity.uid;
      _mergeMissingIdentity(patch, existing, identity);

      final providers = <String>{
        ..._stringList(existing['authProviders']),
        ...identity.authProviders,
      }.toList()..sort();
      if (!_sameStrings(providers, _stringList(existing['authProviders']))) {
        patch['authProviders'] = providers;
      }

      if (!existing.containsKey('onboardingCompleted')) {
        patch['onboardingCompleted'] = false;
      }
      if (_string(existing['accountStatus']).isEmpty) {
        patch['accountStatus'] = 'active';
      }

      if (patch.isNotEmpty) {
        await _store.mergeCustomer(identity.uid, patch);
      }
      return CustomerProvisioningResult(
        status: patch.isEmpty
            ? CustomerProvisioningStatus.unchanged
            : CustomerProvisioningStatus.updated,
        onboardingCompleted: existing['onboardingCompleted'] == true,
        accountStatus: _string(existing['accountStatus']).isEmpty
            ? 'active'
            : _string(existing['accountStatus']),
      );
    } catch (error) {
      if (error is CustomerProvisioningException) rethrow;
      throw CustomerProvisioningException(
        'We could not prepare your CLEANGO profile. Please try again.',
        error,
      );
    }
  }

  Map<String, dynamic> _identityValues(CustomerIdentity identity) {
    return <String, dynamic>{
      if (_notEmpty(identity.phoneNumber))
        'phoneNumber': identity.phoneNumber!.trim(),
      if (_notEmpty(identity.email)) 'email': identity.email!.trim(),
      if (_notEmpty(identity.displayName))
        'displayName': identity.displayName!.trim(),
      if (_notEmpty(identity.displayName))
        'fullName': identity.displayName!.trim(),
      if (_notEmpty(identity.avatarUrl))
        'avatarUrl': identity.avatarUrl!.trim(),
      if (_notEmpty(identity.avatarUrl))
        'profileImage': identity.avatarUrl!.trim(),
    };
  }

  void _mergeMissingIdentity(
    Map<String, dynamic> patch,
    Map<String, dynamic> existing,
    CustomerIdentity identity,
  ) {
    final values = _identityValues(identity);
    for (final entry in values.entries) {
      if (_string(existing[entry.key]).isEmpty) {
        patch[entry.key] = entry.value;
      }
    }
  }
}

bool _notEmpty(String? value) => value != null && value.trim().isNotEmpty;

String _string(Object? value) => value is String ? value.trim() : '';

List<String> _stringList(Object? value) {
  if (value is! Iterable) return const [];
  return value
      .whereType<String>()
      .map((item) => item.trim())
      .where((item) => item.isNotEmpty)
      .toList();
}

bool _sameStrings(List<String> left, List<String> right) {
  if (left.length != right.length) return false;
  final normalizedRight = [...right]..sort();
  for (var index = 0; index < left.length; index++) {
    if (left[index] != normalizedRight[index]) return false;
  }
  return true;
}

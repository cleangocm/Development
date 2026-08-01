enum SupportRequestCategory {
  general,
  missedCollection,
  billing,
  subscription,
  account,
  other,
}

extension SupportRequestCategoryValue on SupportRequestCategory {
  String get wireValue => switch (this) {
    SupportRequestCategory.general => 'general',
    SupportRequestCategory.missedCollection => 'missed_collection',
    SupportRequestCategory.billing => 'billing',
    SupportRequestCategory.subscription => 'subscription',
    SupportRequestCategory.account => 'account',
    SupportRequestCategory.other => 'other',
  };

  String get label => switch (this) {
    SupportRequestCategory.general => 'General support',
    SupportRequestCategory.missedCollection => 'Missed collection',
    SupportRequestCategory.billing => 'Payment or billing',
    SupportRequestCategory.subscription => 'Subscription',
    SupportRequestCategory.account => 'Account',
    SupportRequestCategory.other => 'Other',
  };
}

class SupportRequestDraft {
  const SupportRequestDraft({
    required this.category,
    required this.subject,
    required this.message,
    this.collectionId,
  });

  final SupportRequestCategory category;
  final String subject;
  final String message;
  final String? collectionId;
}

class SupportRequestResult {
  const SupportRequestResult({required this.id});

  final String id;
}

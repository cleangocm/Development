import 'package:ultrawash/core/cleango/collectors/collector.dart';

enum CollectorAccessDestination {
  customer,
  collectorDashboard,
  pendingReview,
  blocked,
}

class CollectorAccessPolicy {
  const CollectorAccessPolicy._();

  static CollectorAccessDestination resolve(CollectorProfile? profile) {
    if (profile == null) return CollectorAccessDestination.customer;
    if (profile.canOperate) {
      return CollectorAccessDestination.collectorDashboard;
    }
    if (profile.role == 'collector' &&
        profile.approvalStatus == CollectorApprovalStatus.pending) {
      return CollectorAccessDestination.pendingReview;
    }
    return CollectorAccessDestination.blocked;
  }
}

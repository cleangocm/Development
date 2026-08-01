import 'package:ultrawash/core/cleango/models/support_request.dart';

abstract interface class SupportRequestRepository {
  Future<SupportRequestResult> createRequest(SupportRequestDraft request);
}

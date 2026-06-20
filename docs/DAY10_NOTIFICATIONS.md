# Day 10 - Notifications

## Completed

- Added Firestore-backed `notifications` usage for CleanGo launch workflows.
- Added `createNotification` server helper with optional Firebase Cloud Messaging delivery when device tokens exist.
- Added `registerDeviceToken` callable for future browser/mobile push-token registration.
- Added `sendPickupReminders` scheduled function for next-day customer and collector reminders.
- Added customer notifications when:
  - a collector is assigned,
  - pickup status changes,
  - pickup is rescheduled or cancelled,
  - subscription schedules are generated,
  - payment is initiated or verified.
- Added collector notifications when:
  - a pickup is assigned,
  - an assigned pickup is completed, rescheduled, cancelled, or due tomorrow.
- Switched the customer `/notifications` page to read Firestore notifications.
- Switched the delivery `/delivery/notifications` page to read Firestore notifications.
- Updated the customer dashboard sidebar unread badge to count Firestore unread notifications.
- Added `deviceTokens` Firestore rules for user-owned token registration.

## Notes

- In-app notifications are ready now.
- Browser push delivery needs the Firebase web push certificate/VAPID key configured in the frontend before the browser can request notification permission and generate a token.
- The scheduled reminder runs every day at 18:00 Africa/Douala time and deduplicates by pickup/date.

## Test Points

- Assign `sample-pickup-today` to the demo collector and confirm customer and collector notification documents are created.
- Update pickup status from the collector workflow and confirm the customer sees the update in `/notifications`.
- Manually verify a payment and confirm the customer sees a payment status notification.

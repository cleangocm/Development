# Day 5 Customer Booking

## Customer flow

1. Open `/dashboard/book-pickup`.
2. Select an active CleanGo plan.
3. Choose a configured service zone and supported neighborhood.
4. Enter the pickup address, location details, and contact information.
5. Select an official pickup day: Tuesday, Thursday, Friday, or Saturday.
6. Review the booking and confirm it.
7. Open `/dashboard/orders` to view pickup history and current status.
8. Open `/dashboard/orders/{pickupId}` for the status timeline and recorded details.

## Firestore transaction

Confirmation writes these linked records atomically:

- `addresses/{addressId}`
- `subscriptions/{subscriptionId}` with `pending` status
- `pickups/{pickupId}` with `scheduled` status and no collector
- `payments/{paymentId}` with `pending` status

Security rules prevent customers from creating assigned pickups, active subscriptions, or paid payment records.

## Configuration fallback

The page prefers active `plans` and `serviceZones` documents from Firestore. Until administrators seed those collections, it displays the three MVP plans and the approved Yaounde neighborhoods as local defaults. Default prices remain zero and are shown as “Price confirmed by CleanGo” to avoid inventing unapproved pricing.

# Day 12 - QA, Security, and Performance

## Implemented

- Added `tests/launch-readiness.test.ts` to protect launch-critical CleanGo paths from regression.
- Added `npm run test:launch` for fast static launch checks.
- Added `npm run test:day12` to run scheduling plus launch-readiness checks.
- Moved local Firebase emulator QA ports to `18080` for Firestore and `19199` for Storage to avoid collisions with older emulator processes.
- Verified generated plan-card artwork is used instead of repeated CleanGo logo images.
- Verified launch entry points keep CleanGo/French branding:
  - `/login`
  - `/admin/login`
  - `/delivery/login`
  - public home sections and subscription plans entry
- Verified Firestore/Storage rules still contain the launch-critical customer, collector, admin, payment, pickup proof, and notification protections.

## Required Day 12 QA Pass

Run locally before staging release:

```bash
npm run test:day12
npm run test:rules
cd frontend/Laundry-Service-Booking-App-Frontend
npx eslint src/components/sections/Services.tsx src/components/layout/Header.tsx src/app/login/page.tsx src/app/admin/login/page.tsx src/app/delivery/login/page.tsx
npx tsc --noEmit --incremental false
npm run build
cd ../../functions
npm run build
```

`npm run test:rules` starts Firebase emulators on the dedicated ports configured in `firebase.json`.

## Manual End-To-End QA

Test with one admin, one customer, and two collectors:

1. Customer creates or logs into an account.
2. Customer opens public plans and selects a subscription.
3. Customer selects zone, address, date, plan, payment method, and submits.
4. Admin sees the pickup in dispatch.
5. Admin assigns the pickup to Collector A.
6. Collector A sees the pickup.
7. Collector B cannot see or update Collector A's pickup.
8. Collector A marks `en_route`, `arrived`, then `completed`.
9. Customer sees updated pickup history and notification.
10. Admin manually verifies a pending payment.
11. Customer sees the payment status update.

## Security Checklist

- Customers cannot read another customer's pickups, payments, receipts, profile, or notifications.
- Collectors can read and update only assigned pickups.
- Collectors can only update allowed status/proof/note fields.
- Customers cannot mark a payment as paid.
- Only admins can assign collectors, manage operational records, verify payments, and read audit logs.
- Storage proof uploads are limited to image files under `pickupProof/{customerId}/{collectorId}/{pickupId}`.
- Payment receipts are limited to the owning customer and admin.
- Provider payment callbacks require `PAYMENT_CALLBACK_SECRET`.

## Performance Checklist

- Pickups queries use indexed filters by customer, collector, status, zone, subscription, and date.
- Notification queries use `userId + createdAt`.
- Dashboard screens should use paginated or date-filtered reads before launch traffic.
- Images in launch cards are local optimized assets.
- No launch customer path should depend on the old laundry service catalog.

## Known Release Risks

- Browser push still needs the Firebase web push certificate/VAPID key before real web push tokens work.
- MTN/Orange live provider approval may not be ready; use manual verification/cash fallback for launch.
- Full production build may require closing stale Node processes if `.next/trace` is locked on Windows.

# Day 13 - Staging Release and User Acceptance

## Staging Release Scope

Release only the CleanGo launch paths:

- Public home and subscription plans.
- Customer login, signup, dashboard, subscription booking, one-off pickup, payment account, address/profile, pickup history, and notifications.
- Collector login and workflow.
- Admin login and dispatch/payment verification views.
- Firestore rules, Storage rules, indexes, and Cloud Functions.

Legacy UltraWash catalog/admin pages may remain in the repository, but they are not part of Day 13 acceptance.

## Pre-Deploy Checklist

1. Confirm Firebase staging project ID.
2. Confirm Firebase billing is enabled for Functions, Scheduler, and Hosting if required.
3. Confirm these secrets/config values:
   - `PAYMENT_CALLBACK_SECRET`
   - MTN sandbox credentials, if available
   - Orange sandbox credentials, if available
   - Firebase web push certificate/VAPID key, if browser push is required
4. Confirm staging test accounts:
   - `customer.test@cleango.local`
   - `admin.test@cleango.local`
   - `collector.test@cleango.local`
   - one second collector account for access isolation testing
5. Run Day 12 checks.

## Deploy Commands

Use the staging project alias once it is configured:

```bash
firebase use cleango-staging
npm run test:day12
npm run test:rules

cd functions
npm run build
cd ..

cd frontend/Laundry-Service-Booking-App-Frontend
npm run build
cd ../..

firebase deploy --only firestore:rules,firestore:indexes,storage,functions,hosting
```

The local emulator QA ports are `18080` for Firestore and `19199` for Storage. If another emulator suite is already running, leave it alone and use the documented Day 12 commands.

If the project alias is not configured yet:

```bash
firebase use --add
```

Then choose the staging Firebase project and name the alias `cleango-staging`.

## User Acceptance Script

Run a complete simulated collection day:

1. Admin verifies plans, zones, collectors, and payment methods exist.
2. Customer logs in on a real phone or mobile browser.
3. Customer books the Basic plan for an official pickup date.
4. Customer books one one-off pickup with manual/cash payment.
5. Admin assigns one pickup to Collector A and one pickup to Collector B.
6. Collector A completes the assigned pickup and uploads optional proof.
7. Collector B marks one pickup missed, then reschedules.
8. Admin verifies the payment manually.
9. Customer confirms pickup history, payment status, and notifications.
10. Admin confirms dispatch counts and collector earnings.

## Sign-Off Criteria

- Customer booking works from a phone.
- Admin assignment works on staging.
- Collector status updates work from a phone.
- Cross-collector data is not visible.
- Payment records can be initiated and manually verified.
- Notifications appear in-app.
- No critical layout issue blocks mobile use.
- Stakeholder approves the flow for production Day 14.

## Launch Blockers

- Any unauthorized read/write path.
- Customer cannot create a pickup.
- Admin cannot assign a pickup.
- Collector cannot complete a pickup.
- Payment cannot be recorded or verified manually.
- Staging deployment cannot be reproduced from documented commands.

## Non-Blocking For Day 13

- Live MTN/Orange callbacks, if provider approval is still pending.
- Browser push on devices until VAPID is configured.
- Full iOS store release.
- Legacy UltraWash admin screens outside the launch navigation.

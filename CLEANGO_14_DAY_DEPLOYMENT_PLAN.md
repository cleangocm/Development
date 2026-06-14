# CleanGo 14-Day MVP Deployment Plan

**Start:** Saturday, June 13, 2026  
**Target launch:** Friday, June 26, 2026

## Launch Scope

The two-week goal is a usable waste pickup MVP, not every feature in the original UltraWash package.

### Included

- Firebase Authentication with Customer, Collector, and Admin roles
- Customer pickup booking, address, zone, plan, date, and status tracking
- Recurring pickup schedule generation
- Collector view restricted to assigned pickups
- Collector status updates, notes, completion time, and optional photo proof
- Admin customer, collector, pickup, assignment, zone, and plan management
- MTN Mobile Money and Orange Money payment records and verification flow
- Push notifications and pickup reminders
- French-first CleanGo branding
- Web deployment, Android test build, monitoring, and backups

### Deferred Until After Launch

- Advanced route optimization
- Multi-store laundry features
- Loyalty, coupons, reviews, blog, chat, and complex accounting
- Stripe and PayPal
- Full iOS App Store launch if the Apple account/review is not ready

## Target Architecture

- **Flutter:** one role-aware mobile app for customers and collectors
- **Next.js:** admin web dashboard and optional customer web portal
- **Firebase Authentication:** login and role identity
- **Cloud Firestore:** operational database
- **Cloud Functions:** scheduling, assignment, payments, notifications, and statistics
- **Cloud Storage:** profile images, receipts, and pickup proof
- **Firebase Cloud Messaging:** push notifications
- **Firebase App Hosting / Hosting:** web deployment
- **Firebase App Distribution:** Android/iOS testing

Use two Firebase projects:

- `cleango-staging` for development and testing
- `cleango-production` for real customers

Never commit service-account files, API keys with server privileges, payment secrets, or `.env` files.

## Firestore Collections

- `users`: identity, role, name, phone, active status
- `customers`: customer profile and preferences
- `collectors`: collector profile, zone, availability, pay rate
- `addresses`: customer location and service zone
- `serviceZones`: supported neighborhoods and pricing rules
- `plans`: Basic, Standard, Popular, pickup frequency, and price
- `subscriptions`: customer plan and billing state
- `pickups`: scheduled date, customer, collector, status, notes, proof
- `payments`: provider, amount, transaction reference, verification status
- `collectorDailyStats`: completed count and earnings by collector/date
- `notifications`: delivery status and message history
- `auditLogs`: important administrative changes
- `settings`: business-wide configuration

Pickup statuses: `scheduled`, `assigned`, `en_route`, `arrived`, `completed`, `missed`, `rescheduled`, `cancelled`.

## Daily Plan

### Day 1 - Saturday, June 13: Project Foundation

- Back up the untouched UltraWash source.
- Create `cleango-staging` and `cleango-production` Firebase projects.
- Register Web and Android apps; register iOS if an Apple account is available.
- Install/configure Firebase CLI and FlutterFire CLI.
- Create environment files and a Git branch for the CleanGo conversion.
- Freeze the MVP screens and remove unrelated laundry features from the launch list.

**Done when:** Flutter, Next.js, and Firebase emulators start locally without exposing secrets.

### Day 2 - Sunday, June 14: Authentication and Roles

- Connect Flutter and Next.js to Firebase Authentication.
- Implement email/password and phone-ready authentication structure.
- Define roles: `customer`, `collector`, `admin`.
- Add role-based navigation and protected routes.
- Create an admin-only Cloud Function for assigning custom claims.

**Done when:** test accounts reach only their permitted dashboards.

### Day 3 - Monday, June 15: Firestore Schema and Security

- Create the Firestore collections and indexes.
- Write Security Rules:
  - customers see their own profile, pickups, subscriptions, and payments;
  - collectors see only pickups assigned to their user ID;
  - admins can manage operational records;
  - privileged changes run through Cloud Functions.
- Add Storage rules for receipts and pickup proof.
- Add emulator-based rules tests.

**Done when:** cross-user access tests are rejected.

### Day 4 - Tuesday, June 16: Replace the MongoDB Backend

- Introduce Firebase repositories/services in the backend and clients.
- Port user, customer, collector, zone, plan, pickup, and payment operations.
- Move trusted business logic to Cloud Functions.
- Stop adding features to the old Mongoose models.

**Done when:** the staging application creates and reads core records only from Firestore.

### Day 5 - Wednesday, June 17: Customer Booking Flow

- Convert laundry service selection into waste pickup plan selection.
- Build address, neighborhood, zone, pickup date, contact, and instructions forms.
- Add booking review and confirmation.
- Add customer pickup history and current status.

**Done when:** a customer can submit a valid pickup that appears in the admin dashboard.

### Day 6 - Thursday, June 18: Plans and Automatic Scheduling

- Configure Basic, Standard, and Popular plans.
- Implement recurring schedule generation in Cloud Functions.
- Prevent duplicate pickups for the same subscription/date.
- Preserve missed, pending, and rescheduled pickups until completion.
- Add cancellation and rescheduling rules.

**Done when:** changing a plan generates the correct future pickup dates exactly once.

### Day 7 - Friday, June 19: Collector Workflow

- Build Today, Tomorrow, Missed, and Completed views.
- Restrict every query to the signed-in collector's UID.
- Add `en_route`, `arrived`, `completed`, `missed`, and `rescheduled` actions.
- Capture notes, completion timestamp, and optional photo proof.
- Add lightweight offline/error states.

**Done when:** Collector A cannot read or update Collector B's assignments.

### Day 8 - Saturday, June 20: Admin Dispatch Dashboard

- Build customer and collector management.
- Build Today/Tomorrow pickup boards grouped by zone and collector.
- Add assignment and reassignment actions.
- Add filters for date, zone, status, collector, and payment status.
- Add completed count and collector earnings views.

**Done when:** an admin can create a customer, schedule a pickup, assign it, and monitor completion.

### Day 9 - Sunday, June 21: MTN and Orange Money

- Add provider-neutral payment service interfaces.
- Configure MTN and Orange sandbox credentials through Firebase secrets.
- Implement payment initiation, callback/webhook verification, retries, and audit logs.
- Never mark a payment paid from the client response alone.
- Keep cash/manual verification as a launch fallback if provider approval is pending.

**Done when:** a verified callback changes a payment from `pending` to `paid` exactly once.

### Day 10 - Monday, June 22: Notifications

- Configure Firebase Cloud Messaging.
- Notify customers when a pickup is booked, assigned, approaching, completed, or rescheduled.
- Notify collectors of new assignments and next-day work.
- Add scheduled reminder functions and notification logs.

**Done when:** test devices receive assignment and reminder notifications.

### Day 11 - Tuesday, June 23: CleanGo Rebrand and French UI

- Replace UltraWash/laundry wording, icons, images, colors, and sample data.
- Make French the primary interface language.
- Keep technical Firestore values stable in English; translate display labels only.
- Check mobile layouts and accessibility.

**Done when:** no customer-facing laundry wording remains in launch paths.

### Day 12 - Wednesday, June 24: QA, Security, and Performance

- Test customer, collector, and admin journeys end to end.
- Test duplicate scheduling, offline behavior, invalid payments, and permission attacks.
- Add Firestore indexes and query pagination.
- Review logs, error handling, rate limits, and data validation.
- Run Flutter, Next.js, Functions, and Security Rules tests.

**Done when:** there are no critical defects or unauthorized data paths.

### Day 13 - Thursday, June 25: Staging Release and User Acceptance

- Deploy Next.js and Cloud Functions to staging.
- Distribute the Android build through Firebase App Distribution.
- Test with at least one customer, two collectors, and one admin on real devices.
- Run a complete simulated collection day.
- Fix launch-blocking issues only.

**Done when:** stakeholders sign off on booking, assignment, completion, and payment recording.

### Day 14 - Friday, June 26: Production Launch

- Create production indexes, rules, secrets, and initial admin account.
- Deploy the web app, Functions, Firestore rules, and Storage rules.
- Release the Android build to the chosen production channel.
- Configure domain, monitoring, alerts, budgets, and backups.
- Verify one production booking with a controlled test customer.
- Record rollback steps and begin a seven-day launch monitoring period.

**Done when:** production booking, assignment, completion, notification, and payment recording work end to end.

## Information Needed Before Implementation

- Firebase staging and production project IDs
- Android package name and signing decision
- Apple Developer account status, if iOS is required
- CleanGo logo, colors, French labels, privacy policy, and terms
- Service zones and neighborhoods
- Final plan prices and pickup frequencies
- Collector pay rule, currently assumed as XAF 300 per completed pickup
- MTN and Orange merchant/sandbox credentials and callback requirements
- Production domain/subdomain

## Main Risks

- MTN/Orange merchant approval can exceed two weeks. Use sandbox plus manual/cash confirmation until production credentials arrive.
- App Store review can exceed the launch window. Prioritize web and Android; distribute iOS through testing if possible.
- Firebase billing may be required for server functions, hosting features, scheduled jobs, and outbound payment calls.
- Migrating every UltraWash feature would exceed two weeks. Keep the launch scope strict.

## Launch Acceptance Checklist

- Customer can register, book, pay/record payment, and track a pickup.
- Collector sees only assigned work and can complete it with notes/proof.
- Admin can manage customers, plans, zones, pickups, collectors, and assignments.
- Automatic schedules do not create duplicates.
- Completed pickups update daily collector earnings correctly.
- Payment webhooks are authenticated and idempotent.
- Firestore and Storage rules pass permission tests.
- Production has monitoring, budget alerts, backups, and documented rollback steps.


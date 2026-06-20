# Day 4 Firestore Migration

## Migrated launch paths

- Firebase signup creates `users/{uid}` and `customers/{uid}` atomically.
- Customer profile reads and writes use Firestore.
- Customer dashboard and pickup history query `pickups` by authenticated UID.
- Existing checkout confirmation now creates a Firestore pickup and optional pending payment instead of a MongoDB order.
- Admin pickup assignment validates the collector and writes an audit log through `assignPickup`.
- Collector/admin status changes use validated transitions through `updatePickupStatus`.
- Role assignment maintains matching customer or collector profile records.

## Repository modules

- `src/types/cleango.ts`: shared client domain types.
- `src/services/cleangoRepository.ts`: user, customer, plan, zone, subscription, pickup, and payment access.
- `src/services/cleangoFunctions.ts`: callable trusted operations.
- `functions/src/index.ts`: role, assignment, status transition, and audit logic.

## Deliberately deferred legacy screens

The purchased UltraWash package still contains laundry services, stores, coupons, reviews, support tickets, Stripe/PayPal, staff cleaning, and delivery-return workflows. They are not part of the Day 4 data contract and must not receive new development.

- Day 5 replaces service/cart/checkout presentation with the CleanGo booking flow.
- Day 7 replaces delivery screens with the collector workflow.
- Day 8 replaces legacy admin order/user screens with dispatch management.
- Day 9 replaces legacy payment gateways with MTN/Orange/manual records.
- Day 11 removes remaining customer-facing laundry language and screens.

The legacy Express backend remains read-only migration reference under `backend/`.

# Day 6 - Plans and Automatic Scheduling

Day 6 is implemented locally.

## Implemented

- Added shared scheduling helpers in `functions/src/scheduling.ts`.
- Added idempotent `generateSubscriptionSchedule`.
- Added `changeSubscriptionPlan` with future scheduled pickup reconciliation.
- Added customer/admin `reschedulePickup` and `cancelPickup` callables.
- Preserved assigned, missed, rescheduled, and completed pickups during plan changes.
- Added security tests that require direct customer cancellation/rescheduling to go through trusted functions.

## Verification

- `npm run test:scheduling` passed.
- `npm run build` passed in `functions`.

## Notes

Official pickup days remain Tuesday, Thursday, Friday, and Saturday. Generated pickup document IDs are deterministic by subscription and date so repeated schedule generation does not duplicate future work.

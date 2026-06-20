# Day 8 - Admin Dispatch Dashboard

Day 8 is implemented locally at `/admin/delivery`.

## Implemented

- Replaced the delivery management route with a Firestore-backed CleanGo dispatch board.
- Added Today, Tomorrow, and All pickup views.
- Added filters for status, collector, zone, and payment status.
- Grouped visible pickups by service zone or neighborhood.
- Added collector assignment and reassignment through the trusted `assignPickup` callable.
- Added completion counts, active collector counts, and collector earnings rollups.

## Access Control

The page relies on admin-only Firestore reads plus the admin-only `assignPickup` callable. Collector views remain scoped to their own `collectorId`, so assignments made here become visible only to the selected collector.

## Remaining For Day 9

Payment records are visible for dispatch filtering, but provider verification is still manual/pending until MTN and Orange Money callback handling is implemented.

# Day 7 - Collector Workflow

Day 7 is implemented locally.

## Implemented

- Replaced the legacy REST-backed delivery routes with a Firestore collector workflow.
- Added Today, Tomorrow, Missed, and Completed views under existing `/delivery` URLs.
- Added collector-scoped pickup queries using the signed-in UID.
- Added actions for `en_route`, `arrived`, `completed`, `missed`, and rescheduling.
- Added optional image proof upload to Firebase Storage under `pickupProof/{customerId}/{collectorId}/{pickupId}`.
- Added note capture and callable status updates so completion timestamps are written server-side.
- Updated delivery login to allow `collector` users as well as the legacy `delivery` role.

## Access Control

Firestore rules still only allow collectors to read or directly update pickups where `collectorId` matches their auth UID. The `reschedulePickup` callable now also allows the assigned collector to reschedule their own active pickup while preserving the assignment.

## Remaining For Day 8

Admin dispatch still needs the Firestore assignment board so admins can create and assign the collector work that appears in these Day 7 views.

# CleanGo Firestore Schema

This document is the Day 3 contract for the CleanGo MVP. IDs that refer to an authenticated person use the Firebase Authentication UID.

## Core collections

| Collection | Required fields | Ownership and writes |
| --- | --- | --- |
| `users/{uid}` | `uid`, `role`, `active`, `createdAt`, `updatedAt` | User reads/updates safe profile fields; admins manage role and active state. |
| `customers/{uid}` | `userId`, `name`, `phone`, `preferredLanguage` | Customer owns the document; admins may manage it. |
| `collectors/{uid}` | `userId`, `name`, `phone`, `active`, `payRate` | Collector reads and updates safe profile fields; admins manage operational fields. |
| `addresses/{id}` | `customerId`, `label`, `addressLine`, `neighborhood`, `serviceZoneId`, `location` | Customer owns addresses; admins may manage them. |
| `serviceZones/{id}` | `name`, `neighborhoods`, `active` | Signed-in users read; admins write. |
| `plans/{id}` | `name`, `pickupFrequency`, `priceXaf`, `bags`, `active` | Signed-in users read; admins write. |
| `subscriptions/{id}` | `customerId`, `planId`, `status`, `startDate`, `endDate`, `preferredDays` | Customer creates/reads; trusted server or admin changes billing/scheduling state. |
| `pickups/{id}` | `customerId`, `subscriptionId`, `addressId`, `serviceZoneId`, `scheduledDate`, `status` | Customer creates/reads; assigned collector reads and performs workflow updates; admin manages all. |
| `payments/{id}` | `customerId`, `subscriptionId`, `provider`, `amountXaf`, `status`, `reference` | Customer creates pending records and reads; only trusted server/admin verifies. |
| `collectorDailyStats/{id}` | `collectorId`, `date`, `completedCount`, `earningsXaf` | Collector/admin read; Cloud Functions write. |
| `notifications/{id}` | `userId`, `type`, `title`, `body`, `read`, `createdAt` | Recipient reads and marks read; Cloud Functions create. |
| `auditLogs/{id}` | `action`, `actorUid`, `targetId`, `createdAt`, `metadata` | Admin reads; Cloud Functions write. |
| `settings/{id}` | setting-specific values | Signed-in users read; admins write. |

## Pickup status values

`scheduled`, `assigned`, `en_route`, `arrived`, `completed`, `missed`, `rescheduled`, `cancelled`

## Payment status values

`pending`, `paid`, `failed`, `cancelled`, `refunded`

Clients must not set a payment to `paid`. Day 9 payment callbacks will verify provider responses in Cloud Functions and update the record idempotently.

## Storage paths

- `users/{uid}/...`: profile images owned by the user.
- `pickupProof/{customerId}/{collectorId}/{pickupId}/...`: image proof readable by the customer, assigned collector path owner, and admins.
- `paymentReceipts/{customerId}/{paymentId}/...`: image or PDF receipt owned by the customer and readable by admins.

## Migration compatibility

The legacy `bookings` collection remains temporarily protected by the same owner/collector/admin access model. Day 4 will migrate active reads and writes to `pickups`, after which `bookings` can be removed.

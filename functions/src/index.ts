import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import {
  generateScheduleDates,
  pickupDocumentId,
  validatePreferredWeekdays,
} from './scheduling.js';
import { createNotification } from './notifications.js';
export {
  initiatePayment,
  paymentProviderCallback,
  verifyPaymentManually,
} from './payments.js';
export {
  registerDeviceToken,
  sendPickupReminders,
} from './notifications.js';

if (getApps().length === 0) initializeApp();

const auth = getAuth();
const db = getFirestore();
const allowedRoles = ['customer', 'collector', 'admin'] as const;
type UserRole = (typeof allowedRoles)[number];

interface SetUserRoleInput { uid?: string; role?: string; }

const pickupStatuses = [
  'scheduled',
  'assigned',
  'en_route',
  'arrived',
  'completed',
  'missed',
  'rescheduled',
  'cancelled',
] as const;
type PickupStatus = (typeof pickupStatuses)[number];

function isAdmin(token: Record<string, unknown>) {
  return token.admin === true || token.role === 'admin';
}

function isCollector(token: Record<string, unknown>) {
  return token.collector === true || token.role === 'collector';
}

function requireAdmin(authData: { token: Record<string, unknown> } | undefined) {
  if (!authData) throw new HttpsError('unauthenticated', 'You must be signed in.');
  if (!isAdmin(authData.token)) {
    throw new HttpsError('permission-denied', 'Only administrators can perform this action.');
  }
}

export const setUserRole = onCall<SetUserRoleInput>(
  { region: 'europe-west1' },
  async (request) => {
    requireAdmin(request.auth);
    const actor = request.auth!;

    const uid = request.data.uid?.trim();
    const requestedRole = request.data.role?.trim();
    if (!uid || !requestedRole || !allowedRoles.includes(requestedRole as UserRole)) {
      throw new HttpsError('invalid-argument', 'A valid uid and role are required.');
    }
    if (uid === actor.uid) {
      throw new HttpsError('failed-precondition', 'Administrators cannot change their own role.');
    }

    const role = requestedRole as UserRole;
    const targetUser = await auth.getUser(uid);
    const targetRef = db.collection('users').doc(uid);
    const targetSnapshot = await targetRef.get();
    const previousRole = targetSnapshot.data()?.role ?? targetUser.customClaims?.role ?? 'customer';

    await auth.setCustomUserClaims(uid, {
      ...(targetUser.customClaims ?? {}),
      role,
      admin: role === 'admin',
      collector: role === 'collector',
    });

    const batch = db.batch();
    batch.set(targetRef, {
      uid,
      email: targetUser.email ?? targetSnapshot.data()?.email ?? '',
      role,
      active: targetSnapshot.data()?.active ?? true,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    if (role === 'collector') {
      batch.set(db.collection('collectors').doc(uid), {
        userId: uid,
        name: targetUser.displayName ?? targetSnapshot.data()?.name ?? '',
        phone: targetUser.phoneNumber ?? targetSnapshot.data()?.phone ?? '',
        active: true,
        serviceZoneIds: [],
        payRate: 300,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    } else if (role === 'customer') {
      batch.set(db.collection('customers').doc(uid), {
        userId: uid,
        name: targetUser.displayName ?? targetSnapshot.data()?.name ?? '',
        phone: targetUser.phoneNumber ?? targetSnapshot.data()?.phone ?? '',
        email: targetUser.email ?? targetSnapshot.data()?.email ?? '',
        preferredLanguage: 'fr',
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }
    batch.set(db.collection('auditLogs').doc(), {
      action: 'user.role.updated',
      actorUid: actor.uid,
      actorEmail: actor.token.email ?? null,
      targetUid: uid,
      targetEmail: targetUser.email ?? null,
      previousRole,
      newRole: role,
      createdAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();

    return { success: true, uid, role, message: 'Role updated. Sign in again to refresh access.' };
  },
);

interface AssignPickupInput { pickupId?: string; collectorId?: string; }

export const assignPickup = onCall<AssignPickupInput>(
  { region: 'europe-west1' },
  async (request) => {
    requireAdmin(request.auth);
    const pickupId = request.data.pickupId?.trim();
    const collectorId = request.data.collectorId?.trim();
    if (!pickupId || !collectorId) {
      throw new HttpsError('invalid-argument', 'pickupId and collectorId are required.');
    }

    const pickupRef = db.collection('pickups').doc(pickupId);
    const collectorRef = db.collection('collectors').doc(collectorId);

    let customerId = '';
    await db.runTransaction(async (transaction) => {
      const [pickupSnapshot, collectorSnapshot] = await Promise.all([
        transaction.get(pickupRef),
        transaction.get(collectorRef),
      ]);
      if (!pickupSnapshot.exists) throw new HttpsError('not-found', 'Pickup not found.');
      if (!collectorSnapshot.exists || collectorSnapshot.data()?.active !== true) {
        throw new HttpsError('failed-precondition', 'Collector is missing or inactive.');
      }
      const pickup = pickupSnapshot.data()!;
      customerId = pickup.customerId ?? '';

      transaction.update(pickupRef, {
        collectorId,
        status: 'assigned',
        assignedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.set(db.collection('auditLogs').doc(), {
        action: 'pickup.assigned',
        actorUid: request.auth!.uid,
        pickupId,
        collectorId,
        createdAt: FieldValue.serverTimestamp(),
      });
    });
    await Promise.all([
      createNotification({
        userId: collectorId,
        type: 'pickup_assigned',
        title: 'New pickup assigned',
        body: 'A CleanGo pickup has been assigned to you. Open the delivery dashboard for details.',
        pickupId,
      }),
      createNotification({
        userId: customerId,
        type: 'pickup_assigned',
        title: 'Collector assigned',
        body: 'A CleanGo collector has been assigned to your pickup.',
        pickupId,
      }),
    ]);

    return { success: true, pickupId, collectorId, status: 'assigned' };
  },
);

interface UpdatePickupStatusInput {
  pickupId?: string;
  status?: string;
  notes?: string;
  proofPath?: string;
}

const collectorTransitions: Record<PickupStatus, PickupStatus[]> = {
  scheduled: [],
  assigned: ['en_route', 'missed', 'rescheduled'],
  en_route: ['arrived', 'missed', 'rescheduled'],
  arrived: ['completed', 'missed', 'rescheduled'],
  completed: [],
  missed: ['rescheduled'],
  rescheduled: ['en_route', 'missed'],
  cancelled: [],
};

export const updatePickupStatus = onCall<UpdatePickupStatusInput>(
  { region: 'europe-west1' },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'You must be signed in.');
    const pickupId = request.data.pickupId?.trim();
    const requestedStatus = request.data.status?.trim() as PickupStatus | undefined;
    if (!pickupId || !requestedStatus || !pickupStatuses.includes(requestedStatus)) {
      throw new HttpsError('invalid-argument', 'A valid pickupId and status are required.');
    }

    const pickupRef = db.collection('pickups').doc(pickupId);
    let customerId = '';
    let collectorId = '';
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(pickupRef);
      if (!snapshot.exists) throw new HttpsError('not-found', 'Pickup not found.');
      const pickup = snapshot.data()!;
      customerId = pickup.customerId ?? '';
      collectorId = pickup.collectorId ?? '';
      const currentStatus = pickup.status as PickupStatus;
      const admin = isAdmin(request.auth!.token);
      const assignedCollector = isCollector(request.auth!.token)
        && pickup.collectorId === request.auth!.uid;

      if (!admin && !assignedCollector) {
        throw new HttpsError('permission-denied', 'This pickup is not assigned to you.');
      }
      if (!admin && !collectorTransitions[currentStatus]?.includes(requestedStatus)) {
        throw new HttpsError(
          'failed-precondition',
          `Collectors cannot change a pickup from ${currentStatus} to ${requestedStatus}.`,
        );
      }

      const updates: Record<string, unknown> = {
        status: requestedStatus,
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (request.data.notes?.trim()) updates.completionNotes = request.data.notes.trim();
      if (request.data.proofPath?.trim()) updates.proofPath = request.data.proofPath.trim();
      if (requestedStatus === 'completed') updates.completedAt = FieldValue.serverTimestamp();
      if (requestedStatus === 'rescheduled') updates.rescheduledAt = Timestamp.now();

      transaction.update(pickupRef, updates);
      transaction.set(db.collection('auditLogs').doc(), {
        action: 'pickup.status.updated',
        actorUid: request.auth!.uid,
        pickupId,
        previousStatus: currentStatus,
        newStatus: requestedStatus,
        createdAt: FieldValue.serverTimestamp(),
      });
    });
    const statusLabel = requestedStatus.replace(/_/g, ' ');
    await Promise.all([
      createNotification({
        userId: customerId,
        type: 'pickup_status',
        title: 'Pickup status updated',
        body: `Your CleanGo pickup is now ${statusLabel}.`,
        pickupId,
      }),
      collectorId && requestedStatus === 'completed'
        ? createNotification({
          userId: collectorId,
          type: 'pickup_completed',
          title: 'Pickup completed',
          body: 'CleanGo recorded your completed pickup.',
          pickupId,
        })
        : Promise.resolve(null),
    ]);

    return { success: true, pickupId, status: requestedStatus };
  },
);

interface GenerateSubscriptionScheduleInput {
  subscriptionId?: string;
  horizonDays?: number;
}

function weekdayName(day: number) {
  return ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][day];
}

function preferredDayNumbers(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.map((day) => {
    if (typeof day === 'number') return day;
    return ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      .indexOf(String(day).toLowerCase());
  });
}

async function generateSubscriptionPickups(
  subscriptionId: string,
  actorUid: string,
  horizonDays = 28,
) {
  const subscriptionRef = db.collection('subscriptions').doc(subscriptionId);
  const subscriptionSnapshot = await subscriptionRef.get();
  if (!subscriptionSnapshot.exists) throw new HttpsError('not-found', 'Subscription not found.');
  const subscription = subscriptionSnapshot.data()!;

  const planSnapshot = await db.collection('plans').doc(subscription.planId).get();
  const frequency = Number(planSnapshot.data()?.pickupFrequency ?? subscription.pickupFrequency ?? 0);
  let preferredWeekdays: number[];
  try {
    preferredWeekdays = validatePreferredWeekdays(
      frequency,
      preferredDayNumbers(subscription.preferredDays),
    );
  } catch (error) {
    throw new HttpsError(
      'failed-precondition',
      error instanceof Error ? error.message : 'The subscription schedule is invalid.',
    );
  }
  const startDate = subscription.startDate?.toDate?.() ?? new Date(subscription.startDate);
  const dates = generateScheduleDates({
    pickupFrequency: frequency,
    preferredWeekdays,
    startDate,
    horizonDays,
  });

  const existing = await db.collection('pickups')
    .where('subscriptionId', '==', subscriptionId)
    .get();
  const existingIds = new Set(existing.docs.map((document) => document.id));
  const existingDateKeys = new Set(existing.docs
    .filter((document) => document.data().status !== 'cancelled')
    .map((document) => {
      const value = document.data().scheduledDate;
      const date = value?.toDate?.() ?? new Date(value);
      return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
    }));
  const batch = db.batch();
  let createdCount = 0;

  for (const date of dates) {
    const id = pickupDocumentId(subscriptionId, date);
    if (existingIds.has(id) || existingDateKeys.has(date.toISOString().slice(0, 10))) continue;
    batch.create(db.collection('pickups').doc(id), {
      customerId: subscription.customerId,
      collectorId: null,
      subscriptionId,
      addressId: subscription.addressId ?? null,
      serviceZoneId: subscription.serviceZoneId ?? null,
      serviceZoneName: subscription.serviceZoneName ?? '',
      neighborhood: subscription.neighborhood ?? '',
      planId: subscription.planId,
      planName: subscription.planName ?? planSnapshot.data()?.name ?? '',
      status: 'scheduled',
      scheduledDate: Timestamp.fromDate(date),
      addressText: subscription.addressText ?? '',
      locationDetails: subscription.locationDetails ?? '',
      contactName: subscription.contactName ?? '',
      contactPhone: subscription.contactPhone ?? '',
      notes: subscription.instructions ?? '',
      scheduleKey: id,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    createdCount += 1;
  }

  batch.set(subscriptionRef, {
    status: 'active',
    pickupFrequency: frequency,
    preferredDays: preferredWeekdays.map(weekdayName),
    scheduleGeneratedThrough: dates.length ? Timestamp.fromDate(dates[dates.length - 1]) : null,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  batch.set(db.collection('auditLogs').doc(), {
    action: 'subscription.schedule.generated',
    actorUid,
    subscriptionId,
    createdCount,
    horizonDays,
    createdAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();
  if (subscription.customerId) {
    await createNotification({
      userId: subscription.customerId,
      type: 'subscription_schedule',
      title: 'Subscription schedule ready',
      body: `CleanGo created ${createdCount} upcoming pickup${createdCount === 1 ? '' : 's'} for your plan.`,
      subscriptionId,
    });
  }
  return { createdCount, totalDates: dates.length, frequency };
}

export const generateSubscriptionSchedule = onCall<GenerateSubscriptionScheduleInput>(
  { region: 'europe-west1' },
  async (request) => {
    requireAdmin(request.auth);
    const subscriptionId = request.data.subscriptionId?.trim();
    const horizonDays = request.data.horizonDays ?? 28;
    if (!subscriptionId) throw new HttpsError('invalid-argument', 'subscriptionId is required.');
    if (!Number.isInteger(horizonDays) || horizonDays < 1 || horizonDays > 90) {
      throw new HttpsError('invalid-argument', 'horizonDays must be between 1 and 90.');
    }
    const result = await generateSubscriptionPickups(subscriptionId, request.auth!.uid, horizonDays);
    return { success: true, subscriptionId, ...result };
  },
);

interface ChangeSubscriptionPlanInput {
  subscriptionId?: string;
  planId?: string;
  preferredDays?: Array<string | number>;
  horizonDays?: number;
}

export const changeSubscriptionPlan = onCall<ChangeSubscriptionPlanInput>(
  { region: 'europe-west1' },
  async (request) => {
    requireAdmin(request.auth);
    const subscriptionId = request.data.subscriptionId?.trim();
    const planId = request.data.planId?.trim();
    if (!subscriptionId || !planId) {
      throw new HttpsError('invalid-argument', 'subscriptionId and planId are required.');
    }
    const planSnapshot = await db.collection('plans').doc(planId).get();
    if (!planSnapshot.exists || planSnapshot.data()?.active !== true) {
      throw new HttpsError('failed-precondition', 'The selected plan is missing or inactive.');
    }
    const frequency = Number(planSnapshot.data()?.pickupFrequency ?? 0);
    let weekdays: number[];
    try {
      weekdays = validatePreferredWeekdays(frequency, preferredDayNumbers(request.data.preferredDays));
    } catch (error) {
      throw new HttpsError('invalid-argument', error instanceof Error ? error.message : 'Invalid pickup days.');
    }

    const subscriptionRef = db.collection('subscriptions').doc(subscriptionId);
    const subscriptionSnapshot = await subscriptionRef.get();
    if (!subscriptionSnapshot.exists) throw new HttpsError('not-found', 'Subscription not found.');
    const subscription = subscriptionSnapshot.data()!;
    const startDate = subscription.startDate?.toDate?.() ?? new Date(subscription.startDate);
    const desiredDates = generateScheduleDates({
      pickupFrequency: frequency,
      preferredWeekdays: weekdays,
      startDate,
      horizonDays: request.data.horizonDays ?? 28,
    });
    const desiredDateKeys = new Set(desiredDates.map((date) => date.toISOString().slice(0, 10)));
    const existing = await db.collection('pickups').where('subscriptionId', '==', subscriptionId).get();
    const reconciliation = db.batch();
    for (const document of existing.docs) {
      const pickup = document.data();
      const scheduledDate = pickup.scheduledDate?.toDate?.() ?? new Date(pickup.scheduledDate);
      const key = Number.isNaN(scheduledDate.getTime()) ? '' : scheduledDate.toISOString().slice(0, 10);
      if (pickup.status === 'scheduled' && scheduledDate.getTime() > Date.now()) {
        if (desiredDateKeys.has(key)) {
          reconciliation.update(document.ref, {
            planId,
            planName: planSnapshot.data()?.name ?? '',
            updatedAt: FieldValue.serverTimestamp(),
          });
        } else {
          reconciliation.update(document.ref, {
            status: 'cancelled',
            cancellationReason: 'plan_changed',
            cancelledAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      }
    }
    reconciliation.set(subscriptionRef, {
      planId,
      planName: planSnapshot.data()?.name ?? '',
      pickupFrequency: frequency,
      preferredDays: weekdays.map(weekdayName),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    await reconciliation.commit();
    const result = await generateSubscriptionPickups(
      subscriptionId,
      request.auth!.uid,
      request.data.horizonDays ?? 28,
    );
    return { success: true, subscriptionId, planId, ...result };
  },
);

interface ReschedulePickupInput { pickupId?: string; scheduledDate?: string; }

export const reschedulePickup = onCall<ReschedulePickupInput>(
  { region: 'europe-west1' },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'You must be signed in.');
    const pickupId = request.data.pickupId?.trim();
    const scheduledDate = request.data.scheduledDate?.trim();
    if (!pickupId || !scheduledDate) {
      throw new HttpsError('invalid-argument', 'pickupId and scheduledDate are required.');
    }
    const nextDate = new Date(`${scheduledDate}T09:00:00.000Z`);
    if (Number.isNaN(nextDate.getTime()) || ![2, 4, 5, 6].includes(nextDate.getUTCDay())) {
      throw new HttpsError('invalid-argument', 'Choose Tuesday, Thursday, Friday, or Saturday.');
    }
    if (nextDate.getTime() <= Date.now()) {
      throw new HttpsError('invalid-argument', 'The new pickup date must be in the future.');
    }

    const pickupRef = db.collection('pickups').doc(pickupId);
    let customerId = '';
    let collectorId = '';
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(pickupRef);
      if (!snapshot.exists) throw new HttpsError('not-found', 'Pickup not found.');
      const pickup = snapshot.data()!;
      customerId = pickup.customerId ?? '';
      collectorId = pickup.collectorId ?? '';
      const admin = isAdmin(request.auth!.token);
      const owner = pickup.customerId === request.auth!.uid;
      const assignedCollector = isCollector(request.auth!.token) && pickup.collectorId === request.auth!.uid;
      if (!admin && !owner && !assignedCollector) {
        throw new HttpsError('permission-denied', 'You cannot reschedule this pickup.');
      }
      if (!admin && owner && !['scheduled', 'assigned', 'missed', 'rescheduled'].includes(pickup.status)) {
        throw new HttpsError('failed-precondition', 'This pickup can no longer be rescheduled by the customer.');
      }
      if (!admin && assignedCollector && !['assigned', 'en_route', 'arrived', 'missed', 'rescheduled'].includes(pickup.status)) {
        throw new HttpsError('failed-precondition', 'This pickup can no longer be rescheduled by the collector.');
      }
      if (['completed', 'cancelled'].includes(pickup.status)) {
        throw new HttpsError('failed-precondition', 'Completed or cancelled pickups cannot be rescheduled.');
      }
      const duplicateQuery = db.collection('pickups')
        .where('subscriptionId', '==', pickup.subscriptionId ?? null)
        .where('scheduledDate', '==', Timestamp.fromDate(nextDate))
        .limit(1);
      const duplicate = await transaction.get(duplicateQuery);
      if (!duplicate.empty && duplicate.docs[0].id !== pickupId) {
        throw new HttpsError('already-exists', 'A pickup already exists for this subscription and date.');
      }
      transaction.update(pickupRef, {
        status: 'rescheduled',
        scheduledDate: Timestamp.fromDate(nextDate),
        collectorId: assignedCollector ? request.auth!.uid : null,
        rescheduledAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.set(db.collection('auditLogs').doc(), {
        action: 'pickup.rescheduled',
        actorUid: request.auth!.uid,
        pickupId,
        scheduledDate: Timestamp.fromDate(nextDate),
        createdAt: FieldValue.serverTimestamp(),
      });
    });
    await Promise.all([
      createNotification({
        userId: customerId,
        type: 'pickup_rescheduled',
        title: 'Pickup rescheduled',
        body: `Your CleanGo pickup was rescheduled to ${scheduledDate}.`,
        pickupId,
      }),
      collectorId
        ? createNotification({
          userId: collectorId,
          type: 'pickup_rescheduled',
          title: 'Assigned pickup rescheduled',
          body: `A pickup assigned to you was rescheduled to ${scheduledDate}.`,
          pickupId,
        })
        : Promise.resolve(null),
    ]);
    return { success: true, pickupId, scheduledDate };
  },
);

interface CancelPickupInput { pickupId?: string; }

export const cancelPickup = onCall<CancelPickupInput>(
  { region: 'europe-west1' },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'You must be signed in.');
    const pickupId = request.data.pickupId?.trim();
    if (!pickupId) throw new HttpsError('invalid-argument', 'pickupId is required.');
    const pickupRef = db.collection('pickups').doc(pickupId);
    let customerId = '';
    let collectorId = '';
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(pickupRef);
      if (!snapshot.exists) throw new HttpsError('not-found', 'Pickup not found.');
      const pickup = snapshot.data()!;
      customerId = pickup.customerId ?? '';
      collectorId = pickup.collectorId ?? '';
      const admin = isAdmin(request.auth!.token);
      const owner = pickup.customerId === request.auth!.uid;
      if (!admin && !owner) throw new HttpsError('permission-denied', 'You cannot cancel this pickup.');
      if (!['scheduled', 'assigned', 'rescheduled'].includes(pickup.status)) {
        throw new HttpsError('failed-precondition', 'This pickup can no longer be cancelled.');
      }
      transaction.update(pickupRef, {
        status: 'cancelled',
        cancelledAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.set(db.collection('auditLogs').doc(), {
        action: 'pickup.cancelled',
        actorUid: request.auth!.uid,
        pickupId,
        createdAt: FieldValue.serverTimestamp(),
      });
    });
    await Promise.all([
      createNotification({
        userId: customerId,
        type: 'pickup_cancelled',
        title: 'Pickup cancelled',
        body: 'Your CleanGo pickup was cancelled.',
        pickupId,
      }),
      collectorId
        ? createNotification({
          userId: collectorId,
          type: 'pickup_cancelled',
          title: 'Assigned pickup cancelled',
          body: 'A pickup assigned to you was cancelled.',
          pickupId,
        })
        : Promise.resolve(null),
    ]);
    return { success: true, pickupId, status: 'cancelled' };
  },
);

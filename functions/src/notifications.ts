import { createHash } from 'node:crypto';
import { getMessaging } from 'firebase-admin/messaging';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';

const notificationTypes = [
  'collection_reminder_tomorrow',
  'collector_on_the_way',
  'collector_arrived',
  'collection_completed',
  'payment_received',
  'subscription_expiring_5_days',
] as const;

type NotificationType = (typeof notificationTypes)[number];

interface NotificationInput {
  customerId?: string;
  userId?: string;
  type: string;
  title: string;
  body: string;
  titleFr?: string;
  bodyFr?: string;
  collectionId?: string | null;
  pickupId?: string | null;
  bookingId?: string | null;
  paymentId?: string | null;
  subscriptionId?: string | null;
  collectorId?: string | null;
  dedupeKey?: string;
}

interface RegisterDeviceTokenInput {
  token?: string;
  platform?: string;
}

const legacyTypeAliases: Record<string, NotificationType> = {
  pickup_completed: 'collection_completed',
};

function canonicalNotificationType(value: string) {
  if (notificationTypes.includes(value as NotificationType)) {
    return value as NotificationType;
  }
  return legacyTypeAliases[value] ?? null;
}

function db() {
  return getFirestore();
}

function hash(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function nullable(value: unknown) {
  const text = String(value ?? '').trim();
  return text || null;
}

async function preferredLanguage(customerId: string) {
  const snapshot = await db().collection('customers').doc(customerId).get();
  return String(snapshot.data()?.preferredLanguage ?? 'en').toLowerCase();
}

export async function createNotification(input: NotificationInput) {
  const customerId = nullable(input.customerId ?? input.userId);
  if (!customerId) return null;
  const type = canonicalNotificationType(input.type);
  if (!type) return null;

  const notificationId = input.dedupeKey
    ? hash(`${customerId}:${type}:${input.dedupeKey}`)
    : db().collection('notifications').doc().id;
  const notificationRef = db().collection('notifications').doc(notificationId);
  const language = await preferredLanguage(customerId);
  const title = language === 'fr' && input.titleFr ? input.titleFr : input.title;
  const body = language === 'fr' && input.bodyFr ? input.bodyFr : input.body;
  const collectionId = nullable(input.collectionId ?? input.pickupId);

  const created = await db().runTransaction(async (transaction) => {
    const existing = await transaction.get(notificationRef);
    if (existing.exists) return false;
    transaction.create(notificationRef, {
      notificationId,
      customerId,
      type,
      title,
      body,
      collectionId,
      bookingId: nullable(input.bookingId) ?? collectionId,
      subscriptionId: nullable(input.subscriptionId),
      paymentId: nullable(input.paymentId),
      collectorId: nullable(input.collectorId),
      createdAt: FieldValue.serverTimestamp(),
      read: false,
      readAt: null,
      deliveryStatus: 'pending',
      dataVersion: 1,
    });
    return true;
  });
  if (!created) return notificationId;

  const deliveryStatus = await sendPushIfAvailable(customerId, title, body, {
    notificationId,
    type,
    collectionId: collectionId ?? '',
    bookingId: nullable(input.bookingId) ?? collectionId ?? '',
    paymentId: nullable(input.paymentId) ?? '',
    subscriptionId: nullable(input.subscriptionId) ?? '',
    collectorId: nullable(input.collectorId) ?? '',
    dataVersion: '1',
  });
  await notificationRef.update({
    deliveryStatus,
    deliveryUpdatedAt: FieldValue.serverTimestamp(),
  });
  return notificationId;
}

async function sendPushIfAvailable(
  customerId: string,
  title: string,
  body: string,
  data: Record<string, string>,
) {
  const tokens = await db().collection('deviceTokens')
    .where('customerId', '==', customerId)
    .where('active', '==', true)
    .limit(50)
    .get();
  if (tokens.empty) return 'no_registered_device';

  let delivered = 0;
  let failed = 0;
  await Promise.all(tokens.docs.map(async (document) => {
    const token = nullable(document.data().token);
    if (!token) {
      await document.ref.delete();
      failed += 1;
      return;
    }
    try {
      await getMessaging().send({
        token,
        notification: { title, body },
        data,
        android: {
          priority: 'high',
          notification: {
            channelId: 'cleango_updates',
            icon: 'ic_stat_cleango',
          },
        },
        apns: {
          payload: { aps: { sound: 'default' } },
        },
      });
      delivered += 1;
      await document.ref.update({
        lastUsedAt: FieldValue.serverTimestamp(),
        lastErrorCode: null,
      });
    } catch (error) {
      failed += 1;
      const code = String(
        (error as { code?: unknown })?.code ?? 'messaging/unknown-error',
      );
      if ([
        'messaging/registration-token-not-registered',
        'messaging/invalid-registration-token',
        'messaging/invalid-argument',
      ].includes(code)) {
        await document.ref.delete();
      } else {
        await document.ref.update({
          lastErrorCode: code,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }
  }));

  if (delivered > 0 && failed === 0) return 'delivered';
  if (delivered > 0) return 'partially_delivered';
  return 'delivery_failed';
}

export const registerDeviceToken = onCall<RegisterDeviceTokenInput>(
  { region: 'europe-west1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'You must be signed in.');
    }
    const token = request.data.token?.trim();
    const platform = request.data.platform?.trim().toLowerCase() || 'android';
    if (!token || token.length < 20) {
      throw new HttpsError('invalid-argument', 'A valid device token is required.');
    }
    if (!['android', 'ios'].includes(platform)) {
      throw new HttpsError('invalid-argument', 'Unsupported device platform.');
    }

    const reference = db().collection('deviceTokens').doc(hash(token));
    await db().runTransaction(async (transaction) => {
      const existing = await transaction.get(reference);
      transaction.set(reference, {
        customerId: request.auth!.uid,
        token,
        platform,
        active: true,
        createdAt: existing.data()?.createdAt ?? FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        lastUsedAt: FieldValue.serverTimestamp(),
        lastErrorCode: null,
        metadataVersion: 1,
      }, { merge: true });
    });
    return { success: true };
  },
);

export const unregisterDeviceToken = onCall<RegisterDeviceTokenInput>(
  { region: 'europe-west1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'You must be signed in.');
    }
    const token = request.data.token?.trim();
    if (!token || token.length < 20) {
      throw new HttpsError('invalid-argument', 'A valid device token is required.');
    }
    const reference = db().collection('deviceTokens').doc(hash(token));
    const snapshot = await reference.get();
    if (!snapshot.exists) return { success: true };
    if (snapshot.data()?.customerId !== request.auth.uid) {
      throw new HttpsError('permission-denied', 'This device token is not owned by the user.');
    }
    await reference.delete();
    return { success: true };
  },
);

function serviceDayBounds(daysFromToday: number) {
  const offsetMs = 60 * 60 * 1000;
  const serviceNow = new Date(Date.now() + offsetMs);
  const startServiceUtc = Date.UTC(
    serviceNow.getUTCFullYear(),
    serviceNow.getUTCMonth(),
    serviceNow.getUTCDate() + daysFromToday,
  );
  return {
    start: new Date(startServiceUtc - offsetMs),
    end: new Date(startServiceUtc + 24 * 60 * 60 * 1000 - offsetMs),
  };
}

export const sendPickupReminders = onSchedule(
  {
    region: 'europe-west1',
    schedule: 'every day 18:00',
    timeZone: 'Africa/Douala',
  },
  async () => {
    const tomorrow = serviceDayBounds(1);
    const collections = await db().collection('collections')
      .where('scheduledDate', '>=', Timestamp.fromDate(tomorrow.start))
      .where('scheduledDate', '<', Timestamp.fromDate(tomorrow.end))
      .where('status', 'in', ['confirmed', 'assigned'])
      .get();

    let sent = 0;
    for (const document of collections.docs) {
      const collection = document.data();
      if (!collection.customerId) continue;
      await createNotification({
        customerId: collection.customerId,
        type: 'collection_reminder_tomorrow',
        title: 'Tomorrow we are coming',
        body: 'We will come tomorrow for your collection.',
        titleFr: 'Nous passerons demain',
        bodyFr: 'Nous passerons demain pour votre collecte.',
        collectionId: document.id,
        bookingId: document.id,
        subscriptionId: nullable(collection.subscriptionId),
        collectorId: nullable(collection.assignedWorkerId),
        dedupeKey: `${document.id}:tomorrow`,
      });
      await document.ref.set({
        reminderSentAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      sent += 1;
    }

    await db().collection('auditLogs').add({
      action: 'notifications.collection_reminders.sent',
      sent,
      createdAt: FieldValue.serverTimestamp(),
    });
  },
);

export const sendSubscriptionExpiryReminders = onSchedule(
  {
    region: 'europe-west1',
    schedule: 'every day 09:00',
    timeZone: 'Africa/Douala',
  },
  async () => {
    const expiryDay = serviceDayBounds(5);
    const subscriptions = await db().collection('subscriptions')
      .where('endDate', '>=', Timestamp.fromDate(expiryDay.start))
      .where('endDate', '<', Timestamp.fromDate(expiryDay.end))
      .where('status', '==', 'active')
      .get();

    let sent = 0;
    for (const document of subscriptions.docs) {
      const subscription = document.data();
      if (!subscription.customerId) continue;
      await createNotification({
        customerId: subscription.customerId,
        type: 'subscription_expiring_5_days',
        title: 'Subscription expires in 5 days',
        body: 'Your subscription expires in 5 days.',
        titleFr: 'Abonnement bientot expire',
        bodyFr: 'Votre abonnement expire dans 5 jours.',
        subscriptionId: document.id,
        dedupeKey: `${document.id}:expires:${expiryDay.start.toISOString().slice(0, 10)}`,
      });
      await document.ref.set({
        expiryReminderSentAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      sent += 1;
    }

    await db().collection('auditLogs').add({
      action: 'notifications.subscription_expiry.sent',
      sent,
      createdAt: FieldValue.serverTimestamp(),
    });
  },
);

export const onCollectionStatusNotification = onDocumentUpdated(
  {
    region: 'europe-west1',
    document: 'collections/{collectionId}',
  },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after || before.status === after.status) return;

    const messages: Partial<Record<NotificationType, {
      title: string;
      body: string;
      titleFr: string;
      bodyFr: string;
    }>> = {
      collector_on_the_way: {
        title: 'We are on the way',
        body: 'Your collector is on the way.',
        titleFr: 'Votre collecteur est en route',
        bodyFr: 'Votre collecteur est en route.',
      },
      collector_arrived: {
        title: 'Collector has arrived',
        body: 'Your collector has arrived.',
        titleFr: 'Votre collecteur est arrive',
        bodyFr: 'Votre collecteur est arrive.',
      },
      collection_completed: {
        title: 'Waste collected',
        body: 'Your waste has been collected.',
        titleFr: 'Dechets collectes',
        bodyFr: 'Vos dechets ont ete collectes.',
      },
    };
    const statusTypes: Record<string, NotificationType | undefined> = {
      onTheWay: 'collector_on_the_way',
      arrived: 'collector_arrived',
      completed: 'collection_completed',
    };
    const type = statusTypes[String(after.status)];
    if (!type || !messages[type] || !after.customerId) return;
    const message = messages[type]!;

    await createNotification({
      customerId: after.customerId,
      type,
      ...message,
      collectionId: event.params.collectionId,
      bookingId: event.params.collectionId,
      subscriptionId: nullable(after.subscriptionId),
      collectorId: nullable(after.assignedWorkerId),
      dedupeKey: `${event.params.collectionId}:${type}`,
    });
  },
);

export const onPaymentReceivedNotification = onDocumentUpdated(
  {
    region: 'europe-west1',
    document: 'payments/{paymentId}',
  },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    const beforeStatus = before?.paymentStatus ?? before?.status;
    const afterStatus = after?.paymentStatus ?? after?.status;
    if (!after || beforeStatus === 'paid' || afterStatus !== 'paid') return;
    if (!after.customerId) return;

    await createNotification({
      customerId: after.customerId,
      type: 'payment_received',
      title: 'Payment received',
      body: 'Your payment has been received.',
      titleFr: 'Paiement recu',
      bodyFr: 'Votre paiement a ete recu.',
      collectionId: nullable(after.bookingId ?? after.pickupId),
      bookingId: nullable(after.bookingId ?? after.pickupId),
      paymentId: event.params.paymentId,
      subscriptionId: nullable(after.subscriptionId),
      dedupeKey: `${event.params.paymentId}:paid`,
    });
  },
);

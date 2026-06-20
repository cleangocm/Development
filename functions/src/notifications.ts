import { getMessaging } from 'firebase-admin/messaging';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';

interface NotificationInput {
  userId: string;
  type: string;
  title: string;
  body: string;
  pickupId?: string | null;
  paymentId?: string | null;
  subscriptionId?: string | null;
}

interface RegisterDeviceTokenInput {
  token?: string;
  platform?: string;
}

function db() {
  return getFirestore();
}

export async function createNotification(input: NotificationInput) {
  if (!input.userId) return null;
  const notificationRef = db().collection('notifications').doc();
  await notificationRef.set({
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    pickupId: input.pickupId ?? null,
    paymentId: input.paymentId ?? null,
    subscriptionId: input.subscriptionId ?? null,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });
  await sendPushIfAvailable(input.userId, input.title, input.body, {
    type: input.type,
    notificationId: notificationRef.id,
    pickupId: input.pickupId ?? '',
    paymentId: input.paymentId ?? '',
    subscriptionId: input.subscriptionId ?? '',
  });
  return notificationRef.id;
}

async function sendPushIfAvailable(
  userId: string,
  title: string,
  body: string,
  data: Record<string, string>,
) {
  const tokens = await db().collection('deviceTokens')
    .where('userId', '==', userId)
    .where('active', '==', true)
    .limit(20)
    .get();
  if (tokens.empty) return;

  const messaging = getMessaging();
  await Promise.all(tokens.docs.map(async (document) => {
    try {
      await messaging.send({
        token: document.id,
        notification: { title, body },
        data,
      });
    } catch (error) {
      await document.ref.set({
        active: false,
        lastError: error instanceof Error ? error.message : String(error),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }
  }));
}

export const registerDeviceToken = onCall<RegisterDeviceTokenInput>(
  { region: 'europe-west1' },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'You must be signed in.');
    const token = request.data.token?.trim();
    if (!token || token.length < 20) throw new HttpsError('invalid-argument', 'A valid device token is required.');
    await db().collection('deviceTokens').doc(token).set({
      userId: request.auth.uid,
      platform: request.data.platform?.trim() || 'web',
      active: true,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    return { success: true };
  },
);

export const sendPickupReminders = onSchedule(
  { region: 'europe-west1', schedule: 'every day 18:00', timeZone: 'Africa/Douala' },
  async () => {
    const now = new Date();
    const tomorrowStart = new Date(now);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    tomorrowStart.setHours(0, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setHours(23, 59, 59, 999);

    const pickups = await db().collection('pickups')
      .where('scheduledDate', '>=', Timestamp.fromDate(tomorrowStart))
      .where('scheduledDate', '<=', Timestamp.fromDate(tomorrowEnd))
      .where('status', 'in', ['scheduled', 'assigned', 'rescheduled'])
      .get();

    let sent = 0;
    for (const document of pickups.docs) {
      const pickup = document.data();
      const reminderKey = `${document.id}:${tomorrowStart.toISOString().slice(0, 10)}`;
      const reminderRef = db().collection('notificationDedupe').doc(reminderKey);
      const dedupe = await reminderRef.get();
      if (dedupe.exists) continue;
      await createNotification({
        userId: pickup.customerId,
        type: 'pickup_reminder',
        title: 'Upcoming CleanGo pickup',
        body: `Your pickup is scheduled for tomorrow at ${pickup.addressText || pickup.neighborhood || 'your address'}.`,
        pickupId: document.id,
        subscriptionId: pickup.subscriptionId ?? null,
      });
      if (pickup.collectorId) {
        await createNotification({
          userId: pickup.collectorId,
          type: 'collector_reminder',
          title: 'Pickup assigned for tomorrow',
          body: `You have a CleanGo pickup scheduled tomorrow in ${pickup.neighborhood || 'your zone'}.`,
          pickupId: document.id,
        });
      }
      await reminderRef.set({ createdAt: FieldValue.serverTimestamp() });
      sent += 1;
    }
    await db().collection('auditLogs').add({
      action: 'notifications.pickup_reminders.sent',
      sent,
      createdAt: FieldValue.serverTimestamp(),
    });
  },
);

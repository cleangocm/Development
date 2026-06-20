import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { HttpsError, onCall, onRequest } from 'firebase-functions/v2/https';
import { createNotification } from './notifications.js';

const providers = ['mtn_momo', 'orange_money', 'cash', 'manual'] as const;
export type PaymentProvider = (typeof providers)[number];
const terminalStatuses = ['paid', 'cancelled', 'refunded'] as const;

function isAdmin(token: Record<string, unknown>) {
  return token.admin === true || token.role === 'admin';
}

function assertProvider(value: unknown): PaymentProvider {
  if (typeof value !== 'string' || !providers.includes(value as PaymentProvider)) {
    throw new HttpsError('invalid-argument', 'Choose a supported payment provider.');
  }
  return value as PaymentProvider;
}

export function normalizeProviderStatus(status: unknown) {
  const value = String(status ?? '').toLowerCase();
  if (['paid', 'success', 'successful', 'completed', 'succeeded'].includes(value)) return 'paid';
  if (['failed', 'failure', 'declined', 'expired'].includes(value)) return 'failed';
  if (['cancelled', 'canceled'].includes(value)) return 'cancelled';
  return 'pending';
}

function paymentReference(provider: PaymentProvider, paymentId: string) {
  return `${provider}:${paymentId}:${Date.now()}`;
}

function firestore() {
  return getFirestore();
}

interface InitiatePaymentInput {
  paymentId?: string;
  provider?: string;
  phoneNumber?: string;
}

export const initiatePayment = onCall<InitiatePaymentInput>(
  { region: 'europe-west1' },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'You must be signed in.');
    const paymentId = request.data.paymentId?.trim();
    const provider = assertProvider(request.data.provider);
    const phoneNumber = request.data.phoneNumber?.trim() || '';
    if (!paymentId) throw new HttpsError('invalid-argument', 'paymentId is required.');
    if (['mtn_momo', 'orange_money'].includes(provider) && !phoneNumber) {
      throw new HttpsError('invalid-argument', 'A mobile money phone number is required.');
    }

    const db = firestore();
    const paymentRef = db.collection('payments').doc(paymentId);
    const snapshot = await paymentRef.get();
    if (!snapshot.exists) throw new HttpsError('not-found', 'Payment not found.');
    const payment = snapshot.data()!;
    const admin = isAdmin(request.auth.token);
    if (!admin && payment.customerId !== request.auth.uid) {
      throw new HttpsError('permission-denied', 'You cannot initiate this payment.');
    }
    if (payment.status === 'paid') {
      return { success: true, paymentId, status: 'paid', alreadyPaid: true };
    }
    if (terminalStatuses.includes(payment.status)) {
      throw new HttpsError('failed-precondition', 'This payment can no longer be initiated.');
    }

    const providerReference = payment.providerReference || paymentReference(provider, paymentId);
    const instructions = provider === 'mtn_momo'
      ? 'MTN Mobile Money request recorded. Await provider callback or admin verification.'
      : provider === 'orange_money'
        ? 'Orange Money request recorded. Await provider callback or admin verification.'
        : 'Cash/manual payment recorded. Admin must verify before it becomes paid.';

    await paymentRef.set({
      provider,
      providerReference,
      phoneNumber,
      status: 'pending',
      initiationStatus: ['mtn_momo', 'orange_money'].includes(provider)
        ? 'awaiting_provider_credentials'
        : 'manual_verification_required',
      instructions,
      initiatedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    await db.collection('auditLogs').add({
      action: 'payment.initiated',
      actorUid: request.auth.uid,
      paymentId,
      provider,
      providerReference,
      createdAt: FieldValue.serverTimestamp(),
    });
    await createNotification({
      userId: payment.customerId,
      type: 'payment_initiated',
      title: 'Payment pending',
      body: instructions,
      pickupId: payment.pickupId ?? null,
      paymentId,
      subscriptionId: payment.subscriptionId ?? null,
    });

    return { success: true, paymentId, provider, providerReference, status: 'pending', instructions };
  },
);

interface VerifyPaymentInput {
  paymentId?: string;
  status?: string;
  note?: string;
  transactionId?: string;
}

export const verifyPaymentManually = onCall<VerifyPaymentInput>(
  { region: 'europe-west1' },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'You must be signed in.');
    if (!isAdmin(request.auth.token)) throw new HttpsError('permission-denied', 'Only admins can verify payments.');
    const paymentId = request.data.paymentId?.trim();
    const nextStatus = normalizeProviderStatus(request.data.status);
    if (!paymentId || !['paid', 'failed', 'cancelled'].includes(nextStatus)) {
      throw new HttpsError('invalid-argument', 'paymentId and a final status are required.');
    }

    const db = firestore();
    const paymentRef = db.collection('payments').doc(paymentId);
    let customerId = '';
    let pickupId: string | null = null;
    let subscriptionId: string | null = null;
    const result = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(paymentRef);
      if (!snapshot.exists) throw new HttpsError('not-found', 'Payment not found.');
      const payment = snapshot.data()!;
      customerId = payment.customerId ?? '';
      pickupId = payment.pickupId ?? null;
      subscriptionId = payment.subscriptionId ?? null;
      if (payment.status === 'paid') return { alreadyProcessed: true, status: 'paid' };
      if (['cancelled', 'refunded'].includes(payment.status)) {
        throw new HttpsError('failed-precondition', 'This payment is already closed.');
      }
      const updates: Record<string, unknown> = {
        status: nextStatus,
        manualVerificationNote: request.data.note?.trim() || '',
        providerTransactionId: request.data.transactionId?.trim() || payment.providerTransactionId || null,
        verifiedBy: request.auth!.uid,
        verifiedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (nextStatus === 'paid') updates.paidAt = FieldValue.serverTimestamp();
      transaction.update(paymentRef, updates);
      transaction.set(db.collection('auditLogs').doc(), {
        action: 'payment.manually_verified',
        actorUid: request.auth!.uid,
        paymentId,
        previousStatus: payment.status,
        newStatus: nextStatus,
        createdAt: FieldValue.serverTimestamp(),
      });
      return { alreadyProcessed: false, status: nextStatus };
    });
    if (!result.alreadyProcessed) {
      await createNotification({
        userId: customerId,
        type: 'payment_status',
        title: `Payment ${result.status}`,
        body: `Your CleanGo payment was marked ${result.status}.`,
        pickupId,
        paymentId,
        subscriptionId,
      });
    }
    return { success: true, paymentId, ...result };
  },
);

export const paymentProviderCallback = onRequest(
  { region: 'europe-west1', cors: false },
  async (request, response) => {
    if (request.method !== 'POST') {
      response.status(405).json({ error: 'method_not_allowed' });
      return;
    }
    const expectedSecret = process.env.PAYMENT_CALLBACK_SECRET;
    if (!expectedSecret) {
      response.status(503).json({ error: 'callback_secret_not_configured' });
      return;
    }
    if (request.header('x-cleango-payment-secret') !== expectedSecret) {
      response.status(401).json({ error: 'unauthorized' });
      return;
    }

    const provider = request.body?.provider;
    const providerReference = String(request.body?.providerReference ?? '').trim();
    const providerStatus = normalizeProviderStatus(request.body?.status);
    const transactionId = String(request.body?.transactionId ?? '').trim();
    const amountXaf = Number(request.body?.amountXaf ?? 0);
    if (!providers.includes(provider) || !providerReference) {
      response.status(400).json({ error: 'invalid_payload' });
      return;
    }

    const db = firestore();
    const query = await db.collection('payments')
      .where('providerReference', '==', providerReference)
      .limit(1)
      .get();
    if (query.empty) {
      response.status(404).json({ error: 'payment_not_found' });
      return;
    }

    const paymentRef = query.docs[0].ref;
    let customerId = '';
    let pickupId: string | null = null;
    let subscriptionId: string | null = null;
    const result = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(paymentRef);
      const payment = snapshot.data()!;
      customerId = payment.customerId ?? '';
      pickupId = payment.pickupId ?? null;
      subscriptionId = payment.subscriptionId ?? null;
      if (payment.status === 'paid') return { alreadyProcessed: true, status: 'paid' };
      if (amountXaf > 0 && Number(payment.amountXaf ?? 0) > 0 && amountXaf !== Number(payment.amountXaf)) {
        transaction.set(db.collection('auditLogs').doc(), {
          action: 'payment.callback.amount_mismatch',
          paymentId: snapshot.id,
          provider,
          providerReference,
          expectedAmountXaf: payment.amountXaf,
          receivedAmountXaf: amountXaf,
          createdAt: FieldValue.serverTimestamp(),
        });
        return { alreadyProcessed: false, status: payment.status, rejected: 'amount_mismatch' };
      }

      const updates: Record<string, unknown> = {
        status: providerStatus,
        providerStatus,
        providerTransactionId: transactionId || payment.providerTransactionId || null,
        callbackReceivedAt: Timestamp.now(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (providerStatus === 'paid') updates.paidAt = FieldValue.serverTimestamp();
      transaction.update(paymentRef, updates);
      transaction.set(db.collection('auditLogs').doc(), {
        action: 'payment.callback_verified',
        paymentId: snapshot.id,
        provider,
        providerReference,
        previousStatus: payment.status,
        newStatus: providerStatus,
        createdAt: FieldValue.serverTimestamp(),
      });
      return { alreadyProcessed: false, status: providerStatus };
    });
    if (!result.alreadyProcessed && !result.rejected) {
      await createNotification({
        userId: customerId,
        type: 'payment_status',
        title: `Payment ${result.status}`,
        body: `Your CleanGo payment provider returned ${result.status}.`,
        pickupId,
        paymentId: paymentRef.id,
        subscriptionId,
      });
    }

    response.status(200).json({ success: true, paymentId: paymentRef.id, ...result });
  },
);

import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall, onRequest } from 'firebase-functions/v2/https';

const paymentMethods = ['mtn_mobile_money', 'orange_money', 'cash'] as const;
type PaymentMethod = (typeof paymentMethods)[number];
const manualStatuses = ['paid', 'failed', 'cancelled'] as const;
type ManualPaymentStatus = (typeof manualStatuses)[number];

function firestore() {
  return getFirestore();
}

function isAdmin(token: Record<string, unknown>) {
  return token.admin === true || token.role === 'admin';
}

function assertPaymentMethod(value: unknown): PaymentMethod {
  if (typeof value !== 'string' || !paymentMethods.includes(value as PaymentMethod)) {
    throw new HttpsError('invalid-argument', 'Choose a supported CLEANGO payment method.');
  }
  return value as PaymentMethod;
}

function assertManualStatus(value: unknown): ManualPaymentStatus {
  if (typeof value !== 'string' || !manualStatuses.includes(value as ManualPaymentStatus)) {
    throw new HttpsError('invalid-argument', 'Choose paid, failed, or cancelled.');
  }
  return value as ManualPaymentStatus;
}

interface InitiatePaymentInput {
  paymentId?: string;
  provider?: string;
  paymentMethod?: string;
}

export const initiatePayment = onCall<InitiatePaymentInput>(
  { region: 'europe-west1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'You must be signed in.');
    }
    const paymentId = request.data.paymentId?.trim();
    const method = assertPaymentMethod(
      request.data.paymentMethod ?? request.data.provider,
    );
    if (!paymentId) {
      throw new HttpsError('invalid-argument', 'paymentId is required.');
    }
    if (method !== 'cash') {
      throw new HttpsError(
        'failed-precondition',
        'This mobile money integration is not configured. No payment was initiated.',
        { reason: 'integration_not_configured', paymentMethod: method },
      );
    }

    const snapshot = await firestore().collection('payments').doc(paymentId).get();
    if (!snapshot.exists) {
      throw new HttpsError('not-found', 'Payment not found.');
    }
    const payment = snapshot.data()!;
    if (!isAdmin(request.auth.token) && payment.customerId !== request.auth.uid) {
      throw new HttpsError('permission-denied', 'You cannot access this payment.');
    }
    if (payment.paymentMethod !== 'cash') {
      throw new HttpsError('failed-precondition', 'This is not a cash payment.');
    }
    const status = String(payment.paymentStatus ?? '');
    if (!['awaitingCashConfirmation', 'paid'].includes(status)) {
      throw new HttpsError('failed-precondition', 'This cash payment is no longer active.');
    }

    return {
      success: true,
      paymentId,
      paymentMethod: 'cash',
      paymentStatus: status,
      requiresAuthorizedConfirmation: status !== 'paid',
    };
  },
);

interface VerifyPaymentInput {
  paymentId?: string;
  status?: string;
  note?: string;
}

export const verifyPaymentManually = onCall<VerifyPaymentInput>(
  { region: 'europe-west1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'You must be signed in.');
    }
    if (!isAdmin(request.auth.token)) {
      throw new HttpsError('permission-denied', 'Only admins can verify cash payments.');
    }
    const paymentId = request.data.paymentId?.trim();
    const nextStatus = assertManualStatus(request.data.status);
    if (!paymentId) {
      throw new HttpsError('invalid-argument', 'paymentId is required.');
    }

    const db = firestore();
    const paymentRef = db.collection('payments').doc(paymentId);
    const result = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(paymentRef);
      if (!snapshot.exists) {
        throw new HttpsError('not-found', 'Payment not found.');
      }
      const payment = snapshot.data()!;
      const currentStatus = String(payment.paymentStatus ?? '');
      if (payment.paymentMethod !== 'cash') {
        throw new HttpsError(
          'failed-precondition',
          'Only cash payments can be manually verified.',
        );
      }
      if (currentStatus === 'paid') {
        return { alreadyProcessed: true, paymentStatus: 'paid' };
      }
      if (currentStatus !== 'awaitingCashConfirmation') {
        throw new HttpsError(
          'failed-precondition',
          'Only cash awaiting confirmation can be verified.',
        );
      }

      const now = FieldValue.serverTimestamp();
      const update: Record<string, unknown> = {
        paymentStatus: nextStatus,
        updatedAt: now,
        confirmedBy: request.auth!.uid,
        confirmationSource: 'adminCashVerification',
        manualVerificationNote: request.data.note?.trim() || null,
      };
      if (nextStatus === 'paid') {
        update.confirmedAt = now;
        update.failedAt = null;
        update.cancelledAt = null;
        update.failureCode = null;
        update.failureMessageSafe = null;
      } else if (nextStatus === 'failed') {
        update.failedAt = now;
        update.failureCode = 'cash_not_received';
        update.failureMessageSafe = 'Cash payment was not confirmed.';
      } else {
        update.cancelledAt = now;
      }
      transaction.update(paymentRef, update);

      const bookingId = String(payment.bookingId ?? '').trim();
      if (nextStatus === 'paid' && bookingId) {
        transaction.set(db.collection('collections').doc(bookingId), {
          paymentId,
          paymentStatus: 'paid',
          paymentConfirmedAt: now,
          updatedAt: now,
        }, { merge: true });
      }
      const subscriptionId = String(payment.subscriptionId ?? '').trim();
      if (nextStatus === 'paid' && subscriptionId) {
        transaction.set(db.collection('subscriptions').doc(subscriptionId), {
          paymentId,
          paymentStatus: 'paid',
          paymentConfirmedAt: now,
          updatedAt: now,
        }, { merge: true });
      }

      transaction.set(db.collection('auditLogs').doc(), {
        action: 'payment.cash.verified',
        actorUid: request.auth!.uid,
        paymentId,
        previousStatus: currentStatus,
        newStatus: nextStatus,
        createdAt: now,
      });
      return { alreadyProcessed: false, paymentStatus: nextStatus };
    });

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
    response.status(503).json({
      error: 'integration_not_configured',
      message: 'Mobile money callbacks are disabled until a verified provider adapter is configured.',
    });
  },
);

import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase';
import type { PaymentProvider, PaymentStatus, PickupStatus } from '@/types/cleango';

const functions = getFunctions(app, 'europe-west1');

export async function assignPickup(pickupId: string, collectorId: string) {
  const callable = httpsCallable(functions, 'assignPickup');
  return callable({ pickupId, collectorId });
}

export async function updatePickupWorkflow(
  pickupId: string,
  status: PickupStatus,
  notes?: string,
  proofPath?: string,
) {
  const callable = httpsCallable(functions, 'updatePickupStatus');
  return callable({ pickupId, status, notes, proofPath });
}

export async function generateSubscriptionSchedule(subscriptionId: string, horizonDays = 28) {
  const callable = httpsCallable(functions, 'generateSubscriptionSchedule');
  return callable({ subscriptionId, horizonDays });
}

export async function changeSubscriptionPlan(
  subscriptionId: string,
  planId: string,
  preferredDays: string[],
  horizonDays = 28,
) {
  const callable = httpsCallable(functions, 'changeSubscriptionPlan');
  return callable({ subscriptionId, planId, preferredDays, horizonDays });
}

export async function reschedulePickup(pickupId: string, scheduledDate: string) {
  const callable = httpsCallable(functions, 'reschedulePickup');
  return callable({ pickupId, scheduledDate });
}

export async function cancelPickup(pickupId: string) {
  const callable = httpsCallable(functions, 'cancelPickup');
  return callable({ pickupId });
}

export async function initiatePayment(
  paymentId: string,
  provider: PaymentProvider,
  phoneNumber?: string,
) {
  const callable = httpsCallable(functions, 'initiatePayment');
  return callable({ paymentId, provider, phoneNumber });
}

export async function verifyPaymentManually(
  paymentId: string,
  status: Extract<PaymentStatus, 'paid' | 'failed' | 'cancelled'>,
  note?: string,
  transactionId?: string,
) {
  const callable = httpsCallable(functions, 'verifyPaymentManually');
  return callable({ paymentId, status, note, transactionId });
}

export async function registerDeviceToken(token: string, platform = 'web') {
  const callable = httpsCallable(functions, 'registerDeviceToken');
  return callable({ token, platform });
}

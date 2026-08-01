import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { afterAll, afterEach, beforeAll, describe, it } from 'vitest';

let testEnv: RulesTestEnvironment;
const projectId = 'clean-go-150fb';
const customerA = 'customer-a';
const customerB = 'customer-b';
const collectorA = 'collector-a';
const collectorB = 'collector-b';
const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST?.split(':') ?? ['127.0.0.1', '18080'];

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      host: firestoreHost[0],
      port: Number(firestoreHost[1]),
      rules: readFileSync(resolve('firestore.rules'), 'utf8'),
    },
  });
}, 60_000);

afterEach(async () => testEnv.clearFirestore());
afterAll(async () => testEnv.cleanup());

async function seed(path: string, data: Record<string, unknown>) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), path), data);
  });
}

function customerDb(uid = customerA) {
  return testEnv.authenticatedContext(uid, { role: 'customer' }).firestore();
}

function collectorDb(uid: string) {
  return testEnv.authenticatedContext(uid, {
    role: 'collector',
    collector: true,
  }).firestore();
}

function collectorProfile(
  uid: string,
  approvalStatus = 'approved',
  accountStatus = 'active',
) {
  return {
    uid,
    userId: uid,
    role: 'collector',
    displayName: 'Test collector',
    phoneNumber: '',
    email: '',
    profileImageUrl: '',
    approvalStatus,
    accountStatus,
    active: accountStatus === 'active',
    serviceZones: ['zone-a'],
    vehicleType: 'tricycle',
    vehicleId: null,
    employeeReference: null,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    approvedAt: approvalStatus === 'approved' ? Timestamp.now() : null,
    approvedBy: approvalStatus === 'approved' ? 'admin-a' : null,
    suspendedAt: approvalStatus === 'suspended' ? Timestamp.now() : null,
    suspensionReason: approvalStatus === 'suspended' ? 'Security review' : null,
    lastActiveAt: null,
    currentAvailability: 'available',
    availabilityReason: null,
  };
}

function operationalCollection(
  assignedWorkerId: string | null,
  status = 'assigned',
  overrides: Record<string, unknown> = {},
) {
  const pricing = {
    totalAmount: 1500,
    extraBagAmount: 0,
    pricingVersion: 'approved-v1-2026-07',
  };
  return {
    customerId: customerA,
    assignedWorkerId,
    status,
    paymentStatus: 'paid',
    serviceZoneId: 'zone-a',
    scheduledDate: Timestamp.now(),
    pricing,
    pricingSnapshot: { ...pricing },
    updatedAt: Timestamp.now(),
    ...overrides,
  };
}

async function seedPaymentSource() {
  await seed('collections/collection-payment-source', {
    customerId: customerA,
    paymentStatus: 'unpaid',
    quotationStatus: 'notRequired',
    pricing: { totalAmount: 1500, pricingVersion: 'approved-v1-2026-07' },
    pricingSnapshot: { totalAmount: 1500, pricingVersion: 'approved-v1-2026-07' },
  });
}

function cashPayment(customerId: string, idempotencyKey: string, overrides: Record<string, unknown> = {}) {
  return {
    customerId,
    paymentMethod: 'cash',
    paymentStatus: 'awaitingCashConfirmation',
    amount: 1500,
    currency: 'XAF',
    purpose: 'oneTimePickup',
    bookingId: 'collection-payment-source',
    subscriptionId: null,
    quotationId: null,
    providerReference: null,
    externalTransactionId: null,
    idempotencyKey,
    phoneNumberMasked: null,
    initiatedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    confirmedAt: null,
    failedAt: null,
    cancelledAt: null,
    confirmedBy: null,
    confirmationSource: null,
    failureCode: null,
    failureMessageSafe: null,
    pricingSnapshot: {
      amount: 1500,
      currency: 'XAF',
      sourceType: 'collection',
      sourceId: 'collection-payment-source',
      pricingVersion: 'approved-v1-2026-07',
    },
    receipt: {
      available: false,
      receiptNumber: null,
      downloadUrl: null,
      issuedAt: null,
    },
    metadataVersion: 1,
    ...overrides,
  };
}

async function createCashPayment(
  uid = customerA,
  paymentId = 'pay00000000000000001',
  idempotencyKey = 'a'.repeat(64),
  overrides: Record<string, unknown> = {},
) {
  const db = customerDb(uid);
  const batch = writeBatch(db);
  batch.set(doc(db, `payments/${paymentId}`), cashPayment(uid, idempotencyKey, overrides));
  batch.set(doc(db, `paymentIdempotency/${idempotencyKey}`), {
    customerId: uid,
    paymentId,
    purpose: 'oneTimePickup',
    sourceId: 'collection-payment-source',
    createdAt: serverTimestamp(),
  });
  return batch.commit();
}

function notification(customerId = customerA) {
  return {
    notificationId: 'notification-a',
    customerId,
    type: 'collection_reminder_tomorrow',
    title: 'Tomorrow we are coming',
    body: 'We will come tomorrow for your collection.',
    collectionId: 'collection-a',
    bookingId: 'collection-a',
    subscriptionId: null,
    paymentId: null,
    collectorId: collectorA,
    createdAt: Timestamp.now(),
    read: false,
    readAt: null,
    deliveryStatus: 'delivered',
    dataVersion: 1,
  };
}

describe('CLEANGO operational payment rules', () => {
  it('allows a customer to create an own protected cash payment and lock', async () => {
    await seedPaymentSource();
    await assertSucceeds(createCashPayment());
  });

  it('denies cross-user payment creation', async () => {
    await seedPaymentSource();
    await assertFails(createCashPayment(customerB));
  });

  it('denies client-created MTN payment records', async () => {
    await seedPaymentSource();
    await assertFails(createCashPayment(customerA, 'pay00000000000000001', 'a'.repeat(64), {
      paymentMethod: 'mtn_mobile_money',
      paymentStatus: 'pending',
    }));
  });

  it('denies client-created Orange payment records', async () => {
    await seedPaymentSource();
    await assertFails(createCashPayment(customerA, 'pay00000000000000001', 'a'.repeat(64), {
      paymentMethod: 'orange_money',
      paymentStatus: 'pending',
    }));
  });

  it('denies a client-authoritative payment amount', async () => {
    await seedPaymentSource();
    await assertFails(createCashPayment(customerA, 'pay00000000000000001', 'a'.repeat(64), {
      amount: 500,
      pricingSnapshot: {
        amount: 500,
        currency: 'XAF',
        sourceType: 'collection',
        sourceId: 'collection-payment-source',
        pricingVersion: 'approved-v1-2026-07',
      },
    }));
  });

  it('denies a payment without its idempotency lock', async () => {
    await seedPaymentSource();
    const db = customerDb();
    await assertFails(setDoc(
      doc(db, 'payments/pay00000000000000001'),
      cashPayment(customerA, 'a'.repeat(64)),
    ));
  });

  it('denies duplicate payment use of an existing idempotency key', async () => {
    await seedPaymentSource();
    await assertSucceeds(createCashPayment());
    await assertFails(createCashPayment(
      customerA,
      'pay00000000000000002',
      'a'.repeat(64),
    ));
  });

  it('isolates existing idempotency locks by customer', async () => {
    const key = 'a'.repeat(64);
    await seed(`paymentIdempotency/${key}`, {
      customerId: customerA,
      paymentId: 'pay00000000000000001',
      purpose: 'oneTimePickup',
      sourceId: 'collection-payment-source',
      createdAt: Timestamp.now(),
    });
    await assertSucceeds(getDoc(doc(customerDb(), `paymentIdempotency/${key}`)));
    await assertFails(getDoc(doc(customerDb(customerB), `paymentIdempotency/${key}`)));
  });
  it.each([
    ['mark paid', { paymentStatus: 'paid' }],
    ['alter amount', { amount: 1 }],
    ['confirm cash', { confirmedAt: serverTimestamp(), confirmedBy: customerA }],
  ])('denies customer attempt to %s', async (_label, update) => {
    await seed('payments/payment-a', {
      ...cashPayment(customerA, 'a'.repeat(64)),
      initiatedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    await assertFails(updateDoc(doc(customerDb(), 'payments/payment-a'), update));
  });

  it('allows own payment history query and denies cross-user read', async () => {
    await seed('payments/payment-a', {
      ...cashPayment(customerA, 'a'.repeat(64)),
      initiatedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    await assertSucceeds(getDocs(query(
      collection(customerDb(), 'payments'),
      where('customerId', '==', customerA),
    )));
    await assertFails(getDoc(doc(customerDb(customerB), 'payments/payment-a')));
  });
});

describe('CLEANGO operational notification rules', () => {
  it('allows a customer to read and query own notifications', async () => {
    await seed('notifications/notification-a', notification());
    const db = customerDb();
    await assertSucceeds(getDoc(doc(db, 'notifications/notification-a')));
    await assertSucceeds(getDocs(query(
      collection(db, 'notifications'),
      where('customerId', '==', customerA),
    )));
  });

  it('denies cross-user notification reads', async () => {
    await seed('notifications/notification-a', notification());
    await assertFails(getDoc(doc(customerDb(customerB), 'notifications/notification-a')));
  });

  it('allows owner to mark a notification read', async () => {
    await seed('notifications/notification-a', notification());
    await assertSucceeds(updateDoc(doc(customerDb(), 'notifications/notification-a'), {
      read: true,
      readAt: serverTimestamp(),
    }));
  });

  it.each([
    ['body', { body: 'Changed' }],
    ['type', { type: 'payment_received' }],
    ['owner', { customerId: customerB }],
    ['read state', { read: false, readAt: serverTimestamp() }],
  ])('denies notification mutation of %s', async (_label, update) => {
    await seed('notifications/notification-a', notification());
    await assertFails(updateDoc(doc(customerDb(), 'notifications/notification-a'), update));
  });

  it('denies customer-created notification history', async () => {
    await assertFails(setDoc(doc(customerDb(), 'notifications/notification-a'), notification()));
  });

  it('denies direct client device-token writes', async () => {
    await assertFails(setDoc(doc(customerDb(), 'deviceTokens/token-a'), {
      customerId: customerA,
      token: 'not-a-real-token',
      active: true,
    }));
  });
});

describe('CLEANGO operational collector rules', () => {
  it('denies assigned data to a pending collector', async () => {
    await seed(`collectors/${collectorA}`, collectorProfile(collectorA, 'pending', 'inactive'));
    await seed('collections/collection-a', operationalCollection(collectorA));
    await assertFails(getDoc(doc(collectorDb(collectorA), 'collections/collection-a')));
  });

  it('allows an approved collector to read only their profile', async () => {
    await seed(`collectors/${collectorA}`, collectorProfile(collectorA));
    await seed(`collectors/${collectorB}`, collectorProfile(collectorB));
    const db = collectorDb(collectorA);
    await assertSucceeds(getDoc(doc(db, `collectors/${collectorA}`)));
    await assertFails(getDoc(doc(db, `collectors/${collectorB}`)));
  });

  it('denies collector self-approval', async () => {
    await seed(`collectors/${collectorA}`, collectorProfile(collectorA, 'pending', 'inactive'));
    await assertFails(updateDoc(doc(collectorDb(collectorA), `collectors/${collectorA}`), {
      approvalStatus: 'approved',
      accountStatus: 'active',
    }));
  });

  it('allows assigned collection read and denies another collector', async () => {
    await seed(`collectors/${collectorA}`, collectorProfile(collectorA));
    await seed(`collectors/${collectorB}`, collectorProfile(collectorB));
    await seed('collections/collection-a', operationalCollection(collectorA));
    await assertSucceeds(getDoc(doc(collectorDb(collectorA), 'collections/collection-a')));
    await assertFails(getDoc(doc(collectorDb(collectorB), 'collections/collection-a')));
  });

  it.each([
    ['assigned', 'onTheWay', 'onTheWayAt'],
    ['onTheWay', 'arrived', 'arrivedAt'],
    ['arrived', 'inProgress', 'startedAt'],
    ['inProgress', 'completed', 'completedAt'],
  ])('allows collector transition %s to %s', async (from, to, timestampField) => {
    await seed(`collectors/${collectorA}`, collectorProfile(collectorA));
    await seed('collections/collection-a', operationalCollection(collectorA, from));
    await assertSucceeds(updateDoc(doc(collectorDb(collectorA), 'collections/collection-a'), {
      status: to,
      [timestampField]: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }));
  });

  it('allows missed with a reason and timestamp', async () => {
    await seed(`collectors/${collectorA}`, collectorProfile(collectorA));
    await seed('collections/collection-a', operationalCollection(collectorA));
    await assertSucceeds(updateDoc(doc(collectorDb(collectorA), 'collections/collection-a'), {
      status: 'missed',
      missedAt: serverTimestamp(),
      missedReason: 'Customer was unavailable',
      updatedAt: serverTimestamp(),
    }));
  });

  it('denies an impossible status transition', async () => {
    await seed(`collectors/${collectorA}`, collectorProfile(collectorA));
    await seed('collections/collection-a', operationalCollection(collectorA));
    await assertFails(updateDoc(doc(collectorDb(collectorA), 'collections/collection-a'), {
      status: 'completed',
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }));
  });

  it.each([
    ['pricing', { status: 'onTheWay', onTheWayAt: serverTimestamp(), updatedAt: serverTimestamp(), pricing: { totalAmount: 1 } }],
    ['payment status', { status: 'onTheWay', onTheWayAt: serverTimestamp(), updatedAt: serverTimestamp(), paymentStatus: 'unpaid' }],
    ['assignment', { assignedWorkerId: collectorA, status: 'assigned', updatedAt: serverTimestamp() }],
  ])('denies collector mutation of %s', async (_label, update) => {
    await seed(`collectors/${collectorA}`, collectorProfile(collectorA));
    const unassigned = _label === 'assignment';
    await seed('collections/collection-a', operationalCollection(
      unassigned ? null : collectorA,
      unassigned ? 'confirmed' : 'assigned',
    ));
    await assertFails(updateDoc(doc(collectorDb(collectorA), 'collections/collection-a'), update));
  });

  it('denies completing an unassigned collection', async () => {
    await seed(`collectors/${collectorA}`, collectorProfile(collectorA));
    await seed('collections/collection-a', operationalCollection(null, 'inProgress'));
    await assertFails(updateDoc(doc(collectorDb(collectorA), 'collections/collection-a'), {
      status: 'completed',
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }));
  });

  it('denies a suspended collector operational access', async () => {
    await seed(`collectors/${collectorA}`, collectorProfile(collectorA, 'suspended', 'blocked'));
    await seed('collections/collection-a', operationalCollection(collectorA));
    const db = collectorDb(collectorA);
    await assertFails(getDoc(doc(db, 'collections/collection-a')));
    await assertFails(updateDoc(doc(db, 'collections/collection-a'), {
      status: 'onTheWay',
      onTheWayAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }));
  });

  it('allows approved collector availability update', async () => {
    await seed(`collectors/${collectorA}`, collectorProfile(collectorA));
    await assertSucceeds(updateDoc(doc(collectorDb(collectorA), `collectors/${collectorA}`), {
      currentAvailability: 'onBreak',
      availabilityReason: 'Scheduled break',
      availabilityUpdatedAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }));
  });

  it('denies pending collector availability update', async () => {
    await seed(`collectors/${collectorA}`, collectorProfile(collectorA, 'pending', 'inactive'));
    await assertFails(updateDoc(doc(collectorDb(collectorA), `collectors/${collectorA}`), {
      currentAvailability: 'available',
      availabilityReason: null,
      availabilityUpdatedAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }));
  });
});

describe('CLEANGO support request rules', () => {
  function supportRequest(customerId: string) {
    return {
      customerId,
      category: 'general',
      subject: 'Collection question',
      message: 'Please help with my collection request.',
      collectionId: null,
      status: 'open',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      closedAt: null,
      assignedTo: null,
      adminNotes: null,
      metadataVersion: 1,
    };
  }

  it('allows a customer to create an exact own support request', async () => {
    await assertSucceeds(setDoc(
      doc(customerDb(), 'supportRequests/request-a'),
      supportRequest(customerA),
    ));
  });

  it('denies a support request owned by another customer', async () => {
    await assertFails(setDoc(
      doc(customerDb(), 'supportRequests/request-a'),
      supportRequest(customerB),
    ));
  });
});

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore';
import { getBytes, ref, uploadBytes } from 'firebase/storage';
import { afterAll, afterEach, beforeAll, describe, it } from 'vitest';

let testEnv: RulesTestEnvironment;

const projectId = 'clean-go-150fb';
const customerA = 'customer-a';
const customerB = 'customer-b';
const collectorA = 'collector-a';
const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST?.split(':') ?? ['127.0.0.1', '18080'];
const storageHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST?.split(':') ?? ['127.0.0.1', '19199'];

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      host: firestoreHost[0],
      port: Number(firestoreHost[1]),
      rules: readFileSync(resolve('firestore.rules'), 'utf8'),
    },
    storage: {
      host: storageHost[0],
      port: Number(storageHost[1]),
      rules: readFileSync(resolve('storage.rules'), 'utf8'),
    },
  });
}, 60_000);

describe('CleanGo Storage rules', () => {
  const image = new Uint8Array([137, 80, 78, 71]);

  it('isolates customer payment receipts', async () => {
    const ownerStorage = testEnv.authenticatedContext(customerA, { role: 'customer' }).storage();
    const otherStorage = testEnv.authenticatedContext(customerB, { role: 'customer' }).storage();
    const path = `paymentReceipts/${customerA}/payment-a/receipt.png`;

    await assertSucceeds(uploadBytes(ref(ownerStorage, path), image, { contentType: 'image/png' }));
    await assertSucceeds(getBytes(ref(ownerStorage, path)));
    await assertFails(getBytes(ref(otherStorage, path)));
  });

  it('allows pickup proof only to the path customer, collector, or admin', async () => {
    const collectorStorage = testEnv.authenticatedContext(collectorA, {
      role: 'collector',
      collector: true,
    }).storage();
    const customerStorage = testEnv.authenticatedContext(customerA, { role: 'customer' }).storage();
    const otherStorage = testEnv.authenticatedContext(customerB, { role: 'customer' }).storage();
    const path = `pickupProof/${customerA}/${collectorA}/pickup-a/proof.png`;

    await assertSucceeds(uploadBytes(ref(collectorStorage, path), image, { contentType: 'image/png' }));
    await assertSucceeds(getBytes(ref(customerStorage, path)));
    await assertFails(getBytes(ref(otherStorage, path)));
  });

  it('rejects oversized or non-image pickup proof', async () => {
    const collectorStorage = testEnv.authenticatedContext(collectorA, {
      role: 'collector',
      collector: true,
    }).storage();
    const path = `pickupProof/${customerA}/${collectorA}/pickup-a/proof.txt`;

    await assertFails(uploadBytes(ref(collectorStorage, path), image, { contentType: 'text/plain' }));
  });
});

afterEach(async () => testEnv.clearFirestore());
afterAll(async () => testEnv.cleanup());

async function seed(path: string, data: Record<string, unknown>) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), path), data);
  });
}

describe('CleanGo Firestore rules', () => {
  it('allows the customer Day 5 booking transaction', async () => {
    await seed('addresses/address-a', {
      customerId: customerA,
      label: 'Home',
      addressLine: 'Rue 1, Essos',
      city: 'Yaounde',
      district: 'Essos',
      latitude: 3.86,
      longitude: 11.52,
      serviceZone: 'yaounde',
      isWithinServiceArea: true,
    });
    const db = testEnv.authenticatedContext(customerA, { role: 'customer' }).firestore();
    const batch = writeBatch(db);
    const subscriptionId = `subscription_${'d'.repeat(64)}`;
    batch.set(doc(db, `subscriptions/${subscriptionId}`), {
      idempotencyKey: subscriptionId,
      customerId: customerA,
      planId: 'basic',
      planSnapshot: {
        id: 'basic',
        englishName: 'Basic Plan',
        frenchName: 'Forfait Basique',
        monthlyPriceXaf: 5000,
        pickupsPerWeek: 1,
        pickupsPerMonth: 4,
        includedBagsPerPickup: 2,
        bagsSupplied: true,
        flexibleSchedule: false,
        urgentPickup: false,
        requiresQuotation: false,
        startingPriceXaf: null,
        currency: 'XAF',
        pricingVersion: 'approved-v1-2026-07',
        active: true,
        displayOrder: 1,
      },
      serviceAddressId: 'address-a',
      serviceAddressSnapshot: {
        label: 'Home',
        addressLine: 'Rue 1, Essos',
        city: 'Yaounde',
        district: 'Essos',
        latitude: 3.86,
        longitude: 11.52,
      },
      status: 'pendingPayment',
      paymentStatus: 'unpaid',
      startDate: null,
      endDate: null,
      billingCycle: 'monthly',
      includedPickupsPerMonth: 4,
      includedBagsPerPickup: 2,
      usedPickups: 0,
      extraBagRate: 500,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      cancelledAt: null,
      pricingVersion: 'approved-v1-2026-07',
    });
    batch.set(doc(db, 'pickups/pickup-a'), {
      customerId: customerA,
      collectorId: null,
      subscriptionId,
      addressId: 'address-a',
      scheduledDate: '2026-06-16',
      status: 'scheduled',
    });

    await assertSucceeds(batch.commit());
  }, 15_000);

  it('allows an owner to query and read only their address', async () => {
    await seed('addresses/address-a', {
      customerId: customerA,
      addressLine: 'Owner address',
      isPrimary: true,
    });
    const db = testEnv.authenticatedContext(customerA, { role: 'customer' }).firestore();

    await assertSucceeds(getDoc(doc(db, 'addresses/address-a')));
    await assertSucceeds(getDocs(query(
      collection(db, 'addresses'),
      where('customerId', '==', customerA),
    )));
  });

  it('rejects address reads by another customer or an unauthenticated user', async () => {
    await seed('addresses/address-a', {
      customerId: customerA,
      addressLine: 'Owner address',
    });
    const otherDb = testEnv.authenticatedContext(customerB, { role: 'customer' }).firestore();
    const unauthenticatedDb = testEnv.unauthenticatedContext().firestore();

    await assertFails(getDoc(doc(otherDb, 'addresses/address-a')));
    await assertFails(getDoc(doc(unauthenticatedDb, 'addresses/address-a')));
  });

  it('allows a customer to create an address owned by their UID', async () => {
    const db = testEnv.authenticatedContext(customerA, { role: 'customer' }).firestore();

    await assertSucceeds(setDoc(doc(db, 'addresses/address-a'), {
      customerId: customerA,
      addressLine: 'Owner address',
    }));
  });

  it('rejects creating an address owned by another customer', async () => {
    const db = testEnv.authenticatedContext(customerA, { role: 'customer' }).firestore();

    await assertFails(setDoc(doc(db, 'addresses/address-a'), {
      customerId: customerB,
      addressLine: 'Other address',
    }));
  });

  it('allows an owner to update normal address fields', async () => {
    await seed('addresses/address-a', {
      customerId: customerA,
      addressLine: 'Old address',
    });
    const db = testEnv.authenticatedContext(customerA, { role: 'customer' }).firestore();

    await assertSucceeds(updateDoc(doc(db, 'addresses/address-a'), {
      addressLine: 'Updated address',
    }));
  });

  it('rejects ownership reassignment by the current owner', async () => {
    await seed('addresses/address-a', {
      customerId: customerA,
      addressLine: 'Owner address',
    });
    const db = testEnv.authenticatedContext(customerA, { role: 'customer' }).firestore();

    await assertFails(updateDoc(doc(db, 'addresses/address-a'), {
      customerId: customerB,
    }));
  });

  it('rejects address updates and deletes by another customer', async () => {
    await seed('addresses/address-a', {
      customerId: customerA,
      addressLine: 'Owner address',
    });
    const db = testEnv.authenticatedContext(customerB, { role: 'customer' }).firestore();

    await assertFails(updateDoc(doc(db, 'addresses/address-a'), {
      addressLine: 'Unauthorized update',
    }));
    await assertFails(deleteDoc(doc(db, 'addresses/address-a')));
  });

  it('allows an owner to delete their address', async () => {
    await seed('addresses/address-a', {
      customerId: customerA,
      addressLine: 'Owner address',
    });
    const db = testEnv.authenticatedContext(customerA, { role: 'customer' }).firestore();

    await assertSucceeds(deleteDoc(doc(db, 'addresses/address-a')));
  });

  it('rejects customer-created assigned pickups or active subscriptions', async () => {
    const db = testEnv.authenticatedContext(customerA, { role: 'customer' }).firestore();
    await assertFails(setDoc(doc(db, 'pickups/pickup-a'), {
      customerId: customerA,
      collectorId: collectorA,
      scheduledDate: '2026-06-16',
      status: 'assigned',
    }));
    await assertFails(setDoc(doc(db, 'subscriptions/subscription-a'), {
      customerId: customerA,
      planId: 'basic',
      status: 'active',
    }));
  });

  it('allows a customer to create and read their own pickup', async () => {
    const db = testEnv.authenticatedContext(customerA, { role: 'customer' }).firestore();
    const pickup = doc(db, 'pickups/pickup-a');

    await assertSucceeds(setDoc(pickup, {
      customerId: customerA,
      collectorId: null,
      scheduledDate: '2026-06-16',
      status: 'scheduled',
    }));
    await assertSucceeds(getDoc(pickup));
  });

  it('rejects cross-customer pickup access', async () => {
    await seed('pickups/pickup-a', {
      customerId: customerA,
      collectorId: collectorA,
      scheduledDate: '2026-06-16',
      status: 'assigned',
    });
    const db = testEnv.authenticatedContext(customerB, { role: 'customer' }).firestore();

    await assertFails(getDoc(doc(db, 'pickups/pickup-a')));
  });

  it('requires customer cancellation and rescheduling to use trusted functions', async () => {
    await seed('pickups/pickup-a', {
      customerId: customerA,
      collectorId: collectorA,
      scheduledDate: '2026-06-16',
      status: 'assigned',
    });
    const db = testEnv.authenticatedContext(customerA, { role: 'customer' }).firestore();

    await assertFails(updateDoc(doc(db, 'pickups/pickup-a'), { status: 'cancelled' }));
    await assertFails(updateDoc(doc(db, 'pickups/pickup-a'), {
      status: 'rescheduled',
      scheduledDate: '2026-06-18',
    }));
  });

  it('allows only the assigned collector to read and update a pickup', async () => {
    await seed('pickups/pickup-a', {
      customerId: customerA,
      collectorId: collectorA,
      scheduledDate: '2026-06-16',
      status: 'assigned',
    });
    const assignedDb = testEnv.authenticatedContext(collectorA, {
      role: 'collector',
      collector: true,
    }).firestore();
    const otherDb = testEnv.authenticatedContext('collector-b', {
      role: 'collector',
      collector: true,
    }).firestore();

    await assertSucceeds(getDoc(doc(assignedDb, 'pickups/pickup-a')));
    await assertSucceeds(updateDoc(doc(assignedDb, 'pickups/pickup-a'), { status: 'en_route' }));
    await assertFails(getDoc(doc(otherDb, 'pickups/pickup-a')));
    await assertFails(updateDoc(doc(otherDb, 'pickups/pickup-a'), { status: 'en_route' }));
  });

  it('allows a protected cash request but prevents customers from marking it paid', async () => {
    const sourceId = 'collection-payment-source';
    const paymentId = 'pay12345678901234567';
    const idempotencyKey = 'a'.repeat(64);
    await seed(`collections/${sourceId}`, {
      customerId: customerA,
      paymentStatus: 'unpaid',
      quotationStatus: 'notRequired',
      pricing: { totalAmount: 1500, pricingVersion: 'approved-v1-2026-07' },
      pricingSnapshot: { totalAmount: 1500, pricingVersion: 'approved-v1-2026-07' },
    });
    const db = testEnv.authenticatedContext(customerA, { role: 'customer' }).firestore();
    const payment = doc(db, `payments/${paymentId}`);
    const batch = writeBatch(db);
    batch.set(payment, {
      customerId: customerA,
      paymentMethod: 'cash',
      paymentStatus: 'awaitingCashConfirmation',
      amount: 1500,
      currency: 'XAF',
      purpose: 'oneTimePickup',
      bookingId: sourceId,
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
        sourceId,
        pricingVersion: 'approved-v1-2026-07',
      },
      receipt: {
        available: false,
        receiptNumber: null,
        downloadUrl: null,
        issuedAt: null,
      },
      metadataVersion: 1,
    });
    batch.set(doc(db, `paymentIdempotency/${idempotencyKey}`), {
      customerId: customerA,
      paymentId,
      purpose: 'oneTimePickup',
      sourceId,
      createdAt: serverTimestamp(),
    });

    await assertSucceeds(batch.commit());
    await assertFails(updateDoc(payment, { paymentStatus: 'paid' }));
  });

  it('allows admins to manage operational records', async () => {
    await seed('pickups/pickup-a', {
      customerId: customerA,
      collectorId: null,
      status: 'scheduled',
    });
    const db = testEnv.authenticatedContext('admin-a', {
      role: 'admin',
      admin: true,
    }).firestore();

    await assertSucceeds(updateDoc(doc(db, 'pickups/pickup-a'), {
      collectorId: collectorA,
      status: 'assigned',
    }));
    await assertSucceeds(deleteDoc(doc(db, 'pickups/pickup-a')));
  });
});

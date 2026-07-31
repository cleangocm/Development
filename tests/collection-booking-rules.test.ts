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
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { afterAll, afterEach, beforeAll, describe, it } from 'vitest';

let testEnv: RulesTestEnvironment;

const projectId = 'clean-go-150fb';
const customerA = 'customer-a';
const customerB = 'customer-b';
const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST?.split(':') ?? [
  '127.0.0.1',
  '18080',
];

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

async function seedAddress(id = 'address-a', customerId = customerA) {
  await seed(`addresses/${id}`, {
    customerId,
    label: 'Home',
    addressLine: 'Test address',
    city: 'Yaounde',
    district: 'Test district',
    latitude: 3.86,
    longitude: 11.52,
    serviceZone: 'yaounde',
    isWithinServiceArea: true,
  });
}

function collectionId(seed: string) {
  return `collection_${seed.repeat(64)}`;
}

function subscriptionId(seed: string) {
  return `subscription_${seed.repeat(64)}`;
}

function addressSnapshot() {
  return {
    label: 'Home',
    addressLine: 'Test address',
    city: 'Yaounde',
    district: 'Test district',
    latitude: 3.86,
    longitude: 11.52,
  };
}

function oneTimePricing(bagCount: number) {
  const amount = bagCount * 500;
  return {
    currency: 'XAF',
    baseAmount: amount,
    includedBagCount: 0,
    extraBagCount: 0,
    extraBagRate: 500,
    extraBagAmount: 0,
    serviceFee: 0,
    discount: 0,
    totalAmount: amount,
    pricingVersion: 'approved-v1-2026-07',
    calculationSource: 'approvedOneTimeBagRate',
  };
}

function photoQuotePricing() {
  return {
    currency: 'XAF',
    baseAmount: null,
    includedBagCount: 0,
    extraBagCount: 0,
    extraBagRate: 500,
    extraBagAmount: 0,
    serviceFee: 0,
    discount: 0,
    totalAmount: null,
    pricingVersion: 'approved-v1-2026-07',
    calculationSource: 'pendingAdminQuotation',
  };
}

function validBagCollection(
  id: string,
  bagCount = 3,
  overrides: Record<string, unknown> = {},
) {
  const pricing = oneTimePricing(bagCount);
  return {
    idempotencyKey: id,
    customerId: customerA,
    addressId: 'address-a',
    addressSnapshot: addressSnapshot(),
    serviceZone: 'yaounde',
    bookingMode: 'oneTimeBagCount',
    collectionType: 'oneTime',
    wasteCategory: 'household',
    scheduleType: 'customerSelected',
    scheduledDate: Timestamp.fromDate(
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    ),
    scheduledTimeWindow: '08:00-10:00',
    frequency: 'once',
    status: 'pending',
    paymentStatus: 'unpaid',
    pricing,
    pricingSnapshot: { ...pricing },
    declaredBagCount: bagCount,
    includedBagCount: 0,
    extraBagCount: 0,
    extraBagRate: 500,
    extraBagAmount: 0,
    quotationStatus: 'notRequired',
    quotedAmount: null,
    quotationReviewedBy: null,
    quotationReviewedAt: null,
    quotationAcceptedAt: null,
    photoStoragePaths: [],
    subscriptionId: null,
    includedInSubscription: false,
    customerNotes: '',
    assignedWorkerId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    cancelledAt: null,
    completedAt: null,
    ...overrides,
  };
}

function validPhotoCollection(
  id: string,
  overrides: Record<string, unknown> = {},
) {
  const pricing = photoQuotePricing();
  return {
    idempotencyKey: id,
    customerId: customerA,
    addressId: 'address-a',
    addressSnapshot: addressSnapshot(),
    serviceZone: 'yaounde',
    bookingMode: 'oneTimePhotoQuote',
    collectionType: 'oneTime',
    wasteCategory: 'household',
    scheduleType: 'quotationPending',
    scheduledDate: null,
    scheduledTimeWindow: null,
    frequency: 'once',
    status: 'quotationRequested',
    paymentStatus: 'unpaid',
    pricing,
    pricingSnapshot: { ...pricing },
    declaredBagCount: null,
    includedBagCount: 0,
    extraBagCount: 0,
    extraBagRate: 500,
    extraBagAmount: 0,
    quotationStatus: 'requested',
    quotedAmount: null,
    quotationReviewedBy: null,
    quotationReviewedAt: null,
    quotationAcceptedAt: null,
    photoStoragePaths: [
      `collection-quotes/${customerA}/${id}/quote_1_0123456789abcdef.jpg`,
    ],
    subscriptionId: null,
    includedInSubscription: false,
    customerNotes: '',
    assignedWorkerId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    cancelledAt: null,
    completedAt: null,
    ...overrides,
  };
}

async function seedCollection(
  id: string,
  data: Record<string, unknown>,
) {
  const timestamp = Timestamp.now();
  await seed(`collections/${id}`, {
    ...data,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

function approvedPlan(planId = 'basic') {
  const plans = {
    basic: {
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
    standard: {
      id: 'standard',
      englishName: 'Standard',
      frenchName: 'Standard',
      monthlyPriceXaf: 8500,
      pickupsPerWeek: 2,
      pickupsPerMonth: 8,
      includedBagsPerPickup: 2,
      bagsSupplied: false,
      flexibleSchedule: false,
      urgentPickup: false,
      requiresQuotation: false,
      startingPriceXaf: null,
      currency: 'XAF',
      pricingVersion: 'approved-v1-2026-07',
      active: true,
      displayOrder: 2,
    },
    popular: {
      id: 'popular',
      englishName: 'Popular',
      frenchName: 'Populaire',
      monthlyPriceXaf: 11000,
      pickupsPerWeek: 2,
      pickupsPerMonth: 8,
      includedBagsPerPickup: 4,
      bagsSupplied: false,
      flexibleSchedule: false,
      urgentPickup: false,
      requiresQuotation: false,
      startingPriceXaf: null,
      currency: 'XAF',
      pricingVersion: 'approved-v1-2026-07',
      active: true,
      displayOrder: 3,
    },
    premium: {
      id: 'premium',
      englishName: 'Premium',
      frenchName: 'Premium',
      monthlyPriceXaf: 16500,
      pickupsPerWeek: 3,
      pickupsPerMonth: 12,
      includedBagsPerPickup: 6,
      bagsSupplied: false,
      flexibleSchedule: false,
      urgentPickup: false,
      requiresQuotation: false,
      startingPriceXaf: null,
      currency: 'XAF',
      pricingVersion: 'approved-v1-2026-07',
      active: true,
      displayOrder: 4,
    },
    apartments_hotels: {
      id: 'apartments_hotels',
      englishName: 'Apartments & Hotels',
      frenchName: 'Appartements & Hôtels',
      monthlyPriceXaf: null,
      pickupsPerWeek: 0,
      pickupsPerMonth: 0,
      includedBagsPerPickup: 10,
      bagsSupplied: false,
      flexibleSchedule: true,
      urgentPickup: true,
      requiresQuotation: true,
      startingPriceXaf: 35000,
      currency: 'XAF',
      pricingVersion: 'approved-v1-2026-07',
      active: true,
      displayOrder: 5,
    },
  } as const;
  return plans[planId as keyof typeof plans];
}

function validSubscription(
  id: string,
  planId = 'basic',
  overrides: Record<string, unknown> = {},
) {
  const plan = approvedPlan(planId);
  return {
    idempotencyKey: id,
    customerId: customerA,
    planId: plan.id,
    planSnapshot: { ...plan },
    serviceAddressId: 'address-a',
    serviceAddressSnapshot: addressSnapshot(),
    status: plan.requiresQuotation ? 'pendingReview' : 'pendingPayment',
    paymentStatus: 'unpaid',
    startDate: null,
    endDate: null,
    billingCycle: plan.requiresQuotation ? 'flexibleReview' : 'monthly',
    includedPickupsPerMonth: plan.pickupsPerMonth,
    includedBagsPerPickup: plan.includedBagsPerPickup,
    usedPickups: 0,
    extraBagRate: 500,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    cancelledAt: null,
    pricingVersion: 'approved-v1-2026-07',
    ...overrides,
  };
}

describe('CLEANGO one-time collection rules', () => {
  it('allows an owner to create an exact bag-count booking', async () => {
    await seedAddress();
    const db = testEnv.authenticatedContext(customerA).firestore();
    const id = collectionId('a');
    await assertSucceeds(setDoc(doc(db, `collections/${id}`), validBagCollection(id)));
  });

  it('enforces deterministic collection document IDs', async () => {
    await seedAddress();
    const db = testEnv.authenticatedContext(customerA).firestore();
    await assertFails(setDoc(doc(db, 'collections/collection-invalid'), validBagCollection('collection-invalid')));
  });

  it('rejects another customerId', async () => {
    await seedAddress();
    const db = testEnv.authenticatedContext(customerA).firestore();
    const id = collectionId('b');
    await assertFails(setDoc(doc(db, `collections/${id}`), validBagCollection(id, 3, { customerId: customerB })));
  });

  it('rejects another customer saved address', async () => {
    await seedAddress('address-b', customerB);
    const db = testEnv.authenticatedContext(customerA).firestore();
    const id = collectionId('c');
    await assertFails(setDoc(doc(db, `collections/${id}`), validBagCollection(id, 3, { addressId: 'address-b' })));
  });

  it('rejects a modified price snapshot', async () => {
    await seedAddress();
    const db = testEnv.authenticatedContext(customerA).firestore();
    const id = collectionId('d');
    const altered = oneTimePricing(3);
    altered.totalAmount = 1;
    await assertFails(setDoc(doc(db, `collections/${id}`), validBagCollection(id, 3, { pricing: altered, pricingSnapshot: { ...altered } })));
  });

  it('rejects a reduced extra bag rate', async () => {
    await seedAddress();
    const db = testEnv.authenticatedContext(customerA).firestore();
    const id = collectionId('e');
    await assertFails(setDoc(doc(db, `collections/${id}`), validBagCollection(id, 3, { extraBagRate: 499 })));
  });

  it('allows owner read and rejects cross-user and public reads', async () => {
    const id = collectionId('f');
    await seedCollection(id, validBagCollection(id));
    await assertSucceeds(getDoc(doc(testEnv.authenticatedContext(customerA).firestore(), `collections/${id}`)));
    await assertFails(getDoc(doc(testEnv.authenticatedContext(customerB).firestore(), `collections/${id}`)));
    await assertFails(getDoc(doc(testEnv.unauthenticatedContext().firestore(), `collections/${id}`)));
  });

  it('protects pricing, payment, worker, and customer identity fields', async () => {
    const id = collectionId('1');
    await seedCollection(id, validBagCollection(id));
    const db = testEnv.authenticatedContext(customerA).firestore();
    await assertFails(updateDoc(doc(db, `collections/${id}`), { 'pricing.totalAmount': 1 }));
    await assertFails(updateDoc(doc(db, `collections/${id}`), { paymentStatus: 'paid' }));
    await assertFails(updateDoc(doc(db, `collections/${id}`), { assignedWorkerId: 'worker-a' }));
    await assertFails(updateDoc(doc(db, `collections/${id}`), { customerId: customerB }));
  });

  it('allows pending and confirmed cancellation only', async () => {
    const pendingId = collectionId('2');
    const confirmedId = collectionId('3');
    const completedId = collectionId('4');
    await seedCollection(pendingId, validBagCollection(pendingId));
    await seedCollection(confirmedId, validBagCollection(confirmedId, 3, { status: 'confirmed' }));
    await seedCollection(completedId, validBagCollection(completedId, 3, { status: 'completed' }));
    const db = testEnv.authenticatedContext(customerA).firestore();
    const cancellation = { status: 'cancelled', cancelledAt: serverTimestamp(), updatedAt: serverTimestamp() };
    await assertSucceeds(updateDoc(doc(db, `collections/${pendingId}`), cancellation));
    await assertSucceeds(updateDoc(doc(db, `collections/${confirmedId}`), cancellation));
    await assertFails(updateDoc(doc(db, `collections/${completedId}`), cancellation));
  });

  it('prevents deletion and arbitrary status transitions', async () => {
    const id = collectionId('5');
    await seedCollection(id, validBagCollection(id));
    const db = testEnv.authenticatedContext(customerA).firestore();
    await assertFails(updateDoc(doc(db, `collections/${id}`), { status: 'completed', updatedAt: serverTimestamp() }));
    await assertFails(deleteDoc(doc(db, `collections/${id}`)));
  });
});

describe('CLEANGO photo quotation rules', () => {
  it('allows an owner to request a quotation with an owned booking path', async () => {
    await seedAddress();
    const db = testEnv.authenticatedContext(customerA).firestore();
    const id = collectionId('6');
    await assertSucceeds(setDoc(doc(db, `collections/${id}`), validPhotoCollection(id)));
  });

  it('rejects client-supplied quote and reviewer fields', async () => {
    await seedAddress();
    const db = testEnv.authenticatedContext(customerA).firestore();
    const quotedId = collectionId('7');
    const reviewerId = collectionId('8');
    await assertFails(setDoc(doc(db, `collections/${quotedId}`), validPhotoCollection(quotedId, { quotedAmount: 2500 })));
    await assertFails(setDoc(doc(db, `collections/${reviewerId}`), validPhotoCollection(reviewerId, { quotationReviewedBy: customerA })));
  });

  it('rejects another customer or booking photo path', async () => {
    await seedAddress();
    const db = testEnv.authenticatedContext(customerA).firestore();
    const wrongOwnerId = collectionId('9');
    const wrongBookingId = collectionId('a');
    await assertFails(setDoc(doc(db, `collections/${wrongOwnerId}`), validPhotoCollection(wrongOwnerId, { photoStoragePaths: [`collection-quotes/${customerB}/${wrongOwnerId}/quote_1_0123456789abcdef.jpg`] })));
    await assertFails(setDoc(doc(db, `collections/${wrongBookingId}`), validPhotoCollection(wrongBookingId, { photoStoragePaths: [`collection-quotes/${customerA}/${collectionId('b')}/quote_1_0123456789abcdef.jpg`] })));
  });

  it('rejects empty, duplicate, or excessive photo references', async () => {
    await seedAddress();
    const db = testEnv.authenticatedContext(customerA).firestore();
    const emptyId = collectionId('c');
    const duplicateId = collectionId('d');
    const excessiveId = collectionId('e');
    const path = `collection-quotes/${customerA}/${duplicateId}/quote_1_0123456789abcdef.jpg`;
    await assertFails(setDoc(doc(db, `collections/${emptyId}`), validPhotoCollection(emptyId, { photoStoragePaths: [] })));
    await assertFails(setDoc(doc(db, `collections/${duplicateId}`), validPhotoCollection(duplicateId, { photoStoragePaths: [path, path] })));
    await assertFails(setDoc(doc(db, `collections/${excessiveId}`), validPhotoCollection(excessiveId, { photoStoragePaths: [1, 2, 3, 4, 5].map((index) => `collection-quotes/${customerA}/${excessiveId}/quote_${index}_0123456789abcdef.jpg`) })));
  });

  it('allows cancellation while a quotation is requested', async () => {
    const id = collectionId('f');
    await seedCollection(id, validPhotoCollection(id));
    const db = testEnv.authenticatedContext(customerA).firestore();
    await assertSucceeds(updateDoc(doc(db, `collections/${id}`), { status: 'cancelled', cancelledAt: serverTimestamp(), updatedAt: serverTimestamp() }));
  });

  it('allows only acceptance of an existing trusted quotation', async () => {
    const id = collectionId('0');
    await seedCollection(id, validPhotoCollection(id, {
      quotationStatus: 'quoted',
      quotedAmount: 2500,
      quotationReviewedBy: 'admin-a',
      quotationReviewedAt: Timestamp.now(),
    }));
    const db = testEnv.authenticatedContext(customerA).firestore();
    await assertSucceeds(updateDoc(doc(db, `collections/${id}`), { quotationStatus: 'accepted', quotationAcceptedAt: serverTimestamp(), updatedAt: serverTimestamp() }));
  });

  it('rejects acceptance before quotation and protects quotedAmount', async () => {
    const pendingId = collectionId('1');
    const quotedId = collectionId('2');
    await seedCollection(pendingId, validPhotoCollection(pendingId));
    await seedCollection(quotedId, validPhotoCollection(quotedId, {
      quotationStatus: 'quoted',
      quotedAmount: 2500,
      quotationReviewedBy: 'admin-a',
      quotationReviewedAt: Timestamp.now(),
    }));
    const db = testEnv.authenticatedContext(customerA).firestore();
    await assertFails(updateDoc(doc(db, `collections/${pendingId}`), { quotationStatus: 'accepted', quotationAcceptedAt: serverTimestamp(), updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(db, `collections/${quotedId}`), { quotationStatus: 'accepted', quotedAmount: 1, quotationAcceptedAt: serverTimestamp(), updatedAt: serverTimestamp() }));
  });
});

describe('CLEANGO subscription rules', () => {
  it('allows exact pending unpaid requests for all fixed-price plans', async () => {
    await seedAddress();
    const db = testEnv.authenticatedContext(customerA).firestore();
    const ids = ['basic', 'standard', 'popular', 'premium'];
    for (let index = 0; index < ids.length; index += 1) {
      const id = subscriptionId(String(index + 1));
      await assertSucceeds(setDoc(doc(db, `subscriptions/${id}`), validSubscription(id, ids[index])));
    }
  });

  it('allows apartments and hotels only as pending review', async () => {
    await seedAddress();
    const db = testEnv.authenticatedContext(customerA).firestore();
    const validId = subscriptionId('5');
    const invalidId = subscriptionId('6');
    await assertSucceeds(setDoc(doc(db, `subscriptions/${validId}`), validSubscription(validId, 'apartments_hotels')));
    await assertFails(setDoc(doc(db, `subscriptions/${invalidId}`), validSubscription(invalidId, 'apartments_hotels', { status: 'pendingPayment' })));
  });

  it('allows own reads and rejects cross-user reads', async () => {
    const id = subscriptionId('7');
    await seed(`subscriptions/${id}`, { ...validSubscription(id), createdAt: Timestamp.now(), updatedAt: Timestamp.now() });
    await assertSucceeds(getDoc(doc(testEnv.authenticatedContext(customerA).firestore(), `subscriptions/${id}`)));
    await assertFails(getDoc(doc(testEnv.authenticatedContext(customerB).firestore(), `subscriptions/${id}`)));
  });

  it('rejects activation, paid status, altered usage, and altered plan pricing', async () => {
    await seedAddress();
    const db = testEnv.authenticatedContext(customerA).firestore();
    const activeId = subscriptionId('8');
    const paidId = subscriptionId('9');
    const usageId = subscriptionId('a');
    const priceId = subscriptionId('b');
    const alteredPlan = { ...approvedPlan('basic'), monthlyPriceXaf: 1 };
    await assertFails(setDoc(doc(db, `subscriptions/${activeId}`), validSubscription(activeId, 'basic', { status: 'active' })));
    await assertFails(setDoc(doc(db, `subscriptions/${paidId}`), validSubscription(paidId, 'basic', { paymentStatus: 'paid' })));
    await assertFails(setDoc(doc(db, `subscriptions/${usageId}`), validSubscription(usageId, 'basic', { usedPickups: 1 })));
    await assertFails(setDoc(doc(db, `subscriptions/${priceId}`), validSubscription(priceId, 'basic', { planSnapshot: alteredPlan })));
  });

  it('rejects customer updates and deletions after creation', async () => {
    const id = subscriptionId('c');
    await seed(`subscriptions/${id}`, { ...validSubscription(id), createdAt: Timestamp.now(), updatedAt: Timestamp.now() });
    const db = testEnv.authenticatedContext(customerA).firestore();
    await assertFails(updateDoc(doc(db, `subscriptions/${id}`), { status: 'active' }));
    await assertFails(updateDoc(doc(db, `subscriptions/${id}`), { usedPickups: 2 }));
    await assertFails(deleteDoc(doc(db, `subscriptions/${id}`)));
  });
});

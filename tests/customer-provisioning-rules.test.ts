import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
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

describe('CLEANGO customer provisioning rules', () => {
  it('allows a customer to provision and read their own profile', async () => {
    const db = testEnv
      .authenticatedContext(customerA, { role: 'customer' })
      .firestore();
    const profile = doc(db, `customers/${customerA}`);

    await assertSucceeds(
      setDoc(profile, {
        uid: customerA,
        userId: customerA,
        accountStatus: 'active',
        onboardingCompleted: false,
        authProviders: ['phone'],
      }),
    );
    await assertSucceeds(getDoc(profile));
  });

  it('rejects provisioning for another UID', async () => {
    const db = testEnv
      .authenticatedContext(customerA, { role: 'customer' })
      .firestore();

    await assertFails(
      setDoc(doc(db, `customers/${customerB}`), {
        uid: customerB,
        userId: customerB,
        accountStatus: 'active',
      }),
    );
  });

  it('rejects self-assigned roles and unknown privileged fields', async () => {
    const db = testEnv
      .authenticatedContext(customerA, { role: 'customer' })
      .firestore();
    const profile = doc(db, `customers/${customerA}`);

    await assertFails(
      setDoc(profile, {
        uid: customerA,
        userId: customerA,
        accountStatus: 'active',
        role: 'admin',
      }),
    );
    await assertFails(
      setDoc(profile, {
        uid: customerA,
        userId: customerA,
        accountStatus: 'active',
        admin: true,
      }),
    );
  });

  it('rejects cross-user and unauthenticated profile reads', async () => {
    await seed(`customers/${customerA}`, {
      uid: customerA,
      userId: customerA,
      accountStatus: 'active',
    });
    const otherDb = testEnv
      .authenticatedContext(customerB, { role: 'customer' })
      .firestore();
    const publicDb = testEnv.unauthenticatedContext().firestore();

    await assertFails(getDoc(doc(otherDb, `customers/${customerA}`)));
    await assertFails(getDoc(doc(publicDb, `customers/${customerA}`)));
  });

  it('prevents protected identity and status changes', async () => {
    await seed(`customers/${customerA}`, {
      uid: customerA,
      userId: customerA,
      accountStatus: 'active',
      role: 'customer',
      onboardingCompleted: false,
    });
    const db = testEnv
      .authenticatedContext(customerA, { role: 'customer' })
      .firestore();
    const profile = doc(db, `customers/${customerA}`);

    await assertSucceeds(
      updateDoc(profile, {
        displayName: 'Updated customer',
        onboardingCompleted: true,
      }),
    );
    await assertFails(updateDoc(profile, { accountStatus: 'admin' }));
    await assertFails(updateDoc(profile, { role: 'admin' }));
    await assertFails(updateDoc(profile, { uid: customerB }));
    await assertFails(updateDoc(profile, { userId: customerB }));
    await assertFails(updateDoc(profile, { admin: true }));
  });

  it('allows a legacy owner to add canonical safe identity fields', async () => {
    await seed(`customers/${customerA}`, {
      userId: customerA,
      onboardingCompleted: false,
    });
    const db = testEnv
      .authenticatedContext(customerA, { role: 'customer' })
      .firestore();

    await assertSucceeds(
      updateDoc(doc(db, `customers/${customerA}`), {
        uid: customerA,
        accountStatus: 'active',
        authProviders: ['phone'],
      }),
    );
  });
});

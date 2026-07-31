import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { getBytes, ref, uploadBytes } from 'firebase/storage';
import { afterAll, beforeAll, describe, it } from 'vitest';

let testEnv: RulesTestEnvironment;

const projectId = 'clean-go-150fb';
const customerA = 'customer-a';
const customerB = 'customer-b';
const storageHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST?.split(':') ?? [
  '127.0.0.1',
  '19199',
];
const bookingId = `collection_${'a'.repeat(64)}`;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    storage: {
      host: storageHost[0],
      port: Number(storageHost[1]),
      rules: readFileSync(resolve('storage.rules'), 'utf8'),
    },
  });
}, 60_000);

afterAll(async () => testEnv.cleanup());

function quotePath(customerId: string, index: number, digest: string) {
  return `collection-quotes/${customerId}/${bookingId}/quote_${index}_${digest}.jpg`;
}

describe('CLEANGO collection quotation Storage rules', () => {
  const image = new Uint8Array([255, 216, 255, 217]);

  it('allows an authenticated owner to upload and read a valid image', async () => {
    const storage = testEnv.authenticatedContext(customerA).storage();
    const path = quotePath(customerA, 1, '0123456789abcdef');
    await assertSucceeds(
      uploadBytes(ref(storage, path), image, { contentType: 'image/jpeg' }),
    );
    await assertSucceeds(getBytes(ref(storage, path)));
  });

  it('denies cross-user upload and read', async () => {
    const ownerStorage = testEnv.authenticatedContext(customerA).storage();
    const otherStorage = testEnv.authenticatedContext(customerB).storage();
    const path = quotePath(customerA, 2, '1123456789abcdef');
    await assertFails(
      uploadBytes(ref(otherStorage, path), image, { contentType: 'image/jpeg' }),
    );
    await assertSucceeds(
      uploadBytes(ref(ownerStorage, path), image, { contentType: 'image/jpeg' }),
    );
    await assertFails(getBytes(ref(otherStorage, path)));
  });

  it('denies a non-image MIME type', async () => {
    const storage = testEnv.authenticatedContext(customerA).storage();
    const path = quotePath(customerA, 3, '2123456789abcdef');
    await assertFails(
      uploadBytes(ref(storage, path), image, { contentType: 'text/plain' }),
    );
  });

  it('denies an image larger than 4 MB', async () => {
    const storage = testEnv.authenticatedContext(customerA).storage();
    const path = quotePath(customerA, 4, '3123456789abcdef');
    const oversized = new Uint8Array(4 * 1024 * 1024 + 1);
    await assertFails(
      uploadBytes(ref(storage, path), oversized, { contentType: 'image/jpeg' }),
    );
  });

  it('denies unauthenticated uploads', async () => {
    const storage = testEnv.unauthenticatedContext().storage();
    const path = quotePath(customerA, 1, '4123456789abcdef');
    await assertFails(
      uploadBytes(ref(storage, path), image, { contentType: 'image/jpeg' }),
    );
  });

  it('denies invalid booking and generated-file names', async () => {
    const storage = testEnv.authenticatedContext(customerA).storage();
    await assertFails(
      uploadBytes(
        ref(storage, `collection-quotes/${customerA}/invalid/photo.jpg`),
        image,
        { contentType: 'image/jpeg' },
      ),
    );
    await assertFails(
      uploadBytes(
        ref(storage, `collection-quotes/${customerA}/${bookingId}/personal-name.jpg`),
        image,
        { contentType: 'image/jpeg' },
      ),
    );
  });
});

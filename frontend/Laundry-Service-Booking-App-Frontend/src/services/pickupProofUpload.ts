import { ref, uploadBytes } from 'firebase/storage';
import { storage } from '@/lib/firebase';

function safeFileName(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  return `proof-${Date.now()}.${extension.replace(/[^a-z0-9]/g, '') || 'jpg'}`;
}

export async function uploadPickupProof(input: {
  customerId: string;
  collectorId: string;
  pickupId: string;
  file: File;
}) {
  if (!input.file.type.startsWith('image/')) {
    throw new Error('Please upload an image proof file.');
  }
  const path = `pickupProof/${input.customerId}/${input.collectorId}/${input.pickupId}/${safeFileName(input.file)}`;
  await uploadBytes(ref(storage, path), input.file, { contentType: input.file.type });
  return path;
}

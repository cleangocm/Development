import { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type UserRole = 'customer' | 'collector' | 'admin' | 'staff' | 'delivery';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  profileImage?: string | null;
  address?: string;
}

interface CreateCustomerProfileInput {
  name: string;
  phone?: string;
}

const usersCollection = 'users';

export async function createCustomerProfile(
  firebaseUser: FirebaseUser,
  input: CreateCustomerProfileInput,
): Promise<AppUser> {
  const profile: AppUser = {
    id: firebaseUser.uid,
    name: input.name.trim() || firebaseUser.displayName || 'Customer',
    email: firebaseUser.email || '',
    phone: input.phone?.trim() || firebaseUser.phoneNumber || '',
    role: 'customer',
    profileImage: firebaseUser.photoURL,
  };

  await setDoc(doc(db, usersCollection, firebaseUser.uid), {
    ...profile,
    uid: firebaseUser.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return profile;
}

export async function getUserProfile(firebaseUser: FirebaseUser): Promise<AppUser> {
  const profileRef = doc(db, usersCollection, firebaseUser.uid);
  const snapshot = await getDoc(profileRef);

  if (!snapshot.exists()) {
    return createCustomerProfile(firebaseUser, {
      name: firebaseUser.displayName || 'Customer',
      phone: firebaseUser.phoneNumber || undefined,
    });
  }

  const data = snapshot.data();
  const role: UserRole = ['customer', 'collector', 'admin', 'staff', 'delivery'].includes(data.role)
    ? data.role
    : 'customer';

  return {
    id: firebaseUser.uid,
    name: data.name || firebaseUser.displayName || 'Customer',
    email: data.email || firebaseUser.email || '',
    phone: data.phone || firebaseUser.phoneNumber || undefined,
    role,
    profileImage: data.profileImage || firebaseUser.photoURL,
    address: data.address || undefined,
  };
}

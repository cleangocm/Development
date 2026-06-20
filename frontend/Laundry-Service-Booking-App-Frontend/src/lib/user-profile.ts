import { User as FirebaseUser } from 'firebase/auth';
import { createCustomerAccount, getUser } from '@/services/cleangoRepository';

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

  await createCustomerAccount({
    uid: firebaseUser.uid,
    name: profile.name,
    email: profile.email,
    phone: profile.phone || '',
    role: 'customer',
    active: true,
    profileImage: profile.profileImage,
  });

  return profile;
}

export async function getUserProfile(firebaseUser: FirebaseUser): Promise<AppUser> {
  const data = await getUser(firebaseUser.uid);

  if (!data) {
    return createCustomerProfile(firebaseUser, {
      name: firebaseUser.displayName || 'Customer',
      phone: firebaseUser.phoneNumber || undefined,
    });
  }

  const role: UserRole = ['customer', 'collector', 'admin'].includes(data.role)
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

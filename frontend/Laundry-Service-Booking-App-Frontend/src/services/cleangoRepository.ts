import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type {
  CleanGoUser,
  CleanGoNotification,
  CollectorProfile,
  CustomerProfile,
  Payment,
  Pickup,
  Plan,
  ServiceZone,
  Subscription,
} from '@/types/cleango';

function withId<T>(id: string, data: Omit<T, 'id'>): T {
  return { id, ...data } as T;
}

export async function getUser(uid: string): Promise<CleanGoUser | null> {
  const snapshot = await getDoc(doc(db, 'users', uid));
  return snapshot.exists() ? snapshot.data() as CleanGoUser : null;
}

export async function createCustomerAccount(user: CleanGoUser): Promise<void> {
  const batch = writeBatch(db);
  const timestamps = { createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
  const customer: CustomerProfile = {
    userId: user.uid,
    name: user.name,
    phone: user.phone,
    email: user.email,
    preferredLanguage: 'fr',
  };

  batch.set(doc(db, 'users', user.uid), { ...user, ...timestamps });
  batch.set(doc(db, 'customers', user.uid), { ...customer, ...timestamps });
  await batch.commit();
}

export async function updateCustomerProfile(
  uid: string,
  updates: Pick<CleanGoUser, 'name' | 'phone' | 'address' | 'profileImage'>,
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, 'users', uid), { ...updates, updatedAt: serverTimestamp() });
  batch.set(doc(db, 'customers', uid), {
    userId: uid,
    name: updates.name,
    phone: updates.phone,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  await batch.commit();
}

export async function listActivePlans(): Promise<Plan[]> {
  const snapshot = await getDocs(query(collection(db, 'plans'), where('active', '==', true)));
  return snapshot.docs.map((item) => withId<Plan>(item.id, item.data() as Omit<Plan, 'id'>));
}

export async function listActiveServiceZones(): Promise<ServiceZone[]> {
  const snapshot = await getDocs(query(collection(db, 'serviceZones'), where('active', '==', true)));
  return snapshot.docs.map((item) => withId<ServiceZone>(item.id, item.data() as Omit<ServiceZone, 'id'>));
}

export async function listCustomerSubscriptions(customerId: string): Promise<Subscription[]> {
  const snapshot = await getDocs(query(
    collection(db, 'subscriptions'),
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc'),
  ));
  return snapshot.docs.map((item) => withId<Subscription>(item.id, item.data() as Omit<Subscription, 'id'>));
}

export async function listCustomerPickups(customerId: string, max = 50): Promise<Pickup[]> {
  const snapshot = await getDocs(query(
    collection(db, 'pickups'),
    where('customerId', '==', customerId),
    orderBy('scheduledDate', 'desc'),
    limit(max),
  ));
  return snapshot.docs.map((item) => withId<Pickup>(item.id, item.data() as Omit<Pickup, 'id'>));
}

export async function listCollectorPickups(collectorId: string, max = 100): Promise<Pickup[]> {
  const snapshot = await getDocs(query(
    collection(db, 'pickups'),
    where('collectorId', '==', collectorId),
    orderBy('scheduledDate', 'asc'),
    limit(max),
  ));
  return snapshot.docs.map((item) => withId<Pickup>(item.id, item.data() as Omit<Pickup, 'id'>));
}

export async function listAdminPickups(max = 200): Promise<Pickup[]> {
  const snapshot = await getDocs(query(
    collection(db, 'pickups'),
    orderBy('scheduledDate', 'asc'),
    limit(max),
  ));
  return snapshot.docs.map((item) => withId<Pickup>(item.id, item.data() as Omit<Pickup, 'id'>));
}

export async function listAdminCollectors(): Promise<CollectorProfile[]> {
  const [collectorProfiles, users] = await Promise.all([
    getDocs(collection(db, 'collectors')),
    getDocs(query(collection(db, 'users'), where('role', '==', 'collector'))),
  ]);
  const usersById = new Map(users.docs.map((item) => [item.id, item.data() as CleanGoUser]));

  return collectorProfiles.docs.map((item) => {
    const data = item.data() as Omit<CollectorProfile, 'userId'> & { userId?: string };
    const user = usersById.get(item.id);
    return {
      userId: item.id,
      name: data.name || user?.name || 'Collector',
      email: user?.email,
      phone: data.phone || user?.phone || '',
      active: data.active ?? user?.active ?? true,
      serviceZoneIds: data.serviceZoneIds || [],
      payRate: Number(data.payRate ?? 300),
    };
  });
}

export async function listAdminPayments(max = 200): Promise<Payment[]> {
  const snapshot = await getDocs(query(
    collection(db, 'payments'),
    orderBy('createdAt', 'desc'),
    limit(max),
  ));
  return snapshot.docs.map((item) => withId<Payment>(item.id, item.data() as Omit<Payment, 'id'>));
}

export async function getPickup(pickupId: string): Promise<Pickup | null> {
  const snapshot = await getDoc(doc(db, 'pickups', pickupId));
  return snapshot.exists()
    ? withId<Pickup>(snapshot.id, snapshot.data() as Omit<Pickup, 'id'>)
    : null;
}

export interface CreatePickupInput {
  customerId: string;
  scheduledDate: string;
  pickupFrequency?: number;
  preferredDays?: string[];
  notes?: string;
  addressText?: string;
  contactName?: string;
  contactPhone?: string;
}

export interface CreateBookingInput {
  customerId: string;
  planId: string;
  planName: string;
  serviceZoneId: string;
  serviceZoneName: string;
  neighborhood: string;
  addressLine: string;
  locationDetails?: string;
  scheduledDate: string;
  pickupFrequency: number;
  preferredDays: string[];
  contactName: string;
  contactPhone: string;
  alternativePhone?: string;
  instructions?: string;
  priceXaf: number;
}

export async function createCustomerBooking(input: CreateBookingInput) {
  const addressRef = doc(collection(db, 'addresses'));
  const subscriptionRef = doc(collection(db, 'subscriptions'));
  const pickupRef = doc(collection(db, 'pickups'));
  const paymentRef = doc(collection(db, 'payments'));
  const parsedDate = new Date(`${input.scheduledDate}T09:00:00`);
  if (Number.isNaN(parsedDate.getTime())) throw new Error('Please choose a valid pickup date.');

  const batch = writeBatch(db);
  batch.set(addressRef, {
    customerId: input.customerId,
    label: 'Pickup address',
    addressLine: input.addressLine.trim(),
    neighborhood: input.neighborhood,
    serviceZoneId: input.serviceZoneId,
    serviceZoneName: input.serviceZoneName,
    locationDetails: input.locationDetails?.trim() || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(subscriptionRef, {
    customerId: input.customerId,
    planId: input.planId,
    planName: input.planName,
    status: 'pending',
    pickupFrequency: input.pickupFrequency,
    preferredDays: input.preferredDays,
    startDate: Timestamp.fromDate(parsedDate),
    endDate: null,
    addressId: addressRef.id,
    serviceZoneId: input.serviceZoneId,
    serviceZoneName: input.serviceZoneName,
    neighborhood: input.neighborhood,
    addressText: input.addressLine.trim(),
    locationDetails: input.locationDetails?.trim() || '',
    contactName: input.contactName.trim(),
    contactPhone: input.contactPhone.trim(),
    alternativePhone: input.alternativePhone?.trim() || '',
    instructions: input.instructions?.trim() || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(pickupRef, {
    customerId: input.customerId,
    collectorId: null,
    subscriptionId: subscriptionRef.id,
    addressId: addressRef.id,
    serviceZoneId: input.serviceZoneId,
    serviceZoneName: input.serviceZoneName,
    neighborhood: input.neighborhood,
    planId: input.planId,
    planName: input.planName,
    status: 'scheduled',
    scheduledDate: Timestamp.fromDate(parsedDate),
    addressText: input.addressLine.trim(),
    locationDetails: input.locationDetails?.trim() || '',
    contactName: input.contactName.trim(),
    contactPhone: input.contactPhone.trim(),
    alternativePhone: input.alternativePhone?.trim() || '',
    notes: input.instructions?.trim() || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(paymentRef, {
    customerId: input.customerId,
    subscriptionId: subscriptionRef.id,
    pickupId: pickupRef.id,
    provider: 'manual',
    amountXaf: input.priceXaf,
    status: 'pending',
    reference: `booking:${pickupRef.id}`,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await batch.commit();

  return {
    addressId: addressRef.id,
    subscriptionId: subscriptionRef.id,
    pickupId: pickupRef.id,
    paymentId: paymentRef.id,
  };
}

export async function createPickup(input: CreatePickupInput): Promise<string> {
  const pickupRef = doc(collection(db, 'pickups'));
  const parsedDate = new Date(input.scheduledDate);
  const scheduledDate = Number.isNaN(parsedDate.getTime())
    ? Timestamp.now()
    : Timestamp.fromDate(parsedDate);

  await setDoc(pickupRef, {
    customerId: input.customerId,
    collectorId: null,
    subscriptionId: null,
    addressId: null,
    serviceZoneId: null,
    planId: null,
    status: 'scheduled',
    scheduledDate,
    notes: input.notes?.trim() || '',
    addressText: input.addressText?.trim() || '',
    contactName: input.contactName?.trim() || '',
    contactPhone: input.contactPhone?.trim() || '',
    source: 'legacy-checkout-migration',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return pickupRef.id;
}

export async function listCustomerPayments(customerId: string): Promise<Payment[]> {
  const snapshot = await getDocs(query(
    collection(db, 'payments'),
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc'),
  ));
  return snapshot.docs.map((item) => withId<Payment>(item.id, item.data() as Omit<Payment, 'id'>));
}

export async function createPendingPayment(payment: Omit<Payment, 'id' | 'status' | 'createdAt'>) {
  const ref = doc(collection(db, 'payments'));
  await setDoc(ref, {
    ...payment,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function listUserNotifications(userId: string, max = 50): Promise<CleanGoNotification[]> {
  const snapshot = await getDocs(query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(max),
  ));
  return snapshot.docs.map((item) => withId<CleanGoNotification>(
    item.id,
    item.data() as Omit<CleanGoNotification, 'id'>,
  ));
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  const snapshot = await getDocs(query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('read', '==', false),
  ));
  return snapshot.size;
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await updateDoc(doc(db, 'notifications', notificationId), {
    read: true,
    readAt: serverTimestamp(),
  });
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const unread = await getDocs(query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('read', '==', false),
    limit(100),
  ));
  const batch = writeBatch(db);
  unread.docs.forEach((item) => batch.update(item.ref, {
    read: true,
    readAt: serverTimestamp(),
  }));
  await batch.commit();
}

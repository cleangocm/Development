import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'customer' | 'collector' | 'admin';
export type PickupStatus =
  | 'scheduled'
  | 'assigned'
  | 'en_route'
  | 'arrived'
  | 'completed'
  | 'missed'
  | 'rescheduled'
  | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';
export type PaymentProvider = 'mtn_momo' | 'orange_money' | 'cash' | 'manual';

export interface CleanGoUser {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  active: boolean;
  profileImage?: string | null;
  address?: string;
}

export interface CustomerProfile {
  userId: string;
  name: string;
  phone: string;
  email: string;
  preferredLanguage: 'fr' | 'en';
  defaultAddressId?: string | null;
}

export interface CollectorProfile {
  userId: string;
  name: string;
  email?: string;
  phone: string;
  active: boolean;
  serviceZoneIds: string[];
  payRate: number;
}

export interface ServiceZone {
  id: string;
  name: string;
  neighborhoods: string[];
  active: boolean;
}

export interface Plan {
  id: string;
  name: string;
  pickupFrequency: number;
  priceXaf: number;
  bags: number;
  active: boolean;
}

export interface Subscription {
  id: string;
  customerId: string;
  planId: string;
  status: 'pending' | 'active' | 'paused' | 'cancelled' | 'expired';
  preferredDays: string[];
  startDate?: Timestamp | null;
  endDate?: Timestamp | null;
}

export interface Pickup {
  id: string;
  customerId: string;
  collectorId?: string | null;
  subscriptionId?: string | null;
  addressId?: string | null;
  serviceZoneId?: string | null;
  serviceZoneName?: string | null;
  neighborhood?: string | null;
  planId?: string | null;
  planName?: string | null;
  status: PickupStatus;
  scheduledDate: Timestamp | string;
  notes?: string;
  addressText?: string;
  locationDetails?: string;
  contactName?: string;
  contactPhone?: string;
  completionNotes?: string;
  proofPath?: string | null;
  completedAt?: Timestamp | null;
  assignedAt?: Timestamp | null;
  rescheduledAt?: Timestamp | null;
  paymentStatus?: PaymentStatus;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface Payment {
  id: string;
  customerId: string;
  subscriptionId?: string | null;
  pickupId?: string | null;
  provider: PaymentProvider;
  amountXaf: number;
  status: PaymentStatus;
  reference: string;
  providerReference?: string;
  providerTransactionId?: string | null;
  createdAt?: Timestamp | null;
}

export interface CleanGoNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  pickupId?: string | null;
  paymentId?: string | null;
  subscriptionId?: string | null;
  createdAt?: Timestamp | null;
  readAt?: Timestamp | null;
}

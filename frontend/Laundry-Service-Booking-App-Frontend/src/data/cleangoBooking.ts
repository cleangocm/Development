import type { Plan, ServiceZone } from '@/types/cleango';
import { CLEAN_GO_SUBSCRIPTION_PLANS } from './cleangoPlans';

export const OFFICIAL_PICKUP_DAYS = [2, 4, 5, 6]; // Tuesday, Thursday, Friday, Saturday

export const DEFAULT_CLEANGO_PLANS: Plan[] = CLEAN_GO_SUBSCRIPTION_PLANS.map((plan) => ({
  id: plan.id,
  name: plan.name,
  pickupFrequency: plan.pickupsPerWeek,
  priceXaf: plan.priceXaf,
  bags: plan.id === 'enterprise' ? 8 : plan.id === 'basic' ? 2 : plan.id === 'standard' ? 2 : 4,
  active: true,
}));

export const SUPPORTED_NEIGHBORHOODS = [
  'Ekounou', 'Olezoa', 'Ekie', 'Essos', 'Tsinga Garage', 'Mvog-Ada', 'Emombo',
  'Nkoldongo', 'Eleveur', 'Fougerolle', 'Nkolfoulou', 'Soa', 'Ngousso',
  'Santa Barbara', 'Odza', 'Mvan', 'Barriere', 'Ekoumdoum', 'Awae', 'Nkoabang',
  'Opep', 'Manguiers', 'Nkomo', 'Melen', 'Obili', 'Biyem-Assi', 'Simbock',
  'Jouvence', 'Ahala', 'Cite Verte',
];

export const DEFAULT_SERVICE_ZONES: ServiceZone[] = [{
  id: 'yaounde-supported',
  name: 'Yaounde - Supported areas',
  neighborhoods: SUPPORTED_NEIGHBORHOODS,
  active: true,
}];

export function getNextPickupDates(count = 8) {
  const dates: Date[] = [];
  const cursor = new Date();
  cursor.setHours(9, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1);
  while (dates.length < count) {
    if (OFFICIAL_PICKUP_DAYS.includes(cursor.getDay())) dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

export function toDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

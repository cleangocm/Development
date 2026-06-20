'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FiArrowLeft,
  FiArrowRight,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiLoader,
  FiMapPin,
  FiPackage,
  FiPhone,
  FiUser,
} from 'react-icons/fi';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
  DEFAULT_CLEANGO_PLANS,
  DEFAULT_SERVICE_ZONES,
  OFFICIAL_PICKUP_DAYS,
  getNextPickupDates,
  toDateInput,
} from '@/data/cleangoBooking';
import {
  createCustomerBooking,
  listActivePlans,
  listActiveServiceZones,
} from '@/services/cleangoRepository';
import { useAuthStore } from '@/store/authStore';
import type { Plan, ServiceZone } from '@/types/cleango';

type Step = 'details' | 'review' | 'confirmed';

interface BookingForm {
  planId: string;
  serviceZoneId: string;
  neighborhood: string;
  addressLine: string;
  locationDetails: string;
  pickupDate: string;
  preferredDays: string[];
  contactName: string;
  contactPhone: string;
  alternativePhone: string;
  instructions: string;
}

const fieldClass = 'w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-[#16A34A] focus:ring-3 focus:ring-[#16A34A]/15 dark:border-gray-600 dark:bg-gray-800 dark:text-white';

export default function BookPickupPage() {
  const router = useRouter();
  const { user, checkAuth } = useAuthStore();
  const [step, setStep] = useState<Step>('details');
  const [plans, setPlans] = useState<Plan[]>(DEFAULT_CLEANGO_PLANS);
  const [zones, setZones] = useState<ServiceZone[]>(DEFAULT_SERVICE_ZONES);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [pickupId, setPickupId] = useState('');
  const [form, setForm] = useState<BookingForm>({
    planId: DEFAULT_CLEANGO_PLANS[0].id,
    serviceZoneId: DEFAULT_SERVICE_ZONES[0].id,
    neighborhood: '',
    addressLine: '',
    locationDetails: '',
    pickupDate: '',
    preferredDays: [],
    contactName: '',
    contactPhone: '',
    alternativePhone: '',
    instructions: '',
  });

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!user) return;
    setForm((current) => ({
      ...current,
      contactName: current.contactName || user.name || '',
      contactPhone: current.contactPhone || user.phone || '',
      addressLine: current.addressLine || user.address || '',
    }));
  }, [user]);

  useEffect(() => {
    Promise.all([listActivePlans(), listActiveServiceZones()])
      .then(([remotePlans, remoteZones]) => {
        const nextPlans = remotePlans.length ? remotePlans : DEFAULT_CLEANGO_PLANS;
        const nextZones = remoteZones.length ? remoteZones : DEFAULT_SERVICE_ZONES;
        setPlans(nextPlans);
        setZones(nextZones);
        setForm((current) => ({
          ...current,
          planId: nextPlans.some((plan) => plan.id === current.planId) ? current.planId : nextPlans[0].id,
          serviceZoneId: nextZones.some((zone) => zone.id === current.serviceZoneId)
            ? current.serviceZoneId
            : nextZones[0].id,
        }));
      })
      .catch(() => {
        setPlans(DEFAULT_CLEANGO_PLANS);
        setZones(DEFAULT_SERVICE_ZONES);
      })
      .finally(() => setLoadingOptions(false));
  }, []);

  const selectedPlan = plans.find((plan) => plan.id === form.planId) || plans[0];
  const selectedZone = zones.find((zone) => zone.id === form.serviceZoneId) || zones[0];
  const neighborhoods = selectedZone?.neighborhoods?.length
    ? selectedZone.neighborhoods
    : DEFAULT_SERVICE_ZONES[0].neighborhoods;
  const quickDates = useMemo(() => getNextPickupDates(), []);

  const update = (field: keyof BookingForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
  };

  const togglePreferredDay = (day: string) => {
    setForm((current) => {
      const selected = current.preferredDays.includes(day)
        ? current.preferredDays.filter((item) => item !== day)
        : [...current.preferredDays, day];
      return { ...current, preferredDays: selected.slice(-selectedPlan.pickupFrequency) };
    });
    setError('');
  };

  const validate = () => {
    if (!user) return 'Please sign in before booking a pickup.';
    if (!selectedPlan) return 'Please select a subscription plan.';
    if (!selectedZone || !form.neighborhood) return 'Please select your service area and neighborhood.';
    if (form.addressLine.trim().length < 5) return 'Please enter a complete pickup address.';
    if (!form.pickupDate) return 'Please choose a pickup date.';
    const chosenDate = new Date(`${form.pickupDate}T09:00:00`);
    if (!OFFICIAL_PICKUP_DAYS.includes(chosenDate.getDay())) {
      return 'CleanGo pickups are available Tuesday, Thursday, Friday, and Saturday.';
    }
    if (form.preferredDays.length !== selectedPlan.pickupFrequency) {
      return `${selectedPlan.name} requires ${selectedPlan.pickupFrequency} preferred pickup day(s).`;
    }
    const chosenDay = chosenDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    if (!form.preferredDays.includes(chosenDay)) {
      return 'Your first pickup date must match one of your preferred recurring days.';
    }
    if (chosenDate.getTime() < new Date().setHours(0, 0, 0, 0)) return 'Please choose a future pickup date.';
    if (form.contactName.trim().length < 2) return 'Please enter the contact name.';
    if (!/^\+?[0-9\s-]{8,16}$/.test(form.contactPhone.trim())) return 'Please enter a valid contact phone number.';
    return '';
  };

  const reviewBooking = () => {
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setStep('review');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmBooking = async () => {
    if (!user || !selectedPlan || !selectedZone) return;
    setSubmitting(true);
    setError('');
    try {
      const result = await createCustomerBooking({
        customerId: user.id,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        serviceZoneId: selectedZone.id,
        serviceZoneName: selectedZone.name,
        neighborhood: form.neighborhood,
        addressLine: form.addressLine,
        locationDetails: form.locationDetails,
        scheduledDate: form.pickupDate,
        pickupFrequency: selectedPlan.pickupFrequency,
        preferredDays: form.preferredDays,
        contactName: form.contactName,
        contactPhone: form.contactPhone,
        alternativePhone: form.alternativePhone,
        instructions: form.instructions,
        priceXaf: selectedPlan.priceXaf,
      });
      setPickupId(result.pickupId);
      setStep('confirmed');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (bookingError) {
      setError(bookingError instanceof Error ? bookingError.message : 'Unable to book your pickup. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'confirmed') {
    return (
      <DashboardLayout>
        <div className="border border-green-200 bg-white p-6 shadow-sm dark:border-green-900 dark:bg-gray-800 sm:p-10">
          <div className="mx-auto max-w-xl text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <FiCheckCircle className="h-8 w-8" />
            </div>
            <h1 className="mt-5 text-2xl font-bold text-gray-950 dark:text-white">Pickup scheduled</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Your request has been recorded. CleanGo will confirm the assignment and payment instructions.
            </p>
            <div className="mt-6 border-y border-gray-200 py-4 text-left dark:border-gray-700">
              <p className="text-xs font-semibold uppercase text-gray-500">Pickup reference</p>
              <p className="mt-1 font-mono text-sm font-semibold text-gray-900 dark:text-white">{pickupId}</p>
              <p className="mt-4 text-xs font-semibold uppercase text-gray-500">Scheduled date</p>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                {new Date(`${form.pickupDate}T09:00:00`).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/dashboard/orders" className="rounded-lg bg-[#16A34A] px-5 py-3 text-sm font-semibold text-white hover:bg-[#15803D]">
                View my pickups
              </Link>
              <button onClick={() => router.push('/dashboard')} className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">
                Return to dashboard
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 border-b border-gray-200 pb-5 dark:border-gray-700 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#16A34A]">CleanGo collection</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-950 dark:text-white">Schedule a waste pickup</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Choose your plan, location, and preferred official collection date.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
            <span className={step === 'details' ? 'text-[#16A34A]' : ''}>1. Details</span>
            <FiArrowRight />
            <span className={step === 'review' ? 'text-[#16A34A]' : ''}>2. Review</span>
          </div>
        </div>

        {error && <div className="border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</div>}

        {step === 'details' ? (
          <div className="space-y-8 bg-white p-5 shadow-sm dark:bg-gray-800 sm:p-7">
            <section>
              <div className="mb-4 flex items-center gap-2"><FiPackage className="text-[#16A34A]" /><h2 className="font-bold text-gray-900 dark:text-white">Select a plan</h2></div>
              {loadingOptions ? <div className="flex items-center gap-2 text-sm text-gray-500"><FiLoader className="animate-spin" /> Loading plans...</div> : (
                <div className="grid gap-3 md:grid-cols-3">
                  {plans.map((plan) => (
                    <button key={plan.id} type="button" onClick={() => setForm((current) => ({ ...current, planId: plan.id, preferredDays: current.preferredDays.slice(0, plan.pickupFrequency) }))} className={`border p-4 text-left transition ${form.planId === plan.id ? 'border-[#16A34A] bg-green-50 ring-2 ring-[#16A34A]/15 dark:bg-green-950/20' : 'border-gray-200 hover:border-gray-400 dark:border-gray-700'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div><p className="font-bold text-gray-950 dark:text-white">{plan.name}</p><p className="mt-1 text-xs text-gray-500">{plan.pickupFrequency} pickup{plan.pickupFrequency > 1 ? 's' : ''} / week</p></div>
                        {form.planId === plan.id && <FiCheck className="text-[#16A34A]" />}
                      </div>
                      <p className="mt-4 text-sm font-semibold text-gray-800 dark:text-gray-200">{plan.priceXaf > 0 ? `${plan.priceXaf.toLocaleString()} XAF` : 'Price confirmed by CleanGo'}</p>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="border-t border-gray-200 pt-7 dark:border-gray-700">
              <div className="mb-4 flex items-center gap-2"><FiMapPin className="text-[#16A34A]" /><h2 className="font-bold text-gray-900 dark:text-white">Pickup location</h2></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Service area<select value={form.serviceZoneId} onChange={(event) => { update('serviceZoneId', event.target.value); update('neighborhood', ''); }} className={`${fieldClass} mt-1.5`}>{zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}</select></label>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Neighborhood<select value={form.neighborhood} onChange={(event) => update('neighborhood', event.target.value)} className={`${fieldClass} mt-1.5`}><option value="">Select neighborhood</option>{neighborhoods.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200 sm:col-span-2">Address<input value={form.addressLine} onChange={(event) => update('addressLine', event.target.value)} className={`${fieldClass} mt-1.5`} placeholder="Street, landmark, building or house number" /></label>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200 sm:col-span-2">Location details<textarea value={form.locationDetails} onChange={(event) => update('locationDetails', event.target.value)} className={`${fieldClass} mt-1.5 min-h-20 resize-y`} placeholder="Gate color, nearby landmark, access instructions" /></label>
              </div>
            </section>

            <section className="border-t border-gray-200 pt-7 dark:border-gray-700">
              <div className="mb-2 flex items-center gap-2"><FiCalendar className="text-[#16A34A]" /><h2 className="font-bold text-gray-900 dark:text-white">Pickup date</h2></div>
              <p className="mb-4 text-xs text-gray-500">Official collection days: Tuesday, Thursday, Friday, and Saturday.</p>
              <div className="mb-5">
                <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">Choose {selectedPlan.pickupFrequency} recurring day{selectedPlan.pickupFrequency > 1 ? 's' : ''}</p>
                <div className="flex flex-wrap gap-2">
                  {['tuesday', 'thursday', 'friday', 'saturday'].map((day) => (
                    <button key={day} type="button" onClick={() => togglePreferredDay(day)} className={`border px-4 py-2 text-sm font-semibold capitalize ${form.preferredDays.includes(day) ? 'border-[#16A34A] bg-[#16A34A] text-white' : 'border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-200'}`}>{day}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {quickDates.map((date) => { const value = toDateInput(date); return <button key={value} type="button" onClick={() => update('pickupDate', value)} className={`border px-3 py-3 text-left ${form.pickupDate === value ? 'border-[#16A34A] bg-green-50 text-green-900 dark:bg-green-950/20 dark:text-green-200' : 'border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-200'}`}><p className="text-xs font-semibold">{date.toLocaleDateString('en-US', { weekday: 'short' })}</p><p className="mt-1 text-sm font-bold">{date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</p></button>; })}
              </div>
              <label className="mt-4 block text-sm font-medium text-gray-700 dark:text-gray-200">Or choose another official date<input type="date" value={form.pickupDate} min={toDateInput(new Date(Date.now() + 86400000))} onChange={(event) => update('pickupDate', event.target.value)} className={`${fieldClass} date-input mt-1.5 max-w-xs`} /></label>
            </section>

            <section className="border-t border-gray-200 pt-7 dark:border-gray-700">
              <div className="mb-4 flex items-center gap-2"><FiPhone className="text-[#16A34A]" /><h2 className="font-bold text-gray-900 dark:text-white">Contact and instructions</h2></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Contact name<div className="relative mt-1.5"><FiUser className="absolute left-3 top-3.5 text-gray-400" /><input value={form.contactName} onChange={(event) => update('contactName', event.target.value)} className={`${fieldClass} pl-10`} /></div></label>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Phone<div className="relative mt-1.5"><FiPhone className="absolute left-3 top-3.5 text-gray-400" /><input type="tel" value={form.contactPhone} onChange={(event) => update('contactPhone', event.target.value)} className={`${fieldClass} pl-10`} placeholder="+237 ..." /></div></label>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Alternative phone<input type="tel" value={form.alternativePhone} onChange={(event) => update('alternativePhone', event.target.value)} className={`${fieldClass} mt-1.5`} placeholder="Optional" /></label>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Collection instructions<textarea value={form.instructions} onChange={(event) => update('instructions', event.target.value)} className={`${fieldClass} mt-1.5 min-h-20 resize-y`} placeholder="Number of bags or special instructions" /></label>
              </div>
            </section>

            <div className="flex justify-end border-t border-gray-200 pt-5 dark:border-gray-700"><button onClick={reviewBooking} className="inline-flex items-center gap-2 rounded-lg bg-[#16A34A] px-5 py-3 text-sm font-bold text-white hover:bg-[#15803D]">Review booking <FiArrowRight /></button></div>
          </div>
        ) : (
          <div className="bg-white p-5 shadow-sm dark:bg-gray-800 sm:p-7">
            <h2 className="text-lg font-bold text-gray-950 dark:text-white">Review your pickup</h2>
            <p className="mt-1 text-sm text-gray-500">Confirm these details before sending the request to CleanGo.</p>
            <dl className="mt-6 grid gap-x-8 gap-y-5 border-y border-gray-200 py-6 dark:border-gray-700 sm:grid-cols-2">
              <div><dt className="text-xs font-bold uppercase text-gray-500">Plan</dt><dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{selectedPlan?.name}</dd></div>
              <div><dt className="text-xs font-bold uppercase text-gray-500">Pickup date</dt><dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{new Date(`${form.pickupDate}T09:00:00`).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</dd></div>
              <div><dt className="text-xs font-bold uppercase text-gray-500">Recurring days</dt><dd className="mt-1 text-sm font-semibold capitalize text-gray-900 dark:text-white">{form.preferredDays.join(', ')}</dd></div>
              <div><dt className="text-xs font-bold uppercase text-gray-500">Area</dt><dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{form.neighborhood}, {selectedZone?.name}</dd></div>
              <div><dt className="text-xs font-bold uppercase text-gray-500">Contact</dt><dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{form.contactName} · {form.contactPhone}</dd></div>
              <div className="sm:col-span-2"><dt className="text-xs font-bold uppercase text-gray-500">Address</dt><dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{form.addressLine}</dd>{form.locationDetails && <p className="mt-1 text-xs text-gray-500">{form.locationDetails}</p>}</div>
              {form.instructions && <div className="sm:col-span-2"><dt className="text-xs font-bold uppercase text-gray-500">Instructions</dt><dd className="mt-1 text-sm text-gray-900 dark:text-white">{form.instructions}</dd></div>}
            </dl>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button onClick={() => setStep('details')} disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"><FiArrowLeft /> Edit details</button>
              <button onClick={confirmBooking} disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#16A34A] px-5 py-3 text-sm font-bold text-white hover:bg-[#15803D] disabled:cursor-not-allowed disabled:opacity-60">{submitting ? <><FiLoader className="animate-spin" /> Scheduling...</> : <><FiCheckCircle /> Confirm pickup</>}</button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-gray-500"><FiClock /><span>Pickup requests remain scheduled until a CleanGo collector is assigned.</span></div>
      </div>
    </DashboardLayout>
  );
}

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { ONE_OFF_PICKUP_OPTIONS, formatXaf } from '@/data/cleangoPlans';
import { createPendingPayment, createPickup } from '@/services/cleangoRepository';
import { useAuthStore } from '@/store/authStore';
import type { PaymentProvider } from '@/types/cleango';
import {
  FiArrowRight,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiCreditCard,
  FiLoader,
  FiMapPin,
  FiPackage,
} from 'react-icons/fi';

type WasteType = 'domestic' | 'medical' | 'business' | 'bulk';

const fieldClass = 'w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#16A34A] focus:ring-3 focus:ring-[#16A34A]/15 dark:border-gray-600 dark:bg-gray-800 dark:text-white';

export default function OneOffPickupPage() {
  const { user } = useAuthStore();
  const tomorrow = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toISOString().slice(0, 10);
  }, []);
  const [size, setSize] = useState(ONE_OFF_PICKUP_OPTIONS[0].id);
  const [wasteType, setWasteType] = useState<WasteType>('domestic');
  const [pickupDate, setPickupDate] = useState(tomorrow);
  const [address, setAddress] = useState(user?.address || '');
  const [contactName, setContactName] = useState(user?.name || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider>('mtn_momo');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ pickupId: string; paymentId: string } | null>(null);

  const selectedOption = ONE_OFF_PICKUP_OPTIONS.find((option) => option.id === size) || ONE_OFF_PICKUP_OPTIONS[0];

  const submit = async () => {
    if (!user) {
      setError('Please sign in before requesting a pickup.');
      return;
    }
    if (address.trim().length < 5) {
      setError('Please enter a complete pickup address.');
      return;
    }
    if (!contactName.trim() || !/^\+?[0-9\s-]{8,16}$/.test(contactPhone.trim())) {
      setError('Please enter a valid contact name and phone number.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const pickupId = await createPickup({
        customerId: user.id,
        scheduledDate: `${pickupDate}T09:00:00`,
        notes: `${selectedOption.name} one-off pickup. Waste type: ${wasteType}. ${notes}`.trim(),
        addressText: address,
        contactName,
        contactPhone,
      });
      const paymentId = await createPendingPayment({
        customerId: user.id,
        pickupId,
        subscriptionId: null,
        provider: paymentProvider,
        amountXaf: selectedOption.priceXaf,
        reference: `one-off:${pickupId}`,
      });
      setResult({ pickupId, paymentId });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to request pickup. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <DashboardLayout>
        <div className="rounded-3xl border border-green-200 bg-white p-8 text-center shadow-sm dark:border-green-900 dark:bg-gray-800">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <FiCheckCircle className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-2xl font-black text-gray-950 dark:text-white">One-off pickup requested</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">CleanGo has recorded your request and pending payment.</p>
          <div className="mx-auto mt-6 max-w-lg rounded-2xl bg-gray-50 p-5 text-left text-sm dark:bg-gray-900">
            <p><span className="font-bold">Pickup:</span> {result.pickupId}</p>
            <p className="mt-2"><span className="font-bold">Payment:</span> {result.paymentId}</p>
            <p className="mt-2"><span className="font-bold">Amount:</span> {formatXaf(selectedOption.priceXaf)}</p>
          </div>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/dashboard/payment-account" className="rounded-xl bg-[#16A34A] px-5 py-3 text-sm font-bold text-white hover:bg-[#15803D]">
              View payment account
            </Link>
            <Link href="/dashboard/orders" className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">
              View pickup history
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="rounded-3xl bg-linear-to-r from-[#0F2744] to-[#00BFA6] p-6 text-white shadow-lg sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/80">One-off pickup request</p>
          <h1 className="mt-2 text-2xl font-black">Book an extra CleanGo pickup</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/80">
            Choose the pickup size, waste type, date, and payment method. This is separate from your subscription.
          </p>
        </div>

        {error && <div className="rounded-xl border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</div>}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-7">
            <div className="mb-5 flex items-center gap-2">
              <FiPackage className="text-[#16A34A]" />
              <h2 className="font-black text-gray-950 dark:text-white">Select pickup size</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {ONE_OFF_PICKUP_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSize(option.id)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    size === option.id ? 'border-[#16A34A] bg-green-50 ring-2 ring-[#16A34A]/15 dark:bg-green-950/20' : 'border-gray-200 hover:border-gray-400 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-gray-950 dark:text-white">{option.name}</p>
                    {size === option.id && <FiCheck className="text-[#16A34A]" />}
                  </div>
                  <p className="mt-2 text-xl font-black text-[#16A34A]">{formatXaf(option.priceXaf)}</p>
                  <p className="mt-2 text-xs text-gray-500">{option.description}</p>
                </button>
              ))}
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Waste type
                <select value={wasteType} onChange={(event) => setWasteType(event.target.value as WasteType)} className={`${fieldClass} mt-1.5`}>
                  <option value="domestic">Domestic waste</option>
                  <option value="medical">Medical waste</option>
                  <option value="business">Business waste</option>
                  <option value="bulk">Large or bulky waste</option>
                </select>
              </label>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Pickup date
                <input type="date" min={tomorrow} value={pickupDate} onChange={(event) => setPickupDate(event.target.value)} className={`${fieldClass} mt-1.5`} />
              </label>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 sm:col-span-2">
                Pickup address
                <div className="relative mt-1.5">
                  <FiMapPin className="absolute left-3 top-3.5 text-gray-400" />
                  <input value={address} onChange={(event) => setAddress(event.target.value)} className={`${fieldClass} pl-10`} placeholder="Street, quarter, landmark, building" />
                </div>
                <p className="mt-1 text-xs text-gray-500">GPS support is available through the browser location prompt in the app header.</p>
              </label>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Contact name
                <input value={contactName} onChange={(event) => setContactName(event.target.value)} className={`${fieldClass} mt-1.5`} />
              </label>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Contact phone
                <input value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} className={`${fieldClass} mt-1.5`} placeholder="+237 ..." />
              </label>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 sm:col-span-2">
                Notes for collector
                <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className={`${fieldClass} mt-1.5 min-h-24 resize-y`} placeholder="Example: Please pick up before midday" />
              </label>
            </div>
          </section>

          <aside className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-7">
            <div className="mb-5 flex items-center gap-2">
              <FiCreditCard className="text-[#16A34A]" />
              <h2 className="font-black text-gray-950 dark:text-white">Payment option</h2>
            </div>
            <div className="space-y-3">
              {[
                ['mtn_momo', 'MTN Cameroon Mobile Money'],
                ['orange_money', 'Orange Cameroon Money'],
                ['manual', 'Bank Transfer'],
                ['cash', 'Cash on Pickup'],
              ].map(([value, label]) => (
                <label key={value} className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 text-sm font-semibold ${
                  paymentProvider === value ? 'border-[#16A34A] bg-green-50 text-green-900 dark:bg-green-950/20 dark:text-green-200' : 'border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-200'
                }`}>
                  <span>{label}</span>
                  <input type="radio" name="paymentProvider" checked={paymentProvider === value} onChange={() => setPaymentProvider(value as PaymentProvider)} />
                </label>
              ))}
            </div>
            <div className="mt-6 rounded-2xl bg-gray-50 p-5 dark:bg-gray-900">
              <p className="text-sm font-bold text-gray-950 dark:text-white">Request total</p>
              <p className="mt-2 text-3xl font-black text-[#16A34A]">{formatXaf(selectedOption.priceXaf)}</p>
              <p className="mt-2 text-xs text-gray-500">Payment is created as pending until CleanGo confirms it or the online provider callback marks it paid.</p>
            </div>
            <button onClick={submit} disabled={submitting} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#16A34A] px-5 py-3 text-sm font-black text-white hover:bg-[#15803D] disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? <><FiLoader className="animate-spin" /> Submitting...</> : <>Submit request <FiArrowRight /></>}
            </button>
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
              <FiCalendar />
              <span>CleanGo will confirm the exact collector assignment after payment review.</span>
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}

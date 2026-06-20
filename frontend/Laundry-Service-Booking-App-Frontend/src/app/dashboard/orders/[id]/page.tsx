'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  FiArrowLeft,
  FiCalendar,
  FiCheck,
  FiClock,
  FiLoader,
  FiMapPin,
  FiPhone,
  FiRefreshCw,
  FiTruck,
  FiUser,
} from 'react-icons/fi';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { getPickup } from '@/services/cleangoRepository';
import { reschedulePickup } from '@/services/cleangoFunctions';
import { getNextPickupDates, toDateInput } from '@/data/cleangoBooking';
import type { Pickup, PickupStatus } from '@/types/cleango';

const statusSteps: { status: PickupStatus; label: string; description: string }[] = [
  { status: 'scheduled', label: 'Scheduled', description: 'Your pickup request has been received.' },
  { status: 'assigned', label: 'Collector assigned', description: 'CleanGo assigned a collector to your request.' },
  { status: 'en_route', label: 'Collector en route', description: 'The collector is travelling to your address.' },
  { status: 'arrived', label: 'Collector arrived', description: 'The collector has reached the pickup location.' },
  { status: 'completed', label: 'Completed', description: 'Your waste collection was completed.' },
];

const statusRank: Record<PickupStatus, number> = {
  scheduled: 0,
  assigned: 1,
  en_route: 2,
  arrived: 3,
  completed: 4,
  missed: 2,
  rescheduled: 0,
  cancelled: -1,
};

function formatDate(value: Pickup['scheduledDate']) {
  const date = typeof value === 'string' ? new Date(value) : value.toDate();
  return date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function PickupDetailPage() {
  const params = useParams<{ id: string }>();
  const [pickup, setPickup] = useState<Pickup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReschedule, setShowReschedule] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    getPickup(params.id)
      .then((result) => {
        if (!result) setError('Pickup not found.');
        setPickup(result);
      })
      .catch(() => setError('Unable to load this pickup.'))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return <DashboardLayout><div className="flex min-h-72 items-center justify-center bg-white dark:bg-gray-800"><FiLoader className="h-8 w-8 animate-spin text-[#16A34A]" /></div></DashboardLayout>;
  }

  if (!pickup || error) {
    return <DashboardLayout><div className="bg-white p-8 text-center shadow-sm dark:bg-gray-800"><p className="text-red-600 dark:text-red-400">{error || 'Pickup not found.'}</p><Link href="/dashboard/orders" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#16A34A]"><FiArrowLeft /> Back to pickups</Link></div></DashboardLayout>;
  }

  const currentRank = statusRank[pickup.status];
  const exceptional = pickup.status === 'cancelled' || pickup.status === 'missed' || pickup.status === 'rescheduled';
  const canReschedule = ['scheduled', 'assigned', 'missed', 'rescheduled'].includes(pickup.status);
  const rescheduleDates = getNextPickupDates(8);

  const saveReschedule = async () => {
    if (!newDate) return;
    setSaving(true);
    setError('');
    try {
      await reschedulePickup(pickup.id, newDate);
      const refreshed = await getPickup(pickup.id);
      if (refreshed) setPickup(refreshed);
      setShowReschedule(false);
      setNewDate('');
    } catch (rescheduleError) {
      setError(rescheduleError instanceof Error ? rescheduleError.message : 'Unable to reschedule this pickup.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 border-b border-gray-200 pb-5 dark:border-gray-700 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/dashboard/orders" className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-[#16A34A]"><FiArrowLeft /> My pickups</Link>
            <h1 className="mt-2 text-2xl font-bold text-gray-950 dark:text-white">Pickup tracking</h1>
            <p className="mt-1 font-mono text-xs text-gray-500">{pickup.id}</p>
          </div>
          <span className={`w-fit px-3 py-1.5 text-xs font-bold uppercase ${pickup.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : pickup.status === 'cancelled' || pickup.status === 'missed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>{pickup.status.replace('_', ' ')}</span>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
          <section className="bg-white p-5 shadow-sm dark:bg-gray-800 sm:p-7">
            <h2 className="font-bold text-gray-950 dark:text-white">Collection progress</h2>
            {exceptional && <div className="mt-4 border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">Current status: <strong>{pickup.status.replace('_', ' ')}</strong>. CleanGo will provide the next update.</div>}
            <ol className="mt-6 space-y-0">
              {statusSteps.map((item, index) => {
                const complete = currentRank >= index;
                const active = currentRank === index;
                return (
                  <li key={item.status} className="relative flex gap-4 pb-7 last:pb-0">
                    {index < statusSteps.length - 1 && <span className={`absolute left-4 top-8 h-full w-0.5 ${complete && currentRank > index ? 'bg-[#16A34A]' : 'bg-gray-200 dark:bg-gray-700'}`} />}
                    <span className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${complete ? 'border-[#16A34A] bg-[#16A34A] text-white' : 'border-gray-300 bg-white text-gray-400 dark:border-gray-600 dark:bg-gray-800'}`}>{complete && !active ? <FiCheck /> : index + 1}</span>
                    <div className="pt-0.5"><p className={`text-sm font-bold ${active ? 'text-[#16A34A]' : 'text-gray-900 dark:text-white'}`}>{item.label}</p><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.description}</p></div>
                  </li>
                );
              })}
            </ol>
          </section>

          <aside className="space-y-5">
            {error && <div className="border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</div>}
            <section className="bg-white p-5 shadow-sm dark:bg-gray-800">
              <h2 className="font-bold text-gray-950 dark:text-white">Pickup details</h2>
              <dl className="mt-4 space-y-4 text-sm">
                <div className="flex gap-3"><FiCalendar className="mt-0.5 shrink-0 text-[#16A34A]" /><div><dt className="text-xs text-gray-500">Scheduled date</dt><dd className="font-semibold text-gray-900 dark:text-white">{formatDate(pickup.scheduledDate)}</dd></div></div>
                <div className="flex gap-3"><FiTruck className="mt-0.5 shrink-0 text-[#16A34A]" /><div><dt className="text-xs text-gray-500">Plan</dt><dd className="font-semibold text-gray-900 dark:text-white">{pickup.planName || 'CleanGo plan'}</dd></div></div>
                <div className="flex gap-3"><FiMapPin className="mt-0.5 shrink-0 text-[#16A34A]" /><div><dt className="text-xs text-gray-500">Location</dt><dd className="font-semibold text-gray-900 dark:text-white">{pickup.neighborhood ? `${pickup.neighborhood}, ` : ''}{pickup.addressText || 'Address recorded'}</dd>{pickup.locationDetails && <p className="mt-1 text-xs text-gray-500">{pickup.locationDetails}</p>}</div></div>
                <div className="flex gap-3"><FiUser className="mt-0.5 shrink-0 text-[#16A34A]" /><div><dt className="text-xs text-gray-500">Contact</dt><dd className="font-semibold text-gray-900 dark:text-white">{pickup.contactName || 'Customer'}</dd></div></div>
                <div className="flex gap-3"><FiPhone className="mt-0.5 shrink-0 text-[#16A34A]" /><div><dt className="text-xs text-gray-500">Phone</dt><dd className="font-semibold text-gray-900 dark:text-white">{pickup.contactPhone || 'Not provided'}</dd></div></div>
                <div className="flex gap-3"><FiClock className="mt-0.5 shrink-0 text-[#16A34A]" /><div><dt className="text-xs text-gray-500">Instructions</dt><dd className="font-semibold text-gray-900 dark:text-white">{pickup.notes || 'No special instructions'}</dd></div></div>
              </dl>
            </section>
            {canReschedule && (
              <section className="bg-white p-5 shadow-sm dark:bg-gray-800">
                <button onClick={() => setShowReschedule((value) => !value)} className="flex w-full items-center justify-between text-left text-sm font-bold text-gray-900 dark:text-white"><span className="inline-flex items-center gap-2"><FiRefreshCw className="text-[#16A34A]" /> Reschedule pickup</span><span>{showReschedule ? '−' : '+'}</span></button>
                {showReschedule && <div className="mt-4 space-y-3"><select value={newDate} onChange={(event) => setNewDate(event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-600 dark:bg-gray-800"><option value="">Choose an official date</option>{rescheduleDates.map((date) => <option key={toDateInput(date)} value={toDateInput(date)}>{date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</option>)}</select><button onClick={saveReschedule} disabled={!newDate || saving} className="w-full rounded-lg bg-[#16A34A] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Saving...' : 'Confirm new date'}</button></div>}
              </section>
            )}
            <Link href="/dashboard/book-pickup" className="block bg-[#16A34A] px-5 py-3 text-center text-sm font-bold text-white hover:bg-[#15803D]">Schedule another pickup</Link>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}

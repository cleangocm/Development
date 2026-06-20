'use client';

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import DeliveryLayout from '@/components/delivery/DeliveryLayout';
import { useAuthStore } from '@/store/authStore';
import { listCollectorPickups } from '@/services/cleangoRepository';
import { reschedulePickup, updatePickupWorkflow } from '@/services/cleangoFunctions';
import { uploadPickupProof } from '@/services/pickupProofUpload';
import type { Pickup, PickupStatus } from '@/types/cleango';
import {
  FiAlertCircle,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiLoader,
  FiMapPin,
  FiNavigation,
  FiPhone,
  FiRefreshCw,
  FiTruck,
  FiUploadCloud,
} from 'react-icons/fi';

export type CollectorWorkflowView = 'today' | 'tomorrow' | 'missed' | 'completed';

interface CollectorWorkflowProps {
  view?: CollectorWorkflowView;
}

function pickupDate(value: Pickup['scheduledDate']) {
  if (typeof value === 'string') return new Date(value);
  return value?.toDate?.() ?? new Date();
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function dateOffset(days: number) {
  const date = startOfToday();
  date.setDate(date.getDate() + days);
  return date;
}

function formatDate(value: Pickup['scheduledDate']) {
  return pickupDate(value).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function filterPickups(pickups: Pickup[], view: CollectorWorkflowView) {
  const today = dateKey(startOfToday());
  const tomorrow = dateKey(dateOffset(1));
  return pickups.filter((pickup) => {
    const key = dateKey(pickupDate(pickup.scheduledDate));
    if (view === 'today') return key === today && !['completed', 'cancelled'].includes(pickup.status);
    if (view === 'tomorrow') return key === tomorrow && !['completed', 'cancelled'].includes(pickup.status);
    if (view === 'completed') return pickup.status === 'completed';
    return pickup.status === 'missed' || (key < today && !['completed', 'cancelled'].includes(pickup.status));
  });
}

function nextOfficialDateOptions() {
  const allowed = new Set([2, 4, 5, 6]);
  const options: string[] = [];
  const cursor = dateOffset(1);
  while (options.length < 8) {
    if (allowed.has(cursor.getDay())) options.push(dateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return options;
}

const viewLabels: Record<CollectorWorkflowView, string> = {
  today: 'Today Pickups',
  tomorrow: 'Tomorrow Pickups',
  missed: 'Missed Pickups',
  completed: 'Completed Pickups',
};

const emptyText: Record<CollectorWorkflowView, string> = {
  today: 'No pickups assigned for today.',
  tomorrow: 'No pickups assigned for tomorrow.',
  missed: 'No missed pickups need attention.',
  completed: 'No completed pickups yet.',
};

const badgeStyles: Record<PickupStatus, string> = {
  scheduled: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  assigned: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  en_route: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  arrived: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  missed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  rescheduled: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
};

export default function CollectorWorkflow({ view = 'today' }: CollectorWorkflowProps) {
  const { user } = useAuthStore();
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);
  const [notesByPickup, setNotesByPickup] = useState<Record<string, string>>({});
  const [filesByPickup, setFilesByPickup] = useState<Record<string, File | null>>({});
  const [rescheduleByPickup, setRescheduleByPickup] = useState<Record<string, string>>({});

  const loadPickups = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    try {
      setPickups(await listCollectorPickups(user.id));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load assigned pickups.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadPickups();
  }, [loadPickups]);

  const filtered = useMemo(() => filterPickups(pickups, view), [pickups, view]);
  const stats = useMemo(() => ({
    today: filterPickups(pickups, 'today').length,
    tomorrow: filterPickups(pickups, 'tomorrow').length,
    missed: filterPickups(pickups, 'missed').length,
    completed: filterPickups(pickups, 'completed').length,
  }), [pickups]);
  const dateOptions = useMemo(nextOfficialDateOptions, []);

  const runStatusAction = async (pickup: Pickup, status: PickupStatus) => {
    setActionId(`${pickup.id}:${status}`);
    setError('');
    try {
      const notes = notesByPickup[pickup.id]?.trim();
      let proofPath: string | undefined;
      const file = filesByPickup[pickup.id];
      if (status === 'completed' && file && user?.id) {
        proofPath = await uploadPickupProof({
          customerId: pickup.customerId,
          collectorId: user.id,
          pickupId: pickup.id,
          file,
        });
      }
      await updatePickupWorkflow(pickup.id, status, notes, proofPath);
      await loadPickups();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to update pickup.');
    } finally {
      setActionId(null);
    }
  };

  const runReschedule = async (pickup: Pickup) => {
    const scheduledDate = rescheduleByPickup[pickup.id];
    if (!scheduledDate) {
      setError('Choose a Tuesday, Thursday, Friday, or Saturday reschedule date.');
      return;
    }
    setActionId(`${pickup.id}:reschedule`);
    setError('');
    try {
      await reschedulePickup(pickup.id, scheduledDate);
      await loadPickups();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to reschedule pickup.');
    } finally {
      setActionId(null);
    }
  };

  const updateProof = (pickupId: string, event: ChangeEvent<HTMLInputElement>) => {
    setFilesByPickup((current) => ({ ...current, [pickupId]: event.target.files?.[0] ?? null }));
  };

  return (
    <DeliveryLayout>
      <div className="space-y-6">
        <div className="bg-linear-to-r from-[#0e6251] to-[#148f77] rounded-2xl p-6 text-white shadow-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm text-green-100">Collector workflow</p>
              <h1 className="text-2xl font-bold">{viewLabels[view]}</h1>
              <p className="mt-1 text-sm text-green-100">Only pickups assigned to your collector account are shown.</p>
            </div>
            <button onClick={loadPickups} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-medium hover:bg-white/25 disabled:opacity-60">
              <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {([
            ['Today', stats.today, FiCalendar],
            ['Tomorrow', stats.tomorrow, FiClock],
            ['Missed', stats.missed, FiAlertCircle],
            ['Completed', stats.completed, FiCheckCircle],
          ] as const).map(([label, count, Icon]) => (
            <div key={label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#148f77]/10 text-[#148f77]">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{count}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            <FiAlertCircle className="h-5 w-5 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center rounded-2xl bg-white py-16 dark:bg-gray-800">
            <FiLoader className="h-8 w-8 animate-spin text-[#148f77]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center dark:bg-gray-800">
            <FiTruck className="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-600 dark:text-gray-300">{emptyText[view]}</p>
            <p className="mt-1 text-xs text-gray-400">Pull to refresh is manual for now, so the page stays light offline.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((pickup) => (
              <div key={pickup.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-gray-900 dark:text-white">{pickup.contactName || 'Customer pickup'}</h2>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${badgeStyles[pickup.status]}`}>
                        {pickup.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{pickup.planName || 'CleanGo subscription'} - {formatDate(pickup.scheduledDate)}</p>
                  </div>
                  {pickup.contactPhone && (
                    <a href={`tel:${pickup.contactPhone}`} className="inline-flex items-center gap-2 rounded-xl bg-[#148f77]/10 px-3 py-2 text-sm font-medium text-[#0e6251] dark:text-green-300">
                      <FiPhone className="h-4 w-4" /> Call customer
                    </a>
                  )}
                </div>

                <div className="mt-4 grid gap-3 text-sm text-gray-600 dark:text-gray-300 lg:grid-cols-2">
                  <div className="flex gap-2">
                    <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#148f77]" />
                    <span>{pickup.addressText || 'No address saved'}{pickup.neighborhood ? `, ${pickup.neighborhood}` : ''}</span>
                  </div>
                  <div className="flex gap-2">
                    <FiCalendar className="mt-0.5 h-4 w-4 shrink-0 text-[#148f77]" />
                    <span>{pickup.serviceZoneName || 'Service zone not set'}</span>
                  </div>
                </div>

                {pickup.notes && <p className="mt-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-700/50 dark:text-gray-300">{pickup.notes}</p>}

                {pickup.status !== 'completed' && pickup.status !== 'cancelled' && (
                  <div className="mt-4 space-y-3">
                    <textarea
                      value={notesByPickup[pickup.id] ?? ''}
                      onChange={(event) => setNotesByPickup((current) => ({ ...current, [pickup.id]: event.target.value }))}
                      placeholder="Optional collector notes"
                      className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#148f77] dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                      rows={2}
                    />

                    {pickup.status === 'arrived' && (
                      <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-gray-300 p-3 text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
                        <FiUploadCloud className="h-5 w-5" />
                        <span>{filesByPickup[pickup.id]?.name || 'Optional image proof for completion'}</span>
                        <input type="file" accept="image/*" onChange={(event) => updateProof(pickup.id, event)} className="hidden" />
                      </label>
                    )}

                    <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap">
                      {pickup.status === 'assigned' && (
                        <button onClick={() => runStatusAction(pickup, 'en_route')} disabled={!!actionId} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0e6251] px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
                          {actionId === `${pickup.id}:en_route` ? <FiLoader className="animate-spin" /> : <FiNavigation />} En route
                        </button>
                      )}
                      {pickup.status === 'en_route' && (
                        <button onClick={() => runStatusAction(pickup, 'arrived')} disabled={!!actionId} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
                          {actionId === `${pickup.id}:arrived` ? <FiLoader className="animate-spin" /> : <FiMapPin />} Arrived
                        </button>
                      )}
                      {pickup.status === 'arrived' && (
                        <button onClick={() => runStatusAction(pickup, 'completed')} disabled={!!actionId} className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
                          {actionId === `${pickup.id}:completed` ? <FiLoader className="animate-spin" /> : <FiCheckCircle />} Complete pickup
                        </button>
                      )}
                      {['assigned', 'en_route', 'arrived', 'rescheduled'].includes(pickup.status) && (
                        <button onClick={() => runStatusAction(pickup, 'missed')} disabled={!!actionId} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
                          {actionId === `${pickup.id}:missed` ? <FiLoader className="animate-spin" /> : <FiAlertCircle />} Mark missed
                        </button>
                      )}
                      {pickup.status === 'rescheduled' && (
                        <button onClick={() => runStatusAction(pickup, 'en_route')} disabled={!!actionId} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0e6251] px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
                          {actionId === `${pickup.id}:en_route` ? <FiLoader className="animate-spin" /> : <FiNavigation />} Start pickup
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 rounded-xl bg-gray-50 p-3 dark:bg-gray-700/40 lg:flex-row lg:items-center">
                      <select
                        value={rescheduleByPickup[pickup.id] ?? ''}
                        onChange={(event) => setRescheduleByPickup((current) => ({ ...current, [pickup.id]: event.target.value }))}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                      >
                        <option value="">Choose reschedule date</option>
                        {dateOptions.map((date) => <option key={date} value={date}>{date}</option>)}
                      </select>
                      <button onClick={() => runReschedule(pickup)} disabled={!!actionId} className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
                        {actionId === `${pickup.id}:reschedule` ? <FiLoader className="animate-spin" /> : <FiCalendar />} Reschedule
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DeliveryLayout>
  );
}

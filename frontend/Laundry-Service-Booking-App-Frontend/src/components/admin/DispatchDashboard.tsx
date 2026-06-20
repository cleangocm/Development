'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { assignPickup } from '@/services/cleangoFunctions';
import { listAdminCollectors, listAdminPayments, listAdminPickups } from '@/services/cleangoRepository';
import type { CollectorProfile, Payment, Pickup, PickupStatus } from '@/types/cleango';
import type { IconType } from 'react-icons';
import { FiAlertCircle, FiCheckCircle, FiClock, FiFilter, FiLoader, FiMapPin, FiPhone, FiRefreshCw, FiTruck, FiUser, FiUsers } from 'react-icons/fi';

function pickupDate(value: Pickup['scheduledDate']) {
  if (typeof value === 'string') return new Date(value);
  return value?.toDate?.() ?? new Date();
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function offsetKey(days: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return dateKey(date);
}

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

function paymentStatusForPickup(pickup: Pickup, payments: Payment[]) {
  return payments.find((item) => item.pickupId === pickup.id || item.subscriptionId === pickup.subscriptionId)?.status || 'pending';
}

function collectorName(collectorId: string | null | undefined, collectors: CollectorProfile[]) {
  return collectors.find((collector) => collector.userId === collectorId)?.name || 'Unassigned';
}

export default function DispatchDashboard() {
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [collectors, setCollectors] = useState<CollectorProfile[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPickup, setSelectedPickup] = useState<Pickup | null>(null);
  const [selectedCollector, setSelectedCollector] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [dateFilter, setDateFilter] = useState<'today' | 'tomorrow' | 'all'>('today');
  const [statusFilter, setStatusFilter] = useState('');
  const [collectorFilter, setCollectorFilter] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [nextPickups, nextCollectors, nextPayments] = await Promise.all([
        listAdminPickups(),
        listAdminCollectors(),
        listAdminPayments(),
      ]);
      setPickups(nextPickups);
      setCollectors(nextCollectors);
      setPayments(nextPayments);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load dispatch data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const zones = useMemo(() => Array.from(new Set(
    pickups.map((pickup) => pickup.serviceZoneName || pickup.neighborhood || '').filter(Boolean),
  )).sort(), [pickups]);

  const filteredPickups = useMemo(() => pickups.filter((pickup) => {
    const key = dateKey(pickupDate(pickup.scheduledDate));
    const paymentStatus = paymentStatusForPickup(pickup, payments);
    if (dateFilter === 'today' && key !== offsetKey(0)) return false;
    if (dateFilter === 'tomorrow' && key !== offsetKey(1)) return false;
    if (statusFilter && pickup.status !== statusFilter) return false;
    if (collectorFilter === 'unassigned' && pickup.collectorId) return false;
    if (collectorFilter && collectorFilter !== 'unassigned' && pickup.collectorId !== collectorFilter) return false;
    if (zoneFilter && (pickup.serviceZoneName || pickup.neighborhood) !== zoneFilter) return false;
    if (paymentFilter && paymentStatus !== paymentFilter) return false;
    return pickup.status !== 'cancelled';
  }), [collectorFilter, dateFilter, paymentFilter, payments, pickups, statusFilter, zoneFilter]);

  const stats = useMemo(() => {
    const completed = pickups.filter((pickup) => pickup.status === 'completed');
    const activeCollectorIds = new Set(pickups.map((pickup) => pickup.collectorId).filter(Boolean));
    return {
      scheduled: pickups.filter((pickup) => pickup.status === 'scheduled').length,
      assigned: pickups.filter((pickup) => ['assigned', 'en_route', 'arrived', 'rescheduled'].includes(pickup.status)).length,
      missed: pickups.filter((pickup) => pickup.status === 'missed').length,
      completed: completed.length,
      activeCollectors: activeCollectorIds.size,
      earningsXaf: completed.reduce((total, pickup) => total + Number(collectors.find((item) => item.userId === pickup.collectorId)?.payRate ?? 300), 0),
    };
  }, [collectors, pickups]);

  const groupedPickups = useMemo(() => filteredPickups.reduce<Record<string, Pickup[]>>((groups, pickup) => {
    const label = pickup.serviceZoneName || pickup.neighborhood || 'No zone';
    groups[label] = groups[label] || [];
    groups[label].push(pickup);
    return groups;
  }, {}), [filteredPickups]);

  const openAssign = (pickup: Pickup) => {
    setSelectedPickup(pickup);
    setSelectedCollector(pickup.collectorId || '');
    setError('');
  };

  const handleAssign = async () => {
    if (!selectedPickup || !selectedCollector) return;
    setAssigning(true);
    setError('');
    try {
      await assignPickup(selectedPickup.id, selectedCollector);
      setSelectedPickup(null);
      await loadData();
    } catch (assignError) {
      setError(assignError instanceof Error ? assignError.message : 'Unable to assign pickup.');
    } finally {
      setAssigning(false);
    }
  };

  const statCards: Array<[string, string | number, IconType]> = [
    ['Scheduled', stats.scheduled, FiClock],
    ['Assigned', stats.assigned, FiTruck],
    ['Missed', stats.missed, FiAlertCircle],
    ['Completed', stats.completed, FiCheckCircle],
    ['Collectors', stats.activeCollectors, FiUsers],
    ['Earnings XAF', stats.earningsXaf.toLocaleString(), FiUser],
  ];

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dispatch Dashboard</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">Assign CleanGo pickups and monitor collector progress.</p>
        </div>
        <button onClick={loadData} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F2744] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1a3a5c] disabled:opacity-60 dark:bg-[#00BFA6] dark:hover:bg-[#00A892]">
          <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-6">
        {statCards.map(([label, value, Icon]) => (
          <div key={label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00BFA6]/10 text-[#00BFA6]">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-white"><FiFilter /> Filters</div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value as 'today' | 'tomorrow' | 'all')} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white">
            <option value="today">Today</option><option value="tomorrow">Tomorrow</option><option value="all">All dates</option>
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white">
            <option value="">All statuses</option>
            {['scheduled', 'assigned', 'en_route', 'arrived', 'missed', 'rescheduled', 'completed'].map((status) => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}
          </select>
          <select value={collectorFilter} onChange={(event) => setCollectorFilter(event.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white">
            <option value="">All collectors</option><option value="unassigned">Unassigned only</option>
            {collectors.map((collector) => <option key={collector.userId} value={collector.userId}>{collector.name}</option>)}
          </select>
          <select value={zoneFilter} onChange={(event) => setZoneFilter(event.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white">
            <option value="">All zones</option>{zones.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
          </select>
          <select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white">
            <option value="">All payments</option>{['pending', 'paid', 'failed', 'cancelled', 'refunded'].map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </div>
      </div>

      {error && <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"><FiAlertCircle className="h-5 w-5 shrink-0" /> {error}</div>}

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl bg-white py-20 dark:bg-gray-800"><FiLoader className="h-8 w-8 animate-spin text-[#00BFA6]" /></div>
      ) : filteredPickups.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center dark:bg-gray-800"><FiTruck className="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" /><p className="text-gray-600 dark:text-gray-300">No pickups match these filters.</p></div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedPickups).map(([zone, zonePickups]) => (
            <section key={zone} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-700">
                <div><h2 className="font-semibold text-gray-900 dark:text-white">{zone}</h2><p className="text-xs text-gray-500 dark:text-gray-400">{zonePickups.length} pickup{zonePickups.length === 1 ? '' : 's'}</p></div>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {zonePickups.map((pickup) => {
                  const paymentStatus = paymentStatusForPickup(pickup, payments);
                  return (
                    <div key={pickup.id} className="grid gap-4 p-5 xl:grid-cols-[1.3fr_1fr_1fr_auto] xl:items-center">
                      <div>
                        <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-gray-900 dark:text-white">{pickup.contactName || 'Customer pickup'}</h3><span className={`rounded-full px-3 py-1 text-xs font-medium ${badgeStyles[pickup.status]}`}>{pickup.status.replace('_', ' ')}</span></div>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{pickup.planName || 'Plan not set'} - {dateKey(pickupDate(pickup.scheduledDate))}</p>
                        <p className="mt-2 flex gap-2 text-sm text-gray-600 dark:text-gray-300"><FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#00BFA6]" /> {pickup.addressText || 'No address saved'}</p>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300"><p className="font-medium text-gray-900 dark:text-white">{collectorName(pickup.collectorId, collectors)}</p><p>{pickup.contactPhone ? <a href={`tel:${pickup.contactPhone}`} className="inline-flex items-center gap-1 text-[#00BFA6]"><FiPhone /> {pickup.contactPhone}</a> : 'No phone saved'}</p></div>
                      <div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700 dark:bg-gray-700 dark:text-gray-300">Payment: {paymentStatus}</span><span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700 dark:bg-gray-700 dark:text-gray-300">Neighborhood: {pickup.neighborhood || 'N/A'}</span></div>
                      <button onClick={() => openAssign(pickup)} disabled={pickup.status === 'completed' || pickup.status === 'cancelled'} className="rounded-xl bg-[#00BFA6] px-4 py-2 text-sm font-medium text-white hover:bg-[#00A892] disabled:cursor-not-allowed disabled:opacity-50">{pickup.collectorId ? 'Reassign' : 'Assign'}</button>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {selectedPickup && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setSelectedPickup(null)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2">
            <div className="rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Assign collector</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{selectedPickup.contactName || 'Pickup'} - {dateKey(pickupDate(selectedPickup.scheduledDate))}</p>
              <div className="mt-5 space-y-2">
                {collectors.length === 0 ? <div className="rounded-xl bg-gray-50 p-5 text-center text-sm text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">No collector profiles found.</div> : collectors.map((collector) => (
                  <button key={collector.userId} onClick={() => setSelectedCollector(collector.userId)} className={`w-full rounded-xl border p-3 text-left transition-colors ${selectedCollector === collector.userId ? 'border-[#00BFA6] bg-[#00BFA6]/10' : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50'}`}>
                    <div className="flex items-center justify-between gap-3"><div><p className="font-medium text-gray-900 dark:text-white">{collector.name}</p><p className="text-xs text-gray-500 dark:text-gray-400">{collector.phone || collector.email || 'No contact saved'}</p></div><span className={`rounded-full px-2 py-1 text-xs ${collector.active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>{collector.active ? 'Active' : 'Inactive'}</span></div>
                  </button>
                ))}
              </div>
              <div className="mt-6 flex gap-3"><button onClick={() => setSelectedPickup(null)} className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium dark:border-gray-700">Cancel</button><button onClick={handleAssign} disabled={!selectedCollector || assigning} className="flex-1 rounded-xl bg-[#0F2744] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-[#00BFA6]">{assigning ? 'Assigning...' : 'Assign pickup'}</button></div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { PAYMENT_ACCOUNT_OPTIONS, formatXaf } from '@/data/cleangoPlans';
import { listCustomerPayments } from '@/services/cleangoRepository';
import { useAuthStore } from '@/store/authStore';
import type { Payment } from '@/types/cleango';
import { FiCheckCircle, FiClock, FiCreditCard, FiDollarSign, FiHash, FiLoader, FiRefreshCw } from 'react-icons/fi';

const providerLabel: Record<string, string> = {
  mtn_momo: 'MTN Cameroon Mobile Money',
  orange_money: 'Orange Cameroon Money',
  manual: 'Bank Transfer / Manual',
  cash: 'Cash on Pickup',
};

const statusClass: Record<string, string> = {
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  refunded: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
};

export default function PaymentAccountPage() {
  const { user } = useAuthStore();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPayments = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setPayments(await listCustomerPayments(user.id));
      setError('');
    } catch {
      setError('Unable to load payment history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="rounded-3xl bg-linear-to-r from-[#0F2744] to-[#00BFA6] p-6 text-white shadow-lg sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/80">Payment account</p>
          <h1 className="mt-2 text-2xl font-black">CleanGo payment methods and status</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/80">
            Use these account details for manual payments, then track payment status and transaction IDs from your dashboard.
          </p>
        </div>

        <section className="grid gap-4 lg:grid-cols-4">
          {PAYMENT_ACCOUNT_OPTIONS.map((method) => (
            <article key={method.id} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00BFA6]/10 text-[#008F7D]">
                <FiCreditCard className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-base font-black text-gray-950 dark:text-white">{method.name}</h2>
              <p className="mt-3 text-xs font-bold uppercase text-gray-500">Account number</p>
              <p className="mt-1 break-words text-sm font-semibold text-gray-800 dark:text-gray-200">{method.accountNumber}</p>
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">{method.instructions}</p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-col gap-3 border-b border-gray-100 p-5 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-gray-950 dark:text-white">Payment history</h2>
              <p className="text-sm text-gray-500">Invoices, pending payments, status, and transaction IDs.</p>
            </div>
            <button onClick={loadPayments} className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">
              <FiRefreshCw /> Refresh
            </button>
          </div>

          {error && <div className="m-5 rounded-xl border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</div>}

          {loading ? (
            <div className="flex items-center justify-center py-16 text-[#00BFA6]">
              <FiLoader className="h-8 w-8 animate-spin" />
            </div>
          ) : payments.length === 0 ? (
            <div className="p-10 text-center">
              <FiDollarSign className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-3 font-semibold text-gray-700 dark:text-gray-200">No payments yet</p>
              <p className="mt-1 text-sm text-gray-500">Book a subscription or one-off pickup to create your first invoice.</p>
              <Link href="/subscription-plans" className="mt-5 inline-flex rounded-xl bg-[#16A34A] px-5 py-3 text-sm font-bold text-white hover:bg-[#15803D]">
                View plans
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {payments.map((payment) => (
                <div key={payment.id} className="grid gap-4 p-5 md:grid-cols-[1fr_1fr_0.8fr_1fr] md:items-center">
                  <div>
                    <p className="text-xs font-bold uppercase text-gray-500">Invoice</p>
                    <p className="mt-1 font-mono text-sm font-semibold text-gray-950 dark:text-white">{payment.reference || payment.id}</p>
                    <p className="mt-1 text-xs text-gray-500">{providerLabel[payment.provider] || payment.provider}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-gray-500">Transaction ID</p>
                    <p className="mt-1 inline-flex items-center gap-2 font-mono text-sm text-gray-800 dark:text-gray-200">
                      <FiHash className="text-gray-400" />
                      {payment.providerTransactionId || payment.providerReference || 'Pending'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-gray-500">Amount</p>
                    <p className="mt-1 text-lg font-black text-[#16A34A]">{formatXaf(payment.amountXaf)}</p>
                  </div>
                  <div className="flex items-center justify-between gap-3 md:justify-end">
                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold capitalize ${statusClass[payment.status] || statusClass.pending}`}>
                      {payment.status === 'paid' ? <FiCheckCircle /> : <FiClock />}
                      {payment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

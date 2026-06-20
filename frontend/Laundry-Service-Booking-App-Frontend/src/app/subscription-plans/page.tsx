'use client';

import Link from 'next/link';
import { FiArrowRight, FiCalendar, FiCheckCircle, FiCreditCard, FiPackage, FiTruck } from 'react-icons/fi';
import {
  CLEAN_GO_SUBSCRIPTION_PLANS,
  ONE_OFF_PICKUP_OPTIONS,
  formatXaf,
} from '@/data/cleangoPlans';

export default function SubscriptionPlansPage() {
  return (
    <main className="min-h-screen bg-gray-50 pt-28 dark:bg-gray-950">
      <section className="container-custom pb-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#00BFA6]">CleanGo plans</p>
          <h1 className="mt-4 text-4xl font-black text-[#0F2744] dark:text-white md:text-5xl">
            Subscription plans for reliable waste collection
          </h1>
          <p className="mt-4 text-base text-gray-600 dark:text-gray-300">
            Choose a monthly pickup plan or book a one-off collection when you need extra flexibility.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-5">
          {CLEAN_GO_SUBSCRIPTION_PLANS.map((plan) => (
            <article
              key={plan.id}
              className={`relative rounded-3xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:bg-gray-900 ${
                plan.featured ? 'border-[#00BFA6] ring-2 ring-[#00BFA6]/20' : 'border-gray-200 dark:border-gray-800'
              }`}
            >
              {plan.featured && (
                <span className="absolute right-5 top-5 rounded-full bg-[#00BFA6]/10 px-3 py-1 text-xs font-bold text-[#008F7D]">
                  Popular
                </span>
              )}
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00BFA6]/10 text-[#008F7D]">
                <FiTruck className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-xl font-black text-gray-950 dark:text-white">{plan.name}</h2>
              <p className="mt-2 text-3xl font-black text-[#16A34A]">{formatXaf(plan.priceXaf)}</p>
              <p className="text-sm font-semibold text-gray-500">per month</p>
              <ul className="mt-5 space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex gap-2"><FiCheckCircle className="mt-0.5 shrink-0 text-[#16A34A]" />{plan.pickupsPerMonth} pickups per month</li>
                <li className="flex gap-2"><FiCheckCircle className="mt-0.5 shrink-0 text-[#16A34A]" />{plan.pickupsPerWeek} pickup{plan.pickupsPerWeek > 1 ? 's' : ''} every week</li>
                <li className="flex gap-2"><FiCheckCircle className="mt-0.5 shrink-0 text-[#16A34A]" />{plan.bags}</li>
              </ul>
              <p className="mt-5 text-sm font-semibold text-gray-900 dark:text-white">{plan.bestFor}</p>
              <Link
                href={`/dashboard/book-pickup?plan=${plan.id}`}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#16A34A] px-4 py-3 text-sm font-bold text-white hover:bg-[#15803D]"
              >
                Subscribe now <FiArrowRight />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-gray-200 bg-white py-16 dark:border-gray-800 dark:bg-gray-900">
        <div className="container-custom">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#00BFA6]">One-off pickup request</p>
              <h2 className="mt-3 text-3xl font-black text-[#0F2744] dark:text-white">No subscription needed</h2>
              <p className="mt-3 text-gray-600 dark:text-gray-300">
                For customers who need a single pickup, CleanGo supports instant booking, flexible scheduling, online payment, and pickup confirmation.
              </p>
              <div className="mt-6 grid gap-3 text-sm text-gray-700 dark:text-gray-300 sm:grid-cols-2">
                <span className="flex items-center gap-2"><FiCalendar className="text-[#00BFA6]" /> Flexible scheduling</span>
                <span className="flex items-center gap-2"><FiCreditCard className="text-[#00BFA6]" /> Online payment</span>
                <span className="flex items-center gap-2"><FiPackage className="text-[#00BFA6]" /> Waste type selection</span>
                <span className="flex items-center gap-2"><FiCheckCircle className="text-[#00BFA6]" /> Pickup confirmation</span>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {ONE_OFF_PICKUP_OPTIONS.map((option) => (
                <article key={option.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-950">
                  <h3 className="text-lg font-black text-gray-950 dark:text-white">{option.name}</h3>
                  <p className="mt-2 text-2xl font-black text-[#16A34A]">{formatXaf(option.priceXaf)}</p>
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{option.description}</p>
                </article>
              ))}
              <Link
                href="/dashboard/one-off-pickup"
                className="rounded-2xl bg-[#0F2744] p-5 text-white transition hover:bg-[#1a3a5c] sm:col-span-3"
              >
                <span className="inline-flex items-center gap-2 text-sm font-bold">
                  Request one-off pickup <FiArrowRight />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

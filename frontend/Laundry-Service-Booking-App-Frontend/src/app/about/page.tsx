'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FiCheckCircle, FiMapPin, FiRefreshCw, FiTruck } from 'react-icons/fi';

const values = [
  {
    icon: FiTruck,
    title: 'Collecte fiable',
    body: 'Des ramassages planifies pour les foyers, commerces, immeubles et restaurants.',
  },
  {
    icon: FiMapPin,
    title: 'Suivi local',
    body: 'Adresse, quartier, collecteur et statut de collecte visibles dans le tableau de bord.',
  },
  {
    icon: FiRefreshCw,
    title: 'Ville plus propre',
    body: 'Une routine de collecte qui aide a reduire les depots sauvages et les retards.',
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#F1F5F9] pt-28 dark:bg-gray-950">
      <section className="container-custom pb-16">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="rounded-[2rem] bg-white p-8 shadow-sm dark:bg-gray-900">
            <Image
              src="/Images/brand/cleango-official.png"
              alt="CleanGo"
              width={700}
              height={700}
              className="mx-auto h-auto w-full max-w-md object-contain"
              priority
            />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#16A34A]">A propos de CleanGo</p>
            <h1 className="mt-4 text-4xl font-black text-[#0F172A] dark:text-white md:text-5xl">
              Collecte propre, avenir propre
            </h1>
            <p className="mt-5 text-lg leading-8 text-gray-600 dark:text-gray-300">
              CleanGo facilite la collecte des dechets au Cameroun avec des abonnements simples,
              des collectes ponctuelles, des paiements locaux et un suivi clair pour chaque client.
            </p>
            <p className="mt-4 leading-7 text-gray-600 dark:text-gray-300">
              Notre mission est d aider les familles et entreprises a garder leur environnement propre
              grace a une organisation plus fiable des collectes.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/subscription-plans" className="rounded-xl bg-[#16A34A] px-6 py-3 text-center text-sm font-bold text-white hover:bg-[#12833C]">
                Voir les plans
              </Link>
              <Link href="/dashboard/one-off-pickup" className="rounded-xl border border-[#1073E6] px-6 py-3 text-center text-sm font-bold text-[#1073E6] hover:bg-[#1073E6]/10">
                Demander une collecte
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {values.map((value) => (
            <article key={value.title} className="rounded-3xl bg-white p-6 shadow-sm dark:bg-gray-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1073E6]/10 text-[#1073E6]">
                <value.icon className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-xl font-black text-gray-950 dark:text-white">{value.title}</h2>
              <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">{value.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-3xl bg-[#0F172A] p-6 text-white md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black">Pourquoi CleanGo ?</h2>
              <p className="mt-2 text-white/75">Plans mensuels, collectes ponctuelles, paiement mobile et notifications.</p>
            </div>
            <div className="grid gap-2 text-sm text-white/90 sm:grid-cols-2">
              {['MTN Money', 'Orange Money', 'Virement bancaire', 'Cash a la collecte'].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <FiCheckCircle className="text-[#16A34A]" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

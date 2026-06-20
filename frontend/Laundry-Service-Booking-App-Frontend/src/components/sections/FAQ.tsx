'use client';

import { useState } from 'react';
import { useScrollAnimation } from '@/hooks';
import { IoChevronDown } from 'react-icons/io5';

const faqs = [
  {
    id: 1,
    question: 'Quels services CleanGo propose-t-il ?',
    answer: 'CleanGo propose des abonnements mensuels de collecte de dechets, des collectes ponctuelles et des solutions pour entreprises, immeubles, hotels et restaurants.',
  },
  {
    id: 2,
    question: 'Comment fonctionne la collecte ?',
    answer: 'Choisissez un plan, indiquez votre quartier et votre adresse, puis selectionnez vos jours de collecte. CleanGo confirme la demande et attribue un collecteur.',
  },
  {
    id: 3,
    question: 'Puis-je demander une collecte ponctuelle ?',
    answer: 'Oui. Les collectes ponctuelles sont disponibles en format Small, Medium et Large avec planification flexible et paiement en ligne ou manuel.',
  },
  {
    id: 4,
    question: 'Quels moyens de paiement sont acceptes ?',
    answer: 'CleanGo accepte MTN Cameroon Mobile Money, Orange Cameroon Money, virement bancaire et cash a la collecte.',
  },
  {
    id: 5,
    question: 'Que faire si une collecte est manquee ?',
    answer: 'Ouvrez le support depuis votre tableau de bord pour signaler la collecte manquee. CleanGo pourra replanifier ou verifier l assignation du collecteur.',
  },
];

const FAQ = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 md:py-28 bg-linear-to-b from-[#F1F5F9] to-white dark:from-gray-900 dark:to-gray-950">
      <div className="container-custom" ref={ref}>
        {/* Section Header */}
        <div className={`text-center mb-14 md:mb-16 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <p className="text-[#00BFA6] font-semibold mb-3 text-sm">FAQ</p>
          <h2 className="text-3xl md:text-4xl lg:text-[42px] font-bold text-[#0f2744] dark:text-white mb-4">
            Questions frequentes
          </h2>
          <p className="text-[#5a6a7a] dark:text-gray-400 max-w-2xl mx-auto text-base leading-relaxed">
            Trouvez les reponses aux questions courantes sur les collectes CleanGo
          </p>
        </div>

        {/* FAQ List */}
        <div className="max-w-4xl mx-auto space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={faq.id}
              className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-all duration-300 ${
                isVisible ? 'animate-fade-in-up' : 'opacity-0'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300"
              >
                <span className="font-semibold text-[#0f2744] dark:text-white pr-4 text-[15px]">{faq.question}</span>
                <div
                  className={`transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                >
                  <IoChevronDown className="w-5 h-5 text-gray-400" />
                </div>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="px-5 pb-5 pt-0 bg-gray-50 dark:bg-gray-700/50">
                  <p className="text-[#5a6a7a] dark:text-gray-300 text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;

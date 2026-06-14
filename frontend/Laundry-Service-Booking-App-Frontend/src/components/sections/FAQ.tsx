'use client';

import { useState } from 'react';
import { useScrollAnimation } from '@/hooks';
import { IoChevronDown } from 'react-icons/io5';

const faqs = [
  {
    id: 1,
    question: 'What services do you offer?',
    answer: 'We offer wash & fold, wash & iron, dry cleaning, ironing/pressing, premium delicate wash, bedding & linen cleaning, stain removal, and shoe cleaning. Our expert team handles everything from everyday clothes to delicate fabrics and formal wear.',
  },
  {
    id: 2,
    question: 'How does pickup and delivery work?',
    answer: 'Schedule a pickup through our app or website. Our driver will arrive at your location, collect your laundry, and deliver it back fresh and clean within 2-3 days. We offer flexible time slots to fit your schedule.',
  },
  {
    id: 3,
    question: 'What are your turnaround times?',
    answer: 'Standard service is 2-3 days. Ironing/pressing can be done in 1 day. Dry cleaning and specialty services take about 3 days. Express same-day service is available for select services.',
  },
  {
    id: 4,
    question: 'How do you handle delicate items?',
    answer: 'Delicate items like silk sarees, Jamdani, cashmere, and designer wear receive special care. We use organic detergents, hand wash when needed, and follow care label instructions carefully.',
  },
  {
    id: 5,
    question: 'What is your pricing?',
    answer: 'Our pricing is transparent and affordable. Wash & fold starts from $3/item, ironing from $2/item, and dry cleaning from $18/item. Prices are automatically converted to your local currency. We also offer discount coupons for regular customers.',
  },
];

const FAQ = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 md:py-28 bg-white dark:bg-gray-900">
      <div className="container-custom" ref={ref}>
        {/* Section Header */}
        <div className={`text-center mb-14 md:mb-16 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <p className="text-[#00BFA6] font-semibold mb-3 text-sm">FAQ</p>
          <h2 className="text-3xl md:text-4xl lg:text-[42px] font-bold text-[#0f2744] dark:text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-[#5a6a7a] dark:text-gray-400 max-w-2xl mx-auto text-base leading-relaxed">
            Find answers to common questions about our laundry services
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

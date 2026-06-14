'use client';

import Image from 'next/image';
import { useScrollAnimation } from '@/hooks';
import { MdOutlineVerified } from 'react-icons/md';

const Satisfaction = () => {
  const { ref, isVisible } = useScrollAnimation();

  const checklistItems = [
    'Free doorstep pickup & delivery',
    'Special care for delicate fabrics',
    'Premium eco-friendly detergents',
    'Expert stain removal service',
    'On-time guaranteed delivery',
    '24/7 customer support',
  ];

  return (
    <section className="py-20 md:py-28 bg-[#e8eef6] dark:bg-gray-900">
      <div className="container-custom" ref={ref}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
          {/* Image Side */}
          <div className={`relative ${isVisible ? 'animate-fade-in-left' : 'opacity-0'}`}>
            <div className="relative rounded-3xl overflow-hidden">
              <Image
                src="/Images/Home/why-we-choose-section/img-4.png"
                alt="Guaranteed Satisfaction"
                width={600}
                height={550}
                className="w-full h-72 sm:h-80 md:h-96 lg:h-112.5 object-cover"
              />
            </div>
          </div>

          {/* Content Side */}
          <div className={`${isVisible ? 'animate-fade-in-right' : 'opacity-0'}`}>
            <p className="text-[#00BFA6] font-semibold mb-4 text-sm tracking-wide">Our Promise</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0f2744] dark:text-white mb-5 leading-tight">
              Quality Cleaning, Guaranteed Satisfaction
            </h2>
            <p className="text-[#5a6a7a] dark:text-gray-400 mb-10 leading-relaxed text-base md:text-lg">
              From everyday laundry to premium garment care, we deliver spotless results with attention
              to detail, lasting freshness, and complete peace of mind with every order.
            </p>

            {/* Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {checklistItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <MdOutlineVerified className="w-6 h-6 text-[#108A7E] shrink-0 group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-[#0f2744] dark:text-gray-200 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Satisfaction;

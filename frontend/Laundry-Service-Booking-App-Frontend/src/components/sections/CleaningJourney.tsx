'use client';

import SafeImage from '@/components/ui/SafeImage';
import { useScrollAnimation } from '@/hooks';
import { MdCalendarMonth } from 'react-icons/md';
import { IoSparkles } from 'react-icons/io5';
import { PiHandHeartFill } from 'react-icons/pi';

const steps = [
  {
    id: 1,
    title: 'Book Your Service',
    description: 'Choose your desired cleaning service, date, and time through our easy online booking form.',
    icon: <MdCalendarMonth className="w-7 h-7 text-white" />,
    image: '/Images/Home/how-it-works-section/how-it-work.png',
  },
  {
    id: 2,
    title: 'Clean With Care',
    description: 'Our professional team arrives on time and performs a detailed, high-quality cleaning tailored to your needs.',
    icon: <PiHandHeartFill  className="w-7 h-7 text-white" />,
    image: '/Images/Home/how-it-works-section/how-it-work (2).png',
  },
  {
    id: 3,
    title: 'Enjoy The Freshness',
    description: 'Your clothes are delivered fresh, spotless, and ready to wear — right at your doorstep.',
    icon: <IoSparkles className="w-7 h-7 text-white" />,
    image: '/Images/Home/how-it-works-section/how-it-wok.png',
  },
];

const CleaningJourney = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="py-20 md:py-28 bg-[#e8eef6] dark:bg-gray-900">
      <div className="container-custom" ref={ref}>
        {/* Section Header */}
        <div className={`text-center mb-14 md:mb-16 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <p className="text-[#00BFA6] font-semibold mb-4 text-sm tracking-wide">How it Works</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0f2744] dark:text-white mb-5">
            How It Works
          </h2>
          <p className="text-[#5a6a7a] dark:text-gray-400 max-w-3xl mx-auto text-base md:text-lg leading-relaxed">
            Getting your laundry done has never been easier. Just book online, we pick up your clothes,
            clean them with expert care using premium products, and deliver them fresh to your door.
            Three simple steps to spotless garments.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`relative ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* Image */}
              <div className="relative h-70 md:h-80 rounded-3xl overflow-hidden mb-6">
                <SafeImage
                  src={step.image}
                  alt={step.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>

              {/* Icon Circle */}
              <div className="flex justify-center -mt-12 mb-4 relative z-10">
                <div className="w-16 h-16 bg-[#0f2744] dark:bg-[#00BFA6] border-2 border-[#0f2744] dark:border-[#00BFA6] rounded-full flex items-center justify-center shadow-lg">
                  {step.icon}
                </div>
              </div>

              {/* Content */}
              <div className="text-center px-4">
                <h3 className="text-xl font-bold text-[#0f2744] dark:text-white mb-3">{step.title}</h3>
                <p className="text-[#5a6a7a] dark:text-gray-400 text-sm leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CleaningJourney;

'use client';

import SafeImage from '@/components/ui/SafeImage';
import { useScrollAnimation } from '@/hooks';

const features = [
  {
    id: 1,
    number: '01',
    title: 'Guaranteed Quality',
    description: 'We stand behind the quality of every wash. If you are not completely satisfied, we will re-clean your garments at no extra cost.',
  },
  {
    id: 2,
    number: '02',
    title: 'Professional Team',
    description: 'Our trained laundry experts use advanced techniques and premium detergents to give your garments a professional finish every time.',
  },
  {
    id: 3,
    number: '03',
    title: 'Eco-Friendly Products',
    description: 'We use biodegradable, non-toxic detergents that are gentle on your clothes and safe for the environment. No harsh chemicals.',
  },
  {
    id: 4,
    number: '04',
    title: 'On-Time Delivery',
    description: 'We value your time. Your laundry is picked up, cleaned to perfection, and delivered back to your doorstep exactly when promised.',
  },
];

const images = [
  '/Images/Home/why-we-choose-section/img-1.png',
  '/Images/Home/why-we-choose-section/img-2.png',
  '/Images/Home/why-we-choose-section/img-3.png',
  '/Images/Home/why-we-choose-section/img-4.png',

];

const Features = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="py-20 md:py-28 bg-white dark:bg-gray-900">
      <div className="container-custom" ref={ref}>
        {/* Section Header */}
        <div className={`text-center mb-14 md:mb-16 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <p className="text-[#00BFA6] font-semibold mb-4 text-sm tracking-wide">Why Choose Us</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0f2744] dark:text-white mb-5">
            Your Trusted Laundry Partner
          </h2>
          <p className="text-[#5a6a7a] dark:text-gray-400 max-w-3xl mx-auto text-base md:text-lg leading-relaxed">
            We deliver spotless results and guaranteed satisfaction with every order. Our eco-friendly
            products and trained professionals ensure your garments receive the best possible care.
          </p>
        </div>

        {/* Features Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Left Side - Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.id}
                className={`${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="inline-block border border-[#d1d9e6] dark:border-gray-600 rounded-lg px-4 py-2 mb-4">
                  <span className="text-[#5a6a7a] dark:text-gray-400 font-medium">{feature.number}</span>
                </div>
                <h3 className="text-xl font-bold text-[#0f2744] dark:text-white mb-3">{feature.title}</h3>
                <p className="text-[#5a6a7a] dark:text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Right Side - Images Grid */}
          <div className={`relative ${isVisible ? 'animate-fade-in-right' : 'opacity-0'}`}>
            <div className="grid grid-cols-2 gap-3">
              {/* Large Image */}
              <div className="row-span-2 relative h-87.5 rounded-2xl overflow-hidden">
                <SafeImage
                  src={images[0]}
                  alt="Laundry Service"
                  fill
                  sizes="(max-width: 640px) 100vw, 25vw"
                  className="object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
              {/* Small Images */}
              <div className="relative h-42.5 rounded-2xl overflow-hidden">
                <SafeImage
                  src={images[1]}
                  alt="Laundry Service"
                  fill
                  sizes="(max-width: 640px) 100vw, 25vw"
                  className="object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
              <div className="relative row-span-2 h-87.5 rounded-2xl overflow-hidden">
                <SafeImage
                  src={images[2]}
                  alt="Laundry Service"
                  fill
                  sizes="(max-width: 640px) 100vw, 25vw"
                  className="object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
              {/* Bottom Row */}
              <div className="relative h-42.5 rounded-2xl overflow-hidden">
                <SafeImage
                  src={images[3]}
                  alt="Laundry Service"
                  fill
                  sizes="(max-width: 640px) 100vw, 25vw"
                  className="object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;

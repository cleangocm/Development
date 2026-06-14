'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import SafeImage from '@/components/ui/SafeImage';
import Link from 'next/link';
import { useScrollAnimation } from '@/hooks';
import { useTheme } from '@/context';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import api from '@/services/api';

interface ServiceData {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  image: string;
  pricePerKg: number;
  pricePerItem: number;
  pricingType: string;
}

const Services = () => {
  const { t, formatPrice } = useTheme();
  const { ref, isVisible } = useScrollAnimation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const sliderRef = useRef<HTMLDivElement>(null);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [services, setServices] = useState<ServiceData[]>([]);

  // Calculate items per view based on window width
  const [itemsVisible, setItemsVisible] = useState(4);
  useEffect(() => {
    const updateItemsVisible = () => {
      if (window.innerWidth < 640) setItemsVisible(1);
      else if (window.innerWidth < 768) setItemsVisible(1);
      else if (window.innerWidth < 1024) setItemsVisible(2);
      else setItemsVisible(4);
    };
    updateItemsVisible();
    window.addEventListener('resize', updateItemsVisible);
    return () => window.removeEventListener('resize', updateItemsVisible);
  }, []);

  // Fetch services from backend API
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await api.get('/services');
        if (res.data?.status === 'success' && res.data?.data) {
          setServices(res.data.data);
        }
      } catch {
        // Silently fail
      }
    };
    fetchServices();
  }, []);

  const maxIndex = Math.max(0, services.length - itemsVisible);

  useEffect(() => {
    if (!isAutoPlaying) return;

    autoPlayTimerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 3000);

    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
      }
    };
  }, [isAutoPlaying, maxIndex, currentIndex]);

  const handleMouseEnter = () => {
    setIsAutoPlaying(false);
  };

  const handleMouseLeave = () => {
    setIsAutoPlaying(true);
  };

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
  };

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  return (
    <section id="services" className="py-12 sm:py-16 md:py-20 lg:py-24 bg-[#e8eef6] dark:bg-gray-800 relative z-0">
      <div className="container-custom px-4 sm:px-6 lg:px-8" ref={ref}>
        {/* Section Header */}
        <div className={`text-center mb-8 sm:mb-12 md:mb-14 lg:mb-16 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <p className="text-[#00BFA6] font-semibold mb-2 sm:mb-3 md:mb-4 text-xs sm:text-sm tracking-wide">{t('ourServices')}</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[36px] font-bold text-[#0f2744] dark:text-white mb-3 sm:mb-4 md:mb-5 px-4">
            {t('servicesTitle')}
          </h2>
          <p className="text-[#5a6a7a] dark:text-gray-400 max-w-3xl mx-auto text-sm sm:text-base md:text-lg leading-relaxed px-4">
            {t('servicesSubtitle')}
          </p>
        </div>

        {/* Custom Slider */}
        <div className="relative">
          {/* Left Arrow */}
          {services.length > itemsVisible && (
            <button
              onClick={handlePrev}
              className="absolute left-0 sm:-left-4 lg:-left-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-gray-700 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 transition-all hover:scale-110 border border-gray-200 dark:border-gray-600"
              aria-label="Previous slide"
            >
              <FiChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-[#0f2744] dark:text-white" />
            </button>
          )}

          {/* Right Arrow */}
          {services.length > itemsVisible && (
            <button
              onClick={handleNext}
              className="absolute right-0 sm:-right-4 lg:-right-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-gray-700 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 transition-all hover:scale-110 border border-gray-200 dark:border-gray-600"
              aria-label="Next slide"
            >
              <FiChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-[#0f2744] dark:text-white" />
            </button>
          )}

          {/* Slider Container */}
          <div className="overflow-hidden select-none px-1 sm:px-2" ref={sliderRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <div
              className="flex transition-transform duration-500 py-2 sm:py-3 md:py-4 ease-out gap-3 sm:gap-4 md:gap-5 lg:gap-6"
              style={{ 
                transform: `translateX(calc(-${currentIndex} * (${
                  itemsVisible === 1 ? '100%' :
                  itemsVisible === 2 ? '50%' : '25%'
                } + ${itemsVisible === 1 ? '12px' :
                  itemsVisible === 2 ? '20px' : '24px'})))`,
                willChange: 'transform'
              }}
            >
              {services.map((service, index) => (
                <div
                  key={service._id}
                  className={`shrink-0 bg-white dark:bg-gray-700 rounded-lg sm:rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 sm:hover:-translate-y-2 flex flex-col w-full sm:w-full md:w-[calc(50%-10px)] lg:w-[calc(25%-18px)] ${
                    isVisible ? 'animate-fade-in-up' : 'opacity-0'
                  }`}
                  style={{ 
                    animationDelay: `${index * 100}ms` 
                  }}
                >
                  {/* Image */}
                  <div className="h-36 sm:h-40 md:h-44 lg:h-48 xl:h-52 p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl bg-white dark:bg-gray-700 overflow-hidden">
                    {service.image ? (
                      <SafeImage
                        src={service.image}
                        alt={service.name}
                        width={400}
                        height={300}
                        className="w-full h-full object-cover rounded-lg sm:rounded-xl transition-transform duration-500 hover:scale-105"
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg sm:rounded-xl">
                        <span className="text-gray-400 text-2xl">🧺</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-3 sm:p-4 md:p-5 lg:p-6 flex flex-col grow">
                    <div className="flex items-center justify-between mb-2 md:mb-3 gap-2">
                      <h3 className="text-base sm:text-lg md:text-xl font-bold text-[#0f2744] dark:text-white truncate">{service.name}</h3>
                      <span className="text-[#0f2744] dark:text-white font-bold text-sm sm:text-base md:text-lg shrink-0">
                        {formatPrice(service.pricingType === 'per_kg' ? service.pricePerKg : service.pricePerItem)}
                      </span>
                    </div>
                    <p className="text-[#5a6a7a] dark:text-gray-300 text-xs sm:text-sm mb-3 sm:mb-4 md:mb-5 leading-relaxed grow">{service.shortDescription}</p>
                    <Link
                      href={`/services/${service.slug}`}
                      className="w-full block text-center bg-[#0f2744] dark:bg-[#00BFA6] text-white py-2.5 sm:py-3 md:py-3.5 rounded-lg sm:rounded-xl border-2 border-[#0f2744] dark:border-[#00BFA6] font-semibold text-xs sm:text-sm md:text-base transition-all duration-300 hover:bg-[#1a3a5c] dark:hover:bg-[#00A892] hover:border-[#1a3a5c] dark:hover:border-[#00A892] hover:shadow-lg mt-auto"
                    >
                      {t('getTheService')}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination Dots */}
          <div className="flex justify-center gap-1.5 sm:gap-2 mt-6 sm:mt-8 md:mt-10">
            {Array.from({ length: maxIndex + 1 }).map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`h-2 sm:h-2.5 md:h-3 rounded-full transition-all duration-300 ${
                  currentIndex === index ? 'bg-[#0f2744] dark:bg-[#00BFA6] w-5 sm:w-5.5 md:w-6' : 'bg-[#c5d0dc] dark:bg-gray-600 w-2 sm:w-2.5 md:w-3'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;

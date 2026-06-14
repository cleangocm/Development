'use client';

import { useState, useEffect } from 'react';
import { FiArrowUp } from 'react-icons/fi';

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className={`fixed bottom-6 left-6 z-50 w-11 h-11 rounded-full bg-[#0F2744] dark:bg-[#00BFA6] text-white shadow-lg flex items-center justify-center transition-all duration-300 hover:bg-[#00BFA6] dark:hover:bg-[#0F2744] hover:scale-110 hover:shadow-xl ${
        isVisible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <FiArrowUp className="w-5 h-5" />
    </button>
  );
};

export default ScrollToTop;

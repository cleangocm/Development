'use client';

import Image from 'next/image';
import { useScrollAnimation } from '@/hooks';
import { MdVerifiedUser, MdCheckCircle } from 'react-icons/md';

const About = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section id="about" className="py-20 md:py-28 bg-[#F1F5F9] dark:bg-gray-900">
      <div className="container-custom" ref={ref}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Image Side */}
          <div className={`relative ${isVisible ? 'animate-fade-in-left' : 'opacity-0'}`}>
            <div className="relative rounded-2xl overflow-hidden">
              <Image
                src="/Images/brand/cleango-official.png"
                alt="CleanGo collecte dechets"
                width={700}
                height={550}
                className="w-full h-auto object-cover rounded-2xl"
              />
            </div>
          </div>

          {/* Content Side */}
          <div className={`${isVisible ? 'animate-fade-in-right' : 'opacity-0'}`}>
            <p className="text-[#00BFA6] font-semibold mb-4 text-sm tracking-wide">A propos</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0f2744] dark:text-white mb-6 leading-tight">
              Une collecte propre que vous pouvez suivre
            </h2>
            <p className="text-[#5a6a7a] dark:text-gray-400 mb-4 leading-relaxed text-base">
              CleanGo aide les foyers et entreprises a organiser leurs collectes de dechets
              avec des plans simples, des rappels et un suivi clair depuis le tableau de bord.
            </p>
            <p className="text-[#5a6a7a] dark:text-gray-400 mb-8 leading-relaxed text-base">
              Notre objectif est de rendre chaque quartier plus propre grace a des ramassages
              fiables, des collecteurs identifies et des paiements faciles par mobile money,
              virement ou cash.
            </p>

            {/* Features Box */}
            <div className="bg-[#e6f7f2] dark:bg-[#14b8a6]/10 rounded-xl p-6 border-l-4 border-[#14b8a6]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center shrink-0 shadow-sm">
                    <MdVerifiedUser className="w-5 h-5 text-[#14b8a6]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0f2744] dark:text-white mb-1">Collecteurs verifies</h4>
                    <p className="text-[#5a6a7a] dark:text-gray-400 text-sm leading-relaxed">
                      Les missions sont attribuees et suivies pour plus de transparence.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center shrink-0 shadow-sm">
                    <MdCheckCircle className="w-5 h-5 text-[#14b8a6]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0f2744] dark:text-white mb-1">Quartiers plus propres</h4>
                    <p className="text-[#5a6a7a] dark:text-gray-400 text-sm leading-relaxed">
                      Des collectes regulieres pour reduire les depots sauvages.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;

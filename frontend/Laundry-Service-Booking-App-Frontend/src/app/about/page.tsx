'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiCheckCircle, FiUsers, FiHeart, FiTarget, FiTrendingUp } from 'react-icons/fi';
import api from '@/services/api';

const AboutPage = () => {
  const [siteName, setSiteName] = useState('Ultra Wash');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/public/site-settings');
        if (res.data?.status === 'success' && res.data?.data?.siteName) {
          setSiteName(res.data.data.siteName);
        }
      } catch { /* use default */ }
    };
    fetchSettings();
  }, []);
  const values = [
    {
      icon: <FiCheckCircle className="w-8 h-8 sm:w-10 sm:h-10" />,
      title: 'Quality First',
      description: 'We never compromise on quality. Every garment receives premium care and attention to detail.',
    },
    {
      icon: <FiUsers className="w-8 h-8 sm:w-10 sm:h-10" />,
      title: 'Customer Focused',
      description: 'Your satisfaction is our priority. We listen, adapt, and deliver exceptional service every time.',
    },
    {
      icon: <FiHeart className="w-8 h-8 sm:w-10 sm:h-10" />,
      title: 'Eco-Friendly',
      description: 'We use environmentally safe products and sustainable practices to protect our planet.',
    },
    {
      icon: <FiTarget className="w-8 h-8 sm:w-10 sm:h-10" />,
      title: 'Reliability',
      description: 'Count on us for timely service and consistent results. We respect your time and schedule.',
    },
  ];

  const stats = [
    { number: '5K+', label: 'Happy Customers' },
    { number: '30K+', label: 'Garments Cleaned' },
    { number: '8+', label: 'Services Offered' },
    { number: '98%', label: 'Satisfaction Rate' },
  ];

  const team = [
    {
      name: 'Arif Rahman',
      role: 'Founder & CEO',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      description: 'With years of experience in the textile care industry, Arif founded the company to bring professional laundry services to every household.',
    },
    {
      name: 'Nasreen Sultana',
      role: 'Operations Manager',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
      description: 'Nasreen ensures every operation runs smoothly and efficiently, maintaining quality standards across all services.',
    },
    {
      name: 'Tanvir Hasan',
      role: 'Customer Relations Lead',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
      description: 'Tanvir leads our customer support team with a focus on delivering the best experience for every client.',
    },
  ];

  return (
    <>

      <main className="min-h-screen bg-white dark:bg-gray-900 pt-20 sm:pt-24 mb-10">
        {/* Hero Section */}
        <section className="relative bg-linear-to-br from-[#0F2744] via-[#1a3a5c] to-[#0F2744] text-white py-16 sm:py-20 md:py-28 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wIDhoLTJ2LTJoMnYyem0tNCA0aC0ydi0yaDJ2MnptMC00aC0ydi0yaDJ2MnptMC00aC0ydi0yaDJ2MnptLTQgNGgtMnYtMmgydjJ6bTAtNGgtMnYtMmgydjJ6bTAtNGgtMnYtMmgydjJ6bS00IDRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
          </div>
          <div className="container-custom px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
                About {siteName} Laundry
              </h1>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-200 leading-relaxed">
                Your trusted partner for premium laundry and dry cleaning services. We&apos;re committed to delivering excellence with every garment we handle.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 sm:py-16 bg-gray-50 dark:bg-gray-800">
          <div className="container-custom px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-700 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center shadow-sm hover:shadow-lg transition-all duration-300 animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#00BFA6] mb-2 sm:mb-3">
                    {stat.number}
                  </div>
                  <div className="text-sm sm:text-base text-gray-600 dark:text-gray-300 font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="py-12 sm:py-16 md:py-20">
          <div className="container-custom px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="animate-fade-in-up">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#0F2744] dark:text-white mb-4 sm:mb-6">
                  Our Story
                </h2>
                <div className="space-y-4 sm:space-y-6 text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  <p>
                    {siteName} Laundry was founded with a simple mission: to provide the highest quality laundry and dry cleaning services with unmatched customer care. What started as a small operation has grown into a trusted name serving thousands of satisfied customers.
                  </p>
                  <p>
                    We recognized the need for a laundry service that combines traditional craftsmanship with modern convenience. Our team of skilled professionals shares a passion for excellence, treating every garment with individual care and attention.
                  </p>
                  <p>
                    Today, we offer a full range of services from everyday wash & fold to premium dry cleaning and specialty care. With convenient pickup and delivery, eco-friendly practices, and transparent pricing, we make professional garment care accessible to everyone.
                  </p>
                </div>
              </div>
              <div className="relative h-64 sm:h-80 md:h-96 lg:h-full min-h-100 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <Image
                  src="https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800&h=1000&fit=crop"
                  alt="Our Story"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-12 sm:py-16 md:py-20 bg-gray-50 dark:bg-gray-800">
          <div className="container-custom px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-12 md:mb-16 animate-fade-in">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#0F2744] dark:text-white mb-4 sm:mb-6">
                Our Core Values
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400">
                These principles guide everything we do and shape our commitment to you
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {values.map((value, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-700 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-[#00BFA6]/10 dark:bg-[#00BFA6]/20 rounded-full text-[#00BFA6] mb-4 sm:mb-6">
                    {value.icon}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-[#0F2744] dark:text-white mb-2 sm:mb-3">
                    {value.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission & Vision Section */}
        <section className="py-12 sm:py-16 md:py-20">
          <div className="container-custom px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              <div className="bg-linear-to-br from-[#0F2744] to-[#1a3a5c] rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 text-white animate-fade-in-up">
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <FiTarget className="w-10 h-10 sm:w-12 sm:h-12" />
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Our Mission</h2>
                </div>
                <p className="text-sm sm:text-base md:text-lg text-gray-200 leading-relaxed">
                  To provide exceptional laundry and dry cleaning services that exceed customer expectations while maintaining the highest standards of quality, reliability, and environmental responsibility. We strive to make laundry care convenient, affordable, and stress-free for every customer.
                </p>
              </div>
              <div className="bg-linear-to-br from-[#00BFA6] to-[#00A892] rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 text-white animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <FiTrendingUp className="w-10 h-10 sm:w-12 sm:h-12" />
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Our Vision</h2>
                </div>
                <p className="text-sm sm:text-base md:text-lg text-gray-100 leading-relaxed">
                  To become the most trusted and innovative laundry service provider in the region, setting new standards for quality and customer satisfaction. We envision a future where professional garment care is accessible to everyone, combining cutting-edge technology with traditional craftsmanship.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-12 sm:py-16 md:py-20 bg-gray-50 dark:bg-gray-800">
          <div className="container-custom px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-12 md:mb-16 animate-fade-in">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#0F2744] dark:text-white mb-4 sm:mb-6">
                Meet Our Leadership Team
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400">
                Passionate professionals dedicated to delivering excellence
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {team.map((member, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-700 rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="relative h-64 sm:h-72 md:h-80">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-6 sm:p-8">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-[#0F2744] dark:text-white mb-1 sm:mb-2">
                      {member.name}
                    </h3>
                    <p className="text-sm sm:text-base text-[#00BFA6] font-semibold mb-3 sm:mb-4">
                      {member.role}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                      {member.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-16 md:py-20">
          <div className="container-custom px-4 sm:px-6 lg:px-8">
            <div className="bg-linear-to-br from-[#0F2744] via-[#1a3a5c] to-[#0F2744] rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-16 text-center text-white animate-fade-in-up">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
                Experience the {siteName} Difference
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-200 mb-6 sm:mb-8 max-w-3xl mx-auto">
                Join thousands of satisfied customers who trust us with their garment care. Book your first service today and discover why we&apos;re the preferred choice for laundry excellence.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Link
                  href="/services"
                  className="inline-block bg-white text-[#0F2744] px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-sm sm:text-base hover:bg-gray-100 transition-all duration-300 hover:scale-105"
                >
                  View Our Services
                </Link>
                <Link
                  href="/contact"
                  className="inline-block bg-[#00BFA6] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-sm sm:text-base hover:bg-[#00A892] transition-all duration-300 hover:scale-105"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default AboutPage;

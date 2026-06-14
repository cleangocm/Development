'use client';

import { useEffect, useRef, useState } from 'react';
import SafeImage from '@/components/ui/SafeImage';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { FiArrowLeft, FiStar, FiMapPin, FiPhone, FiMail, FiClock, FiCheck, FiNavigation } from 'react-icons/fi';
import { useStoreStore } from '@/store/storeStore';

const StoreDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletMapRef = useRef<any>(null);

  const {
    selectedStore,
    isDetailLoading,
    error,
    getStoreBySlug,
    clearSelectedStore,
  } = useStoreStore();

  // Fetch store on mount
  useEffect(() => {
    if (slug) {
      getStoreBySlug(slug);
    }
    return () => clearSelectedStore();
  }, [slug, getStoreBySlug, clearSelectedStore]);

  // Load Leaflet CSS
  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    setIsMapLoaded(true);
  }, []);

  // Initialize Leaflet map when store data is available
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || !selectedStore) return;
    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }

    const [lng, lat] = selectedStore.location.coordinates;

    import('leaflet').then((L) => {
      if (!mapRef.current) return;

      // Inject CSS if not yet present
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      const map = L.map(mapRef.current, { center: [lat, lng], zoom: 15, scrollWheelZoom: false });

      // CartoDB Voyager - always renders in English
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '\u00a9 <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> \u00a9 <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(map);

      const icon = L.divIcon({
        className: '',
        html: `
          <div style="position:relative;width:44px;height:54px;">
            <svg width="44" height="54" viewBox="0 0 44 54" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 0C10 0 0 10 0 22c0 17 22 32 22 32s22-15 22-32C44 10 34 0 22 0z" fill="#0f2744"/>
              <circle cx="22" cy="20" r="13" fill="white"/>
              <path d="M13 15h18v2.5H13zM15.5 20h13v7H15.5z" fill="#0f2744"/>
              <rect x="20" y="22" width="4" height="5" fill="#0f2744"/>
            </svg>
          </div>`,
        iconSize: [44, 54],
        iconAnchor: [22, 54],
        popupAnchor: [0, -56],
      });

      L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(`<div style="font-family:sans-serif;"><b>${selectedStore.name}</b><br/><span style="font-size:12px;color:#666;">${selectedStore.address}</span></div>`)
        .openPopup();

      leafletMapRef.current = map;
    });

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [isMapLoaded, selectedStore]);

  // Get day name
  const getDayName = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  // Convert 24h "HH:MM" to 12h "hh:mm AM/PM"
  const formatTime12h = (time24: string) => {
    const [h, m] = time24.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  // Check if a day is today in the store's timezone
  const isToday = (day: string) => {
    if (!selectedStore) return false;
    const tz = selectedStore.timezone || 'Asia/Dhaka';
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'long',
    });
    return formatter.format(now).toLowerCase() === day;
  };

  // Check if store is currently open (timezone-aware on client)
  const isStoreCurrentlyOpen = () => {
    if (!selectedStore) return false;
    const tz = selectedStore.timezone || 'Asia/Dhaka';
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const weekday = parts.find(p => p.type === 'weekday')?.value?.toLowerCase() || '';
    const hour = parts.find(p => p.type === 'hour')?.value || '00';
    const minute = parts.find(p => p.type === 'minute')?.value || '00';
    const currentTime = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = days.includes(weekday) ? weekday : days[new Date().getDay()];
    const todayHours = selectedStore.operatingHours.find(h => h.day === currentDay);
    if (!todayHours || todayHours.isClosed) return false;
    return currentTime >= todayHours.openTime && currentTime <= todayHours.closeTime;
  };

  // Get timezone display name
  const getTimezoneLabel = () => {
    if (!selectedStore) return '';
    const tz = selectedStore.timezone || 'Asia/Dhaka';
    try {
      const now = new Date();
      const short = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' })
        .formatToParts(now)
        .find(p => p.type === 'timeZoneName')?.value || '';
      return `${tz.replace(/_/g, ' ')} (${short})`;
    } catch {
      return tz;
    }
  };

  // Render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-gray-600 dark:text-gray-400 ml-2">
          {rating || 0} ({selectedStore?.totalReviews || 0} reviews)
        </span>
      </div>
    );
  };

  if (isDetailLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 pt-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00BFA6] mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading store details...</p>
        </div>
      </div>
    );
  }

  if (error || !selectedStore) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 pt-20">
        <div className="text-center">
          <FiMapPin className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">Store Not Found</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error || 'The store you are looking for does not exist.'}</p>
          <Link
            href="/stores"
            className="inline-flex items-center gap-2 bg-[#0f2744] dark:bg-[#00BFA6] text-white px-6 py-3 rounded-lg border-2 border-[#0f2744] dark:border-[#00BFA6] font-semibold hover:bg-[#1a3a5c] dark:hover:bg-[#00A892] hover:border-[#1a3a5c] dark:hover:border-[#00A892] transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
            Back to Stores
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#00BFA6] transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
            <span>Back to Stores</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Image */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
              <div className="relative h-80 md:h-96">
                <SafeImage
                  src={selectedStore.images[activeImageIndex] || selectedStore.image || '/Images/Home/service-section/img.png'}
                  alt={selectedStore.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 66vw"
                  className="object-cover"
                />
                {/* Open/Closed Badge */}
                <div className={`absolute top-4 left-4 px-4 py-2 rounded-full text-sm font-semibold ${
                  isStoreCurrentlyOpen() ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {isStoreCurrentlyOpen() ? '🟢 Open Now' : '🔴 Closed'}
                </div>
              </div>
              
              {/* Image Thumbnails */}
              {selectedStore.images.length > 1 && (
                <div className="p-4 flex gap-2 overflow-x-auto">
                  {selectedStore.images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={`relative w-20 h-20 shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                        activeImageIndex === index ? 'border-[#00BFA6]' : 'border-transparent'
                      }`}
                    >
                      <SafeImage
                        src={img}
                        alt={`${selectedStore.name} ${index + 1}`}
                        fill
                        sizes="5rem"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Store Info */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h1 className="text-2xl md:text-3xl font-bold text-[#0f2744] dark:text-white mb-3">
                {selectedStore.name}
              </h1>
              
              {renderStars(selectedStore.rating)}

              <p className="text-gray-600 dark:text-gray-400 mt-4 leading-relaxed">
                {selectedStore.description}
              </p>

              {/* Features */}
              {selectedStore.features.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-[#0f2744] dark:text-white mb-3">Features</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedStore.features.map((feature, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#00BFA6]/10 text-[#00BFA6] rounded-full text-sm"
                      >
                        <FiCheck className="w-4 h-4" />
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Operating Hours */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-[#0f2744] dark:text-white mb-4 flex items-center gap-2">
                <FiClock className="w-5 h-5 text-[#00BFA6]" />
                Operating Hours
                <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-auto">
                  {getTimezoneLabel()}
                </span>
              </h3>
              <div className="space-y-2">
                {selectedStore.operatingHours.map((hours) => (
                  <div
                    key={hours.day}
                    className={`flex justify-between py-2 px-3 rounded-lg ${
                      isToday(hours.day) ? 'bg-[#00BFA6]/10' : ''
                    }`}
                  >
                    <span className={`font-medium ${isToday(hours.day) ? 'text-[#00BFA6]' : 'text-gray-700 dark:text-gray-300'}`}>
                      {getDayName(hours.day)}
                      {isToday(hours.day) && <span className="ml-2 text-xs">(Today)</span>}
                    </span>
                    <span className={hours.isClosed ? 'text-red-500 font-medium' : 'text-gray-600 dark:text-gray-400'}>
                      {hours.isClosed ? 'Closed' : `${formatTime12h(hours.openTime)} - ${formatTime12h(hours.closeTime)}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Map & Contact */}
          <div className="space-y-6 z-10">
            {/* Map */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg">
              <div ref={mapRef} className="w-full h-64" />
              
              {/* Get Directions Button */}
              <div className="p-4">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedStore.location.coordinates[1]},${selectedStore.location.coordinates[0]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-[#0f2744] dark:bg-[#00BFA6] text-white py-3 rounded-lg border-2 border-[#0f2744] dark:border-[#00BFA6] font-semibold hover:bg-[#1a3a5c] dark:hover:bg-[#00A892] hover:border-[#1a3a5c] dark:hover:border-[#00A892] transition-colors"
                >
                  <FiNavigation className="w-5 h-5" />
                  Get Directions
                </a>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-[#0f2744] dark:text-white mb-4">Contact Information</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <FiMapPin className="w-5 h-5 text-[#00BFA6] mt-1 shrink-0" />
                  <div>
                    <p className="text-gray-700 dark:text-gray-300">{selectedStore.address}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      {selectedStore.area}, {selectedStore.city} - {selectedStore.zipCode}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <FiPhone className="w-5 h-5 text-[#00BFA6] shrink-0" />
                  <a href={`tel:${selectedStore.phone}`} className="text-gray-700 dark:text-gray-300 hover:text-[#00BFA6]">
                    {selectedStore.phone}
                  </a>
                </div>

                <div className="flex items-center gap-3">
                  <FiMail className="w-5 h-5 text-[#00BFA6] shrink-0" />
                  <a href={`mailto:${selectedStore.email}`} className="text-gray-700 dark:text-gray-300 hover:text-[#00BFA6]">
                    {selectedStore.email}
                  </a>
                </div>
              </div>
            </div>

            {/* Book Now CTA */}
            <div className="bg-linear-to-r from-[#0f2744] to-[#00BFA6] rounded-2xl p-6 text-white">
              <h3 className="text-xl font-bold mb-2">Ready to Book?</h3>
              <p className="text-white/80 text-sm mb-4">
                Schedule your laundry pickup from this location
              </p>
              <Link
                href={`/services?store=${selectedStore.slug}`}
                className="block w-full bg-white text-[#0f2744] py-3 rounded-lg font-semibold text-center hover:bg-gray-100 transition-colors"
              >
                Book Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreDetailPage;

'use client';

import { useState, useEffect, useRef } from 'react';
import SafeImage from '@/components/ui/SafeImage';
import Link from 'next/link';
import { MdSearch } from 'react-icons/md';
import { FaStar } from 'react-icons/fa';
import { FiLoader, FiMapPin } from 'react-icons/fi';
import { useStoreStore, Store } from '@/store/storeStore';

const ServiceNetwork = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletMapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);
  
  const { stores, isLoading, error, getStores } = useStoreStore();

  // Fetch stores on mount
  useEffect(() => {
    getStores();
  }, [getStores]);

  // Filter stores based on search query
  const filteredStores = stores.filter(store => 
    store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.area?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if store is currently open (timezone-aware)
  const isStoreOpen = (store: Store): { isOpen: boolean; closeTime: string } => {
    if (!store.operatingHours || store.operatingHours.length === 0) {
      return { isOpen: store.isOpen ?? true, closeTime: '10:00 PM' };
    }
    const tz = store.timezone || 'Asia/Dhaka';
    const now = new Date();
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, weekday: 'long', hour: '2-digit', minute: '2-digit', hour12: false,
    });
    const parts = fmt.formatToParts(now);
    const weekday = parts.find(p => p.type === 'weekday')?.value?.toLowerCase() || '';
    const hour = parts.find(p => p.type === 'hour')?.value || '00';
    const minute = parts.find(p => p.type === 'minute')?.value || '00';
    const currentTime = `${hour.padStart(2,'0')}:${minute.padStart(2,'0')}`;
    const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const today = days.includes(weekday) ? weekday : days[new Date().getDay()];
    const todayHours = store.operatingHours.find(h => h.day.toLowerCase() === today);
    if (!todayHours || todayHours.isClosed) return { isOpen: false, closeTime: 'Closed' };
    const isOpen = currentTime >= todayHours.openTime && currentTime <= todayHours.closeTime;
    // Format close time to 12h
    const [ch, cm] = todayHours.closeTime.split(':').map(Number);
    const ampm = ch >= 12 ? 'PM' : 'AM';
    const h12 = ch % 12 || 12;
    return { isOpen, closeTime: `${h12}:${cm.toString().padStart(2,'0')} ${ampm}` };
  };

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    import('leaflet').then((L) => {
      if (!mapRef.current || leafletMapRef.current) return;
      const map = L.map(mapRef.current, { center: [23.7945, 90.4143], zoom: 11, zoomControl: true, scrollWheelZoom: false });
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '\u00a9 <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> \u00a9 <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(map);
      leafletMapRef.current = map;
    });
    return () => {
      if (leafletMapRef.current) { leafletMapRef.current.remove(); leafletMapRef.current = null; }
    };
  }, []);

  // Update markers when stores change
  useEffect(() => {
    if (!leafletMapRef.current) return;
    import('leaflet').then((L) => {
      const map = leafletMapRef.current;
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      const validStores = filteredStores.filter(s => s.location?.coordinates);
      validStores.forEach((store) => {
        const [lng, lat] = store.location.coordinates;
        const { isOpen } = isStoreOpen(store);
        const icon = L.divIcon({
          className: '',
          html: `<div style="position:relative;width:32px;height:40px;">
            <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 0C7 0 0 7 0 16c0 12 16 24 16 24s16-12 16-24C32 7 25 0 16 0z" fill="#0f2744"/>
              <circle cx="16" cy="15" r="9" fill="white"/>
              <path d="M10 11h12v2H10zM11.5 14.5h9v5.5h-9z" fill="#0f2744"/>
              <rect x="14" y="16" width="4" height="4" fill="#0f2744"/>
            </svg>
            <div style="position:absolute;top:1px;right:-2px;width:9px;height:9px;background:${isOpen ? '#22c55e' : '#ef4444'};border:2px solid white;border-radius:50%;"></div>
          </div>`,
          iconSize: [32, 40], iconAnchor: [16, 40], popupAnchor: [0, -42],
        });
        const marker = L.marker([lat, lng], { icon })
          .addTo(map)
          .bindPopup(`<div style="font-family:sans-serif;min-width:160px;">
            <b style="color:#0f2744;font-size:13px;">${store.name}</b>
            <p style="font-size:11px;color:#666;margin:4px 0;">${store.address}</p>
            <div style="display:flex;align-items:center;gap:5px;">
              <span style="width:7px;height:7px;background:${isOpen?'#22c55e':'#ef4444'};border-radius:50%;display:inline-block;"></span>
              <span style="font-size:11px;font-weight:600;color:${isOpen?'#16a34a':'#dc2626'};">${isOpen?'Open Now':'Closed'}</span>
            </div>
            <a href="/stores/${store.slug}" style="display:inline-block;margin-top:6px;padding:3px 10px;background:#0f2744;color:white;border-radius:5px;font-size:11px;text-decoration:none;">View Store \u2192</a>
          </div>`, { maxWidth: 200 });
        markersRef.current.push(marker);
      });
      if (validStores.length > 0) {
        const coords: [number, number][] = validStores.map(s => { const [lng,lat] = s.location.coordinates; return [lat,lng]; });
        map.fitBounds(L.latLngBounds(coords), { padding: [40,40] });
      }
    });
  }, [filteredStores]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <FaStar
        key={index}
        className={`w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 ${index < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-28 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="container-custom px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-12 md:mb-14 lg:mb-16">
          <p className="text-[#00BFA6] font-semibold mb-2 sm:mb-3 text-xs sm:text-sm">Coverage Area</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-bold text-[#0f2744] dark:text-white mb-3 sm:mb-4 px-4">
            Our Service Network
          </h2>
          <p className="text-[#5a6a7a] dark:text-gray-400 max-w-3xl mx-auto text-sm sm:text-base leading-relaxed px-4">
            Delivering excellence across the city. Discover our store locations and enjoy the convenience of professional dry cleaning and laundry services right in your area.
          </p>
        </div>

        <div className="relative h-96 sm:h-[480px] md:h-[540px] lg:h-[600px] xl:h-[600px] rounded-xl sm:rounded-2xl overflow-hidden shadow-xl sm:shadow-2xl">
          {/* Leaflet Map Background */}
          <div className="absolute inset-0 z-0">
            <div ref={mapRef} className="w-full h-full" />
          </div>

          {/* Left Sidebar */}
          <div className="absolute top-0 left-0 h-full w-full sm:w-[320px] md:w-[350px] lg:w-[380px] xl:w-[420px] bg-white dark:bg-gray-800 shadow-xl sm:shadow-2xl z-[40] flex flex-col">
            {/* Header */}
            <div className="p-3 sm:p-4 md:p-5 lg:p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-[#0f2744] dark:text-white mb-1">Our Store</h3>
              
              {/* Search Box */}
              <div className="relative mt-2 sm:mt-3 md:mt-4">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-[#0f2744] dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00BFA6] text-xs sm:text-sm"
                />
                <MdSearch className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-400" />
              </div>
            </div>

            {/* Store List */}
            <div className="flex-1 overflow-y-auto">
              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <FiLoader className="w-8 h-8 text-[#00BFA6] animate-spin" />
                </div>
              )}

              {/* Network Error */}
              {!isLoading && error && filteredStores.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <FiMapPin className="w-12 h-12 text-red-300 mb-4" />
                  <p className="text-red-500 text-center mb-2">Failed to load stores</p>
                  <p className="text-gray-400 text-xs text-center mb-4">Check your connection and try again</p>
                  <button
                    onClick={() => getStores()}
                    className="text-[#00BFA6] hover:underline font-medium text-sm"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* No Stores Found */}
              {!isLoading && !error && filteredStores.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <FiMapPin className="w-12 h-12 text-gray-300 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-center">
                    {searchQuery ? 'No stores found matching your search' : 'No stores available'}
                  </p>
                </div>
              )}

              {/* Store List */}
              {!isLoading && filteredStores.map((store) => {
                const storeStatus = isStoreOpen(store);
                const storeImage = store.images?.[0] || '/Images/Home/location-section/location-1.png';
                
                return (
                  <Link
                    href={`/stores/${store.slug}`}
                    key={store._id}
                    className="block relative group"
                    onMouseEnter={() => setHoveredCard(store._id)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    {/* Left Border on Hover */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 bg-[#00BFA6] transition-all duration-300 ${
                        hoveredCard === store._id ? 'opacity-100' : 'opacity-0'
                      }`}
                    ></div>

                    <div className="p-2.5 sm:p-3 md:p-4 lg:p-5 border-b border-gray-100 dark:border-gray-700 cursor-pointer transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <div className="flex gap-2 sm:gap-3 md:gap-4">
                        {/* Store Image */}
                        <div className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 lg:w-20 lg:h-20 shrink-0 rounded-lg overflow-hidden">
                          <SafeImage
                            src={storeImage}
                            alt={store.name}
                            fill
                            sizes="5rem"
                            className="object-cover"
                          />
                        </div>

                        {/* Store Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-[#0f2744] dark:text-white mb-0.5 sm:mb-1 text-[10px] sm:text-xs md:text-sm truncate">{store.name}</h4>
                          
                          {/* Rating */}
                          <div className="flex items-center gap-1 sm:gap-1.5 mb-1 sm:mb-1.5 md:mb-2">
                            <div className="flex">{renderStars(store.rating || 4.5)}</div>
                            <span className="text-[#0f2744] dark:text-white text-[10px] sm:text-xs font-semibold">{store.rating?.toFixed(1) || '4.5'}</span>
                          </div>

                          {/* Status */}
                          <div className={`flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs mb-1 sm:mb-1.5 ${storeStatus.isOpen ? 'text-green-600' : 'text-red-500'}`}>
                            <span className="font-semibold">{storeStatus.isOpen ? 'Open' : 'Closed'}</span>
                            {storeStatus.isOpen && (
                              <>
                                <span>•</span>
                                <span className="hidden sm:inline">Close {storeStatus.closeTime}</span>
                                <span className="sm:hidden">{storeStatus.closeTime}</span>
                              </>
                            )}
                          </div>

                          {/* Address */}
                          <p className="text-gray-600 text-[10px] sm:text-[10px] md:text-xs line-clamp-2">{store.address}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}

              {/* View All Link */}
              {!isLoading && filteredStores.length > 0 && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <Link 
                    href="/stores" 
                    className="block text-center text-[#00BFA6] font-semibold hover:underline"
                  >
                    View All Stores →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServiceNetwork;

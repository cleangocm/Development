'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import SafeImage from '@/components/ui/SafeImage';
import Link from 'next/link';
import { FiSearch, FiMapPin, FiStar, FiNavigation } from 'react-icons/fi';
import { useStoreStore, Store } from '@/store/storeStore';

const StoresPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletMapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);

  const {
    stores,
    nearbyStores,
    userLocation,
    isLoading,
    isNearbyLoading,
    getStores,
    getNearbyStores,
    getUserLocation,
  } = useStoreStore();

  // Display stores - prefer search results when searching, else nearby if available, else all stores
  const displayStores = isSearching ? stores : (nearbyStores.length > 0 ? nearbyStores : stores);

  // Load Leaflet CSS dynamically
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

  // Get user location and fetch stores on mount
  useEffect(() => {
    const initializeStores = async () => {
      // Try to get user location
      const locationSuccess = await getUserLocation();
      
      if (locationSuccess) {
        // If location available, get nearby stores
        const { userLocation } = useStoreStore.getState();
        if (userLocation) {
          await getNearbyStores(userLocation.lat, userLocation.lng, 10);
        }
      }
      
      // Always fetch all stores as fallback
      await getStores();
      setInitialized(true);
    };

    initializeStores();
  }, [getUserLocation, getNearbyStores, getStores]);

  // Initialize Leaflet map
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current) return;
    if (leafletMapRef.current) return; // already initialized

    import('leaflet').then((L) => {
      const defaultCenter: [number, number] = userLocation
        ? [userLocation.lat, userLocation.lng]
        : [23.7945, 90.4143];

      const map = L.map(mapRef.current!, {
        center: defaultCenter,
        zoom: 12,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      // CartoDB Voyager - always renders in English
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '\u00a9 <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> \u00a9 <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(map);

      // User location marker
      if (userLocation) {
        const userIcon = L.divIcon({
          className: '',
          html: `<div style="width:16px;height:16px;background:#4285F4;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
          .addTo(map)
          .bindPopup('<b>Your Location</b>');
      }

      leafletMapRef.current = map;
    });

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [isMapLoaded, userLocation]);

  // Update Leaflet markers when stores change
  useEffect(() => {
    if (!leafletMapRef.current || !isMapLoaded) return;

    import('leaflet').then((L) => {
      const map = leafletMapRef.current;

      // Clear existing markers
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      // Add store markers
      displayStores.forEach((store) => {
        const [lng, lat] = store.location.coordinates;
        const isSelected = selectedStoreId === store._id;
        const isOpen = isStoreOpen(store);
        const color = isSelected ? '#00BFA6' : '#0f2744';

        const icon = L.divIcon({
          className: '',
          html: `
            <div style="position:relative;width:36px;height:44px;cursor:pointer;">
              <svg width="36" height="44" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 0C8 0 0 8 0 18c0 13 18 26 18 26s18-13 18-26C36 8 28 0 18 0z" fill="${color}"/>
                <circle cx="18" cy="16" r="10" fill="white"/>
                <path d="M11 12h14v2H11zM13 16h10v6H13z" fill="${color}"/>
                <rect x="16" y="18" width="4" height="4" fill="${color}"/>
              </svg>
              <div style="position:absolute;top:2px;right:-2px;width:10px;height:10px;background:${isOpen ? '#22c55e' : '#ef4444'};border:2px solid white;border-radius:50%;"></div>
            </div>`,
          iconSize: [36, 44],
          iconAnchor: [18, 44],
          popupAnchor: [0, -44],
        });

        const popupHtml = `
          <div style="font-family:sans-serif;min-width:180px;">
            <div style="font-weight:700;font-size:14px;margin-bottom:4px;color:#0f2744;">${store.name}</div>
            <div style="font-size:12px;color:#666;margin-bottom:6px;">${store.address}</div>
            <div style="display:flex;align-items:center;gap:6px;">
              <span style="display:inline-block;width:8px;height:8px;background:${isOpen ? '#22c55e' : '#ef4444'};border-radius:50%;"></span>
              <span style="font-size:12px;font-weight:600;color:${isOpen ? '#16a34a' : '#dc2626'};">${isOpen ? 'Open Now' : 'Closed'}</span>
            </div>
            <a href="/stores/${store.slug}" style="display:inline-block;margin-top:8px;padding:4px 12px;background:#0f2744;color:white;border-radius:6px;font-size:12px;text-decoration:none;">View Store →</a>
          </div>`;

        const marker = L.marker([lat, lng], { icon })
          .addTo(map)
          .bindPopup(popupHtml, { maxWidth: 220 });

        marker.on('click', () => setSelectedStoreId(store._id));
        markersRef.current.push(marker);
      });

      // Fit bounds
      if (displayStores.length > 0) {
        const coords: [number, number][] = displayStores.map(s => {
          const [lng, lat] = s.location.coordinates;
          return [lat, lng];
        });
        if (userLocation) coords.push([userLocation.lat, userLocation.lng]);
        map.fitBounds(L.latLngBounds(coords), { padding: [40, 40] });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayStores, isMapLoaded, selectedStoreId, userLocation]);

  // Handle search
  const handleSearch = useCallback(async () => {
    if (searchQuery.trim()) {
      setIsSearching(true);
      await getStores({ search: searchQuery });
    } else {
      setIsSearching(false);
      if (userLocation) {
        await getNearbyStores(userLocation.lat, userLocation.lng, 10);
      } else {
        await getStores();
      }
    }
  }, [searchQuery, userLocation, getStores, getNearbyStores]);

  // Debounced search — only runs after initialization
  useEffect(() => {
    if (!initialized) return;
    const timer = setTimeout(() => {
      handleSearch();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch, initialized]);

  // Get current day and time in a store's timezone
  const getStoreLocalTime = (store: Store) => {
    const tz = store.timezone || 'Asia/Dhaka';
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
    return { day: weekday, time: `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}` };
  };

  // Convert 24h "HH:MM" to 12h "hh:mm AM/PM"
  const formatTime12h = (time24: string) => {
    const [h, m] = time24.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  // Check if store is currently open (timezone-aware on client)
  const isStoreOpen = (store: Store) => {
    const { day, time } = getStoreLocalTime(store);
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = days.includes(day) ? day : days[new Date().getDay()];
    const todayHours = store.operatingHours.find(h => h.day === currentDay);
    if (!todayHours || todayHours.isClosed) return false;
    return time >= todayHours.openTime && time <= todayHours.closeTime;
  };

  // Get today's hours for a store (timezone-aware)
  const getTodayHours = (store: Store) => {
    const { day } = getStoreLocalTime(store);
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = days.includes(day) ? day : days[new Date().getDay()];
    const hours = store.operatingHours.find(h => h.day === currentDay);
    if (!hours || hours.isClosed) return { text: 'Closed Today', openTime: '', closeTime: '' };
    return {
      text: `${formatTime12h(hours.openTime)} - ${formatTime12h(hours.closeTime)}`,
      openTime: hours.openTime,
      closeTime: hours.closeTime,
    };
  };

  // Render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            className={`w-3.5 h-3.5 ${
              star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">{rating || 0}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)] lg:h-[calc(100vh-80px)]">
        {/* Left Sidebar - Store List */}
        <div className="w-full lg:w-112.5 bg-white dark:bg-gray-800 shadow-lg overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b dark:border-gray-700">
            <h1 className="text-xl font-bold text-[#0f2744] dark:text-white mb-4">Our Store</h1>
            
            {/* Search Input */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stores..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#00BFA6] focus:ring-2 focus:ring-[#00BFA6]/20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Location Info */}
            {userLocation?.address && (
              <div className="flex items-center gap-2 mt-3 text-sm text-gray-600 dark:text-gray-400">
                <FiNavigation className="w-4 h-4 text-[#00BFA6]" />
                <span className="truncate">{userLocation.address}</span>
              </div>
            )}
          </div>

          {/* Store List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading || isNearbyLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#00BFA6]"></div>
              </div>
            ) : displayStores.length === 0 ? (
              <div className="p-6 text-center">
                <FiMapPin className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Store not available in this location
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                  We couldn&apos;t find any stores near you.
                </p>
                <button
                  onClick={() => getStores()}
                  className="text-[#00BFA6] font-semibold hover:underline"
                >
                  Check our all stores →
                </button>
              </div>
            ) : (
              <div className="divide-y dark:divide-gray-700">
                {displayStores.map((store) => (
                  <Link
                    key={store._id}
                    href={`/stores/${store.slug}`}
                    className={`block p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      selectedStoreId === store._id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                    onMouseEnter={() => setSelectedStoreId(store._id)}
                  >
                    <div className="flex gap-3">
                      {/* Store Image */}
                      <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden">
                        <SafeImage
                          src={store.image || '/Images/Home/service-section/img.png'}
                          alt={store.name}
                          fill
                          sizes="5rem"
                          className="object-cover"
                        />
                      </div>

                      {/* Store Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[#0f2744] dark:text-white truncate">
                          {store.name}
                        </h3>
                        
                        {/* Rating */}
                        {renderStars(store.rating)}

                        {/* Open/Close Status */}
                        <div className="flex items-center gap-1 mt-1">
                          <span className={`text-xs font-medium ${isStoreOpen(store) ? 'text-green-600' : 'text-red-500'}`}>
                            {isStoreOpen(store) ? 'Open' : 'Closed'}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          {(() => {
                            const hours = getTodayHours(store);
                            if (!hours.closeTime) return <span className="text-xs text-red-500">Closed Today</span>;
                            return isStoreOpen(store) ? (
                              <span className="text-xs text-green-600">
                                Closes {formatTime12h(hours.closeTime)}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500">
                                Opens {formatTime12h(hours.openTime)}
                              </span>
                            );
                          })()}
                        </div>

                        {/* Address */}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {store.address}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side - OpenStreetMap (Leaflet) */}
        <div className="flex-1 relative min-h-[350px] lg:min-h-0">
          <div ref={mapRef} className="w-full h-full" style={{ minHeight: '400px' }} />
          
          {/* Map Loading Overlay */}
          {!isMapLoaded && (
            <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#00BFA6] mx-auto mb-3"></div>
                <p className="text-gray-500 dark:text-gray-400">Loading map...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoresPage;

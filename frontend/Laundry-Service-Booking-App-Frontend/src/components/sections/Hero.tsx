'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { IoChevronDown } from 'react-icons/io5';
import { FiMapPin, FiLoader, FiAlertCircle, FiNavigation } from 'react-icons/fi';
import { useTheme } from '@/context';
import { useStoreStore, Store } from '@/store/storeStore';

const Hero = () => {
  const { t } = useTheme();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [noStoreFound, setNoStoreFound] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Display stores - prefer nearby if available
  const displayStores = nearbyStores.length > 0 ? nearbyStores : stores;

  // Fetch all stores on mount
  useEffect(() => {
    getStores();
  }, [getStores]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-detect location on mount
  useEffect(() => {
    const autoDetectLocation = async () => {
      setIsDetecting(true);
      setNetworkError(false);
      
      try {
        // Try to get user's real location (falls back to Dhaka default if denied)
        await getUserLocation();
        
        const { userLocation: loc } = useStoreStore.getState();
        if (loc) {
          // Search within 15km radius to cover more area
          const hasNearbyStores = await getNearbyStores(loc.lat, loc.lng, 15);
          setNoStoreFound(!hasNearbyStores);
          
          // Auto-select first nearby store
          if (hasNearbyStores) {
            const { nearbyStores: nearby } = useStoreStore.getState();
            if (nearby.length > 0) {
              setSelectedStore(nearby[0]);
            }
          }
        }
        
        // Check if store fetch had a real network error (not just "no nearby stores")
        const { error, stores: allStores } = useStoreStore.getState();
        if (error && allStores.length === 0 && (error.includes('Network') || error.includes('Failed to fetch'))) {
          setNetworkError(true);
        } else {
          // Clear any non-critical error (e.g. nearby stores 404)
          useStoreStore.getState().clearError();
        }
      } catch {
        setNetworkError(true);
      }
      
      setIsDetecting(false);
    };

    autoDetectLocation();
  }, [getUserLocation, getNearbyStores]);

  // Retry location detection (for when user clicks "Detect My Location")
  const handleRetryLocation = async () => {
    setIsDetecting(true);
    setNoStoreFound(false);
    setNetworkError(false);
    setSelectedStore(null);
    
    try {
      await getUserLocation();
      
      const { userLocation: loc } = useStoreStore.getState();
      if (loc) {
        const hasNearbyStores = await getNearbyStores(loc.lat, loc.lng, 15);
        setNoStoreFound(!hasNearbyStores);
        
        if (hasNearbyStores) {
          const { nearbyStores: nearby } = useStoreStore.getState();
          if (nearby.length > 0) {
            setSelectedStore(nearby[0]);
          }
        }
      }
      
      const { error, stores: allStores } = useStoreStore.getState();
      if (error && allStores.length === 0 && (error.includes('Network') || error.includes('Failed to fetch'))) {
        setNetworkError(true);
      } else {
        useStoreStore.getState().clearError();
      }
    } catch {
      setNetworkError(true);
    }
    setIsDetecting(false);
  };

  // Handle store selection
  const handleSelectStore = (store: Store) => {
    setSelectedStore(store);
    setIsOpen(false);
    setNoStoreFound(false);
  };

  // Handle Book Now
  const handleBookNow = () => {
    if (selectedStore) {
      router.push(`/stores/${selectedStore.slug}`);
    } else {
      router.push('/stores');
    }
  };

  // Handle View All Stores
  const handleViewAllStores = () => {
    router.push('/stores');
  };

  return (
    <section className="relative min-h-screen flex items-center bg-[#f0f4f8]">
      {/* Background Image */}
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src="/Images/Home/Hero.png"
          alt="Laundry Background"
          fill
          sizes="100vw"
          className="object-cover "
          priority
        />
        <div className="absolute inset-0 bg-linear-to-r from-white/35 via-white/10 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="w-full max-w-325 mx-auto relative z-10 pt-32 pb-20 px-4 ">
        <div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-[#0f2744] dark:text-white mb-6 leading-[1.1] animate-fade-in-up" style={{ fontFamily: 'DM Serif Display, serif' }}>
            {t('heroTitle1')}
            <br />
            {t('heroTitle2')}
          </h1>
          
          <p className="text-[#4a5568] dark:text-gray-300 text-lg md:text-xl mb-10 animate-fade-in-up animation-delay-200 max-w-2xl">
            {t('heroSubtitle')}
          </p>

          {/* Location Dropdown & Button */}
          <div className="bg-white dark:bg-[#0f2744] p-4 rounded-lg shadow-md border-2 border-gray-200 dark:border-[#2a4f75] max-w-3xl animate-fade-in-up animation-delay-300">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Store Dropdown */}
              <div className="relative flex-1" ref={dropdownRef}>
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  disabled={isDetecting || isLoading}
                  className="w-full px-6 py-4 bg-gray-50 dark:bg-[#1a3a5c] border border-gray-200 dark:border-[#2a4f75] rounded-lg text-left flex items-center justify-between cursor-pointer focus:outline-none focus:border-[#00BFA6] transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    {isDetecting || isNearbyLoading ? (
                      <FiLoader className="w-5 h-5 text-[#00BFA6] animate-spin" />
                    ) : (
                      <FiMapPin className="w-5 h-5 text-[#00BFA6]" />
                    )}
                    <span className={selectedStore ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>
                      {isDetecting 
                        ? 'Detecting your location...' 
                        : selectedStore 
                          ? `${selectedStore.name}${userLocation?.isDefault ? ' (Default Area)' : ''}` 
                          : t('selectLocation') || 'Select a store location'}
                    </span>
                  </div>
                  <IoChevronDown className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-[100] max-h-64 overflow-y-auto">
                    {/* User Location Info */}
                    {userLocation && (
                      <div className={`px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 ${userLocation.isDefault ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-[#f0f9ff] dark:bg-[#00BFA6]/10'}`}>
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <p className={`text-sm flex items-center gap-2 min-w-0 ${userLocation.isDefault ? 'text-amber-600' : 'text-[#00BFA6]'}`}>
                            <FiMapPin className="w-4 h-4 shrink-0" />
                            <span className="truncate">{userLocation.isDefault ? 'Please allow location access' : (userLocation.address || 'Your Location')}</span>
                          </p>
                          {userLocation.isDefault && (
                            <button
                              onClick={handleRetryLocation}
                              disabled={isDetecting}
                              className="text-xs bg-[#00BFA6] text-white px-2 py-1 rounded flex items-center gap-1 hover:bg-[#009680] transition-colors disabled:opacity-50"
                            >
                              <FiNavigation className="w-3 h-3" />
                              {isDetecting ? 'Detecting...' : 'Allow Location'}
                            </button>
                          )}
                        </div>
                        {userLocation.isDefault && (
                          <p className="text-xs text-amber-500 mt-1">Enable location for nearby stores</p>
                        )}
                      </div>
                    )}

                    {/* No Stores Message */}
                    {noStoreFound && !networkError && (
                      <div className="px-4 py-4 text-center">
                        <FiAlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                        <p className="text-[#4a5568] dark:text-gray-400 mb-3">No stores available in your area</p>
                        <button
                          onClick={handleViewAllStores}
                          className="text-[#00BFA6] hover:underline font-medium"
                        >
                          Check all our stores →
                        </button>
                      </div>
                    )}

                    {/* Network Error Message - only show when stores truly failed to load */}
                    {networkError && displayStores.length === 0 && (
                      <div className="px-4 py-4 text-center">
                        <FiAlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                        <p className="text-[#4a5568] dark:text-gray-400 mb-1">Unable to load stores</p>
                        <p className="text-xs text-gray-400 mb-3">Please check your connection and ensure the server is running</p>
                        <button
                          onClick={handleRetryLocation}
                          disabled={isDetecting}
                          className="text-[#00BFA6] hover:underline font-medium text-sm"
                        >
                          {isDetecting ? 'Retrying...' : 'Retry →'}
                        </button>
                      </div>
                    )}

                    {/* Store List */}
                    {!noStoreFound && displayStores.length > 0 && (
                      <>
                        {nearbyStores.length > 0 && (
                          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nearby Stores</p>
                          </div>
                        )}
                        {displayStores.map((store) => (
                          <button
                            key={store._id}
                            onClick={() => handleSelectStore(store)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-start gap-3"
                          >
                            <FiMapPin className="w-5 h-5 text-[#00BFA6] mt-0.5 shrink-0" />
                            <div>
                              <p className="font-medium text-[#0f2744] dark:text-white">{store.name}</p>
                              <p className="text-sm text-[#4a5568] dark:text-gray-400">{store.address}</p>
                            </div>
                          </button>
                        ))}
                        
                        {/* View All Stores Link */}
                        <button
                          onClick={handleViewAllStores}
                          className="w-full px-4 py-3 text-center text-[#00BFA6] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-t border-gray-100 dark:border-gray-700 font-medium"
                        >
                          View all stores →
                        </button>
                      </>
                    )}

                    {/* Loading State */}
                    {isLoading && displayStores.length === 0 && (
                      <div className="px-4 py-6 text-center">
                        <FiLoader className="w-6 h-6 text-[#00BFA6] animate-spin mx-auto mb-2" />
                        <p className="text-[#4a5568] dark:text-gray-400">Loading stores...</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Book Now Button */}
              <button 
                onClick={handleBookNow}
                className="bg-[#1a3a5c] dark:bg-[#00BFA6] text-white px-10 sm:px-16 py-4 rounded-lg text-sm font-semibold transition-all duration-300 hover:bg-[#00A892] dark:hover:bg-[#00A892] hover:border-[#00A892] dark:hover:border-[#00A892] hover:shadow-lg hover:-translate-y-0.5 border-2 border-[#1a3a5c] dark:border-[#00BFA6]"
              >
                {t('bookNow')}
              </button>
            </div>
          </div>
        </div>
      </div>
     
    </section>
  );
};

export default Hero;

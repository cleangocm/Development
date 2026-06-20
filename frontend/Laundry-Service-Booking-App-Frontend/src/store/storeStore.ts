import { create } from 'zustand';
import api from '@/services/api';

// Types
export interface OperatingHour {
  day: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface Store {
  _id: string;
  id: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  area: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  email: string;
  image: string;
  images: string[];
  rating: number;
  totalReviews: number;
  operatingHours: OperatingHour[];
  services: string[];
  features: string[];
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  manager: string | null;
  location: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
  };
  timezone: string;
  isOpen: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStoreData {
  name: string;
  description: string;
  address: string;
  area: string;
  city: string;
  zipCode: string;
  country: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  image?: string;
  images?: string[];
  features?: string[];
  isFeatured?: boolean;
  sortOrder?: number;
  services?: string[];
  operatingHours?: OperatingHour[];
  timezone?: string;
}

export interface UpdateStoreData {
  name?: string;
  description?: string;
  address?: string;
  area?: string;
  city?: string;
  zipCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  image?: string;
  images?: string[];
  rating?: number;
  features?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
  timezone?: string;
  operatingHours?: OperatingHour[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UserLocation {
  lat: number;
  lng: number;
  address?: string;
  shortName?: string; // short area/neighbourhood name for header badge
  isDefault?: boolean; // true if fallback Dhaka location was used
}

interface StoreState {
  // Data
  stores: Store[];
  nearbyStores: Store[];
  allAdminStores: Store[];
  selectedStore: Store | null;
  pagination: Pagination | null;
  userLocation: UserLocation | null;

  // Loading states
  isLoading: boolean;
  isNearbyLoading: boolean;
  isDetailLoading: boolean;
  isAdminLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;

  // Error states
  error: string | null;
  success: string | null;

  // PUBLIC APIs
  getStores: (params?: {
    search?: string;
    city?: string;
    area?: string;
    featured?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }) => Promise<void>;

  getNearbyStores: (lat: number, lng: number, radius?: number) => Promise<boolean>;

  getStoreBySlug: (slug: string) => Promise<void>;

  // ADMIN APIs
  getAdminStores: (params?: {
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) => Promise<void>;

  createStore: (data: CreateStoreData) => Promise<boolean>;

  updateStore: (id: string, data: UpdateStoreData) => Promise<boolean>;

  deleteStore: (id: string) => Promise<boolean>;

  // Location
  getUserLocation: () => Promise<boolean>;
  setUserLocation: (location: UserLocation) => void;

  // Utils
  clearSelectedStore: () => void;
  clearError: () => void;
  clearSuccess: () => void;
}

export const useStoreStore = create<StoreState>((set, get) => ({
  // Initial state
  stores: [],
  nearbyStores: [],
  allAdminStores: [],
  selectedStore: null,
  pagination: null,
  userLocation: null,
  isLoading: false,
  isNearbyLoading: false,
  isDetailLoading: false,
  isAdminLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  success: null,

  // ==========================================
  // PUBLIC APIs (No Auth Required)
  // ==========================================

  // GET /api/v1/stores - Get all active stores with filters
  getStores: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      if (params?.city) queryParams.append('city', params.city);
      if (params?.area) queryParams.append('area', params.area);
      if (params?.featured) queryParams.append('featured', params.featured);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const queryString = queryParams.toString();
      const url = `/stores${queryString ? `?${queryString}` : ''}`;

      const response = await api.get(url);

      if (response.data.status === 'success') {
        set({
          stores: response.data.data,
          pagination: response.data.pagination,
          isLoading: false,
        });
      } else {
        set({
          error: 'Invalid response from server',
          isLoading: false,
        });
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const message = err.response?.data?.message || 'Failed to fetch stores';
      set({
        error: message,
        isLoading: false,
      });
    }
  },

  // GET /api/v1/stores/nearby - Get nearby stores by location
  getNearbyStores: async (lat, lng, radius = 10) => {
    set({ isNearbyLoading: true });
    try {
      const url = `/stores/nearby?lat=${lat}&lng=${lng}&radius=${radius}`;
      const response = await api.get(url);

      if (response.data.status === 'success') {
        const nearbyCount = response.data.data?.length || 0;
        set({
          nearbyStores: response.data.data || [],
          isNearbyLoading: false,
        });
        return nearbyCount > 0;
      }
      set({ isNearbyLoading: false, nearbyStores: [] });
      return false;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string }; status?: number }; message?: string };
      // Only set global error on actual network failures, not on "no stores found" (404)
      const isNetworkError = !err.response || err.message?.includes('Network');
      set({
        ...(isNetworkError ? { error: 'Failed to fetch nearby stores' } : {}),
        isNearbyLoading: false,
        nearbyStores: [],
      });
      return false;
    }
  },

  // GET /api/v1/stores/:slug - Get single store by slug
  getStoreBySlug: async (slug) => {
    set({ isDetailLoading: true, error: null });
    try {
      const response = await api.get(`/stores/${slug}`);

      if (response.data.status === 'success') {
        set({
          selectedStore: response.data.data,
          isDetailLoading: false,
        });
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      set({
        error: err.response?.data?.message || 'Store not found',
        isDetailLoading: false,
      });
    }
  },

  // ==========================================
  // ADMIN APIs (Auth + Admin Required)
  // ==========================================

  // GET /api/v1/admin/stores - Get all stores (inc. inactive)
  getAdminStores: async (params) => {
    set({ isAdminLoading: true, error: null });
    try {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const queryString = queryParams.toString();
      const url = `/admin/stores${queryString ? `?${queryString}` : ''}`;

      const response = await api.get(url);

      if (response.data.status === 'success') {
        set({
          allAdminStores: response.data.data,
          pagination: response.data.pagination,
          isAdminLoading: false,
        });
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      set({
        error: err.response?.data?.message || 'Failed to fetch admin stores',
        isAdminLoading: false,
      });
    }
  },

  // POST /api/v1/admin/stores - Create new store
  createStore: async (data) => {
    set({ isCreating: true, error: null, success: null });
    try {
      const response = await api.post('/admin/stores', data);

      if (response.data.status === 'success') {
        set({
          isCreating: false,
          success: 'Store created successfully',
        });
        // Refresh admin stores list
        get().getAdminStores();
        return true;
      }
      return false;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      set({
        error: err.response?.data?.message || 'Failed to create store',
        isCreating: false,
      });
      return false;
    }
  },

  // PUT /api/v1/admin/stores/:id - Update store
  updateStore: async (id, data) => {
    set({ isUpdating: true, error: null, success: null });
    try {
      const response = await api.put(`/admin/stores/${id}`, data);

      if (response.data.status === 'success') {
        set({
          isUpdating: false,
          success: 'Store updated successfully',
        });
        // Refresh admin stores list
        get().getAdminStores();
        return true;
      }
      return false;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      set({
        error: err.response?.data?.message || 'Failed to update store',
        isUpdating: false,
      });
      return false;
    }
  },

  // DELETE /api/v1/admin/stores/:id - Delete store
  deleteStore: async (id) => {
    set({ isDeleting: true, error: null, success: null });
    try {
      const response = await api.delete(`/admin/stores/${id}`);

      if (response.data.status === 'success') {
        set({
          isDeleting: false,
          success: 'Store deleted successfully',
        });
        // Refresh admin stores list
        get().getAdminStores();
        return true;
      }
      return false;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      set({
        error: err.response?.data?.message || 'Failed to delete store',
        isDeleting: false,
      });
      return false;
    }
  },

  // ==========================================
  // Location Functions
  // ==========================================

  // Get user's current GPS location (with Dhaka fallback if denied)
  getUserLocation: async () => {
    // Default fallback: Dhaka city center (Mirpur area)
    const DHAKA_DEFAULT: UserLocation = {
      lat: 23.8103,
      lng: 90.4125,
      address: 'Dhaka, Bangladesh (Default)',
      isDefault: true,
    };

    // Helper: reverse geocode — Google Maps first, free Nominatim as fallback
    const reverseGeocode = async (lat: number, lng: number): Promise<{ address: string; shortName: string }> => {
      // Try Google Maps first
      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (apiKey) {
          const geocodeRes = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=en`
          );
          const geocodeData = await geocodeRes.json();
          if (geocodeData.status === 'OK' && geocodeData.results?.[0]) {
            const full = geocodeData.results[0].formatted_address as string;
            // Extract neighbourhood/sublocality from address components
            const comps: { types: string[]; long_name: string }[] = geocodeData.results[0].address_components || [];
            const short =
              comps.find(c => c.types.includes('neighborhood') || c.types.includes('sublocality_level_1') || c.types.includes('sublocality'))?.long_name ||
              full.split(',')[0]?.trim() ||
              '';
            return { address: full, shortName: short };
          }
        }
      } catch { /* ignore */ }

      // Fallback: free Nominatim (no API key needed)
      try {
        const nomRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
          { headers: { 'Accept-Language': 'fr', 'User-Agent': 'CleanGo-App/1.0' } }
        );
        const nomData = await nomRes.json();
        const addr = nomData.address || {};
        const short =
          addr.neighbourhood || addr.suburb || addr.city_district ||
          addr.district || addr.town || addr.city || '';
        const full = nomData.display_name || short;
        return { address: full, shortName: short };
      } catch { /* ignore */ }

      return { address: '', shortName: '' };
    };

    return new Promise<boolean>((resolve) => {
      if (!navigator.geolocation) {
        set({ userLocation: DHAKA_DEFAULT });
        resolve(true);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Reverse geocode to get readable address
          const { address, shortName } = await reverseGeocode(latitude, longitude);

          set({
            userLocation: {
              lat: latitude,
              lng: longitude,
              address: address || 'Your Location',
              shortName: shortName || address?.split(',')[0]?.trim() || 'Near You',
              isDefault: false,
            },
          });
          resolve(true);
        },
        () => {
          // Geolocation denied or failed — use Dhaka default
          set({ userLocation: DHAKA_DEFAULT });
          resolve(true);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 }
      );
    });
  },

  setUserLocation: (location) => {
    set({ userLocation: location });
  },

  // ==========================================
  // Utility Functions
  // ==========================================

  clearSelectedStore: () => {
    set({ selectedStore: null });
  },

  clearError: () => {
    set({ error: null });
  },

  clearSuccess: () => {
    set({ success: null });
  },
}));

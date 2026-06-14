'use client';

import { useState, useEffect } from 'react';
import SafeImage from '@/components/ui/SafeImage';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

import { FiSearch, FiChevronLeft, FiChevronRight, FiPlus, FiMinus } from 'react-icons/fi';
import { useTheme } from '@/context/ThemeContext';
import api from '@/services/api';

interface ServiceItemData {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
}

interface ServiceData {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  items: ServiceItemData[];
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

const ServiceDetailPage = () => {
  const { formatPrice } = useTheme();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [service, setService] = useState<ServiceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch service from backend
  useEffect(() => {
    const fetchService = async () => {
      try {
        const res = await api.get(`/services/${slug}`);
        if (res.data?.status === 'success' && res.data?.data) {
          setService(res.data.data);
        } else {
          router.push('/services');
        }
      } catch {
        router.push('/services');
      } finally {
        setIsLoading(false);
      }
    };
    if (slug) fetchService();
  }, [slug, router]);

  if (isLoading) {
    return (
      <>
  
        <main className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 sm:pt-24 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#00BFA6]"></div>
        </main>

      </>
    );
  }

  if (!service) return null;

  const items = service.items || [];

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleQuantityChange = (id: string, delta: number) => {
    setQuantities((prev) => {
      const newQuantity = Math.max(0, (prev[id] || 0) + delta);
      if (newQuantity === 0) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: newQuantity };
    });
  };

  const getCartItems = (): CartItem[] => {
    return Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const item = items.find((i) => i._id === id);
        return {
          id,
          name: item?.name || '',
          price: item?.price || 0,
          quantity: qty,
          image: item?.image || '',
        };
      });
  };

  const handleAddToCart = () => {
    const cartItems = getCartItems();
    if (cartItems.length > 0) {
      // Load existing cart groups from localStorage
      const existingGroupsStr = localStorage.getItem('cartGroups');
      let cartGroups: { serviceType: string; serviceId: string; items: CartItem[] }[] = [];
      
      if (existingGroupsStr) {
        try {
          cartGroups = JSON.parse(existingGroupsStr);
        } catch {
          cartGroups = [];
        }
      }
      
      // Check if this service already exists in cart
      const existingGroupIndex = cartGroups.findIndex(
        (g) => g.serviceId === service._id
      );
      
      if (existingGroupIndex !== -1) {
        // Merge items into existing group
        const existingGroup = cartGroups[existingGroupIndex];
        cartItems.forEach((newItem) => {
          const existingItemIndex = existingGroup.items.findIndex(
            (item) => item.id === newItem.id
          );
          if (existingItemIndex !== -1) {
            // Item already exists - add quantity
            existingGroup.items[existingItemIndex].quantity += newItem.quantity;
          } else {
            // New item - add to group
            existingGroup.items.push(newItem);
          }
        });
      } else {
        // New service group - add to cart
        cartGroups.push({
          serviceType: service.name,
          serviceId: service._id,
          items: cartItems,
        });
      }
      
      // Save merged cart groups
      localStorage.setItem('cartGroups', JSON.stringify(cartGroups));
      
      // Also keep legacy keys for backward compatibility
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
      localStorage.setItem('serviceType', service.name);
      localStorage.setItem('serviceId', service._id);
      // Notify Header about cart change
      window.dispatchEvent(new Event('cart-updated'));
      router.push('/cart');
    }
  };

  const totalItemsInCart = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);

  return (
    <>

      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 sm:pt-24">
        <div className="container-custom px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
          {/* Breadcrumb */}
          <div className="mb-4 sm:mb-6 animate-fade-in">
            <Link href="/services" className="text-[#00BFA6] text-xs sm:text-sm hover:underline">
              ← Back to Services
            </Link>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#0f2744] dark:text-white mt-2">{service.name}</h2>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm overflow-hidden animate-fade-in-up">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[#0f2744] dark:text-white">
                  Select Items
                </h1>
                
                {/* Search */}
                <div className="relative w-full sm:w-64 md:w-80">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 sm:py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:border-[#00BFA6] focus:ring-2 focus:ring-[#00BFA6]/20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Items List */}
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {paginatedItems.map((item, index) => (
                <div
                  key={`${item._id}-${index}`}
                  className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Image */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0">
                    {item.image ? (
                      <SafeImage
                        src={item.image}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base md:text-lg font-semibold text-[#0f2744] dark:text-white">
                      {item.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#5a6a7a] dark:text-gray-400">{item.description}</p>
                  </div>

                  {/* Price */}
                  <div className="text-right shrink-0">
                    <p className="text-xs sm:text-sm text-[#5a6a7a] dark:text-gray-400 mb-1">Price : {formatPrice(item.price)}</p>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center justify-end gap-2">
                      {quantities[item._id] ? (
                        <div className="flex items-center gap-2 bg-[#00BFA6] rounded-lg overflow-hidden">
                          <button
                            onClick={() => handleQuantityChange(item._id, -1)}
                            className="p-1.5 sm:p-2 text-white hover:bg-[#00A892] transition-colors"
                          >
                            <FiMinus className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                          <span className="text-white text-xs sm:text-sm font-medium min-w-5 text-center">
                            {quantities[item._id]}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item._id, 1)}
                            className="p-1.5 sm:p-2 text-white hover:bg-[#00A892] transition-colors"
                          >
                            <FiPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleQuantityChange(item._id, 1)}
                          className="flex items-center gap-1 bg-[#00BFA6] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-[#00A892] transition-colors"
                        >
                          Add <FiPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 sm:p-5 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#0f2744] dark:bg-[#00BFA6] text-white rounded-lg border-2 border-[#0f2744] dark:border-[#00BFA6] text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1a3a5c] dark:hover:bg-[#00A892] hover:border-[#1a3a5c] dark:hover:border-[#00A892] transition-colors"
                >
                  <FiChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Previous Page</span>
                  <span className="sm:hidden">Prev</span>
                </button>

                <span className="text-xs sm:text-sm text-[#5a6a7a] dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#0f2744] dark:bg-[#00BFA6] text-white rounded-lg border-2 border-[#0f2744] dark:border-[#00BFA6] text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1a3a5c] dark:hover:bg-[#00A892] hover:border-[#1a3a5c] dark:hover:border-[#00A892] transition-colors"
                >
                  <span className="hidden sm:inline">Next Page</span>
                  <span className="sm:hidden">Next</span>
                  <FiChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Add to Cart Button */}
          {totalItemsInCart > 0 && (
            <div className="fixed bottom-4 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-50 animate-fade-in-up">
              <button
                onClick={handleAddToCart}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0f2744] dark:bg-[#00BFA6] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl border-2 border-[#0f2744] dark:border-[#00BFA6] font-semibold text-sm sm:text-base shadow-lg hover:bg-[#1a3a5c] dark:hover:bg-[#00A892] hover:border-[#1a3a5c] dark:hover:border-[#00A892] transition-all hover:shadow-xl"
              >
                <span>Proceed to Cart</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  {totalItemsInCart} items
                </span>
              </button>
            </div>
          )}
        </div>
      </main>

    </>
  );
};

export default ServiceDetailPage;

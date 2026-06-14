'use client';

import { useState, useMemo } from 'react';
import { FiChevronDown, FiChevronRight, FiCopy, FiCheck, FiSearch, FiFilter } from 'react-icons/fi';

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  auth: boolean;
  role?: string;
  description: string;
  queryParams?: string;
  request?: {
    headers?: Partial<Record<string, string>>;
    body?: string;
  };
  response: string;
}

interface EndpointGroup {
  title: string;
  icon: string;
  description: string;
  endpoints: Endpoint[];
}

const ApiDocsPage = () => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [expandedEndpoints, setExpandedEndpoints] = useState<Record<string, boolean>>({});
  const [copiedText, setCopiedText] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');

  const baseUrl = 'https://laundry-service-booking-app-backend.onrender.com/api/v1';

  const apiGroups: EndpointGroup[] = useMemo(() => [
    // ── 1. AUTHENTICATION ──
    {
      title: 'Authentication',
      icon: '🔐',
      description: 'Registration, login, Google auth, OTP, password reset & profile',
      endpoints: [
        {
          method: 'POST',
          path: '/auth/register',
          auth: false,
          description: 'Register a new customer account',
          request: {
            body: JSON.stringify({
              name: 'John Doe',
              email: 'john@example.com',
              phone: '+8801712345678',
              password: 'MyPass123',
              confirmPassword: 'MyPass123'
            }, null, 2)
          },
          response: JSON.stringify({
            status: 'success',
            message: 'Registration successful',
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            user: { id: '6789abc...', name: 'John Doe', email: 'john@example.com', phone: '+8801712345678', role: 'user' }
          }, null, 2)
        },
        {
          method: 'POST',
          path: '/auth/login',
          auth: false,
          description: 'Login with email/phone and password. Field name is "emailOrPhone".',
          request: {
            body: JSON.stringify({
              emailOrPhone: 'admin@ultrawash.com',
              password: '123456'
            }, null, 2)
          },
          response: JSON.stringify({
            status: 'success',
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            user: { id: '6789abc...', name: 'Admin', email: 'admin@ultrawash.com', role: 'admin', profileImage: null, phone: '+8801700000000', address: 'Gulshan-2, Dhaka' }
          }, null, 2)
        },
        {
          method: 'POST',
          path: '/auth/google',
          auth: false,
          description: 'Google Sign-In — send Firebase idToken to backend for JWT',
          request: {
            body: JSON.stringify({
              idToken: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ijk3...(firebase_id_token)'
            }, null, 2)
          },
          response: JSON.stringify({
            status: 'success',
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            user: { id: '6789abc...', name: 'Google User', email: 'user@gmail.com', role: 'user', profileImage: 'https://lh3.googleusercontent.com/...' }
          }, null, 2)
        },
        {
          method: 'POST',
          path: '/auth/forgot-password',
          auth: false,
          description: 'Step 1: Send OTP to email/phone for password reset',
          request: {
            body: JSON.stringify({ emailOrPhone: 'john@example.com' }, null, 2)
          },
          response: JSON.stringify({ status: 'success', message: 'OTP sent to your email' }, null, 2)
        },
        {
          method: 'POST',
          path: '/auth/verify-forgot-otp',
          auth: false,
          description: 'Step 2: Verify the forgot-password OTP → returns resetToken',
          request: {
            body: JSON.stringify({ emailOrPhone: 'john@example.com', otp: '123456' }, null, 2)
          },
          response: JSON.stringify({ status: 'success', message: 'OTP verified successfully', resetToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }, null, 2)
        },
        {
          method: 'POST',
          path: '/auth/reset-password',
          auth: false,
          description: 'Step 3: Reset password using the resetToken from OTP verification',
          request: {
            body: JSON.stringify({ emailOrPhone: 'john@example.com', newPassword: 'NewPass123', confirmPassword: 'NewPass123', resetToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }, null, 2)
          },
          response: JSON.stringify({ status: 'success', message: 'Password reset successfully' }, null, 2)
        },
        {
          method: 'POST',
          path: '/auth/send-login-otp',
          auth: false,
          description: 'Send login OTP to phone/email (passwordless login)',
          request: {
            body: JSON.stringify({ emailOrPhone: '+8801712345678' }, null, 2)
          },
          response: JSON.stringify({ status: 'success', message: 'OTP sent successfully' }, null, 2)
        },
        {
          method: 'POST',
          path: '/auth/verify-login-otp',
          auth: false,
          description: 'Verify login OTP and get JWT token (passwordless login)',
          request: {
            body: JSON.stringify({ emailOrPhone: '+8801712345678', otp: '123456' }, null, 2)
          },
          response: JSON.stringify({
            status: 'success',
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            user: { id: '6789abc...', name: 'John Doe', email: 'john@example.com', role: 'user' }
          }, null, 2)
        },
        {
          method: 'GET',
          path: '/auth/profile',
          auth: true,
          role: 'any',
          description: 'Get current logged-in user profile',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({
            status: 'success',
            data: { _id: '6789abc...', name: 'John Doe', email: 'john@example.com', phone: '+8801712345678', role: 'user', address: 'Gulshan-2, Dhaka', profileImage: null, isVerified: true, createdAt: '2025-01-10T12:00:00Z' }
          }, null, 2)
        },
        {
          method: 'PUT',
          path: '/auth/profile',
          auth: true,
          role: 'any',
          description: 'Update current user profile (name, phone, address, profileImage)',
          request: {
            headers: { 'Authorization': 'Bearer <token>' },
            body: JSON.stringify({ name: 'John Updated', phone: '+8801700000000', address: 'Banani-11, Dhaka', profileImage: 'https://i.ibb.co/xxxxx/avatar.jpg' }, null, 2)
          },
          response: JSON.stringify({ status: 'success', data: { _id: '6789abc...', name: 'John Updated', phone: '+8801700000000', address: 'Banani-11, Dhaka' } }, null, 2)
        },
        {
          method: 'POST',
          path: '/auth/logout',
          auth: true,
          role: 'any',
          description: 'Logout user (invalidate token)',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', message: 'Logged out successfully' }, null, 2)
        }
      ]
    },

    // ── 2. SERVICES (PUBLIC) ──
    {
      title: 'Services (Public)',
      icon: '🧺',
      description: 'Browse laundry services and pricing — no auth required',
      endpoints: [
        {
          method: 'GET', path: '/services', auth: false,
          description: 'Get all active services',
          response: JSON.stringify({ status: 'success', data: [{ _id: '678abc...', name: 'Wash & Fold', slug: 'wash-and-fold', description: 'Professional washing and folding', pricingType: 'per_kg', pricePerKg: 60, category: 'washing', features: ['Quick turnaround', 'Eco-friendly'], image: '/images/wash-fold.jpg', isActive: true, items: [{ name: 'Regular Clothes', price: 60 }] }] }, null, 2)
        },
        {
          method: 'GET', path: '/services/:slug', auth: false,
          description: 'Get service details by slug (e.g. /services/wash-and-fold)',
          response: JSON.stringify({ status: 'success', data: { _id: '678abc...', name: 'Dry Cleaning', slug: 'dry-cleaning', pricingType: 'per_item', pricePerItem: 250, category: 'dry_cleaning', items: [{ name: 'Suit', price: 500 }, { name: 'Dress', price: 300 }], features: ['Stain removal', 'Premium care'], image: '/images/dry-clean.jpg', isActive: true } }, null, 2)
        }
      ]
    },

    // ── 3. STORES (PUBLIC) ──
    {
      title: 'Stores (Public)',
      icon: '🏪',
      description: 'Find UltraWash store locations — no auth required',
      endpoints: [
        {
          method: 'GET', path: '/stores', auth: false,
          description: 'Get all store locations',
          response: JSON.stringify({ status: 'success', data: [{ _id: '678abc...', name: 'UltraWash Gulshan', slug: 'ultrawash-gulshan', address: 'House 45, Road 11, Gulshan-2, Dhaka', area: 'Gulshan-2', city: 'Dhaka', location: { type: 'Point', coordinates: [90.4078, 23.7925] }, phone: '+8801700000001', email: 'gulshan@ultrawash.com', rating: 4.8, totalReviews: 156, features: ['Free Pickup', 'Express Delivery', '24/7 Support'], operatingHours: { open: '08:00', close: '22:00' }, isFeatured: true, isActive: true }] }, null, 2)
        },
        {
          method: 'GET', path: '/stores/nearby', auth: false,
          description: 'Get nearby stores by GPS coordinates',
          queryParams: 'lat=23.79&lng=90.41&maxDistance=10000',
          response: JSON.stringify({ status: 'success', data: [{ name: 'UltraWash Gulshan', distance: 850 }, { name: 'UltraWash Banani', distance: 1200 }] }, null, 2)
        },
        {
          method: 'GET', path: '/stores/:slug', auth: false,
          description: 'Get store details by slug',
          response: JSON.stringify({ status: 'success', data: { _id: '678abc...', name: 'UltraWash Gulshan', slug: 'ultrawash-gulshan', address: 'House 45, Road 11, Gulshan-2', location: { type: 'Point', coordinates: [90.4078, 23.7925] }, rating: 4.8, totalReviews: 156, services: ['678abc...'], features: ['Free Pickup'], operatingHours: { open: '08:00', close: '22:00' } } }, null, 2)
        }
      ]
    },

    // ── 4. ORDERS (CUSTOMER) ──
    {
      title: 'Orders (Customer)',
      icon: '📦',
      description: 'Create, view, track and cancel orders — requires auth (user)',
      endpoints: [
        {
          method: 'POST', path: '/orders', auth: true, role: 'user',
          description: 'Create a new order with billing, shipping, schedule & payment info',
          request: {
            headers: { 'Authorization': 'Bearer <token>' },
            body: JSON.stringify({
              items: [{ service: '<service_id>', serviceName: 'Wash & Fold - T-Shirt', quantity: 3, price: 60, subtotal: 180 }],
              billingInfo: { fullName: 'John Doe', email: 'john@example.com', phone: '+8801712345678', alternativePhone: '+8801700000000', address: 'House 12, Road 5, Gulshan-2, Dhaka', additionalInstruction: 'Ring the doorbell' },
              shippingInfo: { fullName: 'John Doe', phone: '+8801712345678', alternativePhone: '', address: 'House 12, Road 5, Gulshan-2, Dhaka', additionalInstruction: '' },
              schedule: { pickupDate: '2025-01-15', pickupSlot: '10:00 AM - 12:00 PM', deliveryDate: '2025-01-17', deliverySlot: '02:00 PM - 04:00 PM' },
              deliveryType: 'standard',
              deliverySpeedCharge: 0,
              address: 'House 12, Road 5, Gulshan-2, Dhaka',
              notes: 'Handle with care',
              couponCode: 'SAVE20',
              couponDiscount: 50,
              paymentMethod: 'cod'
            }, null, 2)
          },
          response: JSON.stringify({ status: 'success', data: { _id: '678abc...', orderId: 'ORD-1736950123456', status: 'pending', totalAmount: 130, paymentMethod: 'cod', createdAt: '2025-01-15T08:00:00Z' } }, null, 2)
        },
        {
          method: 'GET', path: '/orders/my-orders', auth: true, role: 'user',
          description: 'Get customer orders with pagination & status filter',
          queryParams: 'page=1&limit=10&status=delivered',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', data: { orders: [{ _id: '678abc...', orderId: 'ORD-123', status: 'delivered', totalAmount: 180, createdAt: '2025-01-15T08:00:00Z' }], pagination: { page: 1, limit: 10, total: 25, pages: 3 } } }, null, 2)
        },
        {
          method: 'GET', path: '/orders/dashboard-stats', auth: true, role: 'user',
          description: 'Get customer dashboard statistics',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', data: { totalOrders: 25, activeOrders: 3, completedOrders: 20, totalSpent: 4500 } }, null, 2)
        },
        {
          method: 'GET', path: '/orders/:id', auth: true, role: 'user',
          description: 'Get single order detail by ID',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', data: { _id: '678abc...', orderId: 'ORD-123', status: 'delivered', items: [{ serviceName: 'Wash & Fold - T-Shirt', quantity: 3, price: 60, subtotal: 180 }], billingInfo: { fullName: 'John Doe', phone: '+880171...' }, shippingInfo: { fullName: 'John Doe' }, schedule: { pickupDate: '2025-01-15', deliveryDate: '2025-01-17' }, totalAmount: 180, paymentMethod: 'cod', assignedDeliveryBoy: { name: 'Karim' }, assignedStaff: { name: 'Salam' } } }, null, 2)
        },
        {
          method: 'PUT', path: '/orders/:id/cancel', auth: true, role: 'user',
          description: 'Cancel an order (only if status is "pending")',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', message: 'Order cancelled successfully', data: { status: 'cancelled' } }, null, 2)
        }
      ]
    },

    // ── 5. PAYMENT — STRIPE (User) ──
    {
      title: 'Payment — Stripe',
      icon: '💳',
      description: 'Full Stripe payment flow. Step 1 → GET /payment/gateways to check which methods are enabled and get the Stripe publishableKey. Step 2 → POST /payment/create-intent with only serviceId + itemName + quantity (NO price — backend reads prices from DB, applies coupons, delivery charges all server-side). Step 3 → Use the returned clientSecret to mount Stripe Elements and confirm card on client. Step 4 → POST /payment/verify to confirm success before creating the order.',
      endpoints: [
        {
          method: 'GET', path: '/payment/gateways', auth: false,
          description: 'Get all enabled payment gateways configured in admin panel. Public endpoint — no token needed. Returns the Stripe publishableKey (safe to send to client — never exposes secretKey), the site currency code and symbol from admin settings. Call this first so the frontend knows which payment options to show and which publishableKey to initialise Stripe.js with.',
          response: JSON.stringify({
            status: 'success',
            data: [
              {
                key: 'stripe',
                displayName: 'Credit / Debit Card',
                description: 'Secure card payment via Stripe',
                publishableKey: 'pk_test_51SwH2i00lbQIE2N5tGo11...'
              },
              {
                key: 'cashOnDelivery',
                displayName: 'Cash on Delivery',
                description: 'Pay when your order arrives'
              }
            ],
            currency: 'EUR',
            currencySymbol: '€'
          }, null, 2)
        },
        {
          method: 'POST', path: '/payment/create-intent', auth: true,
          description: 'Create a Stripe PaymentIntent.\n\n⚠️ IMPORTANT — never send prices from the client. Only send serviceId, itemName, quantity. The backend:\n  1. Looks up every item price from the Service collection in MongoDB\n  2. Applies the coupon server-side (checks validity, minimum order, per-user usage limit)\n  3. Reads delivery charge from admin Settings\n  4. Uses the admin-configured currency (e.g. EUR)\n  5. Creates the PaymentIntent with the final verified amount\n\nReturns clientSecret → pass this to Stripe.js Elements to show the card form. Also returns a full price breakdown so the UI can display the exact amount Stripe will charge.\n\nBody fields:\n• items[].serviceId — MongoDB _id of the Service\n• items[].itemName — must match the item name in the service\'s items array\n• items[].quantity — number of units (min 1)\n• couponCode — optional, validated entirely on the server\n• deliveryType — "standard" (default) or "express"',
          request: {
            headers: { 'Authorization': 'Bearer <token>', 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: [
                { serviceId: '69a285923c9ee2995fd3bcbe', itemName: 'Shirt', quantity: 3 },
                { serviceId: '69a285923c9ee2995fd3bcad', itemName: 'Shirt', quantity: 2 }
              ],
              couponCode: 'FLAT5',
              deliveryType: 'standard'
            }, null, 2)
          },
          response: JSON.stringify({
            status: 'success',
            data: {
              clientSecret: 'pi_3T9j55_secret_...',
              publishableKey: 'pk_test_51SwH2i00lbQIE2N5tGo11...',
              paymentIntentId: 'pi_3T9j5500lbQIE2N51yP6PvLj',
              amount: 13.5,
              currency: 'EUR',
              currencySymbol: '€',
              breakdown: {
                subtotal: 18.5,
                discount: 5,
                deliveryCharge: 0,
                total: 13.5,
                coupon: 'FLAT5'
              },
              validatedItems: [
                { serviceId: '69a285923c9ee2995fd3bcbe', serviceName: 'Ironing Only', itemName: 'Shirt', quantity: 3, unitPrice: 2.5, subtotal: 7.5 },
                { serviceId: '69a285923c9ee2995fd3bcad', serviceName: 'Wash & Iron', itemName: 'Shirt', quantity: 2, unitPrice: 5.5, subtotal: 11 }
              ]
            }
          }, null, 2)
        },
        {
          method: 'POST', path: '/payment/verify', auth: true,
          description: 'Verify a PaymentIntent was actually paid, server-side. Call this AFTER Stripe.js confirmPayment() resolves on the client. The backend retrieves the intent from Stripe and checks its status is "succeeded". If verified, proceed to POST /orders to create the order. This prevents creating orders for unpaid or failed payments.',
          request: {
            headers: { 'Authorization': 'Bearer <token>', 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentIntentId: 'pi_3T9j5500lbQIE2N51yP6PvLj' }, null, 2)
          },
          response: JSON.stringify({
            status: 'success',
            data: {
              paymentIntentId: 'pi_3T9j5500lbQIE2N51yP6PvLj',
              amount: 13.5,
              currency: 'eur',
              paymentStatus: 'succeeded',
              paymentMethodType: 'card',
              paid: true
            }
          }, null, 2)
        }
      ]
    },

    // ── 6. COUPONS ──
    {
      title: 'Coupons',
      icon: '🎫',
      description: 'View active coupons and validate coupon codes',
      endpoints: [
        {
          method: 'GET', path: '/coupons/active', auth: true, role: 'user',
          description: 'Get all active/valid coupons',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', data: [{ _id: '678abc...', code: 'SAVE20', discountType: 'percentage', discountValue: 20, minOrderAmount: 200, maxDiscount: 100, startDate: '2025-01-01', endDate: '2025-12-31', isActive: true }] }, null, 2)
        },
        {
          method: 'POST', path: '/coupons/validate', auth: true, role: 'user',
          description: 'Validate a coupon code against an order amount',
          request: { headers: { 'Authorization': 'Bearer <token>' }, body: JSON.stringify({ code: 'SAVE20', orderAmount: 500 }, null, 2) },
          response: JSON.stringify({ status: 'success', data: { valid: true, discount: 100, finalAmount: 400, coupon: { code: 'SAVE20', discountType: 'percentage', discountValue: 20 } } }, null, 2)
        }
      ]
    },

    // ── 7. REVIEWS ──
    {
      title: 'Reviews',
      icon: '⭐',
      description: 'Customer reviews — public read, auth required to write/edit',
      endpoints: [
        {
          method: 'GET', path: '/reviews/approved', auth: false,
          description: 'Get all approved reviews (public)',
          response: JSON.stringify({ status: 'success', data: [{ _id: '678abc...', user: { name: 'John Doe' }, store: { name: 'UltraWash Gulshan' }, service: { name: 'Wash & Fold' }, rating: 5, comment: 'Great service!', status: 'approved', createdAt: '2025-01-10T12:00:00Z' }] }, null, 2)
        },
        {
          method: 'GET', path: '/reviews/store/:storeId', auth: false,
          description: 'Get reviews for a specific store (paginated)',
          queryParams: 'page=1&limit=10',
          response: JSON.stringify({ status: 'success', data: { reviews: [{ rating: 5, comment: 'Excellent!', user: { name: 'John' } }], pagination: { page: 1, limit: 10, total: 50, pages: 5 } } }, null, 2)
        },
        {
          method: 'POST', path: '/reviews', auth: true, role: 'user',
          description: 'Create a review for a delivered order (one review per order)',
          request: { headers: { 'Authorization': 'Bearer <token>' }, body: JSON.stringify({ order: '<order_id>', service: '<service_id>', rating: 5, comment: 'Excellent service! Very clean clothes.' }, null, 2) },
          response: JSON.stringify({ status: 'success', message: 'Review created', data: { _id: '678abc...', user: { name: 'John' }, store: { name: 'UltraWash Gulshan' }, rating: 5, comment: 'Excellent!', status: 'approved' } }, null, 2)
        },
        {
          method: 'GET', path: '/reviews/my-reviews', auth: true, role: 'user',
          description: 'Get all reviews written by current user',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', data: [{ _id: '678abc...', order: { orderId: 'ORD-123' }, service: { name: 'Wash & Fold' }, store: { name: 'UltraWash Gulshan' }, rating: 5, comment: 'Great!', status: 'approved', createdAt: '2025-01-10' }] }, null, 2)
        },
        {
          method: 'PUT', path: '/reviews/:id', auth: true, role: 'user',
          description: 'Update my review (rating and/or comment)',
          request: { headers: { 'Authorization': 'Bearer <token>' }, body: JSON.stringify({ rating: 4, comment: 'Updated: Good but could be faster.' }, null, 2) },
          response: JSON.stringify({ status: 'success', data: { _id: '678abc...', rating: 4, comment: 'Updated' } }, null, 2)
        },
        {
          method: 'DELETE', path: '/reviews/:id', auth: true, role: 'user',
          description: 'Delete my review',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', message: 'Review deleted' }, null, 2)
        }
      ]
    },

    // ── 7. NOTIFICATIONS (USER) ──
    {
      title: 'Notifications (User)',
      icon: '🔔',
      description: 'User notifications — order updates, system alerts',
      endpoints: [
        {
          method: 'GET', path: '/notifications', auth: true, role: 'user',
          description: 'Get user notifications (paginated, returns unreadCount)',
          queryParams: 'page=1&limit=20',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', unreadCount: 5, data: [{ _id: '678abc...', title: 'Order Confirmed', message: 'Your order ORD-123 has been confirmed', type: 'order_update', isRead: false, createdAt: '2025-01-15T08:00:00Z' }], pagination: { page: 1, limit: 20, total: 50, pages: 3 } }, null, 2)
        },
        {
          method: 'POST', path: '/notifications', auth: true, role: 'user',
          description: 'Create a notification (used internally when placing order)',
          request: { headers: { 'Authorization': 'Bearer <token>' }, body: JSON.stringify({ title: 'New Order Placed', message: 'Order ORD-123 placed successfully', type: 'order_update' }, null, 2) },
          response: JSON.stringify({ status: 'success', data: { _id: '678abc...', title: 'New Order Placed' } }, null, 2)
        },
        {
          method: 'PUT', path: '/notifications/:id/read', auth: true, role: 'user',
          description: 'Mark a single notification as read',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', message: 'Notification marked as read' }, null, 2)
        },
        {
          method: 'PUT', path: '/notifications/all/read', auth: true, role: 'user',
          description: 'Mark all notifications as read',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', message: 'All notifications marked as read' }, null, 2)
        }
      ]
    },

    // ── 8. TICKETS / SUPPORT (USER) ──
    {
      title: 'Tickets / Support (User)',
      icon: '🎟️',
      description: 'Customer support ticket system — create & manage tickets',
      endpoints: [
        {
          method: 'GET', path: '/tickets/my-tickets', auth: true, role: 'user',
          description: 'Get all my support tickets',
          queryParams: 'status=open',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', data: { tickets: [{ _id: '678abc...', subject: 'Order delayed', description: 'My order is delayed by 2 days', category: 'order', priority: 'high', status: 'open', createdAt: '2025-01-15' }] } }, null, 2)
        },
        {
          method: 'POST', path: '/tickets', auth: true, role: 'user',
          description: 'Create a new support ticket',
          request: { headers: { 'Authorization': 'Bearer <token>' }, body: JSON.stringify({ subject: 'Order Issue', description: 'My order was not picked up on time', category: 'order', priority: 'medium' }, null, 2) },
          response: JSON.stringify({ status: 'success', data: { _id: '678abc...', subject: 'Order Issue', status: 'open', priority: 'medium' } }, null, 2)
        },
        {
          method: 'GET', path: '/tickets/:id', auth: true, role: 'user',
          description: 'Get ticket detail with notes/messages',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', data: { _id: '678abc...', subject: 'Order Issue', status: 'open', notes: [{ message: 'Looking into it', sender: 'admin', createdAt: '2025-01-15' }] } }, null, 2)
        },
        {
          method: 'POST', path: '/tickets/:id/notes', auth: true, role: 'user',
          description: 'Add a message/note to a ticket (chat)',
          request: { headers: { 'Authorization': 'Bearer <token>' }, body: JSON.stringify({ message: 'Any update on this?' }, null, 2) },
          response: JSON.stringify({ status: 'success', message: 'Note added successfully' }, null, 2)
        }
      ]
    },

    // ── 9. USER SETTINGS ──
    {
      title: 'User Settings',
      icon: '⚙️',
      description: 'Notification preferences & profile update endpoints',
      endpoints: [
        {
          method: 'GET', path: '/users/notification-preferences', auth: true, role: 'user',
          description: 'Get notification preference settings',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', data: { emailNotifications: true, smsNotifications: false, pushNotifications: true, orderUpdates: true, promotions: false } }, null, 2)
        },
        {
          method: 'PUT', path: '/users/notification-preferences', auth: true, role: 'user',
          description: 'Update notification preference settings',
          request: { headers: { 'Authorization': 'Bearer <token>' }, body: JSON.stringify({ emailNotifications: true, smsNotifications: true, pushNotifications: true, orderUpdates: true, promotions: false }, null, 2) },
          response: JSON.stringify({ status: 'success', message: 'Preferences updated' }, null, 2)
        },
        {
          method: 'PUT', path: '/users/profile', auth: true, role: 'delivery',
          description: 'Update user profile (used by delivery boy profile page)',
          request: { headers: { 'Authorization': 'Bearer <token>' }, body: JSON.stringify({ name: 'Karim Delivery', phone: '+8801700000001', address: 'Mirpur-10, Dhaka' }, null, 2) },
          response: JSON.stringify({ status: 'success', data: { name: 'Karim Delivery', phone: '+8801700000001' } }, null, 2)
        }
      ]
    },

    // ── 10. DELIVERY BOY ──
    {
      title: 'Delivery Boy',
      icon: '🚚',
      description: 'Delivery operations — pickup, deliver, earnings (role: delivery)',
      endpoints: [
        {
          method: 'GET', path: '/delivery/dashboard-stats', auth: true, role: 'delivery',
          description: 'Get delivery boy dashboard statistics',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', data: { todayPickups: 5, todayDeliveries: 8, totalCompleted: 120, todayEarnings: 450, totalEarnings: 12000, unsettledEarnings: 3500 } }, null, 2)
        },
        {
          method: 'GET', path: '/delivery/pickup-orders', auth: true, role: 'delivery',
          description: 'Get orders assigned for pickup',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', data: [{ _id: '678abc...', orderId: 'ORD-123', status: 'pickup_assigned', address: 'Gulshan-2, Dhaka', phone: '+8801712345678' }] }, null, 2)
        },
        {
          method: 'GET', path: '/delivery/out-orders', auth: true, role: 'delivery',
          description: 'Get orders assigned for outgoing delivery',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', data: [{ _id: '678abc...', orderId: 'ORD-456', status: 'delivery_assigned', address: 'Banani-11, Dhaka' }] }, null, 2)
        },
        {
          method: 'PUT', path: '/delivery/pickup/:id', auth: true, role: 'delivery',
          description: 'Confirm pickup → status: "picked_up"',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', data: { orderId: 'ORD-123', status: 'picked_up' } }, null, 2)
        },
        {
          method: 'PUT', path: '/delivery/warehouse/:id', auth: true, role: 'delivery',
          description: 'Mark delivered to warehouse → status: "at_warehouse"',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', data: { orderId: 'ORD-123', status: 'at_warehouse' } }, null, 2)
        },
        {
          method: 'PUT', path: '/delivery/start-delivery/:id', auth: true, role: 'delivery',
          description: 'Start delivery → status: "out_for_delivery"',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', data: { orderId: 'ORD-123', status: 'out_for_delivery' } }, null, 2)
        },
        {
          method: 'PUT', path: '/delivery/confirm-delivery/:id', auth: true, role: 'delivery',
          description: 'Confirm delivered → status: "delivered" ✅ (earnings added)',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', message: 'Delivered', data: { orderId: 'ORD-123', status: 'delivered', earnings: 50 } }, null, 2)
        },
        {
          method: 'PUT', path: '/delivery/location', auth: true, role: 'delivery',
          description: 'Update delivery boy current GPS location',
          request: { headers: { 'Authorization': 'Bearer <token>' }, body: JSON.stringify({ latitude: 23.81, longitude: 90.41 }, null, 2) },
          response: JSON.stringify({ status: 'success', message: 'Location updated' }, null, 2)
        },
        {
          method: 'GET', path: '/delivery/completed', auth: true, role: 'delivery',
          description: 'Get completed deliveries (paginated)',
          queryParams: 'page=1&limit=20',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', data: [{ orderId: 'ORD-123', status: 'delivered', deliveryCharge: 50, deliveredAt: '2025-01-15T14:00:00Z' }], pagination: { page: 1, limit: 20, total: 120, pages: 6 } }, null, 2)
        },
        {
          method: 'GET', path: '/delivery/earnings', auth: true, role: 'delivery',
          description: 'View earnings summary',
          queryParams: 'page=1',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', data: { totalEarnings: 12000, settledEarnings: 8500, unsettledEarnings: 3500, orders: [{ orderId: 'ORD-123', deliveryCharge: 50, settledAt: '2025-01-10' }] } }, null, 2)
        }
      ]
    },

    // ── 11. STAFF ──
    {
      title: 'Staff',
      icon: '🧹',
      description: 'Staff cleaning operations (role: staff)',
      endpoints: [
        {
          method: 'GET', path: '/staff/dashboard-stats', auth: true, role: 'staff',
          description: 'Get staff dashboard statistics',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', data: { assignedOrders: 5, inProcessOrders: 2, completedToday: 8, totalCompleted: 250 } }, null, 2)
        },
        {
          method: 'GET', path: '/staff/orders', auth: true, role: 'staff',
          description: 'Get staff assigned orders (filter by status)',
          queryParams: 'status=at_warehouse',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', data: [{ _id: '678abc...', orderId: 'ORD-123', status: 'at_warehouse', service: { name: 'Wash & Fold' }, items: [{ name: 'T-Shirt', quantity: 3 }] }] }, null, 2)
        },
        {
          method: 'GET', path: '/staff/orders/:id', auth: true, role: 'staff',
          description: 'Get single order detail for staff',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', data: { _id: '678abc...', orderId: 'ORD-123', status: 'in_process', items: [{ name: 'T-Shirt', quantity: 3 }] } }, null, 2)
        },
        {
          method: 'PUT', path: '/staff/orders/:id/start-cleaning', auth: true, role: 'staff',
          description: 'Start cleaning → status: "in_process"',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', data: { orderId: 'ORD-123', status: 'in_process' } }, null, 2)
        },
        {
          method: 'PUT', path: '/staff/orders/:id/complete-cleaning', auth: true, role: 'staff',
          description: 'Complete cleaning → status: "cleaned"',
          request: { headers: { 'Authorization': 'Bearer <token>' }, body: JSON.stringify({ notes: 'All items cleaned and pressed' }, null, 2) },
          response: JSON.stringify({ status: 'success', message: 'Cleaning completed', data: { orderId: 'ORD-123', status: 'cleaned' } }, null, 2)
        }
      ]
    },

    // ── 12. PUBLIC / SITE SETTINGS ──
    {
      title: 'Public / Site Settings',
      icon: '🌐',
      description: 'Public site settings, contact info, contact form — no auth',
      endpoints: [
        {
          method: 'GET', path: '/public/site-settings', auth: false,
          description: 'Get public site settings (logo, name, theme, etc.)',
          response: JSON.stringify({ status: 'success', data: { siteName: 'UltraWash Laundry', headerLogo: 'https://i.ibb.co/xxxxx/logo.png', footerLogo: 'https://i.ibb.co/xxxxx/footer.png', favicon: 'https://i.ibb.co/xxxxx/fav.png', primaryColor: '#00BFA6', currency: 'USD', contactEmail: 'info@ultrawash.com', contactPhone: '+8801700000001' } }, null, 2)
        },
        {
          method: 'GET', path: '/public/contact-settings', auth: false,
          description: 'Get contact page data (phone, email, locations, hours, map)',
          response: JSON.stringify({ status: 'success', data: { heroTitle: 'Get in Touch', heroSubtitle: 'Have questions?...', contactInfo: [{ type: 'phone', title: 'Phone', details: ['+880170000'] }], locations: [{ name: 'Gulshan Branch', address: 'Gulshan-2', phone: '+880170000', hours: 'Mon-Sat 8AM-8PM' }], mapEmbedUrl: 'https://www.google.com/maps/embed?...' } }, null, 2)
        },
        {
          method: 'POST', path: '/public/contact-message', auth: false,
          description: 'Submit a contact form message',
          request: { body: JSON.stringify({ name: 'Visitor', email: 'visitor@example.com', phone: '+8801712345678', subject: 'Inquiry', message: 'I want to know about bulk pricing.' }, null, 2) },
          response: JSON.stringify({ status: 'success', message: 'Message sent successfully' }, null, 2)
        }
      ]
    },

    // ── 13. FILE UPLOAD ──
    {
      title: 'File Upload — ImgBB',
      icon: '📤',
      description: 'Upload images to ImgBB through the backend proxy. The ImgBB API key is read from the database (set it in Admin → Settings → Payment → ImgBB API Key). Only the image file is sent — the backend handles the key. Any authenticated user (not just admin) can upload.',
      endpoints: [
        {
          method: 'POST', path: '/upload/imgbb', auth: true,
          description: 'Upload an image file to ImgBB. Send as multipart/form-data with field name "image". Supported types: JPEG, PNG, WebP, GIF. Max size: 5 MB. The backend reads the ImgBB API key from MongoDB (Settings collection, key: "imgbbApiKey") — you do NOT need to send the key from the client.',
          request: {
            headers: { 'Authorization': 'Bearer <token>' },
            body: '// Postman → Body → form-data\n// Key: image   Type: File   Value: select your file\n\n// cURL example:\n// curl -X POST https://laundry-service-booking-app-backend.onrender.com/api/v1/upload/imgbb \\\n//   -H "Authorization: Bearer <token>" \\\n//   -F "image=@/path/to/photo.jpg"'
          },
          response: JSON.stringify({
            status: 'success',
            data: {
              url: 'https://i.ibb.co/xxxxx/image.jpg',
              deleteUrl: 'https://ibb.co/xxxxx',
              thumbnail: 'https://i.ibb.co/xxxxx/image_thumb.jpg'
            }
          }, null, 2)
        }
      ]
    },

    // ── 14. ADMIN — DASHBOARD & ORDERS ──
    {
      title: 'Admin — Dashboard & Orders',
      icon: '🛡️',
      description: 'Admin dashboard stats, order management, assignments (role: admin)',
      endpoints: [
        {
          method: 'GET', path: '/admin/dashboard-stats', auth: true, role: 'admin',
          description: 'Get admin dashboard statistics',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', data: { totalRevenue: 125000, monthlyRevenue: 25000, totalOrders: 500, pendingOrders: 15, activeOrders: 25, completedOrders: 450, cancelledOrders: 10, totalCustomers: 300, totalDeliveryBoys: 10, totalStaff: 8, recentOrders: [], monthlyChart: [{ month: 'Jan', revenue: 25000, orders: 100 }] } }, null, 2)
        },
        {
          method: 'GET', path: '/admin/orders', auth: true, role: 'admin',
          description: 'Get all orders with filters',
          queryParams: 'status=pending&page=1&limit=20',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', data: { orders: [{ _id: '678abc...', orderId: 'ORD-123', status: 'pending', totalAmount: 180, user: { name: 'John Doe' } }], pagination: { page: 1, limit: 20, total: 15, pages: 1 } } }, null, 2)
        },
        {
          method: 'GET', path: '/admin/orders/:id', auth: true, role: 'admin',
          description: 'Get single order detail (admin view)',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', data: { _id: '678abc...', orderId: 'ORD-123', status: 'pending', items: [], billingInfo: {}, shippingInfo: {}, totalAmount: 180, user: { name: 'John' }, assignedDeliveryBoy: null, assignedStaff: null } }, null, 2)
        },
        {
          method: 'PUT', path: '/admin/orders/:id/status', auth: true, role: 'admin',
          description: 'Update order status (e.g. confirm, mark ready)',
          request: { headers: { 'Authorization': 'Bearer <token>' }, body: JSON.stringify({ status: 'confirmed' }, null, 2) },
          response: JSON.stringify({ status: 'success', data: { orderId: 'ORD-123', status: 'confirmed' } }, null, 2)
        },
        {
          method: 'PUT', path: '/admin/orders/:id/assign-pickup', auth: true, role: 'admin',
          description: 'Assign delivery boy for pickup',
          request: { headers: { 'Authorization': 'Bearer <token>' }, body: JSON.stringify({ deliveryBoyId: '<user_id>' }, null, 2) },
          response: JSON.stringify({ status: 'success', data: { orderId: 'ORD-123', status: 'pickup_assigned' } }, null, 2)
        },
        {
          method: 'PUT', path: '/admin/orders/:id/assign-staff', auth: true, role: 'admin',
          description: 'Assign staff for cleaning',
          request: { headers: { 'Authorization': 'Bearer <token>' }, body: JSON.stringify({ staffId: '<user_id>' }, null, 2) },
          response: JSON.stringify({ status: 'success', data: { orderId: 'ORD-123', assignedStaff: { name: 'Salam Staff' } } }, null, 2)
        },
        {
          method: 'PUT', path: '/admin/orders/:id/assign-delivery', auth: true, role: 'admin',
          description: 'Assign delivery boy for outgoing delivery',
          request: { headers: { 'Authorization': 'Bearer <token>' }, body: JSON.stringify({ deliveryBoyId: '<user_id>' }, null, 2) },
          response: JSON.stringify({ status: 'success', data: { orderId: 'ORD-123', status: 'delivery_assigned' } }, null, 2)
        }
      ]
    },

    // ── 15. ADMIN — SERVICES & CATEGORIES ──
    {
      title: 'Admin — Services & Categories',
      icon: '🧺',
      description: 'CRUD for laundry services and categories (role: admin)',
      endpoints: [
        {
          method: 'GET', path: '/admin/services', auth: true, role: 'admin',
          description: 'Get all services (including inactive)',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', data: [{ _id: '678abc...', name: 'Wash & Fold', slug: 'wash-and-fold', pricingType: 'per_kg', pricePerKg: 60, category: 'washing', isActive: true }] }, null, 2)
        },
        {
          method: 'POST', path: '/admin/services', auth: true, role: 'admin',
          description: 'Create a new service',
          request: { headers: { 'Authorization': 'Bearer <token>' }, body: JSON.stringify({ name: 'Express Wash', slug: 'express-wash', description: 'Fast laundry within 4 hours', pricingType: 'per_kg', pricePerKg: 100, category: 'washing', items: [{ name: 'Regular Clothes', price: 100 }], features: ['Fast', 'Premium'], image: 'https://i.ibb.co/xxxxx/express.jpg', isActive: true }, null, 2) },
          response: JSON.stringify({ status: 'success', data: { _id: '678abc...', name: 'Express Wash' } }, null, 2)
        },
        {
          method: 'PUT', path: '/admin/services/:id', auth: true, role: 'admin',
          description: 'Update a service (partial update supported)',
          request: { headers: { 'Authorization': 'Bearer <token>' }, body: JSON.stringify({ name: 'Express Wash Updated', pricePerKg: 120, isActive: true }, null, 2) },
          response: JSON.stringify({ status: 'success', data: { _id: '678abc...', name: 'Express Wash Updated', pricePerKg: 120 } }, null, 2)
        },
        {
          method: 'DELETE', path: '/admin/services/:id', auth: true, role: 'admin',
          description: 'Delete a service',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', message: 'Service deleted' }, null, 2)
        },
        {
          method: 'GET', path: '/admin/categories', auth: true, role: 'admin',
          description: 'Get all service categories',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', data: [{ _id: '678abc...', name: 'Washing', slug: 'washing' }, { _id: '678def...', name: 'Dry Cleaning', slug: 'dry_cleaning' }] }, null, 2)
        },
        {
          method: 'POST', path: '/admin/categories', auth: true, role: 'admin',
          description: 'Create a new service category',
          request: { headers: { 'Authorization': 'Bearer <token>' }, body: JSON.stringify({ name: 'Premium', slug: 'premium' }, null, 2) },
          response: JSON.stringify({ status: 'success', data: { _id: '678abc...', name: 'Premium', slug: 'premium' } }, null, 2)
        }
      ]
    },

    // ── 16. ADMIN — USERS ──
    {
      title: 'Admin — Users',
      icon: '👥',
      description: 'User management — list, create, update role, block/unblock (role: admin)',
      endpoints: [
        {
          method: 'GET', path: '/admin/users', auth: true, role: 'admin',
          description: 'Get all users with pagination & role filter',
          queryParams: 'page=1&limit=20&role=user',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', data: { users: [{ _id: '678abc...', name: 'John Doe', email: 'john@example.com', phone: '+8801712345678', role: 'user', isBlocked: false, isVerified: true }], pagination: { page: 1, limit: 20, total: 300, pages: 15 } } }, null, 2)
        },
        {
          method: 'POST', path: '/admin/users', auth: true, role: 'admin',
          description: 'Create a new user (delivery boy, staff, etc.)',
          request: { headers: { 'Authorization': 'Bearer <token>' }, body: JSON.stringify({ name: 'New Delivery Boy', email: 'delivery4@ultrawash.com', phone: '+8801700000004', password: '123456', role: 'delivery' }, null, 2) },
          response: JSON.stringify({ status: 'success', data: { _id: '678abc...', name: 'New Delivery Boy', role: 'delivery' } }, null, 2)
        },
        {
          method: 'PUT', path: '/admin/users/:id', auth: true, role: 'admin',
          description: 'Update user (change role, block/unblock)',
          request: { headers: { 'Authorization': 'Bearer <token>' }, body: JSON.stringify({ role: 'delivery', isBlocked: false, isVerified: true }, null, 2) },
          response: JSON.stringify({ status: 'success', data: { _id: '678abc...', role: 'delivery', isBlocked: false } }, null, 2)
        }
      ]
    },

    // ── 17. ADMIN — DELIVERY & STAFF LISTS ──
    {
      title: 'Admin — Delivery & Staff Lists',
      icon: '📋',
      description: 'Get delivery boys/staff for assignment + settle earnings (role: admin)',
      endpoints: [
        {
          method: 'GET', path: '/admin/delivery-boys', auth: true, role: 'admin',
          description: 'Get all delivery boys (with optional nearby filter)',
          queryParams: 'lat=23.79&lng=90.41',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', data: [{ _id: '678abc...', name: 'Karim Delivery', email: 'delivery1@ultrawash.com', phone: '+8801700000001', currentLocation: { type: 'Point', coordinates: [90.41, 23.79] } }] }, null, 2)
        },
        {
          method: 'GET', path: '/admin/staff-list', auth: true, role: 'admin',
          description: 'Get all staff members',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', data: [{ _id: '678abc...', name: 'Salam Staff', email: 'staff1@ultrawash.com', phone: '+8801700000005' }] }, null, 2)
        },
        {
          method: 'PUT', path: '/admin/settle-earnings/:deliveryBoyId', auth: true, role: 'admin',
          description: 'Settle delivery boy earnings',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', data: { settledAmount: 3500, message: 'Earnings settled' } }, null, 2)
        }
      ]
    },

    // ── 18. ADMIN — COUPONS ──
    {
      title: 'Admin — Coupons',
      icon: '🎟️',
      description: 'CRUD for discount coupons (role: admin)',
      endpoints: [
        {
          method: 'GET', path: '/admin/coupons', auth: true, role: 'admin',
          description: 'Get all coupons',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', data: [{ _id: '678abc...', code: 'SAVE20', discountType: 'percentage', discountValue: 20, minOrderAmount: 200, maxDiscount: 100, startDate: '2025-01-01', endDate: '2025-12-31', usageLimit: 100, usedCount: 25, isActive: true }] }, null, 2)
        },
        {
          method: 'POST', path: '/admin/coupons', auth: true, role: 'admin',
          description: 'Create a new coupon',
          request: { headers: { 'Authorization': 'Bearer <token>' }, body: JSON.stringify({ code: 'WELCOME50', discountType: 'percentage', discountValue: 50, minOrderAmount: 300, maxDiscount: 200, startDate: '2025-01-01', endDate: '2025-12-31', usageLimit: 50, isActive: true }, null, 2) },
          response: JSON.stringify({ status: 'success', data: { _id: '678abc...', code: 'WELCOME50' } }, null, 2)
        },
        {
          method: 'PUT', path: '/admin/coupons/:id', auth: true, role: 'admin',
          description: 'Update a coupon (or toggle isActive)',
          request: { headers: { 'Authorization': 'Bearer <token>' }, body: JSON.stringify({ discountValue: 30, isActive: true }, null, 2) },
          response: JSON.stringify({ status: 'success', data: { _id: '678abc...', discountValue: 30 } }, null, 2)
        },
        {
          method: 'DELETE', path: '/admin/coupons/:id', auth: true, role: 'admin',
          description: 'Delete a coupon',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', message: 'Coupon deleted' }, null, 2)
        }
      ]
    },

    // ── 19. ADMIN — REVIEWS ──
    {
      title: 'Admin — Reviews',
      icon: '⭐',
      description: 'Manage reviews — approve, reject, reply, delete (role: admin)',
      endpoints: [
        {
          method: 'GET', path: '/admin/reviews', auth: true, role: 'admin',
          description: 'Get all reviews',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', data: [{ _id: '678abc...', user: { name: 'John' }, store: { name: 'UltraWash Gulshan' }, rating: 5, comment: 'Great!', status: 'approved', adminReply: 'Thank you!' }] }, null, 2)
        },
        {
          method: 'PUT', path: '/admin/reviews/:id', auth: true, role: 'admin',
          description: 'Update review — approve/reject + admin reply',
          request: { headers: { 'Authorization': 'Bearer <token>' }, body: JSON.stringify({ status: 'approved', adminReply: 'Thank you for your feedback!' }, null, 2) },
          response: JSON.stringify({ status: 'success', data: { _id: '678abc...', status: 'approved', adminReply: 'Thank you!' } }, null, 2)
        },
        {
          method: 'DELETE', path: '/admin/reviews/:id', auth: true, role: 'admin',
          description: 'Delete a review',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', message: 'Review deleted' }, null, 2)
        }
      ]
    },

    // ── 20. ADMIN — STORES ──
    {
      title: 'Admin — Stores',
      icon: '🏬',
      description: 'CRUD for store locations (role: admin)',
      endpoints: [
        {
          method: 'GET', path: '/admin/stores', auth: true, role: 'admin',
          description: 'Get all stores (admin view)',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', data: [{ _id: '678abc...', name: 'UltraWash Gulshan', slug: 'ultrawash-gulshan', address: 'Gulshan-2', isActive: true, isFeatured: true }] }, null, 2)
        },
        {
          method: 'POST', path: '/admin/stores', auth: true, role: 'admin',
          description: 'Create a new store',
          request: { headers: { 'Authorization': 'Bearer <token>' }, body: JSON.stringify({ name: 'UltraWash Chittagong', slug: 'ultrawash-chittagong', address: 'GEC Circle, Chittagong', area: 'GEC', city: 'Chittagong', location: { type: 'Point', coordinates: [91.8123, 22.3569] }, phone: '+8801700000007', email: 'chittagong@ultrawash.com', services: ['<service_id>'], operatingHours: { open: '08:00', close: '22:00' }, features: ['Free Pickup', 'Express'], isFeatured: true, isActive: true }, null, 2) },
          response: JSON.stringify({ status: 'success', data: { _id: '678abc...', name: 'UltraWash Chittagong' } }, null, 2)
        },
        {
          method: 'PUT', path: '/admin/stores/:id', auth: true, role: 'admin',
          description: 'Update a store',
          request: { headers: { 'Authorization': 'Bearer <token>' }, body: JSON.stringify({ name: 'UltraWash Chittagong Updated', phone: '+8801700000008', isFeatured: false }, null, 2) },
          response: JSON.stringify({ status: 'success', data: { _id: '678abc...', name: 'UltraWash Chittagong Updated' } }, null, 2)
        },
        {
          method: 'DELETE', path: '/admin/stores/:id', auth: true, role: 'admin',
          description: 'Delete a store',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', message: 'Store deleted' }, null, 2)
        }
      ]
    },

    // ── 21. ADMIN — NOTIFICATIONS ──
    {
      title: 'Admin — Notifications',
      icon: '🔔',
      description: 'Admin notification management (role: admin)',
      endpoints: [
        {
          method: 'GET', path: '/admin/notifications', auth: true, role: 'admin',
          description: 'Get admin notifications (paginated, returns unreadCount)',
          queryParams: 'page=1&limit=20',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', unreadCount: 8, data: [{ _id: '678abc...', title: 'New Order Received', message: 'John Doe placed order ORD-123', type: 'new_order', isRead: false, createdAt: '2025-01-15' }], pagination: { page: 1, limit: 20, total: 100, pages: 5 } }, null, 2)
        },
        {
          method: 'PUT', path: '/admin/notifications/:id/read', auth: true, role: 'admin',
          description: 'Mark single admin notification as read',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', message: 'Notification marked as read' }, null, 2)
        },
        {
          method: 'PUT', path: '/admin/notifications/all/read', auth: true, role: 'admin',
          description: 'Mark all admin notifications as read',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', message: 'All notifications marked as read' }, null, 2)
        }
      ]
    },

    // ── 22. ADMIN — PAYMENTS ──
    {
      title: 'Admin — Payments',
      icon: '💳',
      description: 'Payment records and refund management (role: admin)',
      endpoints: [
        {
          method: 'GET', path: '/admin/payments', auth: true, role: 'admin',
          description: 'Get all payment records with filters',
          queryParams: 'page=1&limit=15&status=completed&method=cod',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', data: [{ _id: '678abc...', orderId: 'ORD-123', amount: 180, method: 'cod', status: 'completed', user: { name: 'John Doe' }, createdAt: '2025-01-15' }], stats: { totalRevenue: 125000, totalOrders: 500, completedPayments: 450, pendingPayments: 15 }, pagination: { page: 1, totalPages: 10, total: 150 } }, null, 2)
        },
        {
          method: 'POST', path: '/admin/payments/:id/refund', auth: true, role: 'admin',
          description: 'Process a refund for a payment',
          request: { headers: { 'Authorization': 'Bearer <token>' }, body: JSON.stringify({ reason: 'Customer complaint - order damaged', notes: 'Full refund approved by manager' }, null, 2) },
          response: JSON.stringify({ status: 'success', message: 'Refund processed', data: { refundAmount: 180, status: 'refunded' } }, null, 2)
        }
      ]
    },

    // ── 23. ADMIN — PAYMENT GATEWAYS ──
    {
      title: 'Admin — Payment Gateways',
      icon: '🔑',
      description: 'কোন payment method চালু আছে কোনটা বন্ধ সেটা দেখা ও configure করা। Stripe, Cash on Delivery, Wallet, PayPal, Paystack সাপোর্ট করে। সব config MongoDB Settings collection-এ key "paymentGateways"-এ save হয়। Secret key সবসময় masked হয়ে আসে (শেষ 4 char)। publishableKey full আসে কারণ এটা client-এ দেওয়া safe। Role: admin.',
      endpoints: [
        {
          method: 'GET', path: '/admin/payment-gateways', auth: true, role: 'admin',
          description: 'সব payment gateway-র config দেখো — কোনটা enabled (চালু) আর কোনটা disabled (বন্ধ)। enabled: true হলে সেই method checkout-এ দেখাবে, false হলে দেখাবে না। Secret key masked হয়ে আসে (e.g. "****zIhI") — full key দেখা যায় না। publishableKey full আসে। এই API দিয়ে বুঝবে কোন gateway activate করতে হবে।',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({
            status: 'success',
            data: {
              stripe:          { enabled: true,  displayName: 'Credit / Debit Card',          publishableKey: 'pk_test_51SwH2i00...', secretKey: '****zIhI', description: 'Secure card payment via Stripe' },
              cashOnDelivery:  { enabled: true,  displayName: 'Cash on Delivery',             description: 'Pay when your order arrives' },
              wallet:          { enabled: false, displayName: 'Wallet',                       publishableKey: '', secretKey: '', description: 'Pay from your wallet balance' },
              paypal:          { enabled: false, displayName: 'PayPal',                       publishableKey: '', secretKey: '', description: 'Pay securely with PayPal' },
              paystack:        { enabled: false, displayName: 'Paystack',                     publishableKey: '', secretKey: '', description: 'Cards, bank transfer, mobile money' }
            }
          }, null, 2)
        },
        {
          method: 'PUT', path: '/admin/payment-gateways/stripe', auth: true, role: 'admin',
          description: 'Stripe চালু করো এবং key বসাও। publishableKey (pk_test_...) হলো public key — Stripe.js SDK initialize করতে লাগে। secretKey (sk_test_...) হলো private key — backend PaymentIntent তৈরি করতে ব্যবহার করে, কখনো frontend-এ যায় না।\n\n⚠️ Secret key rule: GET response-এ যে masked value (****zIhI) পাবে সেটা ফেরত পাঠিও না — backend ignore করবে। শুধু নতুন real key পাঠাও তখনই DB-তে save হবে।',
          request: {
            headers: { 'Authorization': 'Bearer <token>', 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: true, publishableKey: 'pk_test_your_publishable_key', secretKey: 'set_on_server_only' }, null, 2)
          },
          response: JSON.stringify({ status: 'success', message: 'stripe gateway updated successfully', data: { enabled: true, displayName: 'Credit / Debit Card', publishableKey: 'pk_test_51SwH2i00...', secretKey: '****zIhI' } }, null, 2)
        },
        {
          method: 'PUT', path: '/admin/payment-gateways/cashOnDelivery', auth: true, role: 'admin',
          description: 'Cash on Delivery চালু বা বন্ধ করো। এর কোনো API key লাগে না।',
          request: {
            headers: { 'Authorization': 'Bearer <token>', 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: true }, null, 2)
          },
          response: JSON.stringify({ status: 'success', message: 'cashOnDelivery gateway updated successfully', data: { enabled: true, displayName: 'Cash on Delivery' } }, null, 2)
        },
        {
          method: 'PUT', path: '/admin/payment-gateways/paypal', auth: true, role: 'admin',
          description: 'PayPal চালু করো। publishableKey = PayPal Client ID, secretKey = PayPal Secret.',
          request: {
            headers: { 'Authorization': 'Bearer <token>', 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: true, publishableKey: 'AYourPayPalClientID...', secretKey: 'EYourPayPalSecret...' }, null, 2)
          },
          response: JSON.stringify({ status: 'success', message: 'paypal gateway updated successfully', data: { enabled: true, displayName: 'PayPal', secretKey: '****t...' } }, null, 2)
        },
        {
          method: 'PUT', path: '/admin/payment-gateways/paystack', auth: true, role: 'admin',
          description: 'Paystack চালু করো। publishableKey = Paystack Public Key (pk_...), secretKey = Paystack Secret Key (sk_...).',
          request: {
            headers: { 'Authorization': 'Bearer <token>', 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: true, publishableKey: 'pk_live_...', secretKey: 'sk_live_...' }, null, 2)
          },
          response: JSON.stringify({ status: 'success', message: 'paystack gateway updated successfully', data: { enabled: true, displayName: 'Paystack', secretKey: '****...' } }, null, 2)
        },
        {
          method: 'PUT', path: '/admin/payment-gateways/wallet', auth: true, role: 'admin',
          description: 'Wallet payment চালু বা বন্ধ করো। API key লাগে না।',
          request: {
            headers: { 'Authorization': 'Bearer <token>', 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: true }, null, 2)
          },
          response: JSON.stringify({ status: 'success', message: 'wallet gateway updated successfully', data: { enabled: true, displayName: 'Wallet' } }, null, 2)
        }
      ]
    },

    // ── 24. ADMIN — REPORTS ──
    {
      title: 'Admin — Reports',
      icon: '📊',
      description: 'Revenue and order reports (role: admin)',
      endpoints: [
        {
          method: 'GET', path: '/admin/reports', auth: true, role: 'admin',
          description: 'Get revenue & order reports by period',
          queryParams: 'period=monthly',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', data: { totalRevenue: 125000, totalOrders: 500, averageOrderValue: 250, topServices: [{ name: 'Wash & Fold', orders: 200, revenue: 50000 }], chart: [{ label: 'Jan', revenue: 25000, orders: 100 }] } }, null, 2)
        }
      ]
    },

    // ── 24. ADMIN — SETTINGS ──
    {
      title: 'Admin — Settings',
      icon: '⚙️',
      description: 'App-wide settings management (role: admin)',
      endpoints: [
        {
          method: 'GET', path: '/admin/settings', auth: true, role: 'admin',
          description: 'Get all app settings',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', data: { siteName: 'UltraWash Laundry', headerLogo: 'https://i.ibb.co/xxxxx/logo.png', footerLogo: '...', favicon: '...', heroImage: '...', primaryColor: '#00BFA6', currency: 'USD', deliveryCharge: 0.42, freeDeliveryThreshold: 4.17, contactPageData: {} } }, null, 2)
        },
        {
          method: 'PUT', path: '/admin/settings', auth: true, role: 'admin',
          description: 'Update app settings (partial update supported)',
          request: { headers: { 'Authorization': 'Bearer <token>' }, body: JSON.stringify({ siteName: 'UltraWash Laundry BD', primaryColor: '#00BFA6', deliveryCharge: 60, freeDeliveryThreshold: 500, contactPageData: { heroTitle: 'Contact Us', heroSubtitle: 'We are here to help!' } }, null, 2) },
          response: JSON.stringify({ status: 'success', message: 'Settings updated' }, null, 2)
        }
      ]
    },

    // ── 25. ADMIN — TICKETS ──
    {
      title: 'Admin — Tickets',
      icon: '🎫',
      description: 'Support ticket management (role: admin)',
      endpoints: [
        {
          method: 'GET', path: '/admin/tickets', auth: true, role: 'admin',
          description: 'Get all support tickets with filters',
          queryParams: 'status=open&priority=high&category=order&search=keyword',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', data: { tickets: [{ _id: '678abc...', subject: 'Order delayed', status: 'open', priority: 'high', category: 'order', user: { name: 'John Doe' }, createdAt: '2025-01-15' }], stats: { open: 5, assigned: 3, in_progress: 2, resolved: 10, closed: 50, total: 70 } } }, null, 2)
        },
        {
          method: 'GET', path: '/admin/tickets/staff-list', auth: true, role: 'admin',
          description: 'Get staff list for ticket assignment',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', data: [{ _id: '678abc...', name: 'Support Staff 1', email: 'support1@ultrawash.com' }] }, null, 2)
        },
        {
          method: 'GET', path: '/admin/tickets/:id', auth: true, role: 'admin',
          description: 'Get ticket detail with notes',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', data: { _id: '678abc...', subject: 'Order delayed', description: 'My order was not picked up', status: 'open', priority: 'high', user: { name: 'John' }, notes: [{ message: 'Customer reported issue', sender: 'user' }] } }, null, 2)
        },
        {
          method: 'PUT', path: '/admin/tickets/:id', auth: true, role: 'admin',
          description: 'Update ticket (status, priority, assign, add message)',
          request: { headers: { 'Authorization': 'Bearer <token>' }, body: JSON.stringify({ status: 'in_progress', priority: 'high', assignedTo: '<staff_user_id>', message: 'We are looking into this.' }, null, 2) },
          response: JSON.stringify({ status: 'success', data: { _id: '678abc...', status: 'in_progress', assignedTo: { name: 'Support Staff 1' } } }, null, 2)
        },
        {
          method: 'DELETE', path: '/admin/tickets/:id', auth: true, role: 'admin',
          description: 'Delete a ticket permanently',
          request: { headers: { 'Authorization': 'Bearer <token>' } },
          response: JSON.stringify({ status: 'success', message: 'Ticket deleted' }, null, 2)
        }
      ]
    }
  ], []);

  const totalEndpoints = useMemo(() => apiGroups.reduce((s, g) => s + g.endpoints.length, 0), [apiGroups]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery && methodFilter === 'ALL') return apiGroups;
    return apiGroups
      .map(g => ({
        ...g,
        endpoints: g.endpoints.filter(ep => {
          const mMatch = methodFilter === 'ALL' || ep.method === methodFilter;
          const sMatch = !searchQuery || ep.path.toLowerCase().includes(searchQuery.toLowerCase()) || ep.description.toLowerCase().includes(searchQuery.toLowerCase()) || g.title.toLowerCase().includes(searchQuery.toLowerCase());
          return mMatch && sMatch;
        })
      }))
      .filter(g => g.endpoints.length > 0);
  }, [apiGroups, searchQuery, methodFilter]);

  const filteredTotal = useMemo(() => filteredGroups.reduce((s, g) => s + g.endpoints.length, 0), [filteredGroups]);

  const toggleSection = (t: string) => setExpandedSections(p => ({ ...p, [t]: !p[t] }));
  const toggleEndpoint = (k: string) => setExpandedEndpoints(p => ({ ...p, [k]: !p[k] }));

  const expandAll = () => {
    const s: Record<string, boolean> = {};
    const e: Record<string, boolean> = {};
    filteredGroups.forEach(g => { s[g.title] = true; g.endpoints.forEach((_, i) => { e[`${g.title}-${i}`] = true; }); });
    setExpandedSections(s);
    setExpandedEndpoints(e);
  };
  const collapseAll = () => { setExpandedSections({}); setExpandedEndpoints({}); };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(key);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const mc = (m: string) => ({ GET: 'bg-blue-500', POST: 'bg-green-500', PUT: 'bg-yellow-500', DELETE: 'bg-red-500', PATCH: 'bg-purple-500' }[m] || 'bg-gray-500');
  const mbc = (m: string) => ({ GET: 'border-l-blue-500', POST: 'border-l-green-500', PUT: 'border-l-yellow-500', DELETE: 'border-l-red-500', PATCH: 'border-l-purple-500' }[m] || 'border-l-gray-500');

  const getCurl = (ep: Endpoint) => {
    const fp = ep.queryParams ? `${ep.path}?${ep.queryParams}` : ep.path;
    let c = `curl -X ${ep.method} "${baseUrl}${fp}"`;
    if (ep.auth) c += ` \\\n  -H "Authorization: Bearer YOUR_TOKEN_HERE"`;
    if (ep.request?.body && !ep.request.body.startsWith('//')) c += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${ep.request.body}'`;
    return c;
  };

  const getBody = (ep: Endpoint) => (ep.request?.body && !ep.request.body.startsWith('//')) ? ep.request.body : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-linear-to-r from-[#0f2744] to-[#1a4d7a] text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">🚀 UltraWash API Documentation</h1>
          <p className="text-lg md:text-xl text-blue-100">Complete REST API Reference — Swagger Style</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <div className="bg-white/10 backdrop-blur px-4 py-2 rounded-lg"><span className="text-sm text-blue-200">Base URL:</span><code className="ml-2 text-white font-mono text-sm">{baseUrl}</code></div>
            <div className="bg-white/10 backdrop-blur px-4 py-2 rounded-lg"><span className="text-sm text-blue-200">Version:</span><code className="ml-2 text-white font-mono">v1</code></div>
            <div className="bg-white/10 backdrop-blur px-4 py-2 rounded-lg"><span className="text-sm text-blue-200">Total Endpoints:</span><code className="ml-2 text-white font-mono">{totalEndpoints}</code></div>
            <div className="bg-white/10 backdrop-blur px-4 py-2 rounded-lg"><span className="text-sm text-blue-200">Groups:</span><code className="ml-2 text-white font-mono">{apiGroups.length}</code></div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Credentials */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-bold text-yellow-900 dark:text-yellow-200 mb-3">🔐 Test Login Credentials <span className="text-sm font-normal">(All passwords: <code className="bg-yellow-200 dark:bg-yellow-800 px-2 py-0.5 rounded">123456</code>)</span></h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            {[{ r: 'Admin', e: 'admin@ultrawash.com', c: 'text-red-700 dark:text-red-300' }, { r: 'Customer', e: 'Register via /signup', c: 'text-blue-700 dark:text-blue-300' }, { r: 'Delivery Boy', e: 'delivery1@ultrawash.com', c: 'text-green-700 dark:text-green-300' }, { r: 'Staff', e: 'staff1@ultrawash.com', c: 'text-purple-700 dark:text-purple-300' }].map(x => (
              <div key={x.r} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-yellow-100 dark:border-yellow-900/40">
                <p className={`font-semibold ${x.c}`}>{x.r}</p>
                <p className="text-yellow-800 dark:text-yellow-400 font-mono text-xs mt-1 break-all">{x.e}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6 flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search endpoints... (e.g. /auth/login, register, admin)" className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white" />
          </div>
          <div className="flex items-center gap-2">
            <FiFilter className="w-4 h-4 text-gray-500" />
            {['ALL', 'GET', 'POST', 'PUT', 'DELETE'].map(m => (
              <button key={m} onClick={() => setMethodFilter(m)} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${methodFilter === m ? (m === 'ALL' ? 'bg-gray-700 text-white' : m === 'GET' ? 'bg-blue-500 text-white' : m === 'POST' ? 'bg-green-500 text-white' : m === 'PUT' ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white') : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>{m}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={expandAll} className="px-3 py-1.5 text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-md hover:bg-blue-100">Expand All</button>
            <button onClick={collapseAll} className="px-3 py-1.5 text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-200">Collapse All</button>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Showing {filteredTotal} of {totalEndpoints}</span>
        </div>

        {/* API Groups */}
        <div className="space-y-4">
          {filteredGroups.map(group => (
            <div key={group.title} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <button onClick={() => toggleSection(group.title)} className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                <div className="text-left">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">{group.icon} {group.title}</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{group.description}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">{group.endpoints.length} endpoint{group.endpoints.length > 1 ? 's' : ''}</span>
                    {group.endpoints.some(e => e.auth) && <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 px-2 py-0.5 rounded-full">🔒 Auth</span>}
                  </div>
                </div>
                {expandedSections[group.title] ? <FiChevronDown className="w-6 h-6 text-gray-500 shrink-0" /> : <FiChevronRight className="w-6 h-6 text-gray-500 shrink-0" />}
              </button>

              {expandedSections[group.title] && (
                <div className="border-t border-gray-200 dark:border-gray-700">
                  {group.endpoints.map((ep, idx) => {
                    const ek = `${group.title}-${idx}`;
                    const isExp = expandedEndpoints[ek];
                    return (
                      <div key={ek} className={`border-b border-gray-100 dark:border-gray-750 last:border-0 border-l-4 ${mbc(ep.method)}`}>
                        <button onClick={() => toggleEndpoint(ek)} className="w-full px-6 py-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                          <span className={`${mc(ep.method)} text-white text-xs font-bold px-3 py-1 rounded-md shrink-0 min-w-15 text-center`}>{ep.method}</span>
                          <div className="flex-1 text-left min-w-0">
                            <code className="text-sm font-mono text-gray-900 dark:text-white break-all">{ep.path}{ep.queryParams && <span className="text-gray-400">?{ep.queryParams}</span>}</code>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{ep.description}</p>
                            <div className="flex gap-2 mt-1.5 flex-wrap">
                              {ep.auth && <span className="text-[10px] bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">🔒 Auth</span>}
                              {ep.role && <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">Role: {ep.role}</span>}
                              {ep.request?.body && <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">📋 Has Body</span>}
                            </div>
                          </div>
                          {isExp ? <FiChevronDown className="w-5 h-5 text-gray-500 shrink-0 mt-1" /> : <FiChevronRight className="w-5 h-5 text-gray-500 shrink-0 mt-1" />}
                        </button>

                        {isExp && (
                          <div className="px-6 pb-6 space-y-4 bg-gray-50/50 dark:bg-gray-900/30">
                            {/* cURL */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">📟 cURL Command</label>
                                <button onClick={() => copyToClipboard(getCurl(ep), `curl-${ek}`)} className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1">{copiedText === `curl-${ek}` ? <><FiCheck className="w-3 h-3" /> Copied!</> : <><FiCopy className="w-3 h-3" /> Copy</>}</button>
                              </div>
                              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs leading-relaxed">{getCurl(ep)}</pre>
                            </div>

                            {/* Request Body */}
                            {getBody(ep) && (
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">📮 Request Body (Postman — raw JSON)</label>
                                  <button onClick={() => copyToClipboard(getBody(ep)!, `req-${ek}`)} className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1">{copiedText === `req-${ek}` ? <><FiCheck className="w-3 h-3" /> Copied!</> : <><FiCopy className="w-3 h-3" /> Copy</>}</button>
                                </div>
                                <pre className="bg-white dark:bg-gray-900 text-orange-700 dark:text-orange-300 p-4 rounded-lg overflow-x-auto text-xs border border-gray-200 dark:border-gray-700 leading-relaxed">{getBody(ep)}</pre>
                              </div>
                            )}

                            {/* Non-JSON body */}
                            {ep.request?.body && ep.request.body.startsWith('//') && (
                              <div>
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2 block">📮 Request (multipart/form-data)</label>
                                <pre className="bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 p-4 rounded-lg overflow-x-auto text-xs border border-gray-200 dark:border-gray-700 leading-relaxed">{ep.request.body}</pre>
                              </div>
                            )}

                            {/* Response */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">✅ Response (200 OK)</label>
                                <button onClick={() => copyToClipboard(ep.response, `res-${ek}`)} className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1">{copiedText === `res-${ek}` ? <><FiCheck className="w-3 h-3" /> Copied!</> : <><FiCopy className="w-3 h-3" /> Copy</>}</button>
                              </div>
                              <pre className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4 rounded-lg overflow-x-auto text-xs border border-gray-200 dark:border-gray-700 leading-relaxed">{ep.response}</pre>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Error Format */}
        <div className="mt-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-red-900 dark:text-red-200 mb-3">❌ Error Response Format</h3>
          <pre className="bg-white dark:bg-gray-900 text-red-700 dark:text-red-300 p-4 rounded-lg text-xs overflow-x-auto border border-red-200 dark:border-red-800">
{`{
  "status": "error",
  "message": "Error description here"
}

// 200 - Success    | 201 - Created   | 400 - Bad Request
// 401 - Unauthorized | 403 - Forbidden | 404 - Not Found | 500 - Server Error`}
          </pre>
        </div>

        {/* Summary */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📝 API Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-200 dark:border-gray-700"><th className="text-left py-2 px-3 text-gray-600 dark:text-gray-300">Category</th><th className="text-center py-2 px-3 text-gray-600 dark:text-gray-300">Endpoints</th><th className="text-center py-2 px-3 text-gray-600 dark:text-gray-300">Auth</th></tr></thead>
              <tbody>
                {apiGroups.map(g => (
                  <tr key={g.title} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-2 px-3 text-gray-900 dark:text-white">{g.icon} {g.title}</td>
                    <td className="py-2 px-3 text-center font-mono text-gray-700 dark:text-gray-300">{g.endpoints.length}</td>
                    <td className="py-2 px-3 text-center">{g.endpoints.every(e => e.auth) ? '🔒 Required' : g.endpoints.every(e => !e.auth) ? '❌ None' : '🔀 Mixed'}</td>
                  </tr>
                ))}
                <tr className="font-bold border-t-2 border-gray-300 dark:border-gray-600"><td className="py-2 px-3 text-gray-900 dark:text-white">TOTAL</td><td className="py-2 px-3 text-center font-mono text-gray-900 dark:text-white">{totalEndpoints}</td><td></td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>UltraWash Laundry Service API • Express.js + MongoDB • $ (USD base)</p>
          <p className="mt-1">Next.js 16 Frontend • {totalEndpoints} Endpoints • {apiGroups.length} Groups</p>
        </div>
      </div>
    </div>
  );
};

export default ApiDocsPage;

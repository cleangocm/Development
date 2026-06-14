'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  FiArrowLeft, 
  FiUser, 
  FiPhone, 
  FiMail, 
  FiMapPin, 
  FiCalendar,
  FiPackage,
  FiDollarSign,
  FiTruck,
  FiUserCheck,
  FiLoader,
  FiDownload
} from 'react-icons/fi';
import api from '@/services/api';
import { useTheme } from '@/context/ThemeContext';
import { generateInvoicePDF } from '@/services/invoicePdf';

interface OrderItem {
  service: { _id: string; name: string } | string;
  serviceName?: string;
  quantity: number;
  pricePerUnit: number;
  price?: number;
  subtotal: number;
}

interface Order {
  _id: string;
  orderId: string;
  user: { _id: string; name: string; email: string; phone?: string };
  items: OrderItem[];
  itemsSummary?: string;
  itemCount?: number;
  totalPayment: number;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  address?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  billingInfo?: { fullName?: string; email?: string; phone?: string; address?: string; additionalInstruction?: string };
  shippingInfo?: { fullName?: string; phone?: string; address?: string; additionalInstruction?: string };
  schedule?: { pickupDate?: string; pickupSlot?: string; deliveryDate?: string; deliverySlot?: string };
  pickupDate?: string;
  deliveryDate?: string;
  deliveryType?: string;
  deliverySpeedCharge?: number;
  pickupCharge?: number;
  deliveryCharge?: number;
  couponCode?: string;
  couponDiscount?: number;
  pickupDeliveryBoy?: { _id: string; name: string; phone?: string };
  assignedStaff?: { _id: string; name: string };
  deliveryBoy?: { _id: string; name: string; phone?: string };
  specialInstructions?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const AdminOrderDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const { formatPrice } = useTheme();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const orderId = params.id as string;

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      
      try {
        setLoading(true);
        // Try fetching by the ID provided (could be _id or orderId)
        const res = await api.get(`/admin/orders/${orderId}`);
        if (res.data?.status === 'success' && res.data?.data) {
          setOrder(res.data.data);
        } else {
        }
      } catch (err: unknown) {
        // If 404 or error, try alternative endpoint
        const axiosErr = err as { response?: { status?: number } };
        if (axiosErr?.response?.status === 404) {
          try {
            // Try fetching all orders and find by orderId
            const allRes = await api.get('/admin/orders');
            if (allRes.data?.status === 'success' && allRes.data?.data?.orders) {
              const foundOrder = allRes.data.data.orders.find(
                (o: Order) => o._id === orderId || o.orderId === orderId
              );
              if (foundOrder) {
                setOrder(foundOrder);
              } else {
              }
            }
          } catch (err2) {
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    pickup_assigned: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    picked_up: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    at_warehouse: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    in_process: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    cleaned: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    ready: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    delivery_assigned: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    out_for_delivery: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    delivered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <FiLoader className="w-8 h-8 text-[#00BFA6] animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="text-center py-20">
          <p className="text-gray-500">Order not found</p>
          <button 
            onClick={() => router.push('/admin/orders')} 
            className="mt-4 px-4 py-2 bg-[#00BFA6] text-white rounded-lg hover:bg-[#00A892]"
          >
            Back to Orders
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-6">
        <button 
          onClick={() => router.push('/admin/orders')} 
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#00BFA6] mb-4"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to Orders
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Order #{order.orderId}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => generateInvoicePDF(order as unknown as Parameters<typeof generateInvoicePDF>[0], formatPrice)}
              className="flex items-center gap-2 px-4 py-2 bg-[#00BFA6] text-white rounded-lg hover:bg-[#00A892] transition-colors text-sm font-medium"
            >
              <FiDownload className="w-4 h-4" /> Download Invoice
            </button>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusColors[order.status] || statusColors.pending}`}>
              {order.status.replace(/_/g, ' ').toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiPackage className="w-5 h-5" />
              Order Items
            </h2>
            <div className="space-y-3">
              {order.items && order.items.length > 0 ? order.items.map((item, idx) => {
                const serviceName = item.serviceName || (typeof item.service === 'object' && item.service?.name ? item.service.name : (typeof item.service === 'string' ? item.service : 'Service'));
                const unitPrice = item.pricePerUnit || item.price || 0;
                const itemSubtotal = item.subtotal || (unitPrice * item.quantity);
                return (
                  <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <div>
                      <p className="text-gray-900 dark:text-white font-medium">{serviceName}</p>
                      <p className="text-sm text-gray-500">Quantity: {item.quantity} × {formatPrice(unitPrice)}</p>
                    </div>
                    <p className="text-gray-900 dark:text-white font-semibold">{formatPrice(itemSubtotal)}</p>
                  </div>
                );
              }) : (
                <p className="text-gray-500 text-sm">{order.itemsSummary || 'No items'}</p>
              )}
            </div>

            {/* Price Summary */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600 space-y-2">
              {order.pickupCharge ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Pickup Charge</span>
                  <span className="text-gray-900 dark:text-white">{formatPrice(order.pickupCharge)}</span>
                </div>
              ) : null}
              {order.deliveryCharge ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Delivery Charge</span>
                  <span className="text-gray-900 dark:text-white">{formatPrice(order.deliveryCharge)}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
                <span className="text-gray-900 dark:text-white font-semibold">Total</span>
                <span className="text-lg font-bold text-[#00BFA6]">{formatPrice(order.totalPayment)}</span>
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          {order.specialInstructions && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Special Instructions</h2>
              <p className="text-gray-600 dark:text-gray-400">{order.specialInstructions}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiUser className="w-5 h-5" />
              Customer
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <FiUser className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="text-gray-900 dark:text-white font-medium">{order.user.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FiMail className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-gray-900 dark:text-white">{order.user.email}</p>
                </div>
              </div>
              {order.user.phone && (
                <div className="flex items-start gap-3">
                  <FiPhone className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-gray-900 dark:text-white">{order.user.phone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Addresses */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiMapPin className="w-5 h-5" />
              Addresses
            </h2>
            <div className="space-y-4">
              {(order.pickupAddress || order.billingInfo?.address || order.address) && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Pickup / Billing Address</p>
                  <p className="text-gray-900 dark:text-white text-sm">{order.pickupAddress || order.billingInfo?.address || order.address}</p>
                  {order.billingInfo?.fullName && <p className="text-xs text-gray-500 mt-1">{order.billingInfo.fullName} {order.billingInfo.phone ? `• ${order.billingInfo.phone}` : ''}</p>}
                </div>
              )}
              {(order.deliveryAddress || order.shippingInfo?.address) && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Delivery / Shipping Address</p>
                  <p className="text-gray-900 dark:text-white text-sm">{order.deliveryAddress || order.shippingInfo?.address}</p>
                  {order.shippingInfo?.fullName && <p className="text-xs text-gray-500 mt-1">{order.shippingInfo.fullName} {order.shippingInfo.phone ? `• ${order.shippingInfo.phone}` : ''}</p>}
                </div>
              )}
              {order.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Instructions</p>
                  <p className="text-gray-900 dark:text-white text-sm">{order.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiCalendar className="w-5 h-5" />
              Dates
            </h2>
            <div className="space-y-3">
              {(order.pickupDate || order.schedule?.pickupDate) && (
                <div>
                  <p className="text-sm text-gray-500">Pickup Date</p>
                  <p className="text-gray-900 dark:text-white font-medium">{new Date(order.pickupDate || order.schedule?.pickupDate || '').toLocaleDateString()}</p>
                  {order.schedule?.pickupSlot && <p className="text-xs text-gray-400">{order.schedule.pickupSlot}</p>}
                </div>
              )}
              {(order.deliveryDate || order.schedule?.deliveryDate) && (
                <div>
                  <p className="text-sm text-gray-500">Delivery Date</p>
                  <p className="text-gray-900 dark:text-white font-medium">{new Date(order.deliveryDate || order.schedule?.deliveryDate || '').toLocaleDateString()}</p>
                  {order.schedule?.deliverySlot && <p className="text-xs text-gray-400">{order.schedule.deliverySlot}</p>}
                </div>
              )}
              {order.deliveryType && (
                <div>
                  <p className="text-sm text-gray-500">Delivery Speed</p>
                  <p className="text-gray-900 dark:text-white font-medium capitalize">{order.deliveryType}</p>
                </div>
              )}
            </div>
          </div>

          {/* Assigned Personnel */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Assigned Personnel</h2>
            <div className="space-y-3">
              {order.pickupDeliveryBoy && (
                <div className="flex items-center gap-2">
                  <FiTruck className="w-4 h-4 text-indigo-500" />
                  <div>
                    <p className="text-xs text-gray-500">Pickup</p>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">{order.pickupDeliveryBoy.name}</p>
                  </div>
                </div>
              )}
              {order.assignedStaff && (
                <div className="flex items-center gap-2">
                  <FiUserCheck className="w-4 h-4 text-orange-500" />
                  <div>
                    <p className="text-xs text-gray-500">Staff</p>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">{order.assignedStaff.name}</p>
                  </div>
                </div>
              )}
              {order.deliveryBoy && (
                <div className="flex items-center gap-2">
                  <FiTruck className="w-4 h-4 text-purple-500" />
                  <div>
                    <p className="text-xs text-gray-500">Delivery</p>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">{order.deliveryBoy.name}</p>
                  </div>
                </div>
              )}
              {!order.pickupDeliveryBoy && !order.assignedStaff && !order.deliveryBoy && (
                <p className="text-sm text-gray-400">No personnel assigned yet</p>
              )}
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiDollarSign className="w-5 h-5" />
              Payment
            </h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  order.paymentStatus === 'paid' 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {order.paymentStatus?.toUpperCase() || 'PENDING'}
                </span>
              </div>
              {order.paymentMethod && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Method</span>
                  <span className="text-sm text-gray-900 dark:text-white font-medium">{order.paymentMethod}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOrderDetailsPage;

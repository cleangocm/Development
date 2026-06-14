'use client';

import { useState, useEffect } from 'react';
import DeliveryLayout from '@/components/delivery/DeliveryLayout';
import api from '@/services/api';
import { FiLoader, FiPackage, FiPhone, FiMapPin, FiHome, FiUser } from 'react-icons/fi';

interface RouteOrder {
  _id: string;
  orderId: string;
  status: string;
  user?: { name: string; phone?: string; address?: string; };
  billingInfo?: { fullName: string; phone?: string; address?: string; };
  shippingInfo?: { address?: string; };
  pickupAddress?: string;
  deliveryAddress?: string;
  totalPayment: number;
  pickupCharge?: number;
  deliveryCharge?: number;
}

const OrderInfoPage = () => {
  const [pickupOrders, setPickupOrders] = useState<RouteOrder[]>([]);
  const [deliveryOrders, setDeliveryOrders] = useState<RouteOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const [pRes, dRes] = await Promise.all([
          api.get('/delivery/pickup-orders').catch(() => null),
          api.get('/delivery/out-orders').catch(() => null),
        ]);
        if (pRes?.data?.status === 'success') setPickupOrders(pRes.data.data || []);
        if (dRes?.data?.status === 'success') setDeliveryOrders(dRes.data.data || []);
      } catch { /* */ }
      finally { setLoading(false); }
    };
    fetchOrders();
  }, []);

  const getAddress = (order: RouteOrder) => {
    return order.billingInfo?.address || order.user?.address || order.shippingInfo?.address || order.pickupAddress || order.deliveryAddress || '';
  };

  const getPhone = (order: RouteOrder) => {
    return order.billingInfo?.phone || order.user?.phone || '';
  };

  const getName = (order: RouteOrder) => {
    return order.user?.name || order.billingInfo?.fullName || 'Customer';
  };

  const allActiveOrders = [...pickupOrders, ...deliveryOrders];

  return (
    <DeliveryLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <FiUser className="w-6 h-6 text-[#148f77]" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order Info</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Customer details for pickup and delivery orders</p>
          </div>
        </div>

        {/* Order Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
            <p className="text-3xl font-bold text-[#148f77]">{allActiveOrders.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Orders</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
            <p className="text-3xl font-bold text-blue-600">{pickupOrders.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Pickups</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
            <p className="text-3xl font-bold text-purple-600">{deliveryOrders.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Deliveries</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><FiLoader className="w-8 h-8 text-[#148f77] animate-spin" /></div>
        ) : allActiveOrders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-sm border border-gray-100 dark:border-gray-700">
            <FiPackage className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Active Orders</h3>
            <p className="text-gray-500 dark:text-gray-400">When you have assigned orders, customer info will appear here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pickupOrders.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <FiPackage className="w-5 h-5 text-blue-600" /> Pickup Orders ({pickupOrders.length})
                </h2>
                <div className="space-y-3">
                  {pickupOrders.map((order, idx) => {
                    const address = getAddress(order);
                    const phone = getPhone(order);
                    const name = getName(order);
                    return (
                      <div key={order._id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                              <span className="text-sm font-bold text-blue-600">{idx + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-bold text-gray-900 dark:text-white">{order.orderId}</h3>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  order.status === 'picked_up' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                }`}>{order.status === 'picked_up' ? '✅ Picked Up' : '📦 Pickup'}</span>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300 font-medium flex items-center gap-1.5">
                                <FiUser className="w-3.5 h-3.5 text-gray-400" /> {name}
                              </p>
                              {phone && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1.5">
                                  <FiPhone className="w-3.5 h-3.5 text-gray-400" />
                                  <a href={`tel:${phone}`} className="text-[#148f77] hover:underline">{phone}</a>
                                </p>
                              )}
                              {address && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-start gap-1.5">
                                  <FiMapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-400" /> {address}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        {phone && (
                          <div className="border-t border-gray-100 dark:border-gray-700 p-3">
                            <a href={`tel:${phone}`}
                              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#148f77] text-white rounded-xl text-sm font-medium hover:bg-[#117a65] transition-colors">
                              <FiPhone className="w-4 h-4" /> Call {name}
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {deliveryOrders.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <FiHome className="w-5 h-5 text-purple-600" /> Delivery Orders ({deliveryOrders.length})
                </h2>
                <div className="space-y-3">
                  {deliveryOrders.map((order, idx) => {
                    const address = getAddress(order);
                    const phone = getPhone(order);
                    const name = getName(order);
                    return (
                      <div key={order._id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                              <span className="text-sm font-bold text-purple-600">{idx + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-bold text-gray-900 dark:text-white">{order.orderId}</h3>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  order.status === 'out_for_delivery' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                                }`}>{order.status === 'out_for_delivery' ? '🚚 In Transit' : '📋 Assigned'}</span>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300 font-medium flex items-center gap-1.5">
                                <FiUser className="w-3.5 h-3.5 text-gray-400" /> {name}
                              </p>
                              {phone && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1.5">
                                  <FiPhone className="w-3.5 h-3.5 text-gray-400" />
                                  <a href={`tel:${phone}`} className="text-[#148f77] hover:underline">{phone}</a>
                                </p>
                              )}
                              {address && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-start gap-1.5">
                                  <FiMapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-400" /> {address}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        {phone && (
                          <div className="border-t border-gray-100 dark:border-gray-700 p-3">
                            <a href={`tel:${phone}`}
                              className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors">
                              <FiPhone className="w-4 h-4" /> Call {name}
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DeliveryLayout>
  );
};

export default OrderInfoPage;

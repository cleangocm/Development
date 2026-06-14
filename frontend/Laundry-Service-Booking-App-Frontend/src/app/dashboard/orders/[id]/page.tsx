'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import api from '@/services/api';
import { FiArrowLeft, FiCheck, FiX, FiPackage, FiTruck, FiHome, FiLoader, FiStar, FiDownload } from 'react-icons/fi';
import { useTheme } from '@/context/ThemeContext';
import { generateInvoicePDF } from '@/services/invoicePdf';

interface OrderItem {
  serviceName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface TrackingStep {
  title: string;
  date: string;
  status: 'completed' | 'current' | 'pending' | 'cancelled';
}

interface OrderDetail {
  _id: string;
  orderId: string;
  items: OrderItem[];
  itemCount: number;
  itemsSummary: string;
  orderDate: string;
  deliveryDate: string;
  discount: number;
  subtotal: number;
  totalPayment: number;
  status: string;
  trackingSteps: TrackingStep[];
}

// Order Confirmed, Pickup Assigned, Picked Up, At Warehouse, Cleaning In Progress, Cleaned & Ready, Out for Delivery, Delivered
const stepIcons = [FiCheck, FiHome, FiTruck, FiPackage, FiPackage, FiCheck, FiTruck, FiHome];

const getStepIcon = (step: TrackingStep, index: number) => {
  const Icon = stepIcons[index] || FiCheck;
  if (step.status === 'completed') return (
    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-500 flex items-center justify-center shadow-lg ring-4 ring-green-100 dark:ring-green-900/30">
      <FiCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
    </div>
  );
  if (step.status === 'cancelled') return (
    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-500 flex items-center justify-center shadow-lg ring-4 ring-red-100 dark:ring-red-900/30">
      <FiX className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
    </div>
  );
  if (step.status === 'current') return (
    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#00BFA6] flex items-center justify-center shadow-lg ring-4 ring-[#00BFA6]/20 animate-pulse">
      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
    </div>
  );
  return (
    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center">
      <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500" />
    </div>
  );
};

const getLineColor = (curr: TrackingStep, next?: TrackingStep) => {
  if (curr.status === 'completed' && next && (next.status === 'completed' || next.status === 'current')) return 'bg-green-500';
  if (curr.status === 'cancelled' || (next && next.status === 'cancelled')) return 'bg-red-300';
  return 'bg-gray-200';
};

const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
const formatStatus = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const OrderTrackingPage = () => {
  const { formatPrice } = useTheme();
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Review state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/${orderId}`);
      if (res.data.status === 'success') setOrder(res.data.data);
      else setNotFound(true);
    } catch { setNotFound(true); }
    finally { setLoading(false); }
  }, [orderId]);

  // Check if already reviewed
  useEffect(() => {
    const checkReview = async () => {
      try {
        const res = await api.get('/reviews/my-reviews');
        if (res.data.status === 'success') {
          const exists = res.data.data.find((r: { order?: { _id: string } }) => r.order?._id === orderId);
          if (exists) setReviewSubmitted(true);
        }
      } catch { /* ignore */ }
    };
    if (orderId) checkReview();
  }, [orderId]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  const handleSubmitReview = async () => {
    if (reviewRating === 0) return;
    setReviewSubmitting(true);
    setReviewError('');
    try {
      const res = await api.post('/reviews', {
        orderId: order?._id,
        service: order?.itemsSummary || 'Laundry Service',
        rating: reviewRating,
        comment: reviewComment,
      });
      if (res.data.status === 'success') {
        setReviewSubmitted(true);
        setShowReviewModal(false);
      } else {
        setReviewError(res.data.message || 'Failed to submit review');
      }
    } catch (err: unknown) {
      setReviewError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to submit review');
    } finally { setReviewSubmitting(false); }
  };

  if (loading) return <DashboardLayout><div className="flex items-center justify-center py-20"><FiLoader className="w-8 h-8 text-[#00BFA6] animate-spin" /></div></DashboardLayout>;

  if (notFound || !order) return (
    <DashboardLayout>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
        <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center"><FiX className="w-10 h-10 text-gray-400" /></div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Order Not Found</h2>
        <p className="text-gray-500 mb-6">The order you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/dashboard/orders" className="inline-flex items-center gap-2 px-6 py-3 bg-[#0F2744] dark:bg-[#00BFA6] text-white rounded-lg border-2 border-[#0F2744] dark:border-[#00BFA6] font-medium hover:bg-[#1a3a5c] dark:hover:bg-[#00A892] hover:border-[#1a3a5c] dark:hover:border-[#00A892]"><FiArrowLeft /> Back to Orders</Link>
      </div>
    </DashboardLayout>
  );

  const getStatusColor = (status: string) => {
    if (['confirmed', 'picked_up', 'in_process', 'ready', 'out_for_delivery'].includes(status)) return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700';
    if (status === 'delivered') return 'bg-green-500 text-white';
    if (status === 'cancelled') return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700';
    return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-[#0F2744] dark:text-white hover:text-[#00BFA6] transition-colors font-medium">
          <FiArrowLeft /> Back to Orders
        </button>

        {/* Order Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden animate-fade-in-up">
          <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#0F2744] dark:text-white">Order Tracking</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Order ID: <span className="font-semibold text-[#0F2744] dark:text-white">{order.orderId}</span></p>
              </div>
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold capitalize w-fit ${getStatusColor(order.status)}`}>
                {formatStatus(order.status)}
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-base sm:text-lg font-bold text-[#0F2744] dark:text-white mb-4">{order.itemCount} items ordered: {order.itemsSummary}</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div><p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Order Date</p><p className="text-sm sm:text-base font-semibold text-[#0F2744] dark:text-white">{formatDate(order.orderDate)}</p></div>
              <div className="text-right lg:text-left"><p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Est. Delivery</p><p className="text-sm sm:text-base font-semibold text-[#0F2744] dark:text-white">{formatDate(order.deliveryDate)}</p></div>
              <div><p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Discount</p><p className="text-sm sm:text-base font-semibold text-[#0F2744] dark:text-white">{formatPrice(order.discount)}</p></div>
              <div className="text-right"><p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Total Payment</p><p className="text-sm sm:text-base font-semibold text-[#0F2744] dark:text-white">{formatPrice(order.totalPayment)}</p></div>
            </div>
          </div>

          {/* Tracking Timeline */}
          <div className="p-4 sm:p-6">
            <h3 className="text-lg font-bold text-[#0F2744] dark:text-white mb-6">Tracking Status</h3>
            <div className="hidden md:block">
              <div className="relative flex justify-between items-start">
                {/* Connector lines rendered first — behind circles */}
                {order.trackingSteps.map((step, i) => (
                  i < order.trackingSteps.length - 1 ? (
                    <div
                      key={`line-${i}`}
                      className={`absolute top-5 sm:top-6 h-1 -translate-y-1/2 ${getLineColor(step, order.trackingSteps[i + 1])}`}
                      style={{
                        zIndex: 0,
                        left: `calc(${(i + 0.5) * (100 / order.trackingSteps.length)}%)`,
                        right: `calc(${(order.trackingSteps.length - i - 1.5) * (100 / order.trackingSteps.length)}%)`,
                      }}
                    />
                  ) : null
                ))}
                {/* Step circles rendered on top */}
                {order.trackingSteps.map((step, i) => (
                  <div key={i} className="flex flex-col items-center relative" style={{ width: `${100 / order.trackingSteps.length}%`, zIndex: 1 }}>
                    <div className="animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>{getStepIcon(step, i)}</div>
                    <p className={`mt-3 text-sm font-semibold text-center ${step.status === 'completed' ? 'text-green-600' : step.status === 'cancelled' ? 'text-red-500' : step.status === 'current' ? 'text-[#00BFA6]' : 'text-gray-400'}`}>{step.title}</p>
                    <p className="text-xs text-gray-500 mt-1 text-center">{step.date}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="md:hidden relative">
              {order.trackingSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-4 pb-8 last:pb-0 relative animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="relative z-10 shrink-0">
                    {getStepIcon(step, i)}
                    {i < order.trackingSteps.length - 1 && <div className={`absolute top-12 left-1/2 -translate-x-1/2 w-1 h-8 ${getLineColor(step, order.trackingSteps[i + 1])}`} />}
                  </div>
                  <div className="pt-2">
                    <p className={`text-sm font-semibold ${step.status === 'completed' ? 'text-green-600' : step.status === 'cancelled' ? 'text-red-500' : step.status === 'current' ? 'text-[#00BFA6]' : 'text-gray-400'}`}>{step.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{step.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Review Section - Only for delivered orders */}
        {order.status === 'delivered' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <div className="p-4 sm:p-6">
              {reviewSubmitted ? (
                <div className="flex items-center gap-3 text-green-600">
                  <FiCheck className="w-6 h-6" />
                  <div>
                    <p className="font-semibold">Thank you for your review!</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Your feedback helps us improve our service.</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#0F2744] dark:text-white flex items-center gap-2">
                      <FiStar className="w-5 h-5 text-yellow-400" /> Rate Your Experience
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your order has been delivered. Share your feedback!</p>
                  </div>
                  <button
                    onClick={() => setShowReviewModal(true)}
                    className="px-6 py-3 bg-[#00BFA6] text-white rounded-xl font-medium hover:bg-[#00A892] transition-colors flex items-center gap-2"
                  >
                    <FiStar className="w-4 h-4" /> Write a Review
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700"><h3 className="text-lg font-bold text-[#0F2744] dark:text-white">Order Items</h3></div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {order.items.map((item, i) => (
              <div key={i} className="p-4 sm:p-6 flex justify-between items-center">
                <div><p className="font-semibold text-[#0F2744] dark:text-white">{item.serviceName}</p><p className="text-sm text-gray-500 dark:text-gray-400">Qty: {item.quantity} × {formatPrice(item.price)}</p></div>
                <p className="font-semibold text-[#0F2744] dark:text-white">{formatPrice(item.subtotal)}</p>
              </div>
            ))}
          </div>
          <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-700/50 flex justify-between items-center">
            <span className="font-semibold text-gray-600 dark:text-gray-300">Subtotal</span>
            <span className="font-bold text-[#0F2744] dark:text-white">{formatPrice(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="px-4 sm:px-6 pb-4 bg-gray-50 dark:bg-gray-700/50 flex justify-between items-center">
              <span className="font-semibold text-gray-600 dark:text-gray-300">Discount</span>
              <span className="font-bold text-green-600">-{formatPrice(order.discount)}</span>
            </div>
          )}
          <div className="p-4 sm:p-6 bg-[#0F2744] dark:bg-[#00BFA6] border-2 border-[#0F2744] dark:border-[#00BFA6] flex justify-between items-center">
            <span className="font-semibold text-white">Total Payment</span>
            <span className="font-bold text-white text-lg">{formatPrice(order.totalPayment)}</span>
          </div>
          {order.status === 'delivered' && (
            <div className="p-4 sm:p-6 flex justify-center">
              <button
                onClick={() => generateInvoicePDF(order as unknown as Parameters<typeof generateInvoicePDF>[0], formatPrice)}
                className="flex items-center gap-2 px-6 py-3 bg-[#00BFA6] text-white rounded-xl font-medium hover:bg-[#00A892] transition-colors"
              >
                <FiDownload className="w-5 h-5" /> Download Invoice PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-9998" onClick={() => setShowReviewModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-9999 w-[90vw] max-w-md">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Rate Your Experience</h3>
                <button onClick={() => setShowReviewModal(false)} className="text-gray-400 hover:text-gray-600"><FiX className="w-5 h-5" /></button>
              </div>

              <div className="text-center mb-5">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  <FiPackage className="inline w-4 h-4 mr-1" />{order.orderId} — {order.itemsSummary}
                </p>
                <div className="flex justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} onClick={() => setReviewRating(star)} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} className="cursor-pointer">
                      <FiStar className={`w-8 h-8 transition-colors ${star <= (hoverRating || reviewRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {reviewRating === 0 ? 'Tap a star to rate' : reviewRating <= 2 ? "We're sorry to hear that" : reviewRating <= 3 ? 'Thanks for your feedback' : reviewRating <= 4 ? 'Great experience!' : 'Excellent!'}
                </p>
              </div>

              <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder="Share your experience (optional)..." rows={4}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-[#00BFA6]/30 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none text-sm" />

              {reviewError && <p className="text-red-500 text-sm mt-2">{reviewError}</p>}

              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowReviewModal(false)} className="flex-1 px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                <button onClick={handleSubmitReview} disabled={reviewRating === 0 || reviewSubmitting}
                  className="flex-1 px-6 py-2.5 bg-[#00BFA6] text-white rounded-lg font-medium hover:bg-[#00A892] disabled:opacity-50">
                  {reviewSubmitting ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting</span> : 'Submit Review'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default OrderTrackingPage;

'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FiHome, FiArrowLeft, FiAlertTriangle, FiLock, FiCreditCard, FiShield, FiServer, FiClock, FiWifi } from 'react-icons/fi';

interface StatusInfo {
  code: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  suggestion: string;
}

function getStatusInfo(code: number): StatusInfo {
  const iconClass = 'w-10 h-10 sm:w-12 sm:h-12';

  const statusMap: Record<number, StatusInfo> = {
    400: {
      code: 400,
      title: 'Bad Request',
      description: 'The server could not understand your request. Please check the details and try again.',
      icon: <FiAlertTriangle className={iconClass} />,
      color: 'from-yellow-500 to-orange-500',
      suggestion: 'Verify the information you entered and resubmit.',
    },
    401: {
      code: 401,
      title: 'Unauthorized',
      description: 'You need to log in to access this resource. Please sign in to continue.',
      icon: <FiLock className={iconClass} />,
      color: 'from-orange-500 to-red-500',
      suggestion: 'Sign in to your account and try again.',
    },
    402: {
      code: 402,
      title: 'Payment Required',
      description: 'Payment is required to access this content or complete this action.',
      icon: <FiCreditCard className={iconClass} />,
      color: 'from-[#00BFA6] to-[#0F2744]',
      suggestion: 'Complete your payment to unlock access.',
    },
    403: {
      code: 403,
      title: 'Access Forbidden',
      description: 'You do not have permission to access this page or resource.',
      icon: <FiShield className={iconClass} />,
      color: 'from-red-500 to-red-700',
      suggestion: 'Contact support if you believe this is a mistake.',
    },
    404: {
      code: 404,
      title: 'Page Not Found',
      description: 'The page you are looking for has been moved, deleted, or does not exist.',
      icon: <FiAlertTriangle className={iconClass} />,
      color: 'from-[#0F2744] to-[#00BFA6]',
      suggestion: 'Go back to the homepage or browse our services.',
    },
    408: {
      code: 408,
      title: 'Request Timeout',
      description: 'The server took too long to respond. This may be a temporary issue.',
      icon: <FiClock className={iconClass} />,
      color: 'from-blue-500 to-blue-700',
      suggestion: 'Check your internet connection and try again.',
    },
    409: {
      code: 409,
      title: 'Conflict',
      description: 'There was a conflict with your request. The data may have already been submitted.',
      icon: <FiAlertTriangle className={iconClass} />,
      color: 'from-yellow-500 to-yellow-700',
      suggestion: 'Refresh the page and try again.',
    },
    410: {
      code: 410,
      title: 'Gone',
      description: 'This resource has been permanently removed and is no longer available.',
      icon: <FiAlertTriangle className={iconClass} />,
      color: 'from-gray-500 to-gray-700',
      suggestion: 'This content no longer exists. Return to the homepage.',
    },
    422: {
      code: 422,
      title: 'Unprocessable Content',
      description: 'The server could not process the data you submitted. Please check for errors.',
      icon: <FiAlertTriangle className={iconClass} />,
      color: 'from-orange-500 to-orange-700',
      suggestion: 'Review the form fields and correct any errors.',
    },
    429: {
      code: 429,
      title: 'Too Many Requests',
      description: 'You have made too many requests in a short time. Please slow down.',
      icon: <FiClock className={iconClass} />,
      color: 'from-purple-500 to-purple-700',
      suggestion: 'Wait a few minutes before trying again.',
    },
    500: {
      code: 500,
      title: 'Internal Server Error',
      description: 'Something went wrong on our end. Our team has been notified.',
      icon: <FiServer className={iconClass} />,
      color: 'from-red-600 to-red-800',
      suggestion: 'Please try again later or contact support.',
    },
    502: {
      code: 502,
      title: 'Bad Gateway',
      description: 'The server received an invalid response from an upstream server.',
      icon: <FiServer className={iconClass} />,
      color: 'from-red-500 to-red-700',
      suggestion: 'This is a temporary issue. Please try again shortly.',
    },
    503: {
      code: 503,
      title: 'Service Unavailable',
      description: 'The service is temporarily unavailable due to maintenance or high traffic.',
      icon: <FiWifi className={iconClass} />,
      color: 'from-blue-600 to-blue-800',
      suggestion: 'Our service will be back shortly. Please try again later.',
    },
    504: {
      code: 504,
      title: 'Gateway Timeout',
      description: 'The server did not receive a timely response. Please try again.',
      icon: <FiClock className={iconClass} />,
      color: 'from-blue-500 to-blue-700',
      suggestion: 'Check your connection and retry after a moment.',
    },
  };

  return statusMap[code] ?? {
    code,
    title: 'Unexpected Error',
    description: 'An unexpected error occurred. Please try again or contact support.',
    icon: <FiAlertTriangle className={iconClass} />,
    color: 'from-gray-500 to-gray-700',
    suggestion: 'Return to the homepage and try again.',
  };
}

function ErrorPageContent() {
  const searchParams = useSearchParams();
  const codeParam = searchParams.get('code');
  const messageParam = searchParams.get('message');
  const code = codeParam ? parseInt(codeParam, 10) : 500;
  const status = getStatusInfo(isNaN(code) ? 500 : code);
  const customMessage = messageParam ? decodeURIComponent(messageParam) : null;

  return (
    <main className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center px-4 py-20 sm:py-24">
      <div className="max-w-4xl mx-auto text-center">

        {/* Status Code Display */}
        <div className="mb-8 sm:mb-12 animate-fade-in-up">
          <div className="relative w-full max-w-md mx-auto">
            <div
              className={`text-[120px] sm:text-[180px] md:text-[220px] font-bold text-transparent bg-clip-text bg-linear-to-br ${status.color} leading-none`}
            >
              {status.code}
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-[#00BFA6]/10 rounded-full animate-pulse" />
            </div>
          </div>
        </div>

        {/* Icon */}
        <div className="mb-6 flex justify-center animate-fade-in-up" style={{ animationDelay: '50ms' }}>
          <div
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-linear-to-br ${status.color} flex items-center justify-center text-white shadow-xl`}
          >
            {status.icon}
          </div>
        </div>

        {/* Title & Description */}
        <div className="mb-8 sm:mb-10 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0F2744] dark:text-white mb-4 sm:mb-6">
            {status.title}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            {customMessage ?? status.description}
          </p>
        </div>

        {/* Suggestion Box */}
        <div
          className="mb-8 sm:mb-10 max-w-xl mx-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-md animate-fade-in-up"
          style={{ animationDelay: '150ms' }}
        >
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            What you can do
          </p>
          <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
            {status.suggestion}
          </p>
        </div>

        {/* All Status Codes Reference */}
        <div
          className="mb-8 sm:mb-10 max-w-3xl mx-auto animate-fade-in-up"
          style={{ animationDelay: '200ms' }}
        >
          <details className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-md text-left">
            <summary className="cursor-pointer px-5 py-4 font-semibold text-[#0F2744] dark:text-white text-sm sm:text-base select-none">
              View all status code meanings
            </summary>
            <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {[
                { code: 400, label: 'Bad Request' },
                { code: 401, label: 'Unauthorized' },
                { code: 402, label: 'Payment Required' },
                { code: 403, label: 'Forbidden' },
                { code: 404, label: 'Not Found' },
                { code: 408, label: 'Request Timeout' },
                { code: 409, label: 'Conflict' },
                { code: 410, label: 'Gone' },
                { code: 422, label: 'Unprocessable Content' },
                { code: 429, label: 'Too Many Requests' },
                { code: 500, label: 'Internal Server Error' },
                { code: 502, label: 'Bad Gateway' },
                { code: 503, label: 'Service Unavailable' },
                { code: 504, label: 'Gateway Timeout' },
              ].map(({ code: c, label }) => (
                <Link
                  key={c}
                  href={`/error-page?code=${c}`}
                  className={`flex items-center gap-3 px-4 py-2 rounded-xl border text-sm transition-all duration-200 hover:scale-105 ${
                    c === status.code
                      ? 'bg-[#0F2744] text-white border-[#0F2744] dark:bg-[#00BFA6] dark:border-[#00BFA6] font-semibold'
                      : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-[#00BFA6] hover:text-[#00BFA6]'
                  }`}
                >
                  <span className="font-bold w-10 shrink-0">{c}</span>
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </details>
        </div>

        {/* Action Buttons */}
        <div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up"
          style={{ animationDelay: '250ms' }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[#0F2744] dark:bg-[#00BFA6] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl border-2 border-[#0F2744] dark:border-[#00BFA6] font-semibold text-sm sm:text-base hover:bg-[#1a3a5c] dark:hover:bg-[#00A892] transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <FiHome className="w-5 h-5" />
            Go to Homepage
          </Link>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 bg-transparent text-[#0F2744] dark:text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl border-2 border-[#0F2744] dark:border-white font-semibold text-sm sm:text-base hover:bg-[#0F2744] hover:text-white dark:hover:bg-white dark:hover:text-[#0F2744] transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <FiArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>
      </div>
    </main>
  );
}

export default function ErrorPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-gray-500 dark:text-gray-400 text-lg animate-pulse">Loading...</div>
        </main>
      }
    >
      <ErrorPageContent />
    </Suspense>
  );
}

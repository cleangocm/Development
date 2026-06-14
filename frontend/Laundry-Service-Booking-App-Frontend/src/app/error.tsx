'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { FiHome, FiRefreshCw, FiServer } from 'react-icons/fi';

interface ErrorProps {
  error: Error & { digest?: string; status?: number };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  const status = (error as { status?: number }).status;

  useEffect(() => {
    // Silently handle the error - no console output
  }, [error]);

  // Determine the display code - only show it if it's a known HTTP status
  const httpCodes = [400, 401, 402, 403, 404, 408, 409, 410, 422, 429, 500, 502, 503, 504];
  const displayCode = status && httpCodes.includes(status) ? status : null;

  return (
    <main className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center px-4 py-20 sm:py-24">
      <div className="max-w-4xl mx-auto text-center">

        {/* Error Code / Icon */}
        <div className="mb-8 sm:mb-12 animate-fade-in-up">
          {displayCode ? (
            <div className="relative w-full max-w-md mx-auto">
              <div className="text-[120px] sm:text-[180px] md:text-[220px] font-bold text-transparent bg-clip-text bg-linear-to-br from-red-500 to-red-800 leading-none">
                {displayCode}
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-red-500/10 rounded-full animate-pulse" />
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-linear-to-br from-red-500 to-red-800 flex items-center justify-center text-white shadow-xl">
                <FiServer className="w-12 h-12 sm:w-16 sm:h-16" />
              </div>
            </div>
          )}
        </div>

        {/* Message */}
        <div className="mb-8 sm:mb-12 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0F2744] dark:text-white mb-4 sm:mb-6">
            Something Went Wrong
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            {displayCode
              ? `An error occurred (${displayCode}). Please try again or contact support if the issue persists.`
              : 'An unexpected error occurred. Our team has been notified and is working on a fix.'}
          </p>
        </div>

        {/* Suggestion */}
        <div
          className="mb-8 sm:mb-10 max-w-xl mx-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-md animate-fade-in-up"
          style={{ animationDelay: '150ms' }}
        >
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            What you can do
          </p>
          <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
            Try refreshing the page. If the problem continues, go back to the homepage or contact our support team.
          </p>
        </div>

        {/* Buttons */}
        <div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up"
          style={{ animationDelay: '200ms' }}
        >
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 bg-[#00BFA6] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-sm sm:text-base hover:bg-[#00A892] transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <FiRefreshCw className="w-5 h-5" />
            Try Again
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[#0F2744] dark:bg-gray-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl border-2 border-[#0F2744] dark:border-gray-700 font-semibold text-sm sm:text-base hover:bg-[#1a3a5c] dark:hover:bg-gray-600 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <FiHome className="w-5 h-5" />
            Go to Homepage
          </Link>
        </div>

        {/* Error reference */}
        {error.digest && (
          <p
            className="mt-8 text-xs text-gray-400 dark:text-gray-600 animate-fade-in-up"
            style={{ animationDelay: '300ms' }}
          >
            Reference: {error.digest}
          </p>
        )}
      </div>
    </main>
  );
}

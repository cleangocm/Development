'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { FiRefreshCw, FiHome } from 'react-icons/fi';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Silently handle - no console output
  }, [error]);

  return (
    <html>
      <body className="bg-white dark:bg-gray-900">
        <main className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center px-4 py-20">
          <div className="max-w-xl mx-auto text-center">
            <div className="mb-8">
              <div className="text-[140px] font-bold text-transparent bg-clip-text bg-linear-to-br from-red-500 to-red-800 leading-none">
                500
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Critical Error
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              A critical error occurred. Please refresh the page or return to the homepage.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 bg-teal-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-teal-600 transition-all duration-300 hover:scale-105 shadow-lg"
              >
                <FiRefreshCw className="w-5 h-5" />
                Try Again
              </button>
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-[#0F2744] dark:bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#1a3a5c] dark:hover:bg-gray-600 transition-all duration-300 hover:scale-105 shadow-lg"
              >
                <FiHome className="w-5 h-5" />
                Go to Homepage
              </Link>
            </div>
            {error.digest && (
              <p className="mt-6 text-xs text-gray-400 dark:text-gray-600">Reference: {error.digest}</p>
            )}
          </div>
        </main>
      </body>
    </html>
  );
}

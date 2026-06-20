'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiMail, FiLock, FiEye, FiEyeOff, FiTruck, FiAlertCircle, FiCheckSquare, FiMap, FiShield, FiUsers } from 'react-icons/fi';
import { useAuthStore } from '@/store/authStore';

const DeliveryLoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await login(email, password);
      
      const userStr = localStorage.getItem('auth_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (!['collector', 'delivery'].includes(user.role)) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          useAuthStore.getState().logout();
          setError('Access denied. You do not have collector access.');
          setIsLoading(false);
          return;
        }
      }
      
      window.location.href = '/delivery';
    } catch (err: unknown) {
      const error = err as { message?: string; response?: { data?: { message?: string } } };
      const errorMsg = error?.response?.data?.message || error?.message || 'Login failed. Please check your credentials.';
      // Add network hint for connection errors
      if (errorMsg.includes('Network Error') || errorMsg.includes('timeout') || errorMsg.includes('ECONNREFUSED')) {
        setError('Cannot connect to server. Make sure the backend is running and accessible from this device.');
      } else {
        setError(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-[#0e6251] via-[#0e6251] to-[#148f77] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#148f77]/20 blur-3xl animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#148f77]/15 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full bg-white/5 blur-2xl animate-pulse" style={{ animationDelay: '4s' }} />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <div className={`relative z-10 flex flex-col justify-center items-center w-full p-12 text-center transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="mb-10">
            <div className="w-40 h-16 relative mb-6 mx-auto">
              <Image
                src="/Images/logo/footer.png"
                alt="CleanGo Logo"
                fill
                sizes="10rem"
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">CleanGo CM</h1>
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="w-8 h-[2px] bg-[#148f77]" />
              <p className="text-[#148f77] font-semibold text-sm uppercase tracking-widest">Delivery Portal</p>
              <div className="w-8 h-[2px] bg-[#148f77]" />
            </div>
          </div>

          <div className="space-y-4 w-full max-w-sm">
            {[
              { icon: <FiCheckSquare className="w-5 h-5 text-white" />, title: 'Pickup Orders', desc: 'Collect from customers', delay: '200ms' },
              { icon: <FiTruck className="w-5 h-5 text-white" />, title: 'Deliver Orders', desc: 'Deliver cleaned items', delay: '400ms' },
              { icon: <FiMap className="w-5 h-5 text-white" />, title: 'Route Tracking', desc: 'GPS-based navigation', delay: '600ms' },
            ].map((card, i) => (
              <div key={i}
                className={`bg-white/[0.07] backdrop-blur-sm rounded-2xl p-5 text-left border border-white/[0.08] hover:bg-white/[0.12] transition-all duration-500 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}
                style={{ transitionDelay: card.delay }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#148f77]/30 rounded-xl flex items-center justify-center shrink-0">{card.icon}</div>
                  <div><p className="text-white font-semibold">{card.title}</p><p className="text-green-200 text-sm mt-0.5">{card.desc}</p></div>
                </div>
              </div>
            ))}
          </div>

          <p className="absolute bottom-8 text-green-200 text-sm">
            © {new Date().getFullYear()} CleanGo. Tous droits reserves.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-gray-50 dark:bg-gray-900">
        <div className={`w-full max-w-md transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="lg:hidden text-center mb-8">
            <div className="w-32 h-12 relative mx-auto mb-4">
              <Image
                src="/Images/logo/header.png"
                alt="CleanGo Logo"
                fill
                sizes="8rem"
                className="object-contain"
                priority
              />
            </div>
            <p className="text-gray-500 dark:text-gray-400">Delivery Portal</p>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Bienvenue !</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Connectez-vous pour gerer vos collectes</p>
          </div>

          {/* Quick Access Buttons */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <Link
              href="/admin/login"
              className="flex flex-col items-center justify-center gap-2 p-3 sm:p-4 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-[#0F2744] dark:hover:border-[#0F2744] hover:bg-gray-50 dark:hover:bg-gray-750 transition-all"
            >
              <FiShield className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400" />
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Admin</span>
            </Link>
            <Link
              href="/staff/login"
              className="flex flex-col items-center justify-center gap-2 p-3 sm:p-4 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-[#1a5276] dark:hover:border-[#1a5276] hover:bg-gray-50 dark:hover:bg-gray-750 transition-all"
            >
              <FiUsers className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400" />
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Staff</span>
            </Link>
            <button
              type="button"
              disabled
              className="flex flex-col items-center justify-center gap-2 p-3 sm:p-4 rounded-lg border-2 border-[#0e6251] dark:border-[#148f77] bg-[#0e6251]/10 dark:bg-[#148f77]/10 opacity-50 cursor-not-allowed"
            >
              <FiTruck className="w-5 h-5 sm:w-6 sm:h-6 text-[#0e6251] dark:text-[#148f77]" />
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Delivery</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <FiAlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="collector.test@cleango.local"
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#148f77] focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#148f77] focus:border-transparent outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">Remember me</span>
              </label>
              <Link 
                href="/forgot-password"
                className="text-sm text-[#148f77] hover:text-[#0e6251] font-medium"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#0e6251] hover:bg-[#0b4f42] text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                Need help?
              </span>
            </div>
          </div>

          <div className="text-center space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Contact IT support at{' '}
              <a href="mailto:support@cleangocm.com" className="text-[#148f77] hover:underline">
                support@cleangocm.com
              </a>
            </p>
            <Link 
              href="/"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-[#148f77] transition-colors"
            >
              ← Back to main website
            </Link>
          </div>

          <div className="mt-8 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-green-800 dark:text-green-300">Delivery Credentials:</p>
              <button
                type="button"
                onClick={() => { setEmail('collector.test@cleango.local'); setPassword('CleanGo@123456'); }}
                className="text-xs px-3 py-1 bg-[#0e6251] text-white rounded-lg hover:opacity-80 transition-opacity font-medium"
              >
                Auto Fill
              </button>
            </div>
            <p className="text-sm text-green-600 dark:text-green-400">Email: collector.test@cleango.local</p>
            <p className="text-sm text-green-600 dark:text-green-400">Password: CleanGo@123456</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryLoginPage;

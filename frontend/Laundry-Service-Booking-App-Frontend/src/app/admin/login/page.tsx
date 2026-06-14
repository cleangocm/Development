'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FiMail, FiLock, FiEye, FiEyeOff, FiShield, FiAlertCircle, FiBarChart2, FiUsers, FiTruck } from 'react-icons/fi';
import { useAuthStore } from '@/store/authStore';

const AdminLoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { login } = useAuthStore();

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
        if (user.role !== 'admin') {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          useAuthStore.getState().logout();
          setError('Access denied. You do not have admin privileges.');
          setIsLoading(false);
          return;
        }
      }
      router.push('/admin');
    } catch (err: unknown) {
      const errorMsg = (err as Error)?.message || 'Login failed. Please check your credentials.';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-[55%] bg-[#0F2744] relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#00BFA6]/20 blur-3xl animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#00BFA6]/15 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full bg-white/5 blur-2xl animate-pulse" style={{ animationDelay: '4s' }} />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <div className={`relative z-10 flex flex-col justify-center items-center w-full p-12 text-center transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Logo */}
          <div className="mb-10">
            <div className="w-40 h-16 relative mb-6 mx-auto">
              <Image src="/Images/logo/header.png" alt="Ultra Wash" fill sizes="10rem" className="object-contain brightness-0 invert" priority />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">Ultra Wash</h1>
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="w-8 h-[2px] bg-[#00BFA6]" />
              <p className="text-[#00BFA6] font-semibold text-sm uppercase tracking-widest">Admin Portal</p>
              <div className="w-8 h-[2px] bg-[#00BFA6]" />
            </div>
          </div>

          {/* Feature Cards with stagger animation */}
          <div className="space-y-4 w-full max-w-sm">
            {[
              { icon: <FiShield className="w-5 h-5 text-white" />, title: 'Secure Access', desc: 'End-to-end encrypted admin portal', delay: '200ms' },
              { icon: <FiBarChart2 className="w-5 h-5 text-white" />, title: 'Real-time Analytics', desc: 'Track revenue, orders & performance', delay: '400ms' },
              { icon: <FiUsers className="w-5 h-5 text-white" />, title: 'Full Control', desc: 'Manage users, orders & services', delay: '600ms' },
            ].map((card, i) => (
              <div key={i}
                className={`bg-white/[0.07] backdrop-blur-sm rounded-2xl p-5 text-left border border-white/[0.08] hover:bg-white/[0.12] transition-all duration-500 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}
                style={{ transitionDelay: card.delay }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#00BFA6]/30 rounded-xl flex items-center justify-center shrink-0">{card.icon}</div>
                  <div><p className="text-white font-semibold">{card.title}</p><p className="text-gray-400 text-sm mt-0.5">{card.desc}</p></div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <p className="absolute bottom-8 text-gray-500 text-sm">© {new Date().getFullYear()} Ultra Wash. All rights reserved.</p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-12">
        <div className={`w-full max-w-md transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-20 h-20 bg-[#0F2744] dark:bg-[#00BFA6] border-2 border-[#0F2744] dark:border-[#00BFA6] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl p-2">
              <Image src="/Images/logo/footer.png" alt="Ultra Wash" width={64} height={64} className="object-contain brightness-0 invert" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ultra Wash</h1>
            <p className="text-[#00BFA6] font-medium text-sm mt-1">Admin Portal</p>
          </div>

          {/* Form Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Welcome Back</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Sign in to access admin dashboard</p>
          </div>

          {/* Quick Access Buttons */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <button
              type="button"
              disabled
              className="flex flex-col items-center justify-center gap-2 p-3 sm:p-4 rounded-lg border-2 border-[#0F2744] dark:border-[#00BFA6] bg-[#0F2744]/10 dark:bg-[#00BFA6]/10 opacity-50 cursor-not-allowed"
            >
              <FiShield className="w-5 h-5 sm:w-6 sm:h-6 text-[#0F2744] dark:text-[#00BFA6]" />
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Admin</span>
            </button>
            <Link
              href="/staff/login"
              className="flex flex-col items-center justify-center gap-2 p-3 sm:p-4 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-[#2e86c1] dark:hover:border-[#2e86c1] hover:bg-gray-50 dark:hover:bg-gray-750 transition-all"
            >
              <FiUsers className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400" />
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Staff</span>
            </Link>
            <Link
              href="/delivery/login"
              className="flex flex-col items-center justify-center gap-2 p-3 sm:p-4 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-[#148f77] dark:hover:border-[#148f77] hover:bg-gray-50 dark:hover:bg-gray-750 transition-all"
            >
              <FiTruck className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400" />
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Delivery</span>
            </Link>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl animate-[shake_0.5s_ease-in-out]">
                <FiAlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ultrawash.com"
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#00BFA6] focus:border-transparent outline-none transition-all" required />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type={showPassword ? 'text' : 'password'} id="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#00BFA6] focus:border-transparent outline-none transition-all" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Remember me</span>
              </label>
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full py-3.5 bg-[#0F2744] dark:bg-[#00BFA6] hover:bg-[#1a3a5c] dark:hover:bg-[#00A892] text-white rounded-xl border-2 border-[#0F2744] dark:border-[#00BFA6] hover:border-[#1a3a5c] dark:hover:border-[#00A892] font-semibold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:scale-[0.98]">
              {isLoading ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Logging in...</>
              ) : 'Login'}
            </button>
          </form>

          {/* Help */}
          <div className="mt-8 text-center">
            <Link href="/" className="text-sm text-gray-500 dark:text-gray-400 hover:text-[#00BFA6] transition-colors">← Back to main website</Link>
          </div>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-[#0F2744]/5 dark:bg-[#00BFA6]/10 rounded-xl border border-[#0F2744]/10 dark:border-[#00BFA6]/20">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-[#0F2744] dark:text-[#00BFA6]">Demo Admin Credentials:</p>
              <button
                type="button"
                onClick={() => { setEmail('admin@ultrawash.com'); setPassword('123456'); }}
                className="text-xs px-3 py-1 bg-[#0F2744] dark:bg-[#00BFA6] text-white rounded-lg hover:opacity-80 transition-opacity font-medium"
              >
                Auto Fill
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Email: admin@ultrawash.com</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Password: 123456</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiPhone, FiLock, FiEye, FiEyeOff, FiShield, FiUsers, FiTruck } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { useAuthStore } from '@/store/authStore';

const LoginPage = () => {
  const router = useRouter();
  const { login, googleLogin, isAuthenticated, user, error: authError } = useAuthStore();

  const [formData, setFormData] = useState({
    emailOrPhone: '',
    password: '',
  });
  const [errors, setErrors] = useState({
    emailOrPhone: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [touched, setTouched] = useState({
    emailOrPhone: false,
    password: false,
  });
  const [mounted, setMounted] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') router.replace('/admin');
      else if (user.role === 'collector' || user.role === 'delivery') router.replace('/delivery');
      else if (user.role === 'staff') router.replace('/staff');
      else router.replace('/');
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => { setMounted(true); }, []);

  // Handle Google Sign In - Works same as regular login
  const onGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await googleLogin();
      
      // Small delay to let state update
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Check localStorage for user data
      const token = localStorage.getItem('auth_token');
      const userStr = localStorage.getItem('auth_user');
      
      if (!token || !userStr) {
        setIsGoogleLoading(false);
        return;
      }
      
      const userData = JSON.parse(userStr);
      
      // Use window.location.href for reliable redirect after Google popup
      if (userData.role === 'admin') window.location.href = '/admin';
      else if (userData.role === 'collector' || userData.role === 'delivery') window.location.href = '/delivery';
      else if (userData.role === 'staff') window.location.href = '/staff';
      else window.location.href = '/';
    } catch {
      setIsGoogleLoading(false);
    }
  };

  const validateEmailOrPhone = (value: string) => {
    if (!value) return 'Email or phone number is required';
    
    // Check if it's an email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Check if it's a phone
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    
    if (!emailRegex.test(value) && !phoneRegex.test(value.replace(/\s/g, ''))) {
      return 'Please enter a valid email or phone number';
    }
    return '';
  };

  const validatePassword = (password: string) => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (touched[name as keyof typeof touched]) {
      if (name === 'emailOrPhone') {
        setErrors((prev) => ({ ...prev, emailOrPhone: validateEmailOrPhone(value) }));
      } else if (name === 'password') {
        setErrors((prev) => ({ ...prev, password: validatePassword(value) }));
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    
    if (name === 'emailOrPhone') {
      setErrors((prev) => ({ ...prev, emailOrPhone: validateEmailOrPhone(value) }));
    } else if (name === 'password') {
      setErrors((prev) => ({ ...prev, password: validatePassword(value) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailOrPhoneError = validateEmailOrPhone(formData.emailOrPhone);
    const passwordError = validatePassword(formData.password);
    
    setErrors({
      emailOrPhone: emailOrPhoneError,
      password: passwordError,
    });
    
    setTouched({
      emailOrPhone: true,
      password: true,
    });

    if (!emailOrPhoneError && !passwordError) {
      setIsLoading(true);
      try {
        await login(formData.emailOrPhone, formData.password);
        
        const token = localStorage.getItem('auth_token');
        const userStr = localStorage.getItem('auth_user');
        
        if (!token || !userStr) {
          setIsLoading(false);
          return;
        }
        
        const userData = JSON.parse(userStr);
        
        // Use window.location.href for reliable redirect
        if (userData.role === 'admin') window.location.href = '/admin';
        else if (userData.role === 'collector' || userData.role === 'delivery') window.location.href = '/delivery';
        else if (userData.role === 'staff') window.location.href = '/staff';
        else window.location.href = '/';
      } catch {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-[#0f2744]/20 to-transparent z-10" />
        <Image
          src="https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=1200&h=1600&fit=crop&q=90"
          alt="Laundry Service"
          fill
          sizes="50vw"
          className="object-cover animate-scale-in"
          priority
          unoptimized
        />
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12 bg-white dark:bg-gray-900 min-h-screen lg:min-h-0">
        <div className={`w-full max-w-100 sm:max-w-105 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          {/* Logo */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <Image
              src="/Images/logo/header.png"
              alt="Ultra Wash Logo"
              width={120}
              height={50}
              className="w-24 sm:w-28 md:w-32 h-auto dark:brightness-0 dark:invert"
            />
          </div>

          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#0f2744] dark:text-white mb-2">
              Welcome Back
            </h1>
            <p className="text-sm sm:text-base text-[#5a6a7a] dark:text-gray-400">
              Access your account to manage to laundry
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Email or Phone Input */}
            <div className="space-y-1.5">
              <div className={`relative transition-all duration-300 ${errors.emailOrPhone && touched.emailOrPhone ? 'animate-shake' : ''}`}>
                <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <FiPhone className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <input
                  type="text"
                  name="emailOrPhone"
                  value={formData.emailOrPhone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Email or Phone"
                  className={`w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 border rounded-lg sm:rounded-xl text-sm sm:text-base text-[#0f2744] dark:text-white bg-white dark:bg-gray-800 placeholder-gray-400 focus:outline-none transition-all duration-300 ${
                    errors.emailOrPhone && touched.emailOrPhone
                      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                      : 'border-gray-200 dark:border-gray-600 focus:border-[#00BFA6] focus:ring-2 focus:ring-[#00BFA6]/20'
                  }`}
                />
              </div>
              {errors.emailOrPhone && touched.emailOrPhone && (
                <p className="text-red-500 text-xs sm:text-sm pl-1 animate-fade-in">{errors.emailOrPhone}</p>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className={`relative transition-all duration-300 ${errors.password && touched.password ? 'animate-shake' : ''}`}>
                <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <FiLock className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="••••••••"
                  className={`w-full pl-10 sm:pl-12 pr-12 py-3 sm:py-3.5 border rounded-lg sm:rounded-xl text-sm sm:text-base text-[#0f2744] dark:text-white bg-white dark:bg-gray-800 placeholder-gray-400 focus:outline-none transition-all duration-300 ${
                    errors.password && touched.password
                      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                      : 'border-gray-200 dark:border-gray-600 focus:border-[#00BFA6] focus:ring-2 focus:ring-[#00BFA6]/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0f2744] dark:hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <FiEyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <FiEye className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>
              {errors.password && touched.password && (
                <p className="text-red-500 text-xs sm:text-sm pl-1 animate-fade-in">{errors.password}</p>
              )}
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-sm sm:text-base text-[#00BFA6] hover:text-[#0f2744] dark:hover:text-white transition-colors font-medium"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#0f2744] dark:bg-[#00BFA6] text-white py-3 sm:py-3.5 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 hover:bg-[#1a3a5c] dark:hover:bg-[#00A892] hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Logging in...</span>
                </>
              ) : (
                'Login'
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 sm:gap-4 my-4 sm:my-6">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <span className="text-sm text-gray-400 dark:text-gray-500">Or</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>

            {/* Google Sign In */}
            <button
              type="button"
              onClick={onGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full flex items-center justify-center gap-2 sm:gap-3 border border-gray-200 dark:border-gray-600 py-3 sm:py-3.5 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base text-[#0f2744] dark:text-white transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isGoogleLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-[#0f2744]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <FcGoogle className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span>Sign in with Google</span>
                </>
              )}
            </button>

            {/* Error Message */}
            {authError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm animate-fade-in">
                {authError}
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3 sm:gap-4 my-4 sm:my-6">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <span className="text-sm text-gray-400 dark:text-gray-500">Or</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>

            {/* Sign Up Link */}
            <p className="text-center text-sm sm:text-base text-[#5a6a7a] dark:text-gray-400">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="text-[#00BFA6] hover:text-[#0f2744] dark:hover:text-white font-semibold transition-colors"
              >
                Sign Up
              </Link>
            </p>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 sm:gap-4 my-6 sm:my-8">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-500">Quick Access</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* Admin, Staff, Delivery Buttons */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <Link
              href="/admin/login"
              onClick={(e) => {
                e.preventDefault();
                // Set password in sessionStorage temporarily
                sessionStorage.setItem('login_password', '123456');
                window.location.href = '/admin/login';
              }}
              className="py-2 sm:py-3 px-2 sm:px-4 bg-[#0F2744] hover:bg-[#1a3a5c] text-white rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 shadow-md hover:shadow-lg"
            >
              <FiShield className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Admin</span>
              <span className="sm:hidden">AD</span>
            </Link>
            <Link
              href="/staff/login"
              onClick={(e) => {
                e.preventDefault();
                sessionStorage.setItem('login_password', '123456');
                window.location.href = '/staff/login';
              }}
              className="py-2 sm:py-3 px-2 sm:px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 shadow-md hover:shadow-lg"
            >
              <FiUsers className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Staff</span>
              <span className="sm:hidden">ST</span>
            </Link>
            <Link
              href="/delivery/login"
              onClick={(e) => {
                e.preventDefault();
                sessionStorage.setItem('login_password', '123456');
                window.location.href = '/delivery/login';
              }}
              className="py-2 sm:py-3 px-2 sm:px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 shadow-md hover:shadow-lg"
            >
              <FiTruck className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Delivery</span>
              <span className="sm:hidden">DL</span>
            </Link>
          </div>

          {/* Auto-fill Credentials */}
          <div className="mt-6 p-4 bg-[#0f2744]/5 dark:bg-[#00BFA6]/10 rounded-xl border border-[#0f2744]/10 dark:border-[#00BFA6]/20">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-[#0f2744] dark:text-[#00BFA6]">Demo User Credentials:</p>
              <button
                type="button"
                onClick={() => setFormData({ emailOrPhone: 'user.ultrawash@gmail.com', password: 'User@123456' })}
                className="text-xs px-3 py-1 bg-[#0f2744] dark:bg-[#00BFA6] text-white rounded-lg hover:opacity-80 transition-opacity font-medium"
              >
                Auto Fill
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Email: user.ultrawash@gmail.com</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Password: User@123456</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

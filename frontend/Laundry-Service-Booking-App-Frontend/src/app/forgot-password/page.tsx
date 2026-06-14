'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiMail } from 'react-icons/fi';
import { usePasswordResetStore } from '@/store/passwordResetStore';

const ForgotPasswordPage = () => {
  const router = useRouter();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [validationError, setValidationError] = useState('');
  const [touched, setTouched] = useState(false);
  const [showDevOtp, setShowDevOtp] = useState(false);

  const { forgotPassword, isLoading, error, clearError, setEmailOrPhone: storeEmailOrPhone, devOtp } = usePasswordResetStore();

  // Clear any previous errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const validateEmailOrPhone = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!value) return 'Email or phone is required';
    if (!emailRegex.test(value) && !phoneRegex.test(value)) {
      return 'Please enter a valid email or phone number';
    }
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailOrPhone(e.target.value);
    if (touched) {
      setValidationError(validateEmailOrPhone(e.target.value));
    }
  };

  const handleBlur = () => {
    setTouched(true);
    setValidationError(validateEmailOrPhone(emailOrPhone));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailPhoneError = validateEmailOrPhone(emailOrPhone);
    setValidationError(emailPhoneError);
    setTouched(true);

    if (!emailPhoneError) {
      const success = await forgotPassword(emailOrPhone);
      
      if (success) {
        storeEmailOrPhone(emailOrPhone);
        setShowDevOtp(true); // Show dev OTP button after successful submission
        // Auto-redirect after 2 seconds if no dev OTP
        setTimeout(() => {
          router.push('/otp');
        }, 2000);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50 dark:bg-gray-900">
      {/* Left Side - Animated Illustration */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-8 xl:p-16 bg-linear-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-800 relative overflow-hidden">
        {/* Background decorative circles */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-cyan-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
        
        <div className="relative w-full max-w-lg xl:max-w-xl">
          {/* Animated forgot password illustration */}
          <div className="relative flex items-center justify-center h-96">
            {/* Email envelope animation */}
            <div className="absolute animate-float">
              <div className="relative">
                {/* Envelope */}
                <div className="w-64 h-48 bg-white rounded-lg shadow-2xl border-4 border-[#00BFA6] relative overflow-hidden transform hover:scale-105 transition-transform duration-300">
                  {/* Envelope flap */}
                  <div className="absolute top-0 left-0 w-full h-24 bg-linear-to-br from-[#00BFA6] to-[#009680] clip-envelope animate-envelope-flap origin-top"></div>
                  
                  {/* Lock icon inside envelope */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-4">
                    <div className="relative animate-bounce-slow">
                      {/* Lock body */}
                      <div className="w-16 h-20 bg-linear-to-b from-yellow-400 to-yellow-500 rounded-lg shadow-lg"></div>
                      {/* Lock shackle */}
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-12 h-12 border-8 border-yellow-400 rounded-t-full"></div>
                      {/* Keyhole */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="w-3 h-3 bg-yellow-700 rounded-full"></div>
                        <div className="w-1.5 h-4 bg-yellow-700 mx-auto"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating OTP particles */}
                <div className="absolute -top-8 left-8 w-12 h-12 bg-[#00BFA6] rounded-lg shadow-lg flex items-center justify-center text-white font-bold text-xl animate-float-otp-1">
                  *
                </div>
                <div className="absolute -top-6 right-8 w-12 h-12 bg-[#009680] rounded-lg shadow-lg flex items-center justify-center text-white font-bold text-xl animate-float-otp-2">
                  *
                </div>
                <div className="absolute -bottom-6 left-12 w-12 h-12 bg-cyan-500 rounded-lg shadow-lg flex items-center justify-center text-white font-bold text-xl animate-float-otp-3">
                  *
                </div>
                <div className="absolute -bottom-8 right-12 w-12 h-12 bg-blue-500 rounded-lg shadow-lg flex items-center justify-center text-white font-bold text-xl animate-float-otp-4">
                  *
                </div>
              </div>
            </div>

            {/* Curved arrow pointing to envelope */}
            <div className="absolute -right-16 top-1/4 animate-pulse">
              <svg width="80" height="80" viewBox="0 0 80 80" className="text-[#00BFA6]">
                <path d="M10 10 Q 40 40, 70 20" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="5,5" className="animate-dash"/>
                <polygon points="70,20 65,15 65,25" fill="currentColor"/>
              </svg>
            </div>
          </div>

          {/* Text below animation */}
          <div className="text-center mt-8 space-y-3">
            <h2 className="text-2xl font-bold text-[#00BFA6] animate-fade-in">Forgot Your Password?</h2>
            <p className="text-gray-600 animate-fade-in-delay">We&apos;ll send you a secure OTP to reset it</p>
          </div>
        </div>

        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          @keyframes envelope-flap {
            0%, 100% { transform: rotateX(0deg); }
            50% { transform: rotateX(-10deg); }
          }
          @keyframes bounce-slow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          @keyframes float-otp-1 {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            25% { transform: translate(5px, -10px) rotate(5deg); }
            50% { transform: translate(0, -20px) rotate(0deg); }
            75% { transform: translate(-5px, -10px) rotate(-5deg); }
          }
          @keyframes float-otp-2 {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            25% { transform: translate(-5px, -10px) rotate(-5deg); }
            50% { transform: translate(0, -20px) rotate(0deg); }
            75% { transform: translate(5px, -10px) rotate(5deg); }
          }
          @keyframes float-otp-3 {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            25% { transform: translate(5px, 10px) rotate(5deg); }
            50% { transform: translate(0, 20px) rotate(0deg); }
            75% { transform: translate(-5px, 10px) rotate(-5deg); }
          }
          @keyframes float-otp-4 {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            25% { transform: translate(-5px, 10px) rotate(-5deg); }
            50% { transform: translate(0, 20px) rotate(0deg); }
            75% { transform: translate(5px, 10px) rotate(5deg); }
          }
          @keyframes dash {
            to { stroke-dashoffset: -100; }
          }
          @keyframes fade-in-delay {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-float { animation: float 3s ease-in-out infinite; }
          .animate-envelope-flap { animation: envelope-flap 2s ease-in-out infinite; }
          .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
          .animate-float-otp-1 { animation: float-otp-1 3s ease-in-out infinite; }
          .animate-float-otp-2 { animation: float-otp-2 3s ease-in-out infinite 0.5s; }
          .animate-float-otp-3 { animation: float-otp-3 3s ease-in-out infinite 1s; }
          .animate-float-otp-4 { animation: float-otp-4 3s ease-in-out infinite 1.5s; }
          .animate-dash { animation: dash 20s linear infinite; }
          .animate-fade-in-delay { animation: fade-in-delay 1s ease-out; }
          .delay-1000 { animation-delay: 1s; }
          .clip-envelope {
            clip-path: polygon(0 0, 100% 0, 50% 70%);
          }
        `}</style>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12 bg-white dark:bg-gray-900 lg:bg-gray-50 lg:dark:bg-gray-900 min-h-screen lg:min-h-0">
        <div className="w-full max-w-95 sm:max-w-100 bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl lg:shadow-xl animate-fade-in-up">
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
            <h1 className="text-2xl sm:text-3xl font-bold text-[#00BFA6] mb-2">
              Forgot Password
            </h1>
            <p className="text-xs sm:text-sm text-[#5a6a7a] dark:text-gray-400 leading-relaxed">
              Please enter Your Email or Phone<br />
              One OTP Will send to your Email or Phone
            </p>
          </div>

          {/* API Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm animate-fade-in">
              {error}
            </div>
          )}

          {/* Dev OTP Display */}
          {showDevOtp && devOtp && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 px-4 py-3 rounded-lg animate-fade-in mb-4">
              <p className="font-semibold text-yellow-800 dark:text-yellow-200 text-sm mb-2">🔧 Dev Mode — Use OTP</p>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm mb-3">
                Your OTP: <span className="font-mono font-bold text-base tracking-widest text-yellow-900 dark:text-yellow-100">{devOtp}</span>
              </p>
              <button
                type="button"
                onClick={() => {
                  // Copy to clipboard
                  navigator.clipboard.writeText(devOtp);
                  // Auto-navigate to OTP page
                  router.push('/otp');
                }}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-300"
              >
                Copy OTP & Continue
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {/* Email/Phone Input */}
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-medium text-[#0f2744] dark:text-gray-200">
                Your Registered Email or Phone
              </label>
              <div className={`relative transition-all duration-300 ${validationError && touched ? 'animate-shake' : ''}`}>
                <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <FiMail className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <input
                  type="text"
                  value={emailOrPhone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="ex: name@yourprs.com or 1234567890"
                  className={`w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 border rounded-lg sm:rounded-xl text-sm sm:text-base text-[#0f2744] dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none transition-all duration-300 ${
                    validationError && touched
                      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                      : 'border-gray-200 dark:border-gray-600 focus:border-[#00BFA6] focus:ring-2 focus:ring-[#00BFA6]/20'
                  }`}
                />
              </div>
              {validationError && touched && (
                <p className="text-red-500 text-xs sm:text-sm pl-1 animate-fade-in">{validationError}</p>
              )}
            </div>

            {/* Next Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#0f2744] dark:bg-[#00BFA6] text-white py-3 sm:py-3.5 rounded-lg sm:rounded-xl border-2 border-[#0f2744] dark:border-[#00BFA6] font-semibold text-sm sm:text-base transition-all duration-300 hover:bg-[#1a3a5c] dark:hover:bg-[#00A892] hover:border-[#1a3a5c] dark:hover:border-[#00A892] hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Sending OTP...</span>
                </>
              ) : (
                'Next'
              )}
            </button>

            {/* Back to Login */}
            <p className="text-center text-sm sm:text-base text-[#5a6a7a] dark:text-gray-400 mt-6">
              Remember your password?{' '}
              <Link
                href="/login"
                className="text-[#00BFA6] hover:text-[#0f2744] dark:hover:text-white font-semibold transition-colors"
              >
                Login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

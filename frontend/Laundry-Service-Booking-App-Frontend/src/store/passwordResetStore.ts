import { create } from 'zustand';
import api from '@/services/api';

interface PasswordResetState {
  emailOrPhone: string;
  resetToken: string | null;
  isLoading: boolean;
  error: string | null;
  success: string | null;
  devOtp: string | null; // Dev mode: OTP returned when email/SMS services are unavailable
  
  // Actions
  setEmailOrPhone: (email: string) => void;
  forgotPassword: (emailOrPhone: string) => Promise<boolean>;
  verifyOtp: (emailOrPhone: string, otp: string) => Promise<boolean>;
  resetPassword: (data: {
    emailOrPhone: string;
    newPassword: string;
    confirmPassword: string;
    resetToken: string;
  }) => Promise<boolean>;
  clearState: () => void;
  clearError: () => void;
}

export const usePasswordResetStore = create<PasswordResetState>((set) => ({
  emailOrPhone: '',
  resetToken: null,
  isLoading: false,
  error: null,
  success: null,
  devOtp: null,

  // Set email for use across pages
  setEmailOrPhone: (email) => {
    set({ emailOrPhone: email });
  },

  // Step 1: Forgot Password - Send OTP to email
  forgotPassword: async (emailOrPhone) => {
    set({ isLoading: true, error: null, success: null });
    try {
      
      const response = await api.post('/auth/forgot-password', {
        emailOrPhone,
      });
      
      
      if (response.data.status === 'success') {
        const devOtp = response.data.devOtp || null;
        if (devOtp) {
        }
        set({
          emailOrPhone,
          isLoading: false,
          success: response.data.message || 'OTP sent to your email',
          error: null,
          devOtp,
        });
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to send OTP');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage = err?.response?.data?.message || 'Failed to send OTP. Please try again.';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  // Step 2: Verify OTP
  verifyOtp: async (emailOrPhone, otp) => {
    set({ isLoading: true, error: null, success: null });
    try {
      
      const response = await api.post('/auth/verify-forgot-otp', {
        emailOrPhone,
        otp,
      });
      
      
      if (response.data.status === 'success') {
        const { resetToken } = response.data;
        
        
        set({
          resetToken,
          isLoading: false,
          success: response.data.message || 'OTP verified successfully',
          error: null,
        });
        return true;
      } else {
        throw new Error(response.data.message || 'Invalid OTP');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage = err?.response?.data?.message || 'Invalid OTP. Please try again.';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  // Step 3: Reset Password
  resetPassword: async (data) => {
    set({ isLoading: true, error: null, success: null });
    try {
      const response = await api.post('/auth/reset-password', data);
      
      
      if (response.data.status === 'success') {
        set({
          isLoading: false,
          success: response.data.message || 'Password reset successfully',
          error: null,
          // Clear reset token after successful reset
          resetToken: null,
          emailOrPhone: '',
        });
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to reset password');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage = err?.response?.data?.message || 'Failed to reset password. Please try again.';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  // Clear all state
  clearState: () => {
    set({
      emailOrPhone: '',
      resetToken: null,
      isLoading: false,
      error: null,
      success: null,
      devOtp: null,
    });
  },

  // Clear error only
  clearError: () => {
    set({ error: null });
  },
}));

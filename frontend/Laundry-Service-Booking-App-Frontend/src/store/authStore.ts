import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { AppUser, createCustomerProfile, getUserProfile } from '@/lib/user-profile';

interface AuthState {
  user: AppUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  register: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
  }) => Promise<void>;
  login: (emailOrPhone: string, password: string) => Promise<void>;
  googleLogin: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  checkAuth: () => void;
}

function saveSession(user: AppUser, token: string) {
  localStorage.setItem('auth_token', token);
  localStorage.setItem('auth_user', JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
}

function authErrorMessage(error: unknown, fallback: string) {
  const code = (error as { code?: string }).code;
  if (code === 'auth/email-already-in-use') return 'An account already exists for this email.';
  if (code === 'auth/invalid-credential') return 'Incorrect email or password.';
  if (code === 'auth/invalid-email') return 'Please enter a valid email address.';
  if (code === 'auth/too-many-requests') return 'Too many attempts. Please wait and try again.';
  if (code === 'auth/network-request-failed') return 'Network error. Check your connection and try again.';
  return error instanceof Error ? error.message : fallback;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          if (data.password !== data.confirmPassword) throw new Error('Passwords do not match.');

          const credential = await createUserWithEmailAndPassword(auth, data.email.trim(), data.password);
          await updateProfile(credential.user, { displayName: data.name.trim() });
          const user = await createCustomerProfile(credential.user, {
            name: data.name,
            phone: data.phone,
          });
          const token = await credential.user.getIdToken();
          saveSession(user, token);
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (error) {
          const message = authErrorMessage(error, 'Registration failed. Please try again.');
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
          const user = await getUserProfile(credential.user);
          const token = await credential.user.getIdToken();
          saveSession(user, token);
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (error) {
          const message = authErrorMessage(error, 'Login failed. Please check your credentials.');
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      googleLogin: async () => {
        set({ isLoading: true, error: null });
        try {
          const credential = await signInWithPopup(auth, googleProvider);
          const user = await getUserProfile(credential.user);
          const token = await credential.user.getIdToken();
          saveSession(user, token);
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (error) {
          const message = authErrorMessage(error, 'Google login failed. Please try again.');
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      logout: async () => {
        await signOut(auth);
        clearSession();
        set({ user: null, token: null, isAuthenticated: false, error: null });
      },

      clearError: () => set({ error: null }),

      checkAuth: () => {
        set({ isLoading: true });
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          unsubscribe();
          if (!firebaseUser) {
            clearSession();
            set({ user: null, token: null, isAuthenticated: false, isLoading: false });
            return;
          }

          try {
            const user = await getUserProfile(firebaseUser);
            const token = await firebaseUser.getIdToken();
            saveSession(user, token);
            set({ user, token, isAuthenticated: true, isLoading: false });
          } catch (error) {
            clearSession();
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              error: authErrorMessage(error, 'Unable to restore your session.'),
            });
          }
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  Auth,
  User
} from 'firebase/auth';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAu0EeHq89PIb-_ffufBb-3eU7GKF0W-b4",
  authDomain: "clean-go-150fb.firebaseapp.com",
  projectId: "clean-go-150fb",
  storageBucket: "clean-go-150fb.firebasestorage.app",
  messagingSenderId: "843085290359",
  appId: "1:843085290359:web:31642367ac067658e65f72",
  measurementId: "G-J7GBVHXV27"
};

// Initialize Firebase
let app: FirebaseApp;
let analytics: Analytics | null = null;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth: Auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
export const auths = getAuth(app);

// Initialize Analytics (client-side only)
if (typeof window !== 'undefined') {
  isSupported().then((supported: boolean) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

// Google Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
googleProvider.addScope('profile');
googleProvider.addScope('email');

// Store confirmation result globally
let confirmationResult: ConfirmationResult | null = null;

// Auth Response Type
interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}


// Phone Auth Functions
export const setupRecaptcha = (containerId: string): RecaptchaVerifier => {
  const recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
    },
    'expired-callback': () => {
    }
  });
  return recaptchaVerifier;
};

export const sendOTP = async (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier): Promise<ConfirmationResult> => {
  try {
    // Format phone number with country code if not present
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
    return confirmationResult;
  } catch (error: unknown) {
    throw error;
  }
};

export const verifyOTP = async (otp: string): Promise<AuthResponse> => {
  try {
    if (!confirmationResult) {
      return { success: false, error: 'No OTP request found. Please request OTP again.' };
    }
    const result = await confirmationResult.confirm(otp);
    return { 
      success: true, 
      user: result.user
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Invalid OTP';
    return { success: false, error: errorMessage };
  }
};

// Email Auth Functions
export const signUpWithEmail = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Send email verification
    await sendEmailVerification(userCredential.user);
    return { 
      success: true, 
      user: userCredential.user
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Signup failed';
    return { success: false, error: errorMessage };
  }
};

export const signInWithEmail = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { 
      success: true, 
      user: userCredential.user
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Login failed';
    return { success: false, error: errorMessage };
  }
};

export const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
    return { success: false, error: errorMessage };
  }
};

// Google Sign In — works from ANY device/IP
// signInWithPopup works from all IPs because the popup window opens on
// Firebase's authorized domain (clean-go-150fb.firebaseapp.com), not on the caller's domain.
// signInWithRedirect does NOT work on network IPs since it redirects back to the caller's unauthorized domain.
export const signInWithGoogle = async (): Promise<AuthResponse> => {
  try {
    // Always use popup — it works from any IP/domain
    const result = await signInWithPopup(auth, googleProvider);
    return { success: true, user: result.user };
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    
    let errorMessage = 'Google sign in failed';
    
    if (err.code === 'auth/popup-closed-by-user') {
      errorMessage = 'Sign-in popup was closed. Please try again.';
    } else if (err.code === 'auth/popup-blocked') {
      errorMessage = 'Popup was blocked by browser. Please allow popups for this site and try again.';
    } else if (err.code === 'auth/cancelled-popup-request') {
      errorMessage = 'Sign-in was cancelled. Please try again.';
    } else if (err.code === 'auth/network-request-failed') {
      errorMessage = 'Network error. Please check your internet connection.';
    } else if (err.code === 'auth/unauthorized-domain') {
      errorMessage = 'Domain not authorized. Please allow popups — the sign-in window opens on an authorized domain.';
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return { success: false, error: errorMessage };
  }
};

// Sign Out
export const signOutUser = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    await auth.signOut();
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
    return { success: false, error: errorMessage };
  }
};

// Get Current User
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Auth State Observer
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return auth.onAuthStateChanged(callback);
};

export { auth, app, db, storage, analytics, googleProvider };

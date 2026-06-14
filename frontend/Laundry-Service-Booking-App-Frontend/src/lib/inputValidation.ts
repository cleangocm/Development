/**
 * Centralized Input Validation & Sanitization
 * Prevents script injection, enforces field-type constraints
 * Use these throughout all forms in the project.
 */

// ============================================================
// SANITIZATION — strip dangerous content from any input
// ============================================================

/** Remove HTML tags, script tags, and common XSS patterns */
export const sanitize = (value: string): string => {
  if (!value) return '';
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/eval\s*\(/gi, '')
    .replace(/expression\s*\(/gi, '')
    .replace(/document\.(cookie|write|domain|location|createElement|getElementById|querySelector)/gi, '')
    .replace(/window\.(location|eval|execScript|setTimeout|setInterval)\s*[=(]/gi, '')
    .trim();
};

// ============================================================
// FIELD-LEVEL VALIDATORS — return error message or empty string
// ============================================================

/** Name fields: letters, spaces, hyphens, dots only. No numbers. */
export const validateName = (value: string, label = 'Name'): string => {
  const clean = sanitize(value);
  if (!clean) return `${label} is required`;
  if (clean.length < 2) return `${label} must be at least 2 characters`;
  if (clean.length > 100) return `${label} must be less than 100 characters`;
  if (!/^[A-Za-z\u0980-\u09FF\u0600-\u06FF\s.\-']+$/.test(clean)) {
    return `${label} can only contain letters, spaces, hyphens, and dots`;
  }
  return '';
};

/** Email validation */
export const validateEmail = (value: string): string => {
  const clean = sanitize(value);
  if (!clean) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    return 'Please enter a valid email address';
  }
  return '';
};

/** Phone validation: digits, +, -, (), spaces */
export const validatePhone = (value: string, required = true): string => {
  const clean = sanitize(value);
  if (!clean && required) return 'Phone number is required';
  if (!clean) return '';
  if (!/^[+\d\s()\-]{7,20}$/.test(clean)) {
    return 'Please enter a valid phone number';
  }
  return '';
};

/** Password validation */
export const validatePassword = (value: string, minLength = 6): string => {
  if (!value) return 'Password is required';
  if (value.length < minLength) return `Password must be at least ${minLength} characters`;
  return '';
};

/** Confirm password match */
export const validateConfirmPassword = (password: string, confirm: string): string => {
  if (!confirm) return 'Please confirm your password';
  if (password !== confirm) return 'Passwords do not match';
  return '';
};

/** Number-only validation */
export const validateNumber = (value: string, label = 'Value', required = true): string => {
  const clean = sanitize(value);
  if (!clean && required) return `${label} is required`;
  if (!clean) return '';
  if (!/^[\d.]+$/.test(clean)) {
    return `${label} must contain only numbers`;
  }
  return '';
};

/** Generic text validation — no script, reasonable length */
export const validateText = (value: string, label = 'Field', required = true, minLen = 0, maxLen = 500): string => {
  const clean = sanitize(value);
  if (!clean && required) return `${label} is required`;
  if (!clean) return '';
  if (minLen > 0 && clean.length < minLen) return `${label} must be at least ${minLen} characters`;
  if (clean.length > maxLen) return `${label} must be less than ${maxLen} characters`;
  return '';
};

/** Address validation — flexible but sanitized */
export const validateAddress = (value: string, required = true): string => {
  const clean = sanitize(value);
  if (!clean && required) return 'Address is required';
  if (!clean) return '';
  if (clean.length < 5) return 'Address is too short';
  if (clean.length > 300) return 'Address is too long';
  return '';
};

/** Zip/Postal code */
export const validateZipCode = (value: string, required = true): string => {
  const clean = sanitize(value);
  if (!clean && required) return 'Zip code is required';
  if (!clean) return '';
  if (!/^[A-Za-z\d\s\-]{3,10}$/.test(clean)) {
    return 'Please enter a valid zip code';
  }
  return '';
};

/** URL validation */
export const validateUrl = (value: string, required = false): string => {
  const clean = sanitize(value);
  if (!clean && required) return 'URL is required';
  if (!clean) return '';
  try {
    new URL(clean);
    return '';
  } catch {
    return 'Please enter a valid URL (e.g. https://example.com)';
  }
};

/** Card number: 13-19 digits */
export const validateCardNumber = (value: string): string => {
  const digits = value.replace(/\s/g, '');
  if (!digits) return 'Card number is required';
  if (!/^\d{13,19}$/.test(digits)) return 'Please enter a valid card number';
  return '';
};

/** Card expiry: MM/YY */
export const validateCardExpiry = (value: string): string => {
  if (!value) return 'Expiry date is required';
  if (!/^\d{2}\/\d{2}$/.test(value)) return 'Use MM/YY format';
  const [month, year] = value.split('/').map(Number);
  if (month < 1 || month > 12) return 'Invalid month';
  const now = new Date();
  const expiry = new Date(2000 + year, month);
  if (expiry < now) return 'Card has expired';
  return '';
};

/** CVV: 3-4 digits */
export const validateCVV = (value: string): string => {
  if (!value) return 'CVV is required';
  if (!/^\d{3,4}$/.test(value)) return 'CVV must be 3-4 digits';
  return '';
};

// ============================================================
// INPUT FILTER HANDLERS — use as onChange pre-processors
// ============================================================

/** Only allow letters, spaces, dots, hyphens for name fields */
export const filterNameInput = (value: string): string => {
  return value.replace(/[^A-Za-z\u0980-\u09FF\u0600-\u06FF\s.\-']/g, '');
};

/** Only allow digits, +, -, (), spaces for phone fields */
export const filterPhoneInput = (value: string): string => {
  return value.replace(/[^+\d\s()\-]/g, '');
};

/** Only allow digits and decimal point for number fields */
export const filterNumberInput = (value: string): string => {
  return value.replace(/[^\d.]/g, '');
};

/** Only allow digits for pure integer fields */
export const filterDigitsOnly = (value: string): string => {
  return value.replace(/\D/g, '');
};

/** Strip any HTML/script tags from text input */
export const filterSafeText = (value: string): string => {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

/** Format card number with spaces every 4 digits */
export const formatCardNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
};

/** Format expiry as MM/YY */
export const formatExpiry = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 2) {
    return digits.slice(0, 2) + '/' + digits.slice(2);
  }
  return digits;
};

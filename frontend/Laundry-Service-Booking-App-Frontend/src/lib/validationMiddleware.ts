/**
 * ═══════════════════════════════════════════════════════════════
 * UltraWash — Input Validation Middleware
 * ═══════════════════════════════════════════════════════════════
 *
 * Centralised, reusable validation rules for every form in the app.
 * Usage:
 *   import { validators, validateForm, schemas } from '@/lib/validationMiddleware';
 *
 *   // 1) Single field:
 *   const err = validators.email('user@example.com');  // '' | error string
 *
 *   // 2) Full form:
 *   const errors = validateForm(formData, schemas.signup);
 *   if (Object.keys(errors).length > 0) { /* show errors *\/ }
 * ═══════════════════════════════════════════════════════════════
 */

// ─── Types ──────────────────────────────────────────────────────
export type FieldValidator = (value: string, allValues?: Record<string, string>) => string;
export type FormSchema = Record<string, FieldValidator[]>;
export type FormErrors = Record<string, string>;

// ─── Primitive Validators ────────────────────────────────────────

/**
 * Returns an error message or '' (valid).
 */
export const validators = {
  /** Field must not be empty / whitespace */
  required:
    (label = 'This field'): FieldValidator =>
    (value) =>
      !value || !value.trim() ? `${label} is required` : '',

  /** Minimum character length */
  minLength:
    (min: number, label = 'This field'): FieldValidator =>
    (value) =>
      value && value.trim().length < min
        ? `${label} must be at least ${min} characters`
        : '',

  /** Maximum character length */
  maxLength:
    (max: number, label = 'This field'): FieldValidator =>
    (value) =>
      value && value.trim().length > max
        ? `${label} must not exceed ${max} characters`
        : '',

  /** Standard email format */
  email: (): FieldValidator => (value) => {
    if (!value) return '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return emailRegex.test(value.trim()) ? '' : 'Please enter a valid email address';
  },

  /** International phone — 10‑15 digits, optional leading + */
  phone: (): FieldValidator => (value) => {
    if (!value) return '';
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    return phoneRegex.test(value.replace(/[\s\-().]/g, ''))
      ? ''
      : 'Please enter a valid phone number (10–15 digits)';
  },

  /** Email OR phone — used on the login form */
  emailOrPhone: (): FieldValidator => (value) => {
    if (!value) return '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    const cleaned = value.replace(/[\s\-().]/g, '');
    return emailRegex.test(value.trim()) || phoneRegex.test(cleaned)
      ? ''
      : 'Please enter a valid email or phone number';
  },

  /**
   * Password strength:
   *  - min 8 chars
   *  - at least one uppercase letter
   *  - at least one lowercase letter
   *  - at least one digit
   *  - at least one special character
   */
  strongPassword: (): FieldValidator => (value) => {
    if (!value) return '';
    if (value.length < 8)
      return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(value))
      return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(value))
      return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(value))
      return 'Password must contain at least one number';
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value))
      return 'Password must contain at least one special character (!@#$%^&* …)';
    return '';
  },

  /** Confirm password must match another field */
  matchField:
    (otherKey: string, label = 'Passwords'): FieldValidator =>
    (value, allValues) => {
      if (!allValues) return '';
      return value !== allValues[otherKey] ? `${label} do not match` : '';
    },

  /** Only alphabetic characters and spaces */
  alphabeticName: (): FieldValidator => (value) => {
    if (!value) return '';
    return /^[A-Za-z\s'-]+$/.test(value.trim())
      ? ''
      : 'Name may only contain letters, spaces, hyphens and apostrophes';
  },

  /** Generic URL validator */
  url: (label = 'URL'): FieldValidator => (value) => {
    if (!value) return '';
    try {
      new URL(value.trim());
      return '';
    } catch {
      return `${label} is not a valid URL`;
    }
  },

  /** Numeric value (integer or decimal) */
  numeric: (label = 'This field'): FieldValidator => (value) => {
    if (!value) return '';
    return isNaN(Number(value)) ? `${label} must be a number` : '';
  },

  /** Positive number (> 0) */
  positiveNumber: (label = 'This field'): FieldValidator => (value) => {
    if (!value) return '';
    const n = Number(value);
    return isNaN(n) || n <= 0 ? `${label} must be a positive number` : '';
  },

  /** Minimum numeric value */
  minValue:
    (min: number, label = 'This field'): FieldValidator =>
    (value) => {
      if (!value) return '';
      const n = Number(value);
      return !isNaN(n) && n < min ? `${label} must be at least ${min}` : '';
    },

  /** Maximum numeric value */
  maxValue:
    (max: number, label = 'This field'): FieldValidator =>
    (value) => {
      if (!value) return '';
      const n = Number(value);
      return !isNaN(n) && n > max ? `${label} must not exceed ${max}` : '';
    },

  /** Must be a valid YYYY-MM-DD date string */
  dateString: (label = 'Date'): FieldValidator => (value) => {
    if (!value) return '';
    const d = new Date(value);
    return isNaN(d.getTime()) ? `${label} is not a valid date` : '';
  },

  /** Date must be in the future (or today) */
  futureDate: (label = 'Date'): FieldValidator => (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return `${label} is not a valid date`;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today ? `${label} must be today or a future date` : '';
  },

  /** Coupon code — alphanumeric only, 3‑20 chars */
  couponCode: (): FieldValidator => (value) => {
    if (!value) return '';
    if (!/^[A-Za-z0-9_-]{3,20}$/.test(value.trim()))
      return 'Coupon code must be 3–20 alphanumeric characters';
    return '';
  },

  /** OTP — exactly 6 digits */
  otp: (): FieldValidator => (value) => {
    if (!value) return '';
    return /^[0-9]{6}$/.test(value.trim())
      ? ''
      : 'OTP must be exactly 6 digits';
  },

  /** Bangladesh postal code — 4 digits */
  postalCode: (): FieldValidator => (value) => {
    if (!value) return '';
    return /^[0-9]{4,10}$/.test(value.trim())
      ? ''
      : 'Please enter a valid postal code';
  },
};

// ─── Core Validator Engine ───────────────────────────────────────

/**
 * Run a set of validators for a single field value.
 * Returns the first error message, or '' if all pass.
 */
export function validateField(
  value: string,
  rules: FieldValidator[],
  allValues?: Record<string, string>
): string {
  for (const rule of rules) {
    const error = rule(value, allValues);
    if (error) return error;
  }
  return '';
}

/**
 * Validate an entire form against a schema.
 * Returns an object of { fieldName: errorMessage } — only fields with errors.
 *
 * @example
 * const errors = validateForm({ email: 'bad', password: '' }, schemas.login);
 * // { email: 'Please enter a valid email…', password: 'Password is required' }
 */
export function validateForm(
  data: Record<string, string>,
  schema: FormSchema
): FormErrors {
  const errors: FormErrors = {};
  for (const [field, rules] of Object.entries(schema)) {
    const err = validateField(data[field] ?? '', rules, data);
    if (err) errors[field] = err;
  }
  return errors;
}

/**
 * Check if a FormErrors object has zero errors.
 */
export function isFormValid(errors: FormErrors): boolean {
  return Object.keys(errors).length === 0;
}

// ─── Convenience: validate-on-blur for a single field ──────────

/**
 * Handy helper for onChange / onBlur handlers.
 * Returns the first error for `fieldName` against the given schema.
 */
export function validateSingleField(
  fieldName: string,
  value: string,
  schema: FormSchema,
  allValues?: Record<string, string>
): string {
  const rules = schema[fieldName];
  if (!rules) return '';
  return validateField(value, rules, allValues);
}

// ─── Pre-Built Form Schemas ──────────────────────────────────────

export const schemas = {
  /** /login */
  login: {
    emailOrPhone: [
      validators.required('Email or phone'),
      validators.emailOrPhone(),
    ],
    password: [
      validators.required('Password'),
      validators.minLength(6, 'Password'),
    ],
  } satisfies FormSchema,

  /** /signup */
  signup: {
    fullName: [
      validators.required('Full name'),
      validators.minLength(2, 'Full name'),
      validators.maxLength(60, 'Full name'),
      validators.alphabeticName(),
    ],
    phone: [
      validators.required('Phone number'),
      validators.phone(),
    ],
    email: [
      validators.required('Email'),
      validators.email(),
    ],
    password: [
      validators.required('Password'),
      validators.strongPassword(),
    ],
    confirmPassword: [
      validators.required('Confirm password'),
      validators.matchField('password'),
    ],
  } satisfies FormSchema,

  /** /forgot-password */
  forgotPassword: {
    email: [
      validators.required('Email'),
      validators.email(),
    ],
  } satisfies FormSchema,

  /** /otp — OTP entry */
  otp: {
    otp: [
      validators.required('OTP'),
      validators.otp(),
    ],
  } satisfies FormSchema,

  /** /create-password (after OTP) */
  createPassword: {
    newPassword: [
      validators.required('Password'),
      validators.strongPassword(),
    ],
    confirmPassword: [
      validators.required('Confirm password'),
      validators.matchField('newPassword'),
    ],
  } satisfies FormSchema,

  /** /contact */
  contact: {
    name: [
      validators.required('Name'),
      validators.minLength(2, 'Name'),
      validators.maxLength(60, 'Name'),
    ],
    email: [
      validators.required('Email'),
      validators.email(),
    ],
    phone: [
      validators.phone(), // optional — no required()
    ],
    subject: [
      validators.required('Subject'),
      validators.minLength(5, 'Subject'),
      validators.maxLength(120, 'Subject'),
    ],
    message: [
      validators.required('Message'),
      validators.minLength(20, 'Message'),
      validators.maxLength(2000, 'Message'),
    ],
  } satisfies FormSchema,

  /** /checkout — delivery address */
  checkout: {
    fullName: [
      validators.required('Full name'),
      validators.minLength(2, 'Full name'),
      validators.maxLength(60, 'Full name'),
    ],
    phone: [
      validators.required('Phone'),
      validators.phone(),
    ],
    email: [
      validators.required('Email'),
      validators.email(),
    ],
    address: [
      validators.required('Address'),
      validators.minLength(10, 'Address'),
      validators.maxLength(300, 'Address'),
    ],
    pickupDate: [
      validators.required('Pickup date'),
      validators.dateString('Pickup date'),
      validators.futureDate('Pickup date'),
    ],
    deliveryDate: [
      validators.required('Delivery date'),
      validators.dateString('Delivery date'),
      validators.futureDate('Delivery date'),
    ],
  } satisfies FormSchema,

  /** /dashboard/profile — customer profile update */
  profileUpdate: {
    fullName: [
      validators.required('Full name'),
      validators.minLength(2, 'Full name'),
      validators.maxLength(60, 'Full name'),
    ],
    phone: [
      validators.required('Phone'),
      validators.phone(),
    ],
    email: [
      validators.required('Email'),
      validators.email(),
    ],
  } satisfies FormSchema,

  /** /dashboard/settings — change password */
  changePassword: {
    currentPassword: [
      validators.required('Current password'),
      validators.minLength(6, 'Current password'),
    ],
    newPassword: [
      validators.required('New password'),
      validators.strongPassword(),
    ],
    confirmPassword: [
      validators.required('Confirm password'),
      validators.matchField('newPassword'),
    ],
  } satisfies FormSchema,

  /** Admin — coupon create/edit */
  coupon: {
    code: [
      validators.required('Coupon code'),
      validators.couponCode(),
    ],
    description: [
      validators.required('Description'),
      validators.maxLength(200, 'Description'),
    ],
    discountValue: [
      validators.required('Discount value'),
      validators.positiveNumber('Discount value'),
    ],
    minOrderAmount: [
      validators.positiveNumber('Minimum order amount'),
    ],
    maxDiscount: [
      validators.positiveNumber('Maximum discount'),
    ],
    startDate: [
      validators.required('Start date'),
      validators.dateString('Start date'),
    ],
    endDate: [
      validators.required('End date'),
      validators.dateString('End date'),
    ],
  } satisfies FormSchema,

  /** Admin — service create/edit */
  service: {
    title: [
      validators.required('Service title'),
      validators.minLength(3, 'Service title'),
      validators.maxLength(80, 'Service title'),
    ],
    description: [
      validators.required('Description'),
      validators.minLength(10, 'Description'),
      validators.maxLength(1000, 'Description'),
    ],
    basePrice: [
      validators.required('Base price'),
      validators.positiveNumber('Base price'),
    ],
  } satisfies FormSchema,

  /** Admin — store create/edit */
  store: {
    name: [
      validators.required('Store name'),
      validators.minLength(3, 'Store name'),
      validators.maxLength(80, 'Store name'),
    ],
    address: [
      validators.required('Address'),
      validators.minLength(10, 'Address'),
      validators.maxLength(300, 'Address'),
    ],
    phone: [
      validators.required('Phone'),
      validators.phone(),
    ],
    email: [
      validators.email(),
    ],
  } satisfies FormSchema,

  /** Admin/Delivery — login */
  adminLogin: {
    email: [
      validators.required('Email'),
      validators.email(),
    ],
    password: [
      validators.required('Password'),
      validators.minLength(6, 'Password'),
    ],
  } satisfies FormSchema,
} as const;

// ─── React Hook: useFormValidation ───────────────────────────────

import { useState, useCallback } from 'react';

/**
 * Drop-in React hook for form validation.
 *
 * @example
 * const { errors, touched, touch, validateAll, clearError } =
 *   useFormValidation(schemas.signup, formData);
 *
 * // Mark a field touched and validate on blur:
 * <input onBlur={() => touch('email')} />
 *
 * // Validate everything before submit:
 * const handleSubmit = () => {
 *   if (!validateAll()) return;   // stops if errors
 *   // proceed ...
 * };
 */
export function useFormValidation(
  schema: FormSchema,
  values: Record<string, string>
) {
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  /** Mark a field as touched and immediately validate it */
  const touch = useCallback(
    (field: string) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      const err = validateSingleField(field, values[field] ?? '', schema, values);
      setErrors((prev) => ({ ...prev, [field]: err }));
    },
    [schema, values]
  );

  /** Validate all fields at once — returns true if form is valid */
  const validateAll = useCallback((): boolean => {
    const allErrors = validateForm(values, schema);
    const allTouched = Object.keys(schema).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {} as Record<string, boolean>
    );
    setErrors(allErrors);
    setTouched(allTouched);
    return isFormValid(allErrors);
  }, [schema, values]);

  /** Validate a single field on change (lightweight) */
  const validateOnChange = useCallback(
    (field: string, value: string) => {
      if (!touched[field]) return;
      const err = validateSingleField(field, value, schema, {
        ...values,
        [field]: value,
      });
      setErrors((prev) => ({ ...prev, [field]: err }));
    },
    [schema, touched, values]
  );

  /** Clear a specific field's error */
  const clearError = useCallback((field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  /** Reset all errors and touched state */
  const resetValidation = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  return {
    errors,
    touched,
    touch,
    validateAll,
    validateOnChange,
    clearError,
    resetValidation,
    isValid: isFormValid(errors),
  };
}

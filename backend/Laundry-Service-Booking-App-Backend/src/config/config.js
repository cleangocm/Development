import 'dotenv/config';

export const PORT = process.env.PORT;
export const NODE_ENV = process.env.NODE_ENV;
export const MONGO_URL = process.env.MONGODB_URI;
export const JWT_SECRET = process.env.JWT_SECRET;

const requiredEnvironmentVariables = [
  'NODE_ENV',
  'MONGODB_URI',
  'JWT_SECRET',
];

function missingRequiredVariables() {
  return requiredEnvironmentVariables.filter((key) => {
    const value = process.env[key];
    return typeof value !== 'string' || value.trim() === '';
  });
}

export function validateBackendEnvironment() {
  const missing = missingRequiredVariables();
  if (missing.length > 0) {
    throw new Error(
      `Missing required backend environment variables: ${missing.join(', ')}`,
    );
  }
}

export function safeEnvironmentSummary() {
  return {
    nodeEnv: NODE_ENV,
    port: PORT || 'not-set',
    mongoConfigured: Boolean(MONGO_URL),
    jwtConfigured: Boolean(JWT_SECRET),
    firebaseAdminConfigured: Boolean(
      process.env.FIREBASE_ADMIN_PROJECT_ID &&
        process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
        process.env.FIREBASE_ADMIN_PRIVATE_KEY,
    ),
    stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
    twilioConfigured: Boolean(
      process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_PHONE_NUMBER,
    ),
    smtpConfigured: Boolean(
      process.env.SMTP_HOST &&
        process.env.SMTP_PORT &&
        process.env.BREVO_SMTP_USER &&
        process.env.BREVO_SMTP_KEY,
    ),
    imgbbConfigured: Boolean(process.env.IMGBB_API_KEY),
    allowedOriginsConfigured: Boolean(process.env.ALLOWED_ORIGINS),
  };
}

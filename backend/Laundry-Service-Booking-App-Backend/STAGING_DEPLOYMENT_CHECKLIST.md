# CLEANGO Minimum Viable Staging Backend Checklist

This checklist prepares a staging backend without touching production data or credentials.

## Render service

- Create a new Render Web Service for staging.
- Connect the same GitHub repository.
- Root directory: `backend/Laundry-Service-Booking-App-Backend`
- Build command: `npm install`
- Start command: `npm start`
- Health check endpoint: `/health`
- Public API base URL format: `https://<staging-render-service>.onrender.com/api/v1`

## Required staging environment variables

Set these in the staging Render service only:

- `NODE_ENV=staging`
- `PORT=3000` or Render-provided port behavior if configured
- `MONGODB_URI=<staging-only MongoDB connection string>`
- `JWT_SECRET=<staging-only random secret>`
- `JWT_ACCESS_EXPIRES_IN=1h`
- `JWT_SECRET_EXPIRES_IN=24h`
- `REFRESH_TOKEN_TTL_DAYS=30`
- `ALLOWED_ORIGINS=<staging web/admin origins>`

Startup now fails fast if `NODE_ENV`, `MONGODB_URI`, or `JWT_SECRET` are missing.
Startup logs only safe metadata, such as whether integrations are configured. It does not print secret values.

## MongoDB staging database

- Use a separate MongoDB Atlas database, for example `cleango_staging`.
- Use a separate database user with access limited to staging.
- Do not reuse the production database name or production database user.
- Do not run broad seed scripts against production.

## Optional integrations to disable initially

Leave these blank or disabled in staging until test credentials exist:

- Stripe: use test mode only when enabled.
- Twilio: use sandbox/test SMS where possible.
- Brevo SMTP: use a staging sender/domain.
- ImgBB: leave disabled until upload testing is needed.
- Firebase Admin: leave disabled for minimum REST staging, then add a separate Firebase staging project later.

## CORS

For web/admin staging, set `ALLOWED_ORIGINS` to comma-separated staging origins, for example:

```text
https://cleango-staging-admin.example.com,https://cleango-staging-web.example.com
```

Mobile apps do not rely on browser CORS, but the web/admin dashboard does.

## Health-check validation

After deployment:

1. Open `https://<staging-render-service>.onrender.com/health`.
2. Confirm the response reports `environment: staging`.
3. Confirm startup logs show Mongo/JWT configured without printing secret values.
4. Confirm no production database is being used.

## Test customer

After health-check validation, create one dedicated non-personal staging customer through:

1. the staging registration endpoint, or
2. a staging admin-created user flow.

Do not create test accounts in production for staging validation.
Do not store test passwords in Git.

## Flutter configuration

Run the mobile app against staging with explicit Dart defines:

```powershell
flutter run `
  --dart-define=CLEANGO_ENV=staging `
  --dart-define=CLEANGO_API_BASE_URL=https://<staging-render-service>.onrender.com/api/v1
```

Build a staging debug APK with:

```powershell
flutter build apk --debug `
  --dart-define=CLEANGO_ENV=staging `
  --dart-define=CLEANGO_API_BASE_URL=https://<staging-render-service>.onrender.com/api/v1
```

## Rollback

- Point Flutter back to mock/local/development configuration.
- Suspend or delete only the staging Render service.
- Drop only the staging MongoDB database.
- Revoke staging-only API keys if needed.
- Leave production Render, MongoDB, Firebase, and payment settings untouched.

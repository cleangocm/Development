# CleanGo Mobile Application

Flutter mobile application being adapted for CleanGo customers and waste collectors.

## Run locally

```powershell
flutter pub get
flutter run `
  --dart-define=CLEANGO_ENV=development `
  --dart-define=CLEANGO_API_BASE_URL=http://10.0.2.2:5000/api/v1 `
  --dart-define=STRIPE_PUBLISHABLE_KEY=pk_test_your_key `
  --dart-define=CLEANGO_WEB_APP_URL=http://localhost:3001
```

## Data modes

The app can run with either the legacy REST/JWT hybrid data layer or the Firebase dashboard data layer.
The default remains `restHybrid` for rollback safety.

REST fallback:

```powershell
flutter run `
  --dart-define=CLEANGO_DATA_MODE=restHybrid
```

Firebase runtime:

```powershell
flutter run `
  --dart-define=CLEANGO_DATA_MODE=firebase
```

Firebase mode activates Firebase-backed customer, subscription, collection,
notification, and read-only payment repositories. It does not remove the legacy
REST/JWT authentication code yet.

## API environments

The mobile app reads its backend API configuration from Dart defines:

- `CLEANGO_ENV`: `development`, `staging`, or `production`
- `CLEANGO_API_BASE_URL`: optional explicit API base URL override

If `CLEANGO_API_BASE_URL` is provided, it wins. Otherwise:

- `development` uses `http://10.0.2.2:5000/api/v1`, which points an Android emulator to a backend running on the host machine.
- `staging` requires `CLEANGO_API_BASE_URL` until a staging backend is created.
- `production` uses the Render production API only when `CLEANGO_ENV=production` is explicitly supplied.

Example staging run:

```powershell
flutter run `
  --dart-define=CLEANGO_ENV=staging `
  --dart-define=CLEANGO_API_BASE_URL=https://your-staging-host/api/v1
```

Example staging debug APK:

```powershell
flutter build apk --debug `
  --dart-define=CLEANGO_ENV=staging `
  --dart-define=CLEANGO_API_BASE_URL=https://your-staging-host/api/v1
``` 

Stripe secret keys belong only in the web/backend environment. The mobile app
calls the web application's `/api/create-payment-intent` endpoint and never
stores a Stripe secret key.

The internal Dart package name still uses the original `ultrawash` identifier. Renaming it is intentionally deferred because it affects imports and platform configuration throughout the application.

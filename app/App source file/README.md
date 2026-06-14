# CleanGo Mobile Application

Flutter mobile application being adapted for CleanGo customers and waste collectors.

## Run locally

```powershell
flutter pub get
flutter run `
  --dart-define=STRIPE_PUBLISHABLE_KEY=pk_test_your_key `
  --dart-define=CLEANGO_WEB_APP_URL=http://localhost:3001
```

Stripe secret keys belong only in the web/backend environment. The mobile app
calls the web application's `/api/create-payment-intent` endpoint and never
stores a Stripe secret key.

The internal Dart package name still uses the original `ultrawash` identifier. Renaming it is intentionally deferred because it affects imports and platform configuration throughout the application.

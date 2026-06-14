# CleanGo Smart Waste Collection

This workspace contains the CleanGo customer, collector, and administration applications being migrated from the original UltraWash marketplace package to a Firebase-based waste pickup platform.

## Active stack

- **Web:** Next.js 16 and TypeScript
- **Authentication and data:** Firebase Authentication and Cloud Firestore
- **Server logic:** Firebase Cloud Functions on Node.js 22
- **Mobile:** Flutter application under active migration
- **Firebase project:** `clean-go-150fb`

The Express/MongoDB backend is retained as a legacy reference while features are moved to Firebase. It is not the intended production backend.

## Workspace

| Folder | Purpose |
| --- | --- |
| `frontend/Laundry-Service-Booking-App-Frontend` | Customer and administrator web application |
| `functions` | Firebase callable functions and role management |
| `app/App source file` | Flutter mobile application |
| `backend/Laundry-Service-Booking-App-Backend` | Legacy vendor API retained for migration reference |
| `docs` | Project and migration documentation |

Open `CleanGo.code-workspace` in VS Code to work with the complete project.

## Local development

### Web application

```powershell
cd "frontend/Laundry-Service-Booking-App-Frontend"
npm install
npm run dev
```

The development server runs on `http://localhost:3001`:

- Customer login: `/login`
- Customer signup: `/signup`
- Administrator login: `/admin/login`

### Firebase Functions

```powershell
cd functions
npm install
npm run build
```

### Flutter application

```powershell
cd "app/App source file"
flutter pub get
flutter run
```

## Deployment status

Firestore rules and the `setUserRole` Cloud Function are configured. The dynamic Next.js application still needs deployment through Firebase App Hosting or Cloud Run; it cannot be deployed as a purely static Firebase Hosting export.

## Security

Local environment files and Firebase service-account keys are intentionally excluded from Git. Never commit passwords, private keys, `.env` files, or Firebase Admin SDK JSON files.

## Migration note

Some internal Flutter package identifiers, legacy API names, and vendor documentation still use `UltraWash`. They are being migrated incrementally to avoid breaking imports and runtime behavior.

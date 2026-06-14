# CleanGo Web Application

Next.js customer and administration application for CleanGo Smart Waste Collection.

## Run locally

```powershell
npm install
npm run dev
```

Open `http://localhost:3001`.

Useful routes:

- `/login` - customer login
- `/signup` - customer registration
- `/admin/login` - administrator login

Firebase Authentication and Firestore provide the active identity and data layer. Keep local environment files private and never commit credentials.

For the complete architecture and deployment status, see the repository root `README.md`.

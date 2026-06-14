# Google Login Setup Guide

## Issue: "Domain not authorized for Google login"

This error occurs when your development domain (localhost:3001) is not registered in the Firebase Console.

## Solution: Add Authorized Domains

### Step 1: Go to Firebase Console
1. Visit https://console.firebase.google.com
2. Select your project: **flutter-22f32**
3. Go to **Authentication** → **Settings** tab

### Step 2: Add Authorized Domains
In the **Authorized Domains** section, add:
- `localhost` (for local development)
- Your development IP (e.g., `192.168.x.x`)
- Your production domain (e.g., `yourdomain.com`)

### Step 3: Configure OAuth Consent Screen
1. Go to **Google Cloud Console**: https://console.cloud.google.com
2. Search for **OAuth consent screen**
3. Make sure your app is configured as **External** or **Internal**
4. Add your email as a test user if in development

### Step 4: Add OAuth Credentials
1. Go to **Credentials** in Google Cloud Console
2. Find your **OAuth 2.0 Client ID** (Web application)
3. Under **Authorized JavaScript origins**, add:
   - `http://localhost:3001`
   - `http://localhost`
   - Your other dev IPs and production domain

4. Under **Authorized redirect URIs**, add:
   - `http://localhost:3001/`
   - Your production URLs

### Step 5: Test
After saving, refresh your app and try Google login again.

## Alternative: Using Email/Password Login for Dev

Until Google OAuth is configured, you can:
1. Use the email/password login feature
2. Or use the OTP reset flow (now with dev OTP display!)

## For Production
Make sure to:
1. Remove `localhost` from authorized domains
2. Add your production domain
3. Update OAuth consent screen with production details
4. Set OAuth app to **Production** mode

---

### Troubleshooting
- Clear browser cache and localStorage
- Check if popups are enabled in browser
- Verify Firebase project credentials in `.env.local`
- Check browser console for specific error codes

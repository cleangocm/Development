# CLEANGO CM Mobile Onboarding Flow

This implementation is for the Android and iOS Flutter app under `app/App source file`. It is separate from the Next.js web app.

## Implemented Screens

1. Splash screen
   - CLEANGO CM app icon
   - Brand gradient using blue, green, and navy
   - Loading indicator
   - Text: `CLEANGO CM`
   - Text: `Making Waste Collection Simple and Reliable`

2. Welcome screen
   - Heading: `Clean Environment, Better Communities`
   - Subheading: `Fast, Affordable, and Eco-Friendly Waste Pickup Near You`
   - Feature chips:
     - Scheduled waste pickup
     - Real-time service updates
     - Secure payments
     - Professional waste management
   - Prompt: `Enter your mobile number to get started.`

3. Phone number registration
   - Clean white layout
   - CLEANGO CM wordmark
   - Cameroon `+237` selected automatically
   - Mobile number field

4. OTP code screen
   - Six-digit code UI
   - SMS helper message
   - Resend code and WhatsApp placeholders

5. Biometric setup
   - Shows Face ID copy on iOS
   - Shows Fingerprint Authentication copy on Android
   - Buttons: `Enable Now`, `Maybe Later`

6. Account setup and service availability
   - Profile name field
   - Detected location field
   - Simulated automatic coverage check
   - Yaounde/Douala route users to dashboard
   - Other regions route users to waitlist

7. Waitlist page
   - Saves the product path for future region expansion planning
   - Explains launch update notification behavior

## Files Changed

- `lib/feature/mobile_onboarding/cleango_onboarding_flow.dart`
- `lib/main.dart`
- `lib/app/assets.dart`
- `assets/images/cleango_app_icon.png`
- `assets/images/cleango_wordmark.png`
- `pubspec.yaml`
- `android/app/src/main/AndroidManifest.xml`
- `android/app/src/main/kotlin/com/cleangocm/app/MainActivity.kt`
- `ios/Runner/Info.plist`

## Native App Identity

- Android label: `CLEANGO CM`
- iOS display name: `CLEANGO CM`
- Launcher icon source: `assets/images/cleango_app_icon.png`
- Android application id already set in Gradle: `com.cleangocm.app`
- iOS bundle id already set in Xcode project: `com.cleangocm.app`
- Android permissions added for location and biometric readiness.
- iOS descriptions added for Face ID and location permission prompts.

## Remaining Native Integrations

The UI flow is implemented. Production behavior still needs native service integration:

- SMS OTP provider or Firebase phone auth
- Real biometric auth through `local_auth`
- Real GPS permission and geolocation through a location plugin
- API/Firebase persistence for waitlist and expansion planning

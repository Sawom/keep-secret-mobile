# KeepSecret Android + Expo Web

React Native / Expo app for the existing KeepSecret NestJS + Prisma backend. Android is the primary target; Expo Web is included for UI smoke testing.

## What is included

- Email/password login, registration, forgot password, reset password.
- HttpOnly cookie-based session requests and access-cookie refresh retry. No access/refresh token is copied into AsyncStorage.
- Notes: create/edit, local offline save, notebook assignment, colors, pin/unpin, search, select-many and bulk move-to-trash.
- Notebooks: create/edit, color/description, open a notebook to view its notes, move to trash.
- Trash: notes and notebooks, restore, permanent delete, empty trash.
- Search across notes and notebooks.
- Light/dark appearance, profile name update, manual sync and admin application-health report.
- Encrypted local note/notebook cache and a pending-operation queue for offline changes.

## Requirements

- Node.js 22 LTS recommended.
- Android Studio + Android SDK for local Android development builds, or EAS cloud build for APKs.
- A deployed KeepSecret API URL. Browser requests also require backend CORS to allow the browser origin and credentials.

## Environment

Copy `.env.example` to `.env` and set:

```env
EXPO_PUBLIC_API_URL=https://your-deployed-backend.example
```

Use the backend origin only, with no trailing slash. Do not put JWT secrets, database credentials, mail passwords or Google client secrets in this file. `EXPO_PUBLIC_*` values are embedded into client bundles and are public.

## Browser UI test

```bash
npm install
npx expo start --web
```

Open the local URL printed by Expo. Browser auth requests need the NestJS backend's `FRONTEND_URL`/CORS configuration to allow your local origin (usually `http://localhost:8081`) with credentials. Third-party cookie restrictions may prevent production cross-site cookie authentication from working in all browsers; use Android development build to validate native cookie handling.

The web local storage adapter exists for development/UI testing. It is not a replacement for Android Keystore-backed SecureStore.

## Android device test

1. Enable USB debugging and connect an Android phone, or start an Android emulator.
2. Run `npm install`.
3. Run `npx expo run:android` (local Android SDK required).
4. Test login, refresh after expiry, logout, offline note changes, reconnect sync and cross-device updates.

`npx expo prebuild --platform android` generates native Android project files. It is not required for browser testing.

## Build APK

EAS build can produce an installable APK without local Android SDK:

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview
```

Download the APK from the EAS build page and install it on the phone.

## Backend compatibility and remaining limits

- Email/password auth uses your existing `/auth/*` endpoints. For native Google login, apply the additive backend patch included alongside this mobile project: it adds `POST /auth/google/mobile` without replacing `auth.controller.ts` or `auth.service.ts`. The patch README gives exact file paths and commands.
- Password-reset email currently opens the existing web reset page. If resetting from mobile, copy the reset token from the link into the app Reset Password screen. A dedicated app deep link can be added later; it is not required for password reset to work.
- The backend does not expose an incremental sync feed or server-enforced version conflict endpoint. This app queues offline changes and pulls current data, but simultaneous edits on two devices cannot be guaranteed conflict-free until backend optimistic concurrency is enforced.
- The backend note DTO does not accept tags even though the Prisma model contains a tags field; tags are not sent from the mobile client.
- The server derives note-encryption keys from `JWT_SECRET`. Do not rotate that secret without planning a data-key migration, or existing encrypted notes may become unreadable.

## Security notes

- Android uses native cookie storage via `@react-native-cookies/cookies`; tokens are not read by JavaScript and are not persisted in AsyncStorage.
- The local notes cache is AES-encrypted; its random key is stored with Expo SecureStore on Android. This protects local-at-rest data but does not protect a rooted/unlocked device from an attacker with code execution.
- The browser adapter is for development testing only and does not provide Android Keystore security.

## Android release builds

This repository includes separate EAS profiles for a directly installable Android APK and a Play Store Android App Bundle (AAB):

- `npm run build:apk` — release-mode APK for internal/device testing.
- `npm run build:aab` — AAB intended for Google Play submission.

Before building, configure the real HTTPS backend URL in the EAS `production` environment (or set it in the local `.env` for local builds). Never add backend secrets, database credentials, JWT secrets, Google client secrets, or mail credentials to Expo public environment variables. Native Google login requires the additive backend patch included in the release bundle and an Android OAuth client configured for the package name and signing SHA-1. It is not ready until that endpoint is deployed and tested.

An EAS build is not itself a production certification. Run the release checklist in `IMPLEMENTATION_STATUS.md` against a deployed staging backend and at least one real Android device before publishing.


## Native Google sign-in and password-reset links

- Set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` to the same Google **Web OAuth client ID** configured as backend `GOOGLE_CLIENT_ID`. This value is public client configuration, not a secret.
- In Google Cloud Console, create an **Android OAuth client** for package `com.keepsecret.mobile` using the SHA-1 certificate fingerprint for the build you will distribute. For EAS, configure the Android signing credentials first and use the matching fingerprint.
- The app requests an ID token for the web client ID, so the backend `GOOGLE_CLIENT_ID` must match it. Never put `GOOGLE_CLIENT_SECRET`, database credentials, JWT secret or mail password in the Expo app.
- Deploy the backend change adding `POST /auth/google/mobile`; it verifies the Google ID token server-side and sets the same HttpOnly cookies.
- Password-reset emails include both the existing web reset link and `keepsecret://reset-password` app link. Android deep links require a development/release build; Expo Go cannot validate this native flow.


## Important: use a development build for full testing

Google Sign-In and native cookie handling use native modules. They cannot be fully tested in Expo Go. Use `npm run build:dev-apk` (after `eas build:configure`) or `npx expo run:android` after installing Android Studio/SDK. Expo Go can still be used for a limited UI smoke test only if all native modules happen to be supported, but it is not the release test path.

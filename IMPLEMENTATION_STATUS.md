# Implementation status — KeepSecret Expo app

## Implemented in this archive

- Modular screen architecture: Auth, Notes, Notebooks, Search, Trash, Settings.
- Reusable controls, note/notebook cards and editors.
- Login, registration, forgot-password and reset-password API calls.
- Cookie credentials and access-cookie refresh retry; no token in AsyncStorage.
- Local encrypted note/notebook cache, offline create/update/trash/restore queue and sync trigger on reconnection.
- Note create/edit, colors, notebook assignment, pin/unpin, search and multi-select bulk trash.
- Notebook create/edit/open/trash.
- Trash for notes and notebooks, restore, permanent deletion and empty trash.
- Profile name update, theme toggle, manual sync, admin health report.
- Expo Web setup and browser local-storage adapter for UI smoke tests.

## Backend compatibility boundaries

- Native Android Google sign-in is wired through Google Sign-In and a new backend `POST /auth/google/mobile` endpoint that verifies Google ID tokens server-side before setting HttpOnly cookies. It still requires Google Cloud Android OAuth configuration and a deployed backend update.
- Password-reset emails retain the web route and now include a `keepsecret://reset-password` app link. The app parses the token from the deep link; test with an installed native build.
- Existing backend note DTO accepts title/content/color/isPinned/notebookId only. Prisma tags exist but cannot be saved through current DTO.
- Current backend has a `version` field but does not enforce a conditional update contract. Two-device concurrent editing can still overwrite changes.
- Browser authentication requires CORS `origin` to include the local Expo Web origin and `credentials: true`. Cross-site cookie policy can still vary by browser.

## Before production release

1. Install dependencies and run `npm run typecheck`.
2. Run `npx expo start --web` and smoke test screens; browser cookie auth depends on backend CORS.
3. Run Android development build and validate native cookie persistence/refresh/logout on a real device.
4. Validate offline queue ordering, reconnect retries, cross-device updates and conflicts against the deployed backend.
5. Configure Google Cloud Android OAuth (package + signing SHA-1), set the public web client ID, deploy the backend mobile endpoint, and test Google login and reset deep links on a real Android build.
6. Audit credentials from the supplied ZIP and rotate leaked secrets carefully. Do not rotate `JWT_SECRET` until encrypted note-key migration is planned.

## Release packaging added

- Branded launcher/adaptive icon and splash artwork are included.
- `production-apk` EAS profile creates an installable release-mode APK for controlled device testing.
- `production` EAS profile creates an Android App Bundle (AAB) for a future Play Store submission.

## Release gate — not yet production-approved

Do not publish until all of these are true:
- [ ] A dependency install and `npm run typecheck` succeed on the release commit.
- [ ] An EAS release build succeeds and is installed on a real Android device.
- [ ] Backend origin, cookie persistence, access refresh, logout, and session expiry are verified on-device.
- [ ] Google mobile OAuth is configured in Google Cloud and tested against the deployed server-verified ID-token endpoint; no JWT is placed in a deep link.
- [ ] Forgot/reset password works end-to-end from the actual email on Android.
- [ ] Offline edits, reconnect sync, duplicate retries, deletes, and cross-device conflict behavior are tested.
- [ ] Production API is HTTPS; CORS/origin policy and cookie attributes are explicitly reviewed for native and web clients.
- [ ] App icon, app name, privacy policy, data-safety disclosures, account deletion requirements, and store listing are reviewed before Play Store submission.

The native Google Sign-In package and Android cookie persistence require a development/release build; Expo Go is not the full test target. The current source has not completed these checks in this environment. Treat it as a release candidate, not a verified production release.

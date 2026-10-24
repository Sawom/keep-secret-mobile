# Backend integration notes

The mobile project intentionally reuses the supplied API and does not put JWTs into URLs or AsyncStorage. These existing backend boundaries affect the final release.

## Expo Web local-origin CORS

Your current `backend/src/main.ts` sets a single CORS origin from `FRONTEND_URL`. For browser testing from Expo Web, the backend must allow the local Expo origin and credentials. Replace the `app.enableCors(...)` block with an allow-list like this, and redeploy the backend:

```ts
const allowedOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.MOBILE_WEB_ORIGINS ?? '').split(',').map((value) => value.trim()),
].filter(Boolean);

app.enableCors({
  origin: (origin, callback) => {
    // Native app requests may not send an Origin header.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS'), false);
  },
  credentials: true,
});
```

Set `MOBILE_WEB_ORIGINS=http://localhost:8081,http://127.0.0.1:8081` in the backend environment for local browser testing. Do not use `origin: '*'` with credentialed cookies. If the backend is deployed with production-only cookie rules, browsers may still block cross-site cookies; native Android testing is the definitive check for the Android app.

## Google mobile sign-in

The supplied Google callback at `GET /auth/google/callback` sets cookies on the backend domain and redirects to the web dashboard. A native app cannot assume that cookies created in the system browser are present in the app's native HTTP cookie jar. The mobile Google button therefore does not fake a login or pass tokens through a deep-link URL.

To enable it securely, add a backend `POST /auth/google/mobile` endpoint that verifies a Google ID token server-side against the configured Android/Web OAuth audiences, then calls the existing `AuthService.validateGoogleUser(...)` and sets the same HttpOnly cookies as `/auth/login`. The Expo app should send the Google ID token to this endpoint over HTTPS and never persist it. Configure an Android OAuth client for `com.keepsecret.mobile`; only the public Android client ID belongs in the app configuration. The backend must verify `email_verified`, issuer, audience and expiry.

## Password reset

The current email link points to the web reset route. In the mobile app, the user can paste the reset token from the link into Reset Password. A production-polished flow should add an app deep link and update the email template, while keeping the reset token short-lived and single-use.

## Conflict handling

The database has a `Note.version` field, but the supplied update service does not increment it or require an expected version. The mobile queue supports offline operations and pull-sync, but two devices editing the same note simultaneously can still overwrite each other. True conflict detection requires the backend update endpoint to enforce optimistic concurrency (for example, an `expectedVersion` field and atomic conditional update).

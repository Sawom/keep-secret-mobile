import {
  GoogleSignin,
  isSuccessResponse,
} from "@react-native-google-signin/google-signin";

// The current library returns the user/token inside response.data.
// Reading response.idToken directly causes the false "no ID token" error.
const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();

GoogleSignin.configure({
  webClientId,
  offlineAccess: false,
  scopes: ["email", "profile"],
});

export async function signInWithGoogle(): Promise<string> {
  if (!webClientId) {
    throw new Error(
      "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is missing. Set the existing Web OAuth Client ID in .env and restart Expo.",
    );
  }

  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();

  if (!isSuccessResponse(response)) {
    throw Object.assign(new Error("Google sign-in was cancelled."), {
      code: "SIGN_IN_CANCELLED",
    });
  }

  // Library v16 shape is response.data.idToken (not response.idToken).
  let idToken = response.data?.idToken ?? null;

  // Some Android builds populate the token through getTokens().
  if (!idToken) {
    try {
      const tokens = await GoogleSignin.getTokens();
      idToken = tokens.idToken || null;
    } catch {
      // Keep the actionable error below. Never log or persist the token.
    }
  }

  if (!idToken) {
    throw new Error(
      "Google did not return an ID token. Check the Web OAuth Client ID and Android OAuth package/SHA-1, then rebuild the development app.",
    );
  }

  return idToken;
}

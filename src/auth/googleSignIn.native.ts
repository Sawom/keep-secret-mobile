import { GoogleSignin } from "@react-native-google-signin/google-signin";

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

  // Keep the native library response separate from our app's User type.
  // The response type differs between installed library typings/releases.
  const response: unknown = await GoogleSignin.signIn();
  const result = response as {
    type?: string;
    data?: { idToken?: string | null };
    idToken?: string | null;
  };

  if (result.type === "cancelled" || result.type === "cancel") {
    throw Object.assign(new Error("Google sign-in was cancelled."), {
      code: "SIGN_IN_CANCELLED",
    });
  }

  let idToken = result.data?.idToken ?? result.idToken ?? null;
  if (!idToken) {
    try {
      const tokens = await GoogleSignin.getTokens();
      idToken = tokens.idToken || null;
    } catch {
      // Report a configuration-specific message below without logging tokens.
    }
  }

  if (!idToken) {
    throw new Error(
      "Google did not return an ID token. Check the Web OAuth Client ID and Android OAuth package/SHA-1, then rebuild the development app.",
    );
  }

  return idToken;
}

import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
if (webClientId) GoogleSignin.configure({ webClientId, offlineAccess: false });

export async function signInWithGoogle(): Promise<string> {
  if (!webClientId) throw new Error('Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID and configure the Android OAuth client in Google Cloud.');
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  
  if (!isSuccessResponse(response) || !response.idToken) {
    throw new Error('Google did not return an ID token.');
  }
  
  return response.idToken;
}
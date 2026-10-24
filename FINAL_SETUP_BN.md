# KeepSecret Android — final setup (বাংলা)

## প্রথমে একবার backend update

এই project bundle-এর `backend-patch/README_BN.md` অনুসরণ করো। সংক্ষেপে:

1. `backend-patch/src/modules/auth/mobile-google-auth.controller.ts` নতুন file হিসেবে backend-এ কপি করবে।
2. `src/modules/auth/auth.module.ts`-এ controller import ও controllers array-তে add করবে।
3. Backend folder-এ `npm install google-auth-library`, তারপর `npm run build` এবং tests চালাবে।
4. Build/test পাস হলে deploy করবে। `auth.controller.ts` ও `auth.service.ts` replace করতে হবে না।

এই backend change শুধু Android native Google Sign-In-এর জন্য। Email/password login, refresh/logout, notes, notebooks, trash ইত্যাদির existing endpoints reuse করা হচ্ছে।

## Mobile environment

`.env.example` copy করে `.env` বানাও:

```env
EXPO_PUBLIC_API_URL=https://YOUR-DEPLOYED-API-ORIGIN
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-existing-web-oauth-client-id.apps.googleusercontent.com
```

- URL-এ `/api` বা trailing slash যোগ করবে না, যদি না তোমার deployed backend সত্যিই ওই base path ব্যবহার করে।
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` হলো backend-এর existing `GOOGLE_CLIENT_ID`-এর matching Web OAuth client ID।
- Google Client Secret, JWT secret, DB password, mail password এখানে কখনো দেবে না। `EXPO_PUBLIC_*` values app bundle-এ public থাকে।

## Google Cloud configuration

Google Cloud Console-এ Android OAuth client তৈরি করো:

- Package: `com.keepsecret.mobile`
- SHA-1: EAS/Android release signing key-এর SHA-1
- Web OAuth client ID: `.env`-এর `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

Android OAuth client-এ package name ও SHA-1 অবশ্যই match করতে হবে। EAS signing credential setup-এর পর EAS dashboard/credentials থেকে fingerprint নিয়ে Google Cloud Console-এ configure করো.

## APK build

```bash
npm install
npm install -g eas-cli
eas login
eas build:configure
npm run build:dev-apk
```

Development APK install করে auth + Google sign-in + cookie refresh + notes/notebooks + offline sync test করো। তারপর release APK:

```bash
npm run build:apk
```

Play Store AAB:

```bash
npm run build:aab
```

## Honest release status

Source/configuration package প্রস্তুত, কিন্তু এখানে Android SDK/EAS account, তোমার production env, Google Cloud signing config ও deployed backend-এ live test করার access নেই। তাই আমি APK build বা end-to-end tests সফল হয়েছে বলে দাবি করছি না। প্রথম build-এর পরে কোনো error এলে পুরো error log দিলে নির্দিষ্টভাবে ঠিক করা যাবে। Offline edits are queued, but backend does not enforce version-based conflict resolution; simultaneous edits on web and phone may still conflict.

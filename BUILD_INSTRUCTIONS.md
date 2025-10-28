# Development Build Instructions for IAP Testing

## 🚀 Quick Start: TestFlight Setup

**For your existing TestFlight pipeline**, run this command once to configure RevenueCat:

```bash
eas secret:create --scope project --name REVENUECAT_IOS_KEY --value appl_pkupxYbUqeGZamQiCcCcThfxSRa
```

Then rebuild for TestFlight using your normal workflow:
```bash
eas build --platform ios --profile production
```

Upload to TestFlight, and RevenueCat will work! The `app.config.js` automatically injects this secret at build time.

---

## Important Notes

⚠️ **In-App Purchases DO NOT work in Expo Go or simulators**  
✅ You must build and test on **physical iOS/Android devices** or **TestFlight**

## Prerequisites

### For iOS Testing:
- Physical iPhone or iPad
- Apple Developer account (already configured)
- Xcode installed (if building locally)
- Apple Sandbox tester account created in App Store Connect

### For Android Testing:
- Physical Android device
- Google Play Console account
- App uploaded to Internal Testing track

## Building for iOS

### Option 1: Using EAS Build (Recommended)

```bash
# Install EAS CLI if not already installed
npm install -g eas-cli

# Login to Expo
eas login

# Build for iOS development
eas build --profile development --platform ios

# Or create a simulator build for development (won't work for IAP testing)
eas build --profile development --platform ios --local
```

After the build completes, download and install it on your physical iOS device.

### Option 2: Local Build with Expo

```bash
# Generate native code
npx expo prebuild

# Run on connected iOS device
npx expo run:ios --device
```

## Building for Android

### Option 1: Using EAS Build

```bash
# Build for Android development
eas build --profile development --platform android

# Build for internal testing
eas build --profile preview --platform android
```

Upload the generated AAB file to Google Play Console's Internal Testing track.

### Option 2: Local Build

```bash
# Generate native code
npx expo prebuild

# Run on connected Android device
npx expo run:android --device
```

## Testing In-App Purchases

### iOS Sandbox Testing:

1. **Sign out of App Store** on your test device
2. **Don't sign in yet** - you'll be prompted during purchase
3. Open the LingoToday app
4. Go through onboarding to the subscription screen
5. When prompted, sign in with your **Apple Sandbox Tester Account**
6. Complete the test purchase (won't charge real money)

### Android Testing:

1. Device must be added as a tester in Google Play Console
2. App must be installed from Internal Testing track
3. Use a Google account that's added as a tester
4. Complete test purchase

## RevenueCat Configuration

The app uses RevenueCat for managing IAP. Make sure:

1. ✅ Your iOS/Android products are configured in RevenueCat dashboard
2. ✅ Products in RevenueCat match your App Store Connect/Google Play products
3. ✅ RevenueCat API keys are configured (see below)

**Note**: The `react-native-purchases` plugin has been removed from `app.json` to allow web builds to work. For native builds via EAS, the plugin will be automatically included through the `react-native-purchases` package dependency. If you encounter issues, you can manually add it back to the `plugins` array in `app.json`:

```json
"plugins": [
  "expo-notifications",
  "react-native-purchases"
]
```

### Adding RevenueCat API Keys

**For Local Development Builds:**

Add your RevenueCat API keys to `app.json` in the `extra` section:

```json
{
  "expo": {
    "extra": {
      "apiBaseUrl": "your-api-url",
      "revenuecatIosKey": "appl_xxxxxxxxxx",
      "revenuecatAndroidKey": "goog_xxxxxxxxxx",
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

⚠️ **Important**: Do NOT commit these keys to git! Add app.json to .gitignore or use a separate app.local.json file.

**For EAS Production Builds:**

Use EAS Secrets to securely inject keys at build time:

```bash
# Set iOS key
eas secret:create --scope project --name REVENUECAT_IOS_KEY --value appl_xxxxxxxxxx

# Set Android key  
eas secret:create --scope project --name REVENUECAT_ANDROID_KEY --value goog_xxxxxxxxxx
```

The app uses `app.config.js` to automatically read these environment variables and inject them into the app config. EAS will make these available as `process.env.REVENUECAT_IOS_KEY` and `process.env.REVENUECAT_ANDROID_KEY` at build time, and `app.config.js` will merge them into `Constants.expoConfig.extra`.

**How it works:**
1. EAS reads secrets you created
2. Makes them available as environment variables during build
3. `app.config.js` reads from `process.env` and injects into config
4. App reads from `Constants.expoConfig.extra` (or manifest fallbacks) at runtime

## Common Issues

### "API key not configured"
- **Local builds**: Make sure you added the keys to app.json's extra section
- **EAS builds**: Make sure you created EAS secrets with correct names
- Check the console logs - `getRevenueCatKey` will log where it found (or didn't find) the keys
- Restart the build after adding keys

### "No offerings available"
- Verify products are created in App Store Connect / Google Play Console
- Check products are imported and active in RevenueCat dashboard
- Ensure products have been approved (iOS) or published (Android)

### Purchase fails silently
- For iOS: Make sure you're signed in with a Sandbox tester account
- For Android: Make sure app is installed from Internal Testing track
- Check RevenueCat dashboard for errors

## Next Steps After Successful Build

1. Test the onboarding flow through to IAP screen
2. Attempt a test purchase with sandbox account
3. Verify purchase is recorded in RevenueCat dashboard
4. Test "Restore Purchases" functionality
5. Verify backend receives webhook from RevenueCat

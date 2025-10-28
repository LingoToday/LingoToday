# Development Build Instructions for IAP Testing

## Important Notes

⚠️ **In-App Purchases DO NOT work in Expo Go or simulators**  
✅ You must build and test on **physical iOS/Android devices**

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
3. ✅ The `REVENUECAT_IOS_KEY` secret is set in Replit
4. ✅ The `REVENUECAT_ANDROID_KEY` secret will be added when Android is ready

## Common Issues

### "API key not configured"
- Make sure `REVENUECAT_IOS_KEY` (or `REVENUECAT_ANDROID_KEY`) is set in Replit Secrets
- Restart the build after adding secrets

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

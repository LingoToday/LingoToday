# LingoToday Mobile App

## Setup Instructions

1. **Install dependencies:**
   ```bash
   cd mobile-app
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Test on your device:**
   - Install the Expo Go app on your phone
   - Scan the QR code from the terminal
   - The app will connect to your local backend at `http://localhost:5000`

## App Structure

- **Authentication:** Login screen connects to existing backend
- **Navigation:** Bottom tabs (Home/Profile) + burger menu
- **Home Screen:** Dashboard with progress and quick actions
- **Profile Screen:** User settings and account management

## API Configuration

The app is configured to connect to:
- **Development:** `http://localhost:5000` (your local server)
- **Production:** Update `src/config/api.ts` with your deployed URL

## Testing the App

1. Make sure your main website's backend is running (`npm run dev`)
2. Start the mobile app (`npm start`)
3. Use your existing website login credentials
4. Test authentication and dashboard loading

## Features Implemented

✅ Authentication (login with existing accounts)
✅ Bottom navigation (Home/Profile)
✅ Burger menu with footer items
✅ Dashboard integration
✅ User profile management
✅ API connection to existing backend

## Next Steps

- Push notifications setup
- Lesson components
- Offline support
- App store preparation
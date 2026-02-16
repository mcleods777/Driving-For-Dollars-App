# Driving for Dollars App

A mobile app for real estate investors to track their driving routes, map street coverage, and flag distressed properties as leads — all from their phone while driving neighborhoods.

Built with **React Native + Expo** for both Android and iOS from a single codebase.

## Features

### GPS Route Tracking
- Real-time GPS tracking with live map display
- Background location tracking (continues when app is minimized)
- Distance, duration, and speed metrics per session
- Foreground service notification on Android

### Property Flagging
- Flag any property as a lead while driving past it
- Take a photo with the camera or attach from gallery
- Tag properties with common indicators (Vacant, Overgrown, Boarded Up, Fire Damage, etc.)
- Add notes and address for each flagged property
- GPS coordinates automatically captured

### Session History
- View all past driving sessions with stats
- Tap into any session to see the full route on a map
- Start and end markers on session replay
- See flagged leads per session
- Delete old sessions

### Coverage Map
- See ALL routes from every session overlaid on one map
- Toggle between uniform color or color-coded by session
- Fit-all button to see total coverage area
- Track total miles and session count

### Lead Management
- Full lead pipeline: New → Contacted → Negotiating → Closed / Passed
- Search leads by address, notes, or tags
- Filter by status
- Edit lead details and update status
- Photo and tag display

### Settings & Export
- Choose route color
- Switch map type (Standard / Satellite / Hybrid)
- Keep-screen-on toggle for driving
- Export all leads to CSV file
- Lifetime stats dashboard

## Project Structure

```
├── App.tsx                          # Root: navigation + tab bar
├── app.json                         # Expo configuration + permissions
├── src/
│   ├── types/index.ts               # TypeScript types & constants
│   ├── utils/geo.ts                 # Haversine distance, formatting helpers
│   ├── services/
│   │   ├── database.ts              # SQLite database (sessions, coordinates, leads, settings)
│   │   └── locationTracking.ts      # GPS tracking, background tasks, session lifecycle
│   ├── screens/
│   │   ├── DriveScreen.tsx          # Main driving view with live map
│   │   ├── SessionsScreen.tsx       # Session history list
│   │   ├── SessionDetailScreen.tsx  # Single session route replay
│   │   ├── CoverageScreen.tsx       # All-time coverage map overlay
│   │   ├── LeadsScreen.tsx          # Lead management with filters
│   │   └── SettingsScreen.tsx       # App settings + export + stats
│   └── components/
│       ├── FlagPropertyModal.tsx     # Modal for flagging a property
│       └── LeadDetailModal.tsx       # Modal for viewing/editing a lead
```

## Getting Started

### Prerequisites

- **Node.js** 18+ installed ([download](https://nodejs.org/))
- **npm** (comes with Node.js)
- A smartphone with **Expo Go** app installed:
  - [Android - Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
  - [iOS - Apple App Store](https://apps.apple.com/app/expo-go/id982107779)

### Install Dependencies

```bash
npm install
```

### Run the App

```bash
npx expo start
```

This starts the Expo development server and shows a QR code in your terminal.

## Testing on Your Devices

### On Your Phone (Recommended for GPS features)

1. Install **Expo Go** on your phone (links above)
2. Make sure your phone and computer are on the **same WiFi network**
3. Run `npx expo start` on your computer
4. **Android**: Open Expo Go and scan the QR code from the terminal
5. **iOS**: Open your phone's Camera app and scan the QR code — it will open in Expo Go
6. The app loads on your phone with hot-reload (changes appear instantly)

### On Your Computer

#### Web Browser (limited — no GPS/camera)
```bash
npx expo start --web
```
Opens the app in your browser. Maps display but GPS tracking and camera won't work.

#### Android Emulator
1. Install [Android Studio](https://developer.android.com/studio)
2. Create a virtual device via AVD Manager
3. Start the emulator
4. Run `npx expo start` and press `a` to open on Android emulator
5. You can simulate GPS locations in the emulator's extended controls

#### iOS Simulator (macOS only)
1. Install [Xcode](https://apps.apple.com/app/xcode/id497799835) from the App Store
2. Run `npx expo start` and press `i` to open on iOS Simulator
3. Simulate locations via Debug → Location in the Simulator menu

### Tunnel Mode (phone not on same WiFi)

If your phone can't connect over local WiFi:
```bash
npx expo start --tunnel
```
This creates a public URL that works from anywhere. Requires `@expo/ngrok` (installed automatically on first use).

## Google Maps API Key (Android)

For Android, the app uses Google Maps. To get maps working on a real Android build:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project and enable "Maps SDK for Android"
3. Create an API key
4. Replace `YOUR_GOOGLE_MAPS_API_KEY_HERE` in `app.json` under `android.config.googleMaps.apiKey`

**Note**: Maps work without an API key in Expo Go on Android. The key is only needed for standalone/production builds.

## Building for Production

### Android APK / AAB
```bash
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
```

### iOS (requires macOS + Apple Developer account)
```bash
npx expo prebuild --platform ios
cd ios && xcodebuild -workspace DrivingForDollars.xcworkspace -scheme DrivingForDollars archive
```

### Using EAS Build (Expo's cloud build service)
```bash
npm install -g eas-cli
eas login
eas build --platform android
eas build --platform ios
```

## Tech Stack

- **React Native** — cross-platform mobile framework
- **Expo SDK 54** — managed workflow, simplified native access
- **TypeScript** — type safety
- **expo-location** — foreground + background GPS tracking
- **expo-task-manager** — background task registration
- **react-native-maps** — Google Maps / Apple Maps
- **expo-sqlite** — local SQLite database
- **expo-image-picker** — camera + photo library
- **expo-file-system + expo-sharing** — CSV export
- **@react-navigation** — tab + stack navigation

## License

MIT License — see [LICENSE](LICENSE) for details.

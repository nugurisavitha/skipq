# SkipQ Mobile App - Setup Guide

## Prerequisites
- Node.js 18+
- React Native CLI (`npm install -g react-native`)
- Xcode 15+ (for iOS, macOS only)
- Android Studio + SDK (for Android)
- CocoaPods (for iOS: `sudo gem install cocoapods`)

## Quick Start

### 1. Initialize React Native project
```bash
npx react-native@latest init SkipQMobile --version 0.74.0
cd SkipQMobile
```

### 2. Copy source files
Replace the generated `src/` folder (or create it) with the `src/` folder from this project:
```bash
rm -rf src/
cp -r /path/to/this/SkipQMobile/src ./src
```

### 3. Update entry point
Edit `index.js` in the project root:
```javascript
import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';
AppRegistry.registerComponent(appName, () => App);
```

### 4. Install dependencies
```bash
npm install @react-navigation/native @react-navigation/native-stack \
  @react-navigation/bottom-tabs @react-navigation/drawer \
  react-native-screens react-native-safe-area-context \
  react-native-gesture-handler react-native-reanimated \
  react-native-vector-icons axios socket.io-client \
  @react-native-async-storage/async-storage \
  react-native-maps @react-native-community/geolocation \
  react-native-permissions react-native-camera \
  react-native-qrcode-scanner react-native-chart-kit \
  react-native-svg react-native-image-picker \
  date-fns react-native-toast-message \
  react-native-push-notification \
  @react-native-firebase/app @react-native-firebase/messaging
```

### 5. iOS Pod Install
```bash
cd ios && pod install && cd ..
```

### 6. Configure react-native-reanimated
Add to `babel.config.js`:
```javascript
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: ['react-native-reanimated/plugin'],
};
```

### 7. Configure Vector Icons
**iOS**: Add to `ios/SkipQMobile/Info.plist` inside `<dict>`:
```xml
<key>UIAppFonts</key>
<array>
  <string>Feather.ttf</string>
</array>
```

**Android**: Add to `android/app/build.gradle`:
```gradle
apply from: file("../../node_modules/react-native-vector-icons/fonts.gradle")
```

### 8. Configure Google Maps (Android)
Add your API key in `android/app/src/main/AndroidManifest.xml`:
```xml
<meta-data
  android:name="com.google.android.geo.API_KEY"
  android:value="YOUR_GOOGLE_MAPS_API_KEY"/>
```

### 9. Run the app
```bash
# Android
npx react-native run-android

# iOS
npx react-native run-ios
```

## Project Structure
```
src/
├── App.js                    # Root component with providers
├── theme/colors.js           # Design tokens (colors, fonts, spacing)
├── services/api.js           # Axios API layer (all endpoints)
├── context/                  # React Context providers
│   ├── AuthContext.js        # JWT auth + user state
│   ├── CartContext.js        # Shopping cart with AsyncStorage
│   ├── SocketContext.js      # Socket.io real-time connection
│   └── NotificationContext.js
├── hooks/                    # Context consumer hooks
├── navigation/               # React Navigation setup
│   ├── AppNavigator.js       # Root: auth vs role-based nav
│   ├── CustomerNavigator.js  # Bottom tabs: Home, Cart, Orders, Profile
│   ├── RestaurantNavigator.js # Bottom tabs: Dashboard, Menu, Orders, More
│   ├── DeliveryNavigator.js  # Bottom tabs: Dashboard, Orders, History
│   └── AdminNavigator.js    # Bottom tabs: Dashboard, Orders, Analytics, Manage
├── screens/                  # 37 screens across 5 roles
│   ├── auth/                 # Login, Register, OTP, Restaurant Register
│   ├── customer/             # Browse, Cart, Checkout, Orders, Profile, QR
│   ├── restaurant/           # Dashboard, Menu, Orders, QR, Tables, Settings
│   ├── delivery/             # Dashboard, Orders, History, Signup
│   └── admin/                # Dashboard, Restaurants, Users, Orders, Analytics
├── components/common/        # Reusable UI components
└── utils/helpers.js          # Utility functions
```

## API Configuration
The app points to `https://beta.skipqapp.com/api` by default.
To change, edit `API_BASE_URL` in `src/services/api.js`.

## Notes
- Backend stays the same — the mobile app uses the exact same REST API
- Real-time features use the same Socket.io server
- Auth tokens are stored in AsyncStorage (secure on device)
- Geolocation runs in background for delivery agents

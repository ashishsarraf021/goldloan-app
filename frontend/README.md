# Gold Loan Tracker — Mobile App

React Native (Expo) mobile app for shopkeepers.

## Requirements

- Node.js 18+
- Expo CLI (via `npx expo`)
- iOS Simulator / Android Emulator / Expo Go app

## Setup

```bash
npm install
cp .env.example .env
npm start
```

## Environment

Create `.env`:

```env
EXPO_PUBLIC_API_URL=http://localhost:8080/api/v1
```

**Connection tips:**

| Environment | API URL |
|-------------|---------|
| iOS Simulator | `http://localhost:8080/api/v1` |
| Android Emulator | `http://10.0.2.2:8080/api/v1` |
| Physical device | `http://<your-computer-ip>:8080/api/v1` |

Ensure backend is running and firewall allows connections.

## Project Structure

```
frontend/
├── App.js                   # Root component
├── index.js                 # Expo entry
├── app.json                 # Expo config
├── src/
│   ├── api/
│   │   └── client.js        # HTTP client with JWT auth
│   ├── components/
│   │   └── UI.js            # Button, Input, Card, StatCard
│   ├── context/
│   │   └── AuthContext.js   # Login state & auth actions
│   ├── navigation/
│   │   └── AppNavigator.js  # Tab + stack navigation
│   ├── screens/
│   │   ├── LoginScreen.js
│   │   ├── RegisterScreen.js
│   │   ├── DashboardScreen.js
│   │   ├── CustomersScreen.js
│   │   ├── AddCustomerScreen.js
│   │   ├── LoansScreen.js
│   │   ├── AddLoanScreen.js
│   │   ├── LoanDetailScreen.js
│   │   └── SettingsScreen.js
│   └── utils/
│       └── constants.js     # Colors, formatters, API URL
└── assets/                  # App icons (add your own)
```

## Screens

| Screen | Description |
|--------|-------------|
| **Login / Register** | Shopkeeper authentication |
| **Dashboard** | Active loans, totals, gold/silver rates |
| **Customers** | List & add/edit customers |
| **Loans** | List loans with filters (active/closed/all) |
| **Add Loan** | Create loan with jewelry items |
| **Loan Detail** | Interest summary, jewelry value, send WhatsApp |
| **Settings** | Update rates, shop info, logout |

## Run on Device

```bash
# Android
npm run android

# iOS (macOS only)
npm run ios
```

Scan QR code with Expo Go for physical device testing.

## Assets

Add these files to `assets/` for production builds:

- `icon.png` (1024×1024)
- `splash.png`
- `adaptive-icon.png` (Android)

For development, Expo works without custom assets.

## Building for Production

```bash
npx expo prebuild
npx expo run:android
# or
npx expo run:ios
```

For app store builds, use [EAS Build](https://docs.expo.dev/build/introduction/).

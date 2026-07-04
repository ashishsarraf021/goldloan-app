# Gold Loan Tracker

A mobile app for **shopkeepers** to manage gold and silver jewelry loans — track collateral, loan amounts, interest rates, and send **WhatsApp updates to customers every 6 months** with accrued interest and current jewelry value.

## Tech Stack

| Layer    | Technology        |
|----------|-------------------|
| Backend  | Go (Gin + GORM)   |
| Frontend | React Native (Expo) |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Auth     | JWT               |
| Reminders| Cron + WhatsApp Business API |

## Project Structure

```
App/
├── backend/                 # Go REST API
│   ├── cmd/server/          # Application entry point
│   ├── internal/
│   │   ├── config/          # Environment configuration
│   │   ├── database/        # DB connection & migrations
│   │   ├── handlers/        # HTTP request handlers
│   │   ├── middleware/      # JWT auth middleware
│   │   ├── models/          # Database models
│   │   ├── router/          # Route definitions
│   │   └── services/        # Business logic (interest, WhatsApp, reminders)
│   ├── docs/                # API documentation
│   └── README.md
├── frontend/                # React Native mobile app
│   ├── src/
│   │   ├── api/             # API client
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # Auth context
│   │   ├── navigation/      # App navigation
│   │   ├── screens/         # App screens
│   │   └── utils/           # Constants & helpers
│   └── README.md
└── README.md                # This file
```

## Quick Start

### 1. Backend

```bash
cd backend
cp .env.example .env
go mod download
go run ./cmd/server
```

API runs at `http://localhost:8080`

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm start
```

Use Expo Go on your phone or an emulator. For Android emulator, set:

```
EXPO_PUBLIC_API_URL=http://10.0.2.2:8080/api/v1
```

For a physical device, use your computer's LAN IP:

```
EXPO_PUBLIC_API_URL=http://192.168.x.x:8080/api/v1
```

## Features

- **Shopkeeper registration & login**
- **Customer management** with WhatsApp number
- **Loan creation** with multiple jewelry items (gold/silver, weight, purity)
- **Interest calculation** (monthly or yearly)
- **Jewelry valuation** based on current gold/silver rates
- **Dashboard** with totals (principal, interest, jewelry value)
- **WhatsApp reminders** every 6 months (automatic cron job)
- **Manual WhatsApp update** from loan detail screen

## WhatsApp Setup

1. Create a [Meta Business](https://business.facebook.com) account
2. Set up [WhatsApp Business Platform](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)
3. Get `Phone Number ID` and `Access Token`
4. Set in `backend/.env`:

```env
WHATSAPP_ENABLED=true
WHATSAPP_PHONE_NUMBER_ID=your_id
WHATSAPP_ACCESS_TOKEN=your_token
```

When disabled, messages are printed to the server console (dev mode).

## Documentation

- [Backend API Docs](backend/docs/API.md)
- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)

## License

MIT

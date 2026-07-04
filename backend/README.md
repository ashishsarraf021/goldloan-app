# Gold Loan Tracker — Backend API

Go REST API for managing gold/silver jewelry loans.

## Requirements

- Go 1.21+
- SQLite (default) or PostgreSQL

## Setup

```bash
cp .env.example .env
go mod download
go run ./cmd/server
```

Server starts on port `8080` by default.

## Project Structure

```
backend/
├── cmd/server/main.go       # Entry point, cron scheduler
├── internal/
│   ├── config/              # Load .env configuration
│   ├── database/            # GORM connection + auto-migrate
│   ├── handlers/            # HTTP handlers
│   │   ├── auth.go          # Register, login, profile
│   │   ├── customer.go      # CRUD customers
│   │   ├── loan.go          # CRUD loans, summary, reminders
│   │   └── reminder.go      # Manual trigger for cron job
│   ├── middleware/auth.go   # JWT authentication
│   ├── models/              # Shopkeeper, Customer, Loan, JewelryItem
│   ├── router/router.go     # Route setup + CORS
│   └── services/
│       ├── interest.go      # Interest & jewelry valuation
│       ├── whatsapp.go      # WhatsApp Cloud API integration
│       └── reminder.go      # 6-month reminder scheduler
├── docs/API.md              # Full API reference
├── .env.example
└── go.mod
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8080` |
| `DB_DRIVER` | `sqlite` or `postgres` | `sqlite` |
| `DATABASE_URL` | DB connection string | `./data/goldloan.db` |
| `JWT_SECRET` | JWT signing secret | (required in prod) |
| `WHATSAPP_ENABLED` | Enable WhatsApp API | `false` |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta phone number ID | — |
| `WHATSAPP_ACCESS_TOKEN` | Meta access token | — |
| `REMINDER_CRON` | Cron schedule for reminders | `0 9 * * *` |

## Interest Calculation

- **Monthly**: `principal × (rate/100/12) × months_elapsed`
- **Yearly**: `principal × (rate/100) × (months_elapsed/12)`

Months are approximated as days ÷ 30 from loan date.

## Jewelry Valuation

Value = weight × quantity × rate_per_gram × purity_factor

Purity factors:
- Gold: 24K=1.0, 22K=0.916, 18K=0.75, 14K=0.585
- Silver: 999=1.0, 925=0.925

Rates are set per shopkeeper in profile/settings.

## 6-Month WhatsApp Reminders

A cron job runs daily (configurable). For each **active** loan:
- First reminder: 6 months after loan date
- Subsequent: every 6 months from last reminder

Message includes: principal, accrued interest, total payable, jewelry value, item details.

## Build for Production

```bash
go build -o goldloan-server ./cmd/server/
./goldloan-server
```

For PostgreSQL, set `DB_DRIVER=postgres` and provide `DATABASE_URL`.

## API Reference

See [docs/API.md](docs/API.md) for full endpoint documentation.

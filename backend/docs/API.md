# Gold Loan Tracker — API Reference

Base URL: `http://localhost:8080/api/v1`

All protected endpoints require header:

```
Authorization: Bearer <jwt_token>
```

---

## Health

### GET /health

```json
{ "status": "ok", "service": "goldloan-api" }
```

---

## Authentication

### POST /auth/register

```json
{
  "name": "Rajesh Kumar",
  "phone": "9876543210",
  "email": "rajesh@shop.com",
  "shop_name": "Shree Gold Finance",
  "password": "secret123"
}
```

**Response 201:**

```json
{
  "token": "eyJ...",
  "shopkeeper": {
    "id": 1,
    "name": "Rajesh Kumar",
    "phone": "9876543210",
    "shop_name": "Shree Gold Finance",
    "gold_rate_per_gram": 6500,
    "silver_rate_per_gram": 85
  }
}
```

### POST /auth/login

```json
{
  "phone": "9876543210",
  "password": "secret123"
}
```

---

## Profile

### GET /profile

Returns current shopkeeper profile.

### PUT /profile

```json
{
  "name": "Rajesh Kumar",
  "shop_name": "Shree Gold Finance",
  "gold_rate_per_gram": 6800,
  "silver_rate_per_gram": 90
}
```

---

## Dashboard

### GET /dashboard

```json
{
  "active_loans": 12,
  "total_customers": 45,
  "total_principal": 1500000,
  "total_accrued_interest": 85000,
  "total_jewelry_value": 2100000,
  "gold_rate_per_gram": 6500,
  "silver_rate_per_gram": 85
}
```

---

## Customers

### GET /customers

List all customers for logged-in shopkeeper.

### POST /customers

```json
{
  "name": "Amit Sharma",
  "phone": "9123456789",
  "whatsapp": "9123456789",
  "address": "123 Main St, Delhi"
}
```

### GET /customers/:id

### PUT /customers/:id

### DELETE /customers/:id

---

## Loans

### GET /loans?status=active

Optional query: `status=active|closed|defaulted`

### POST /loans

```json
{
  "customer_id": 1,
  "principal_amount": 50000,
  "interest_rate": 24,
  "interest_type": "monthly",
  "loan_date": "2024-01-15",
  "due_date": "2025-01-15",
  "notes": "Gold chain + ring",
  "jewelry_items": [
    {
      "metal_type": "gold",
      "description": "Gold chain",
      "weight_grams": 15.5,
      "purity": "22K",
      "quantity": 1
    },
    {
      "metal_type": "silver",
      "description": "Silver bangles",
      "weight_grams": 120,
      "purity": "925",
      "quantity": 2
    }
  ]
}
```

### GET /loans/:id

Returns loan with customer and jewelry items.

### PUT /loans/:id

```json
{
  "interest_rate": 22,
  "status": "closed",
  "notes": "Repaid in full"
}
```

### GET /loans/:id/summary

Returns calculated interest and jewelry valuation:

```json
{
  "loan_id": 1,
  "loan_number": "GL-1-123456",
  "principal_amount": 50000,
  "interest_rate": 24,
  "interest_type": "monthly",
  "loan_date": "2024-01-15T00:00:00Z",
  "months_elapsed": 8.5,
  "accrued_interest": 8500,
  "total_payable": 58500,
  "jewelry_current_value": 125000,
  "jewelry_items": [
    {
      "id": 1,
      "description": "Gold chain",
      "metal_type": "gold",
      "weight_grams": 15.5,
      "purity": "22K",
      "rate_per_gram": 6500,
      "value": 92182
    }
  ]
}
```

### POST /loans/:id/send-reminder

Manually send WhatsApp update to customer.

### GET /loans/:id/reminders

List reminder history for a loan.

---

## Reminders

### POST /reminders/run

Manually trigger the 6-month reminder job (same as cron).

---

## Error Responses

```json
{ "error": "error message" }
```

HTTP status codes: 400, 401, 404, 409, 500

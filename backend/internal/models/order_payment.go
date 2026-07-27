package models

import "time"

type OrderPayment struct {
	ID                uint      `json:"id" gorm:"primaryKey"`
	OrderID           uint      `json:"order_id" gorm:"index"`
	Date              time.Time `json:"date"`
	Type              string    `json:"type"` // "Advance Cash" | "Advance Gold" | "Installment Cash"
	AmountINR         float64   `json:"amount_inr"`
	GoldGrams         *float64  `json:"gold_grams,omitempty"`
	RateAtPaymentDate *float64  `json:"rate_at_payment_date,omitempty"`
	Note              string    `json:"note"`
	CreatedAt         time.Time `json:"created_at"`
}

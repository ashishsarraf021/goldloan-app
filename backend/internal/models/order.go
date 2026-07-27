package models

import "time"

type Order struct {
	ID                     uint           `json:"id" gorm:"primaryKey"`
	ShopkeeperID           uint           `json:"shopkeeper_id" gorm:"index"`
	CustomerID             uint           `json:"customer_id" gorm:"index"`
	Customer               *Customer      `json:"customer,omitempty" gorm:"foreignKey:CustomerID"`
	OrderNumber            string         `json:"order_number" gorm:"uniqueIndex"`
	Category               string         `json:"category"`
	Type                   string         `json:"type"` // "Pre-Order" | "Ready-Made"
	OrderDate              time.Time      `json:"order_date"`
	PromisedDeliveryDate   *time.Time     `json:"promised_delivery_date"`
	ApproxWeightGrams      float64        `json:"approx_weight_grams"`
	ApproxBudget           float64        `json:"approx_budget"`
	LockedMarketRate       float64        `json:"locked_market_rate"`
	Status                 string         `json:"status" gorm:"default:Pending"` // Pending, In Progress, Ready for Delivery, Settled
	ReferenceImage         string         `json:"reference_image"`
	FinalActualWeightGrams *float64       `json:"final_actual_weight_grams"`
	FinalBillAmount        *float64       `json:"final_bill_amount"`
	Payments               []OrderPayment `json:"payments,omitempty" gorm:"foreignKey:OrderID"`
	CreatedAt              time.Time      `json:"created_at"`
	UpdatedAt              time.Time      `json:"updated_at"`
}

// Convenience field for the frontend (flattened customer name/phone)
func (o *Order) CustomerName() string {
	if o.Customer != nil {
		return o.Customer.Name
	}
	return ""
}

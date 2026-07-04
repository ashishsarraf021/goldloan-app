package models

import (
	"time"

	"gorm.io/gorm"
)

type Shopkeeper struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	Name         string         `gorm:"not null" json:"name"`
	Phone        string         `gorm:"uniqueIndex;not null" json:"phone"`
	Email        string         `json:"email"`
	ShopName     string         `gorm:"not null" json:"shop_name"`
	PasswordHash string         `gorm:"not null" json:"-"`
	GoldRate     float64        `gorm:"default:6500" json:"gold_rate_per_gram"`
	SilverRate   float64        `gorm:"default:85" json:"silver_rate_per_gram"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

type Customer struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	ShopkeeperID uint           `gorm:"not null;index" json:"shopkeeper_id"`
	Name         string         `gorm:"not null" json:"name"`
	Phone        string         `gorm:"not null" json:"phone"`
	WhatsApp     string         `json:"whatsapp"`
	Address      string         `json:"address"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

type LoanStatus string

const (
	LoanStatusActive   LoanStatus = "active"
	LoanStatusClosed   LoanStatus = "closed"
	LoanStatusDefaulted LoanStatus = "defaulted"
)

type MetalType string

const (
	MetalGold   MetalType = "gold"
	MetalSilver MetalType = "silver"
)

type JewelryItem struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	LoanID      uint      `gorm:"not null;index" json:"loan_id"`
	MetalType   MetalType `gorm:"not null" json:"metal_type"`
	Description string    `gorm:"not null" json:"description"`
	WeightGrams float64   `gorm:"not null" json:"weight_grams"`
	Purity      string    `json:"purity"` // e.g. "22K", "24K", "925"
	Quantity    int       `gorm:"default:1" json:"quantity"`
	CreatedAt   time.Time `json:"created_at"`
}

type Loan struct {
	ID               uint           `gorm:"primaryKey" json:"id"`
	ShopkeeperID     uint           `gorm:"not null;index" json:"shopkeeper_id"`
	CustomerID       uint           `gorm:"not null;index" json:"customer_id"`
	LoanNumber       string         `gorm:"uniqueIndex;not null" json:"loan_number"`
	PrincipalAmount  float64        `gorm:"not null" json:"principal_amount"`
	InterestRate     float64        `gorm:"not null" json:"interest_rate"` // annual percentage
	InterestType     string         `gorm:"default:monthly" json:"interest_type"` // monthly, yearly
	LoanDate         time.Time      `gorm:"not null" json:"loan_date"`
	DueDate          *time.Time     `json:"due_date"`
	Status           LoanStatus     `gorm:"default:active" json:"status"`
	Notes            string         `json:"notes"`
	LastReminderSent *time.Time     `json:"last_reminder_sent"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`

	Customer      Customer      `gorm:"foreignKey:CustomerID" json:"customer,omitempty"`
	JewelryItems  []JewelryItem `gorm:"foreignKey:LoanID" json:"jewelry_items,omitempty"`
}

type ReminderLog struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	LoanID     uint      `gorm:"not null;index" json:"loan_id"`
	SentAt     time.Time `gorm:"not null" json:"sent_at"`
	Channel    string    `gorm:"default:whatsapp" json:"channel"`
	Message    string    `json:"message"`
	Status     string    `gorm:"default:sent" json:"status"` // sent, failed
	ErrorMsg   string    `json:"error_msg,omitempty"`
}

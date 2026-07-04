package services

import (
	"time"

	"github.com/goldloan/backend/internal/models"
	"gorm.io/gorm"
)

type ReminderScheduler struct {
	db       *gorm.DB
	whatsapp *WhatsAppService
}

func NewReminderScheduler(db *gorm.DB, whatsapp *WhatsAppService) *ReminderScheduler {
	return &ReminderScheduler{db: db, whatsapp: whatsapp}
}

func (r *ReminderScheduler) ProcessDueReminders() error {
	var loans []models.Loan
	now := time.Now()

	if err := r.db.Preload("Customer").Preload("JewelryItems").
		Where("status = ?", models.LoanStatusActive).
		Find(&loans).Error; err != nil {
		return err
	}

	for i := range loans {
		loan := &loans[i]
		if !ShouldSendSixMonthReminder(loan, now) {
			continue
		}

		var shopkeeper models.Shopkeeper
		if err := r.db.First(&shopkeeper, loan.ShopkeeperID).Error; err != nil {
			continue
		}

		summary := BuildLoanSummary(loan, shopkeeper.GoldRate, shopkeeper.SilverRate, now)
		message := FormatReminderMessage(&loan.Customer, summary, shopkeeper.ShopName)

		err := r.whatsapp.SendLoanUpdate(&loan.Customer, summary, shopkeeper.ShopName)
		status := "sent"
		errMsg := ""
		if err != nil {
			status = "failed"
			errMsg = err.Error()
		}

		log := models.ReminderLog{
			LoanID:   loan.ID,
			SentAt:   now,
			Channel:  "whatsapp",
			Message:  message,
			Status:   status,
			ErrorMsg: errMsg,
		}
		r.db.Create(&log)

		if err == nil {
			loan.LastReminderSent = &now
			r.db.Save(loan)
		}
	}
	return nil
}

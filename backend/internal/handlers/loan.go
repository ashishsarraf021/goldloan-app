package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/goldloan/backend/internal/config"
	"github.com/goldloan/backend/internal/middleware"
	"github.com/goldloan/backend/internal/models"
	"github.com/goldloan/backend/internal/services"
	"gorm.io/gorm"
)

type LoanHandler struct {
	db       *gorm.DB
	cfg      *config.Config
	whatsapp *services.WhatsAppService
}

func NewLoanHandler(db *gorm.DB, cfg *config.Config, whatsapp *services.WhatsAppService) *LoanHandler {
	return &LoanHandler{db: db, cfg: cfg, whatsapp: whatsapp}
}

type jewelryItemRequest struct {
	MetalType   string  `json:"metal_type" binding:"required"`
	Description string  `json:"description" binding:"required"`
	WeightGrams float64 `json:"weight_grams" binding:"required,gt=0"`
	Purity      string  `json:"purity"`
	Quantity    int     `json:"quantity"`
}

type createLoanRequest struct {
	CustomerID      uint                 `json:"customer_id" binding:"required"`
	PrincipalAmount float64              `json:"principal_amount" binding:"required,gt=0"`
	InterestRate    float64              `json:"interest_rate" binding:"required,gt=0"`
	InterestType    string               `json:"interest_type"`
	LoanDate        string               `json:"loan_date"`
	DueDate         string               `json:"due_date"`
	Notes           string               `json:"notes"`
	JewelryItems    []jewelryItemRequest `json:"jewelry_items" binding:"required,min=1"`
}

type updateLoanRequest struct {
	InterestRate float64    `json:"interest_rate"`
	Status       string     `json:"status"`
	Notes        string     `json:"notes"`
	DueDate      string     `json:"due_date"`
}

func (h *LoanHandler) List(c *gin.Context) {
	id := middleware.GetShopkeeperID(c)
	status := c.Query("status")

	query := h.db.Preload("Customer").Preload("JewelryItems").
		Where("shopkeeper_id = ?", id)

	if status != "" {
		query = query.Where("status = ?", status)
	}

	var loans []models.Loan
	query.Order("created_at desc").Find(&loans)
	c.JSON(http.StatusOK, loans)
}

func (h *LoanHandler) Get(c *gin.Context) {
	id := middleware.GetShopkeeperID(c)
	loanID, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	var loan models.Loan
	if err := h.db.Preload("Customer").Preload("JewelryItems").
		Where("id = ? AND shopkeeper_id = ?", loanID, id).First(&loan).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "loan not found"})
		return
	}
	c.JSON(http.StatusOK, loan)
}

func (h *LoanHandler) Summary(c *gin.Context) {
	id := middleware.GetShopkeeperID(c)
	loanID, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	var loan models.Loan
	if err := h.db.Preload("Customer").Preload("JewelryItems").
		Where("id = ? AND shopkeeper_id = ?", loanID, id).First(&loan).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "loan not found"})
		return
	}

	var shopkeeper models.Shopkeeper
	h.db.First(&shopkeeper, id)

	summary := services.BuildLoanSummary(&loan, shopkeeper.GoldRate, shopkeeper.SilverRate, time.Now())
	c.JSON(http.StatusOK, summary)
}

func (h *LoanHandler) Create(c *gin.Context) {
	id := middleware.GetShopkeeperID(c)
	var req createLoanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var customer models.Customer
	if err := h.db.Where("id = ? AND shopkeeper_id = ?", req.CustomerID, id).First(&customer).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "customer not found"})
		return
	}

	loanDate := time.Now()
	if req.LoanDate != "" {
		if t, err := time.Parse("2006-01-02", req.LoanDate); err == nil {
			loanDate = t
		}
	}

	var dueDate *time.Time
	if req.DueDate != "" {
		if t, err := time.Parse("2006-01-02", req.DueDate); err == nil {
			dueDate = &t
		}
	}

	interestType := req.InterestType
	if interestType == "" {
		interestType = "monthly"
	}

	loan := models.Loan{
		ShopkeeperID:    id,
		CustomerID:      req.CustomerID,
		LoanNumber:      generateLoanNumber(id),
		PrincipalAmount: req.PrincipalAmount,
		InterestRate:    req.InterestRate,
		InterestType:    interestType,
		LoanDate:        loanDate,
		DueDate:         dueDate,
		Status:          models.LoanStatusActive,
		Notes:           req.Notes,
	}

	tx := h.db.Begin()
	if err := tx.Create(&loan).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create loan"})
		return
	}

	for _, item := range req.JewelryItems {
		qty := item.Quantity
		if qty <= 0 {
			qty = 1
		}
		jewelry := models.JewelryItem{
			LoanID:      loan.ID,
			MetalType:   models.MetalType(item.MetalType),
			Description: item.Description,
			WeightGrams: item.WeightGrams,
			Purity:      item.Purity,
			Quantity:    qty,
		}
		if err := tx.Create(&jewelry).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create jewelry item"})
			return
		}
	}
	tx.Commit()

	h.db.Preload("Customer").Preload("JewelryItems").First(&loan, loan.ID)
	c.JSON(http.StatusCreated, loan)
}

func (h *LoanHandler) Update(c *gin.Context) {
	id := middleware.GetShopkeeperID(c)
	loanID, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	var loan models.Loan
	if err := h.db.Where("id = ? AND shopkeeper_id = ?", loanID, id).First(&loan).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "loan not found"})
		return
	}

	var req updateLoanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.InterestRate > 0 {
		loan.InterestRate = req.InterestRate
	}
	if req.Status != "" {
		loan.Status = models.LoanStatus(req.Status)
	}
	if req.Notes != "" {
		loan.Notes = req.Notes
	}
	if req.DueDate != "" {
		if t, err := time.Parse("2006-01-02", req.DueDate); err == nil {
			loan.DueDate = &t
		}
	}

	h.db.Save(&loan)
	c.JSON(http.StatusOK, loan)
}

func (h *LoanHandler) SendReminder(c *gin.Context) {
	id := middleware.GetShopkeeperID(c)
	loanID, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	var loan models.Loan
	if err := h.db.Preload("Customer").Preload("JewelryItems").
		Where("id = ? AND shopkeeper_id = ?", loanID, id).First(&loan).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "loan not found"})
		return
	}

	var shopkeeper models.Shopkeeper
	h.db.First(&shopkeeper, id)

	now := time.Now()
	summary := services.BuildLoanSummary(&loan, shopkeeper.GoldRate, shopkeeper.SilverRate, now)
	message := services.FormatReminderMessage(&loan.Customer, summary, shopkeeper.ShopName)

	err := h.whatsapp.SendLoanUpdate(&loan.Customer, summary, shopkeeper.ShopName)
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
	h.db.Create(&log)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	loan.LastReminderSent = &now
	h.db.Save(&loan)

	c.JSON(http.StatusOK, gin.H{
		"message": "reminder sent successfully",
		"summary": summary,
	})
}

func (h *LoanHandler) ReminderLogs(c *gin.Context) {
	id := middleware.GetShopkeeperID(c)
	loanID, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	var loan models.Loan
	if err := h.db.Where("id = ? AND shopkeeper_id = ?", loanID, id).First(&loan).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "loan not found"})
		return
	}

	var logs []models.ReminderLog
	h.db.Where("loan_id = ?", loanID).Order("sent_at desc").Find(&logs)
	c.JSON(http.StatusOK, logs)
}

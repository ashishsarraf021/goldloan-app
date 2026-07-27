package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/goldloan/backend/internal/models"
	"github.com/goldloan/backend/internal/services"
	"gorm.io/gorm"
)

type OrderHandler struct {
	db *gorm.DB
}

func NewOrderHandler(db *gorm.DB) *OrderHandler {
	return &OrderHandler{db: db}
}

// GET /orders?status=Pending
func (h *OrderHandler) List(c *gin.Context) {
	shopkeeperID := c.GetUint("shopkeeper_id")
	status := c.Query("status")

	query := h.db.Preload("Customer").Preload("Payments").Where("shopkeeper_id = ?", shopkeeperID)
	if status != "" && status != "ALL" {
		query = query.Where("status = ?", status)
	}

	var orders []models.Order
	if err := query.Order("created_at desc").Find(&orders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch orders"})
		return
	}
	c.JSON(http.StatusOK, serializeOrders(orders))
}

// GET /orders/:id
func (h *OrderHandler) Get(c *gin.Context) {
	shopkeeperID := c.GetUint("shopkeeper_id")
	id := c.Param("id")

	var order models.Order
	if err := h.db.Preload("Customer").Preload("Payments").
		Where("shopkeeper_id = ? AND id = ?", shopkeeperID, id).First(&order).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "order not found"})
		return
	}
	c.JSON(http.StatusOK, serializeOrder(order))
}

type createOrderInput struct {
	CustomerID           uint    `json:"customer_id" binding:"required"`
	Category             string  `json:"category" binding:"required"`
	Type                 string  `json:"type" binding:"required"`
	ApproxWeightGrams    float64 `json:"approx_weight_grams"`
	ApproxBudget         float64 `json:"approx_budget"`
	PromisedDeliveryDate string  `json:"promised_delivery_date"`
	InitialAdvanceCash   float64 `json:"initial_advance_cash"`
	ReferenceImage       string  `json:"reference_image"`
}

// POST /orders
func (h *OrderHandler) Create(c *gin.Context) {
	shopkeeperID := c.GetUint("shopkeeper_id")

	var input createOrderInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Lock in the current live market gold rate at order creation time
	lockedRate := 0.0
	if rates, err := services.GetLiveRates(); err == nil {
		lockedRate = rates.GoldPerGram
	}

	var deliveryDate *time.Time
	if input.PromisedDeliveryDate != "" {
		if parsed, err := time.Parse("2006-01-02", input.PromisedDeliveryDate); err == nil {
			deliveryDate = &parsed
		}
	}

	order := models.Order{
		ShopkeeperID:         shopkeeperID,
		CustomerID:           input.CustomerID,
		OrderNumber:          fmt.Sprintf("ORD-%d-%d", shopkeeperID, time.Now().Unix()),
		Category:             input.Category,
		Type:                 input.Type,
		OrderDate:            time.Now(),
		PromisedDeliveryDate: deliveryDate,
		ApproxWeightGrams:    input.ApproxWeightGrams,
		ApproxBudget:         input.ApproxBudget,
		LockedMarketRate:     lockedRate,
		Status:               "Pending",
		ReferenceImage:       input.ReferenceImage,
	}

	if err := h.db.Create(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create order"})
		return
	}

	if input.InitialAdvanceCash > 0 {
		payment := models.OrderPayment{
			OrderID:   order.ID,
			Date:      time.Now(),
			Type:      "Advance Cash",
			AmountINR: input.InitialAdvanceCash,
			Note:      "Initial advance at order creation",
		}
		h.db.Create(&payment)
		order.Status = "In Progress"
		h.db.Save(&order)
	}

	h.db.Preload("Customer").Preload("Payments").First(&order, order.ID)
	c.JSON(http.StatusCreated, serializeOrder(order))
}

type addPaymentInput struct {
	Type      string  `json:"type" binding:"required"` // "Cash" or "Gold"
	AmountINR float64 `json:"amount_inr"`
	GoldGrams float64 `json:"gold_grams"`
	Note      string  `json:"note"`
}

// POST /orders/:id/payments
func (h *OrderHandler) AddPayment(c *gin.Context) {
	shopkeeperID := c.GetUint("shopkeeper_id")
	id := c.Param("id")

	var order models.Order
	if err := h.db.Where("shopkeeper_id = ? AND id = ?", shopkeeperID, id).First(&order).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "order not found"})
		return
	}

	var input addPaymentInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	payment := models.OrderPayment{
		OrderID: order.ID,
		Date:    time.Now(),
		Note:    input.Note,
	}

	if input.Type == "Gold" {
		// Value the gold advance using the market rate at the moment this payment is recorded,
		// not the order date — per business requirement.
		rate := 0.0
		if rates, err := services.GetLiveRates(); err == nil {
			rate = rates.GoldPerGram
		}
		amount := input.GoldGrams * rate
		payment.Type = "Advance Gold"
		payment.GoldGrams = &input.GoldGrams
		payment.RateAtPaymentDate = &rate
		payment.AmountINR = amount
	} else {
		payment.Type = "Installment Cash"
		payment.AmountINR = input.AmountINR
	}

	if err := h.db.Create(&payment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to record payment"})
		return
	}

	if order.Status == "Pending" {
		order.Status = "In Progress"
		h.db.Save(&order)
	}

	c.JSON(http.StatusCreated, payment)
}

type settleOrderInput struct {
	FinalActualWeightGrams float64 `json:"final_actual_weight_grams"`
	FinalBillAmount        float64 `json:"final_bill_amount" binding:"required"`
}

// POST /orders/:id/settle
func (h *OrderHandler) Settle(c *gin.Context) {
	shopkeeperID := c.GetUint("shopkeeper_id")
	id := c.Param("id")

	var order models.Order
	if err := h.db.Where("shopkeeper_id = ? AND id = ?", shopkeeperID, id).First(&order).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "order not found"})
		return
	}

	var input settleOrderInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	order.FinalActualWeightGrams = &input.FinalActualWeightGrams
	order.FinalBillAmount = &input.FinalBillAmount
	order.Status = "Settled"

	if err := h.db.Save(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to settle order"})
		return
	}

	h.db.Preload("Customer").Preload("Payments").First(&order, order.ID)
	c.JSON(http.StatusOK, serializeOrder(order))
}

// --- Serialization helpers (flatten nested customer for the frontend) ---

func serializeOrder(o models.Order) gin.H {
	customerName := ""
	customerPhone := ""
	if o.Customer != nil {
		customerName = o.Customer.Name
		customerPhone = o.Customer.Phone
	}
	return gin.H{
		"id":                        o.ID,
		"order_number":              o.OrderNumber,
		"customer_id":               o.CustomerID,
		"customer_name":             customerName,
		"customer_phone":            customerPhone,
		"category":                  o.Category,
		"type":                      o.Type,
		"order_date":                o.OrderDate,
		"promised_delivery_date":    o.PromisedDeliveryDate,
		"approx_weight_grams":       o.ApproxWeightGrams,
		"approx_budget":             o.ApproxBudget,
		"locked_market_rate":        o.LockedMarketRate,
		"status":                    o.Status,
		"reference_image":           o.ReferenceImage,
		"final_actual_weight_grams": o.FinalActualWeightGrams,
		"final_bill_amount":         o.FinalBillAmount,
		"payments":                  o.Payments,
		"created_at":                o.CreatedAt,
	}
}

func serializeOrders(orders []models.Order) []gin.H {
	result := make([]gin.H, len(orders))
	for i, o := range orders {
		result[i] = serializeOrder(o)
	}
	return result
}

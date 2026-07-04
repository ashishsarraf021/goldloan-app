package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/goldloan/backend/internal/middleware"
	"github.com/goldloan/backend/internal/models"
	"gorm.io/gorm"
)

type CustomerHandler struct {
	db *gorm.DB
}

func NewCustomerHandler(db *gorm.DB) *CustomerHandler {
	return &CustomerHandler{db: db}
}

type createCustomerRequest struct {
	Name     string `json:"name" binding:"required"`
	Phone    string `json:"phone" binding:"required"`
	WhatsApp string `json:"whatsapp"`
	Address  string `json:"address"`
}

func (h *CustomerHandler) List(c *gin.Context) {
	id := middleware.GetShopkeeperID(c)
	var customers []models.Customer
	h.db.Where("shopkeeper_id = ?", id).Order("name asc").Find(&customers)
	c.JSON(http.StatusOK, customers)
}

func (h *CustomerHandler) Get(c *gin.Context) {
	id := middleware.GetShopkeeperID(c)
	customerID, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	var customer models.Customer
	if err := h.db.Where("id = ? AND shopkeeper_id = ?", customerID, id).First(&customer).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "customer not found"})
		return
	}
	c.JSON(http.StatusOK, customer)
}

func (h *CustomerHandler) Create(c *gin.Context) {
	id := middleware.GetShopkeeperID(c)
	var req createCustomerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	customer := models.Customer{
		ShopkeeperID: id,
		Name:         req.Name,
		Phone:        req.Phone,
		WhatsApp:     req.WhatsApp,
		Address:      req.Address,
	}
	if customer.WhatsApp == "" {
		customer.WhatsApp = customer.Phone
	}

	if err := h.db.Create(&customer).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create customer"})
		return
	}
	c.JSON(http.StatusCreated, customer)
}

func (h *CustomerHandler) Update(c *gin.Context) {
	id := middleware.GetShopkeeperID(c)
	customerID, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	var customer models.Customer
	if err := h.db.Where("id = ? AND shopkeeper_id = ?", customerID, id).First(&customer).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "customer not found"})
		return
	}

	var req createCustomerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	customer.Name = req.Name
	customer.Phone = req.Phone
	customer.WhatsApp = req.WhatsApp
	customer.Address = req.Address
	if customer.WhatsApp == "" {
		customer.WhatsApp = customer.Phone
	}

	h.db.Save(&customer)
	c.JSON(http.StatusOK, customer)
}

func (h *CustomerHandler) Delete(c *gin.Context) {
	id := middleware.GetShopkeeperID(c)
	customerID, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	result := h.db.Where("id = ? AND shopkeeper_id = ?", customerID, id).Delete(&models.Customer{})
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "customer not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "customer deleted"})
}

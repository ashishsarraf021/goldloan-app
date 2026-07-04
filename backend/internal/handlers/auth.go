package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/goldloan/backend/internal/config"
	"github.com/goldloan/backend/internal/middleware"
	"github.com/goldloan/backend/internal/models"
	"github.com/goldloan/backend/internal/services"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewAuthHandler(db *gorm.DB, cfg *config.Config) *AuthHandler {
	return &AuthHandler{db: db, cfg: cfg}
}

type registerRequest struct {
	Name     string `json:"name" binding:"required"`
	Phone    string `json:"phone" binding:"required"`
	Email    string `json:"email"`
	ShopName string `json:"shop_name" binding:"required"`
	Password string `json:"password" binding:"required,min=6"`
}

type loginRequest struct {
	Phone    string `json:"phone" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	shopkeeper := models.Shopkeeper{
		Name:         req.Name,
		Phone:        req.Phone,
		Email:        req.Email,
		ShopName:     req.ShopName,
		PasswordHash: string(hash),
		GoldRate:     h.cfg.DefaultGoldRate,
		SilverRate:   h.cfg.DefaultSilverRate,
	}

	if err := h.db.Create(&shopkeeper).Error; err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "phone already registered"})
		return
	}

	token, err := middleware.GenerateToken(shopkeeper.ID, shopkeeper.Phone, h.cfg.JWTSecret, h.cfg.JWTExpiryHours)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"token":       token,
		"shopkeeper":  sanitizeShopkeeper(shopkeeper),
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var shopkeeper models.Shopkeeper
	if err := h.db.Where("phone = ?", req.Phone).First(&shopkeeper).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(shopkeeper.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	token, err := middleware.GenerateToken(shopkeeper.ID, shopkeeper.Phone, h.cfg.JWTSecret, h.cfg.JWTExpiryHours)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token":      token,
		"shopkeeper": sanitizeShopkeeper(shopkeeper),
	})
}

func (h *AuthHandler) Profile(c *gin.Context) {
	id := middleware.GetShopkeeperID(c)
	var shopkeeper models.Shopkeeper
	if err := h.db.First(&shopkeeper, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "shopkeeper not found"})
		return
	}
	c.JSON(http.StatusOK, sanitizeShopkeeper(shopkeeper))
}

type updateProfileRequest struct {
	Name       string  `json:"name"`
	ShopName   string  `json:"shop_name"`
	Email      string  `json:"email"`
	GoldRate   float64 `json:"gold_rate_per_gram"`
	SilverRate float64 `json:"silver_rate_per_gram"`
}

func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	id := middleware.GetShopkeeperID(c)
	var shopkeeper models.Shopkeeper
	if err := h.db.First(&shopkeeper, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "shopkeeper not found"})
		return
	}

	var req updateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Name != "" {
		shopkeeper.Name = req.Name
	}
	if req.ShopName != "" {
		shopkeeper.ShopName = req.ShopName
	}
	if req.Email != "" {
		shopkeeper.Email = req.Email
	}
	if req.GoldRate > 0 {
		shopkeeper.GoldRate = req.GoldRate
	}
	if req.SilverRate > 0 {
		shopkeeper.SilverRate = req.SilverRate
	}

	h.db.Save(&shopkeeper)
	c.JSON(http.StatusOK, sanitizeShopkeeper(shopkeeper))
}

func sanitizeShopkeeper(s models.Shopkeeper) gin.H {
	return gin.H{
		"id":                   s.ID,
		"name":                 s.Name,
		"phone":                s.Phone,
		"email":                s.Email,
		"shop_name":            s.ShopName,
		"gold_rate_per_gram":   s.GoldRate,
		"silver_rate_per_gram": s.SilverRate,
		"created_at":           s.CreatedAt,
	}
}

// DashboardHandler provides summary stats
type DashboardHandler struct {
	db *gorm.DB
}

func NewDashboardHandler(db *gorm.DB) *DashboardHandler {
	return &DashboardHandler{db: db}
}

func (h *DashboardHandler) Summary(c *gin.Context) {
	id := middleware.GetShopkeeperID(c)
	now := time.Now()

	var shopkeeper models.Shopkeeper
	h.db.First(&shopkeeper, id)

	var activeCount int64
	var totalPrincipal float64
	h.db.Model(&models.Loan{}).Where("shopkeeper_id = ? AND status = ?", id, models.LoanStatusActive).Count(&activeCount)
	h.db.Model(&models.Loan{}).Where("shopkeeper_id = ? AND status = ?", id, models.LoanStatusActive).
		Select("COALESCE(SUM(principal_amount), 0)").Scan(&totalPrincipal)

	var loans []models.Loan
	h.db.Preload("JewelryItems").Where("shopkeeper_id = ? AND status = ?", id, models.LoanStatusActive).Find(&loans)

	var totalInterest float64
	var totalJewelryValue float64
	for i := range loans {
		summary := services.BuildLoanSummary(&loans[i], shopkeeper.GoldRate, shopkeeper.SilverRate, now)
		totalInterest += summary.AccruedInterest
		totalJewelryValue += summary.JewelryCurrentValue
	}

	var customerCount int64
	h.db.Model(&models.Customer{}).Where("shopkeeper_id = ?", id).Count(&customerCount)

	c.JSON(http.StatusOK, gin.H{
		"active_loans":          activeCount,
		"total_customers":       customerCount,
		"total_principal":       totalPrincipal,
		"total_accrued_interest": totalInterest,
		"total_jewelry_value":   totalJewelryValue,
		"gold_rate_per_gram":    shopkeeper.GoldRate,
		"silver_rate_per_gram":  shopkeeper.SilverRate,
	})
}

func generateLoanNumber(shopkeeperID uint) string {
	return fmt.Sprintf("GL-%d-%d", shopkeeperID, time.Now().Unix()%1000000)
}

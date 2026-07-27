package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/goldloan/backend/internal/models"
	"gorm.io/gorm"
)

type CategoryHandler struct {
	db *gorm.DB
}

func NewCategoryHandler(db *gorm.DB) *CategoryHandler {
	return &CategoryHandler{db: db}
}

func (h *CategoryHandler) List(c *gin.Context) {
	shopkeeperID := c.GetUint("shopkeeper_id")
	var categories []models.Category
	h.db.Where("shopkeeper_id = ?", shopkeeperID).Order("name").Find(&categories)
	c.JSON(http.StatusOK, categories)
}

type createCategoryInput struct {
	Name string `json:"name" binding:"required"`
}

func (h *CategoryHandler) Create(c *gin.Context) {
	shopkeeperID := c.GetUint("shopkeeper_id")
	var input createCategoryInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	cat := models.Category{ShopkeeperID: shopkeeperID, Name: input.Name}
	if err := h.db.Create(&cat).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create category"})
		return
	}
	c.JSON(http.StatusCreated, cat)
}

func (h *CategoryHandler) Delete(c *gin.Context) {
	shopkeeperID := c.GetUint("shopkeeper_id")
	id := c.Param("id")
	if err := h.db.Where("shopkeeper_id = ?", shopkeeperID).Delete(&models.Category{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete category"})
		return
	}
	c.Status(http.StatusNoContent)
}

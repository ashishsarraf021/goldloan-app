package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/goldloan/backend/internal/services"
)

func GetLiveRates(c *gin.Context) {
	rates, err := services.GetLiveRates()
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "live rates temporarily unavailable"})
		return
	}
	c.JSON(http.StatusOK, rates)
}
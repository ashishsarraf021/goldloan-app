package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/goldloan/backend/internal/services"
)

type ReminderHandler struct {
	scheduler *services.ReminderScheduler
}

func NewReminderHandler(scheduler *services.ReminderScheduler) *ReminderHandler {
	return &ReminderHandler{scheduler: scheduler}
}

func (h *ReminderHandler) TriggerAll(c *gin.Context) {
	if err := h.scheduler.ProcessDueReminders(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "reminder job completed"})
}

func HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "goldloan-api"})
}

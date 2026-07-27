package router

import (
	"github.com/gin-gonic/gin"
	"github.com/goldloan/backend/internal/config"
	"github.com/goldloan/backend/internal/handlers"
	"github.com/goldloan/backend/internal/middleware"
	"github.com/goldloan/backend/internal/services"
	"gorm.io/gorm"
)

func Setup(db *gorm.DB, cfg *config.Config) *gin.Engine {
	gin.SetMode(cfg.GinMode)
	r := gin.Default()

	r.Use(corsMiddleware())

	whatsapp := services.NewWhatsAppService(cfg)
	scheduler := services.NewReminderScheduler(db, whatsapp)

	authHandler := handlers.NewAuthHandler(db, cfg)
	customerHandler := handlers.NewCustomerHandler(db)
	loanHandler := handlers.NewLoanHandler(db, cfg, whatsapp)
	dashboardHandler := handlers.NewDashboardHandler(db)
	reminderHandler := handlers.NewReminderHandler(scheduler)
	categoryHandler := handlers.NewCategoryHandler(db)
	orderHandler := handlers.NewOrderHandler(db)

	r.GET("/health", handlers.HealthCheck)

	api := r.Group("/api/v1")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
		}

		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware(cfg.JWTSecret))
		{
			protected.GET("/profile", authHandler.Profile)
			protected.PUT("/profile", authHandler.UpdateProfile)
			protected.GET("/dashboard", dashboardHandler.Summary)
			protected.GET("/rates/live", handlers.GetLiveRates)

			protected.GET("/customers", customerHandler.List)
			protected.POST("/customers", customerHandler.Create)
			protected.GET("/customers/:id", customerHandler.Get)
			protected.PUT("/customers/:id", customerHandler.Update)
			protected.DELETE("/customers/:id", customerHandler.Delete)

			protected.GET("/loans", loanHandler.List)
			protected.POST("/loans", loanHandler.Create)
			protected.GET("/loans/:id", loanHandler.Get)
			protected.PUT("/loans/:id", loanHandler.Update)
			protected.GET("/loans/:id/summary", loanHandler.Summary)
			protected.POST("/loans/:id/send-reminder", loanHandler.SendReminder)
			protected.GET("/loans/:id/reminders", loanHandler.ReminderLogs)

			protected.POST("/reminders/run", reminderHandler.TriggerAll)

			protected.GET("/categories", categoryHandler.List)
			protected.POST("/categories", categoryHandler.Create)
			protected.DELETE("/categories/:id", categoryHandler.Delete)

			protected.GET("/orders", orderHandler.List)
			protected.GET("/orders/:id", orderHandler.Get)
			protected.POST("/orders", orderHandler.Create)
			protected.POST("/orders/:id/payments", orderHandler.AddPayment)
			protected.POST("/orders/:id/settle", orderHandler.Settle)
		}
	}

	return r
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}

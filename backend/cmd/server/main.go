package main

import (
	"log"

	"github.com/goldloan/backend/internal/config"
	"github.com/goldloan/backend/internal/database"
	"github.com/goldloan/backend/internal/router"
	"github.com/goldloan/backend/internal/services"
	"github.com/robfig/cron/v3"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config: %v", err)
	}

	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("database: %v", err)
	}

	whatsapp := services.NewWhatsAppService(cfg)
	scheduler := services.NewReminderScheduler(db, whatsapp)

	c := cron.New()
	if _, err := c.AddFunc(cfg.ReminderCron, func() {
		log.Println("Running 6-month WhatsApp reminder job...")
		if err := scheduler.ProcessDueReminders(); err != nil {
			log.Printf("reminder job error: %v", err)
		}
	}); err != nil {
		log.Printf("cron setup warning: %v", err)
	}
	c.Start()
	defer c.Stop()

	r := router.Setup(db, cfg)
	addr := ":" + cfg.Port
	log.Printf("Gold Loan API running on http://localhost%s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("server: %v", err)
	}
}

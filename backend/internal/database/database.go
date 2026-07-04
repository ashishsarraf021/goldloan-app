package database

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/goldloan/backend/internal/config"
	"github.com/goldloan/backend/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Connect(cfg *config.Config) (*gorm.DB, error) {
	var dialector gorm.Dialector

	switch cfg.DBDriver {
	case "postgres":
		dialector = postgres.Open(cfg.DatabaseURL)
	case "sqlite":
		if err := os.MkdirAll(filepath.Dir(cfg.DatabaseURL), 0755); err != nil {
			return nil, fmt.Errorf("create data dir: %w", err)
		}
		dialector = sqlite.Open(cfg.DatabaseURL)
	default:
		return nil, fmt.Errorf("unsupported DB_DRIVER: %s", cfg.DBDriver)
	}

	db, err := gorm.Open(dialector, &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, fmt.Errorf("connect database: %w", err)
	}

	if err := db.AutoMigrate(
		&models.Shopkeeper{},
		&models.Customer{},
		&models.Loan{},
		&models.JewelryItem{},
		&models.ReminderLog{},
	); err != nil {
		return nil, fmt.Errorf("migrate: %w", err)
	}

	return db, nil
}

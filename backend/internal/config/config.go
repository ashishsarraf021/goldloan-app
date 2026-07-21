package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                  string
	GinMode               string
	DBDriver              string
	DatabaseURL           string
	JWTSecret             string
	JWTExpiryHours        int
	WhatsAppEnabled       bool
	WhatsAppAPIURL        string
	WhatsAppPhoneNumberID string
	WhatsAppAccessToken   string
	ReminderCron          string
	DefaultGoldRate         float64
	DefaultSilverRate       float64
	GoldAPIKey 				string
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	cfg := &Config{
		Port:                  getEnv("PORT", "8080"),
		GinMode:               getEnv("GIN_MODE", "debug"),
		DBDriver:              getEnv("DB_DRIVER", "sqlite"),
		DatabaseURL:           getEnv("DATABASE_URL", "./data/goldloan.db"),
		JWTSecret:             getEnv("JWT_SECRET", "dev-secret-change-in-production"),
		JWTExpiryHours:        getEnvInt("JWT_EXPIRY_HOURS", 72),
		WhatsAppEnabled:       getEnvBool("WHATSAPP_ENABLED", false),
		WhatsAppAPIURL:        getEnv("WHATSAPP_API_URL", "https://graph.facebook.com/v18.0"),
		WhatsAppPhoneNumberID: getEnv("WHATSAPP_PHONE_NUMBER_ID", ""),
		WhatsAppAccessToken:   getEnv("WHATSAPP_ACCESS_TOKEN", ""),
		ReminderCron:          getEnv("REMINDER_CRON", "0 9 * * *"),
		DefaultGoldRate:       getEnvFloat("DEFAULT_GOLD_RATE_PER_GRAM", 6500),
		DefaultSilverRate:     getEnvFloat("DEFAULT_SILVER_RATE_PER_GRAM", 85),
		GoldAPIKey: 		   getEnv("GOLDAPI_KEY",""),
	}
	return cfg, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		if i, err := strconv.Atoi(v); err == nil {
			return i
		}
	}
	return fallback
}

func getEnvFloat(key string, fallback float64) float64 {
	if v := os.Getenv(key); v != "" {
		if f, err := strconv.ParseFloat(v, 64); err == nil {
			return f
		}
	}
	return fallback
}

func getEnvBool(key string, fallback bool) bool {
	if v := os.Getenv(key); v != "" {
		if b, err := strconv.ParseBool(v); err == nil {
			return b
		}
	}
	return fallback
}

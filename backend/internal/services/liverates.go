package services

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"
)

type LiveRates struct {
	GoldPerGram   float64   `json:"gold_rate_per_gram"`
	SilverPerGram float64   `json:"silver_rate_per_gram"`
	UpdatedAt     time.Time `json:"updated_at"`
	Source        string    `json:"source"`
}

var (
	cacheMu    sync.Mutex
	cached     *LiveRates
	cacheTTL   = 6 * time.Hour
	apiKey     string
)

func InitLiveRates(key string) {
	apiKey = key
}

type goldAPIResponse struct {
	PriceGram24k float64 `json:"price_gram_24k"`
	Price        float64 `json:"price"` // per troy ounce
}

const troyOunceInGrams = 31.1034768

func fetchMetal(metal string) (*goldAPIResponse, error) {
	req, err := http.NewRequest("GET", fmt.Sprintf("https://www.goldapi.io/api/%s/INR", metal), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("x-access-token", apiKey)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("goldapi returned status %d", resp.StatusCode)
	}

	var data goldAPIResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}
	return &data, nil
}

func GetLiveRates() (*LiveRates, error) {
	cacheMu.Lock()
	defer cacheMu.Unlock()

	if cached != nil && time.Since(cached.UpdatedAt) < cacheTTL {
		return cached, nil
	}

	gold, err := fetchMetal("XAU")
	if err != nil {
		return nil, fmt.Errorf("fetch gold rate: %w", err)
	}
	silver, err := fetchMetal("XAG")
	if err != nil {
		return nil, fmt.Errorf("fetch silver rate: %w", err)
	}

	silverPerGram := silver.Price / troyOunceInGrams

	cached = &LiveRates{
		GoldPerGram:   gold.PriceGram24k,
		SilverPerGram: silverPerGram,
		UpdatedAt:     time.Now(),
		Source:        "goldapi.io",
	}
	return cached, nil
}
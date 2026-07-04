package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/goldloan/backend/internal/config"
	"github.com/goldloan/backend/internal/models"
)

type WhatsAppService struct {
	cfg    *config.Config
	client *http.Client
}

func NewWhatsAppService(cfg *config.Config) *WhatsAppService {
	return &WhatsAppService{
		cfg:    cfg,
		client: &http.Client{Timeout: 30 * time.Second},
	}
}

type whatsAppPayload struct {
	MessagingProduct string `json:"messaging_product"`
	To               string `json:"to"`
	Type             string `json:"type"`
	Text             struct {
		Body string `json:"body"`
	} `json:"text"`
}

func (w *WhatsAppService) SendLoanUpdate(customer *models.Customer, summary LoanSummary, shopName string) error {
	message := FormatReminderMessage(customer, summary, shopName)

	if !w.cfg.WhatsAppEnabled {
		fmt.Printf("[WhatsApp DEV] To: %s\n%s\n", customer.WhatsAppOrPhone(), message)
		return nil
	}

	phone := normalizePhone(customer.WhatsAppOrPhone())
	url := fmt.Sprintf("%s/%s/messages", w.cfg.WhatsAppAPIURL, w.cfg.WhatsAppPhoneNumberID)

	payload := whatsAppPayload{
		MessagingProduct: "whatsapp",
		To:               phone,
		Type:             "text",
	}
	payload.Text.Body = message

	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+w.cfg.WhatsAppAccessToken)

	resp, err := w.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("whatsapp API error %d: %s", resp.StatusCode, string(respBody))
	}
	return nil
}

func FormatReminderMessage(customer *models.Customer, summary LoanSummary, shopName string) string {
	var b strings.Builder
	b.WriteString(fmt.Sprintf("Dear %s,\n\n", customer.Name))
	b.WriteString(fmt.Sprintf("This is your 6-month update from *%s* regarding your gold/silver loan.\n\n", shopName))
	b.WriteString(fmt.Sprintf("Loan No: %s\n", summary.LoanNumber))
	b.WriteString(fmt.Sprintf("Principal Amount: ₹%.2f\n", summary.PrincipalAmount))
	b.WriteString(fmt.Sprintf("Interest Rate: %.2f%% (%s)\n", summary.InterestRate, summary.InterestType))
	b.WriteString(fmt.Sprintf("Loan Date: %s\n", summary.LoanDate.Format("02 Jan 2006")))
	b.WriteString(fmt.Sprintf("Months Elapsed: %.1f\n\n", summary.MonthsElapsed))
	b.WriteString(fmt.Sprintf("*Accrued Interest: ₹%.2f*\n", summary.AccruedInterest))
	b.WriteString(fmt.Sprintf("*Total Payable: ₹%.2f*\n\n", summary.TotalPayable))
	b.WriteString(fmt.Sprintf("*Current Jewelry Value: ₹%.2f*\n\n", summary.JewelryCurrentValue))

	if len(summary.JewelryItems) > 0 {
		b.WriteString("Jewelry Details:\n")
		for i, j := range summary.JewelryItems {
			b.WriteString(fmt.Sprintf("%d. %s (%s, %.2fg) - ₹%.2f\n",
				i+1, j.Description, j.MetalType, j.WeightGrams, j.Value))
		}
		b.WriteString("\n")
	}

	b.WriteString("Please visit the shop for repayment or renewal.\n")
	b.WriteString(fmt.Sprintf("— %s", shopName))
	return b.String()
}

func normalizePhone(phone string) string {
	p := strings.TrimSpace(phone)
	p = strings.ReplaceAll(p, " ", "")
	p = strings.ReplaceAll(p, "-", "")
	if strings.HasPrefix(p, "+") {
		p = p[1:]
	}
	if len(p) == 10 {
		p = "91" + p
	}
	return p
}

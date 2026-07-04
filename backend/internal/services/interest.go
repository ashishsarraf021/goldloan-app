package services

import (
	"math"
	"time"

	"github.com/goldloan/backend/internal/models"
)

type LoanSummary struct {
	LoanID              uint      `json:"loan_id"`
	LoanNumber          string    `json:"loan_number"`
	PrincipalAmount     float64   `json:"principal_amount"`
	InterestRate        float64   `json:"interest_rate"`
	InterestType        string    `json:"interest_type"`
	LoanDate            time.Time `json:"loan_date"`
	MonthsElapsed       float64   `json:"months_elapsed"`
	AccruedInterest     float64   `json:"accrued_interest"`
	TotalPayable        float64   `json:"total_payable"`
	JewelryCurrentValue float64   `json:"jewelry_current_value"`
	JewelryItems        []JewelryValuation `json:"jewelry_items"`
}

type JewelryValuation struct {
	ID          uint    `json:"id"`
	Description string  `json:"description"`
	MetalType   string  `json:"metal_type"`
	WeightGrams float64 `json:"weight_grams"`
	Purity      string  `json:"purity"`
	RatePerGram float64 `json:"rate_per_gram"`
	Value       float64 `json:"value"`
}

// CalculateAccruedInterest computes interest based on loan terms.
// Monthly: principal * (rate/100/12) * months
// Yearly: principal * (rate/100) * (months/12)
func CalculateAccruedInterest(loan *models.Loan, asOf time.Time) float64 {
	if loan.Status != models.LoanStatusActive {
		return 0
	}

	months := monthsBetween(loan.LoanDate, asOf)
	if months <= 0 {
		return 0
	}

	rate := loan.InterestRate / 100.0
	principal := loan.PrincipalAmount

	switch loan.InterestType {
	case "yearly":
		return round2(principal * rate * (months / 12.0))
	default: // monthly
		return round2(principal * (rate / 12.0) * months)
	}
}

func monthsBetween(from, to time.Time) float64 {
	if to.Before(from) {
		return 0
	}
	days := to.Sub(from).Hours() / 24.0
	return days / 30.0 // approximate month for shopkeeper use
}

func round2(v float64) float64 {
	return math.Round(v*100) / 100
}

func CalculateJewelryValue(items []models.JewelryItem, goldRate, silverRate float64) (float64, []JewelryValuation) {
	var total float64
	valuations := make([]JewelryValuation, 0, len(items))

	for _, item := range items {
		rate := goldRate
		if item.MetalType == models.MetalSilver {
			rate = silverRate
		}
		purityFactor := purityMultiplier(item.Purity, item.MetalType)
		value := round2(item.WeightGrams * float64(item.Quantity) * rate * purityFactor)
		total += value
		valuations = append(valuations, JewelryValuation{
			ID:          item.ID,
			Description: item.Description,
			MetalType:   string(item.MetalType),
			WeightGrams: item.WeightGrams,
			Purity:      item.Purity,
			RatePerGram: rate,
			Value:       value,
		})
	}
	return round2(total), valuations
}

func purityMultiplier(purity string, metal models.MetalType) float64 {
	if metal == models.MetalSilver {
		switch purity {
		case "999", "fine":
			return 1.0
		case "925", "92.5":
			return 0.925
		default:
			return 0.925
		}
	}
	// Gold karat
	switch purity {
	case "24K", "24":
		return 1.0
	case "22K", "22":
		return 0.916
	case "18K", "18":
		return 0.75
	case "14K", "14":
		return 0.585
	default:
		return 0.916 // default 22K
	}
}

func BuildLoanSummary(loan *models.Loan, goldRate, silverRate float64, asOf time.Time) LoanSummary {
	interest := CalculateAccruedInterest(loan, asOf)
	jewelryValue, valuations := CalculateJewelryValue(loan.JewelryItems, goldRate, silverRate)

	return LoanSummary{
		LoanID:              loan.ID,
		LoanNumber:          loan.LoanNumber,
		PrincipalAmount:     loan.PrincipalAmount,
		InterestRate:        loan.InterestRate,
		InterestType:        loan.InterestType,
		LoanDate:            loan.LoanDate,
		MonthsElapsed:       round2(monthsBetween(loan.LoanDate, asOf)),
		AccruedInterest:     interest,
		TotalPayable:        round2(loan.PrincipalAmount + interest),
		JewelryCurrentValue: jewelryValue,
		JewelryItems:        valuations,
	}
}

func ShouldSendSixMonthReminder(loan *models.Loan, now time.Time) bool {
	if loan.Status != models.LoanStatusActive {
		return false
	}
	months := monthsBetween(loan.LoanDate, now)
	if months < 6 {
		return false
	}
	if loan.LastReminderSent == nil {
		// First reminder at 6 months
		return months >= 6
	}
	// Subsequent reminders every 6 months from last sent
	monthsSinceLast := monthsBetween(*loan.LastReminderSent, now)
	return monthsSinceLast >= 6
}

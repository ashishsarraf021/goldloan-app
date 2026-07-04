package models

func (c *Customer) WhatsAppOrPhone() string {
	if c.WhatsApp != "" {
		return c.WhatsApp
	}
	return c.Phone
}

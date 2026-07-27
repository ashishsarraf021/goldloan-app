package models

import "gorm.io/gorm"

type Category struct {
	gorm.Model
	ShopkeeperID uint   `json:"shopkeeper_id"`
	Name         string `json:"name" gorm:"not null"`
}

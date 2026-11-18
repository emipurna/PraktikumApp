package models

import "time"

type Participant struct {
	ID            string    `gorm:"primaryKey;type:varchar(50)" json:"id"`
	BoardID       string    `gorm:"index;type:varchar(20);not null" json:"boardId"` // lb1, lb2
	ParticipantID string    `gorm:"type:varchar(50);not null" json:"participantId"`
	Team          string    `gorm:"type:varchar(255);not null" json:"team"`
	TimeMs        int64     `gorm:"not null;default:0" json:"timeMs"`
	TimeStr       string    `gorm:"type:varchar(20);not null" json:"timeStr"`
	CustomStatus  string    `gorm:"type:varchar(30);not null;default:'Otomatis'" json:"customStatus"` // Otomatis, Pemenang, Lolos, Gugur
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

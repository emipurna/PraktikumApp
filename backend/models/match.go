package models

import "time"

type Match struct {
	ID        string    `gorm:"primaryKey;type:varchar(50)" json:"id"`
	BoardID   string    `gorm:"uniqueIndex;type:varchar(20);not null" json:"boardId"` // lb1, lb2
	EventName string    `gorm:"type:varchar(255);not null" json:"eventName"`
	EventDate string    `gorm:"type:varchar(20);not null" json:"eventDate"`
	Status    string    `gorm:"type:varchar(30);not null;default:'belum_mulai'" json:"status"` // belum_mulai, berlangsung, jeda, selesai
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

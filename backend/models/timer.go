package models

import "time"

type LaneTimer struct {
	ID                string    `gorm:"primaryKey;type:varchar(30)" json:"id"`
	BoardID           string    `gorm:"index;type:varchar(20);not null" json:"boardId"`
	Lane              string    `gorm:"type:varchar(10);not null" json:"lane"`
	IsRunning         bool      `gorm:"not null;default:false" json:"isRunning"`
	ElapsedMs         int64     `gorm:"not null;default:0" json:"elapsedMs"`
	StartedAtMs       int64     `gorm:"not null;default:0" json:"startedAtMs"`
	Mode              string    `gorm:"type:varchar(20);not null;default:'pertandingan'" json:"mode"`
	ParticipantID     string    `gorm:"type:varchar(50)" json:"participantId"`
	TeamName          string    `gorm:"type:varchar(255)" json:"teamName"`
	CompletedMissions int       `gorm:"not null;default:1" json:"completedMissions"`
	UpdatedAt         time.Time `json:"updatedAt"`
}

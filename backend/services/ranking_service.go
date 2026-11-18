package services

import (
	"fmt"
	"sort"

	"leaderboard-backend/models"
)

type RankedParticipant struct {
	ID            string `json:"id"`
	BoardID       string `json:"boardId"`
	ParticipantID string `json:"participantId"`
	Team          string `json:"team"`
	TimeMs        int64  `json:"timeMs"`
	TimeStr       string `json:"timeStr"`
	CustomStatus  string `json:"customStatus"`
	Rank          int    `json:"rank"`
	Status        string `json:"status"`
}

// FormatTimeMs memformat milidetik ke MM:SS:mmm
func FormatTimeMs(ms int64) string {
	if ms <= 0 {
		return "00:00:000"
	}
	minutes := ms / 60000
	seconds := (ms % 60000) / 1000
	millis := ms % 1000
	return fmt.Sprintf("%02d:%02d:%03d", minutes, seconds, millis)
}

// CalculateLeaderboard mengurutkan peserta berdasarkan waktu tercepat (timeMs ascending)
func CalculateLeaderboard(participants []models.Participant) []RankedParticipant {
	sorted := make([]models.Participant, len(participants))
	copy(sorted, participants)

	sort.SliceStable(sorted, func(i, j int) bool {
		timeA := sorted[i].TimeMs
		timeB := sorted[j].TimeMs
		if timeA <= 0 {
			timeA = 1<<62 - 1
		}
		if timeB <= 0 {
			timeB = 1<<62 - 1
		}
		return timeA < timeB
	})

	result := make([]RankedParticipant, 0, len(sorted))
	for idx, p := range sorted {
		rank := idx + 1
		status := p.CustomStatus
		if status == "" || status == "Otomatis" {
			if rank == 1 {
				status = "Pemenang"
			} else {
				status = "Lolos"
			}
		}

		timeStr := p.TimeStr
		if timeStr == "" {
			timeStr = FormatTimeMs(p.TimeMs)
		}

		result = append(result, RankedParticipant{
			ID:            p.ID,
			BoardID:       p.BoardID,
			ParticipantID: p.ParticipantID,
			Team:          p.Team,
			TimeMs:        p.TimeMs,
			TimeStr:       timeStr,
			CustomStatus:  p.CustomStatus,
			Rank:          rank,
			Status:        status,
		})
	}

	return result
}

package controllers

import (
	"net/http"
	"time"

	"leaderboard-backend/config"
	"leaderboard-backend/models"

	"github.com/gin-gonic/gin"
)

type UpdateTimerRequest struct {
	Action            string `json:"action"` // start, pause, reset, clear_after_save, update_meta
	Mode              string `json:"mode"`
	ParticipantID     string `json:"participantId"`
	TeamName          string `json:"teamName"`
	CompletedMissions int    `json:"completedMissions"`
}

func getOrCreateLaneTimer(boardID, lane string) models.LaneTimer {
	id := boardID + "_" + lane
	var timer models.LaneTimer
	if err := config.DB.Where("id = ?", id).First(&timer).Error; err != nil {
		timer = models.LaneTimer{
			ID:                id,
			BoardID:           boardID,
			Lane:              lane,
			IsRunning:         false,
			ElapsedMs:         0,
			StartedAtMs:       0,
			Mode:              "pertandingan",
			CompletedMissions: 1,
		}
		config.DB.Create(&timer)
	}
	return timer
}

// EnsureBoardTimers mengambil state timer Lajur A & B untuk sebuah board
func EnsureBoardTimers(boardID string) map[string]models.LaneTimer {
	return map[string]models.LaneTimer{
		"A": getOrCreateLaneTimer(boardID, "A"),
		"B": getOrCreateLaneTimer(boardID, "B"),
	}
}

// PauseBoardTimers menghentikan semua timer yang sedang berjalan pada board tertentu
func PauseBoardTimers(boardID string) {
	nowMs := time.Now().UnixMilli()
	for _, lane := range []string{"A", "B"} {
		timer := getOrCreateLaneTimer(boardID, lane)
		if timer.IsRunning {
			diff := nowMs - timer.StartedAtMs
			if diff > 0 {
				timer.ElapsedMs += diff
			}
			timer.IsRunning = false
			timer.StartedAtMs = 0
			config.DB.Save(&timer)
		}
	}
}

func UpdateLaneTimer(c *gin.Context) {
	boardID := c.Param("boardId")
	lane := c.Param("lane")
	if lane != "A" && lane != "B" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Lajur harus A atau B"})
		return
	}

	var req UpdateTimerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payload tidak valid"})
		return
	}

	if isBoardFrozen(boardID) && req.Action != "update_meta" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Pertandingan telah Selesai. Timer terkunci!"})
		return
	}

	timer := getOrCreateLaneTimer(boardID, lane)
	nowMs := time.Now().UnixMilli()

	switch req.Action {
	case "start":
		if !timer.IsRunning {
			timer.IsRunning = true
			timer.StartedAtMs = nowMs
		}
	case "pause":
		if timer.IsRunning {
			diff := nowMs - timer.StartedAtMs
			if diff > 0 {
				timer.ElapsedMs += diff
			}
			timer.IsRunning = false
			timer.StartedAtMs = 0
		}
	case "reset":
		timer.IsRunning = false
		timer.ElapsedMs = 0
		timer.StartedAtMs = 0
	case "clear_after_save":
		timer.IsRunning = false
		timer.ElapsedMs = 0
		timer.StartedAtMs = 0
		timer.ParticipantID = ""
		timer.TeamName = ""
		timer.CompletedMissions = 1
	case "update_meta":
		if req.Mode == "pertandingan" || req.Mode == "persiapan" {
			timer.Mode = req.Mode
		}
		timer.ParticipantID = req.ParticipantID
		timer.TeamName = req.TeamName
		if req.CompletedMissions >= 0 && req.CompletedMissions <= 5 {
			timer.CompletedMissions = req.CompletedMissions
		}
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Action timer tidak dikenali"})
		return
	}

	if err := config.DB.Save(&timer).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui status timer"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"timer":        timer,
		"serverTimeMs": time.Now().UnixMilli(),
	})
}

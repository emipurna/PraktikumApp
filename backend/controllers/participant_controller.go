package controllers

import (
	"fmt"
	"net/http"
	"time"

	"leaderboard-backend/config"
	"leaderboard-backend/models"
	"leaderboard-backend/services"

	"github.com/gin-gonic/gin"
)

type CreateParticipantRequest struct {
	BoardID           string `json:"boardId" binding:"required"`
	ParticipantID     string `json:"participantId"`
	Team              string `json:"team" binding:"required"`
	CompletedMissions int    `json:"completedMissions"`
	TimeMs            int64  `json:"timeMs" binding:"required"`
	TimeStr           string `json:"timeStr"`
	CustomStatus      string `json:"customStatus"`
}

type UpdateParticipantRequest struct {
	ParticipantID     string `json:"participantId"`
	Team              string `json:"team" binding:"required"`
	CompletedMissions int    `json:"completedMissions"`
	TimeMs            int64  `json:"timeMs" binding:"required"`
	TimeStr           string `json:"timeStr"`
	CustomStatus      string `json:"customStatus"`
}

func isBoardFrozen(boardID string) bool {
	var match models.Match
	if err := config.DB.Where("board_id = ?", boardID).First(&match).Error; err != nil {
		return false
	}
	return match.Status == "selesai"
}

func GetLeaderboard(c *gin.Context) {
	boardID := c.Param("boardId")
	var participants []models.Participant

	if err := config.DB.Where("board_id = ?", boardID).Find(&participants).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data peserta"})
		return
	}

	ranked := services.CalculateLeaderboard(participants)

	var match models.Match
	config.DB.Where("board_id = ?", boardID).First(&match)

	c.JSON(http.StatusOK, gin.H{
		"boardId":      boardID,
		"matchStatus":  match.Status,
		"eventName":    match.EventName,
		"eventDate":    match.EventDate,
		"participants": ranked,
		"timers":       EnsureBoardTimers(boardID),
		"serverTimeMs": time.Now().UnixMilli(),
	})
}

func CreateParticipant(c *gin.Context) {
	var req CreateParticipantRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data peserta tidak lengkap"})
		return
	}

	if isBoardFrozen(req.BoardID) {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Pertandingan telah Selesai. Penambahan data dinonaktifkan (Freeze Data)!",
		})
		return
	}

	timeStr := req.TimeStr
	if timeStr == "" {
		timeStr = services.FormatTimeMs(req.TimeMs)
	}

	customStatus := req.CustomStatus
	if customStatus == "" {
		customStatus = "Otomatis"
	}

	participantID := req.ParticipantID
	if participantID == "" {
		var count int64
		config.DB.Model(&models.Participant{}).Where("board_id = ?", req.BoardID).Count(&count)
		participantID = fmt.Sprintf("TIM-%03d", count+1)
	}

	missions := req.CompletedMissions
	if missions < 0 || missions > 5 {
		missions = 0
	}

	participant := models.Participant{
		ID:                fmt.Sprintf("p-%d", time.Now().UnixNano()),
		BoardID:           req.BoardID,
		ParticipantID:     participantID,
		Team:              req.Team,
		CompletedMissions: missions,
		TimeMs:            req.TimeMs,
		TimeStr:           timeStr,
		CustomStatus:      customStatus,
	}

	if err := config.DB.Create(&participant).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan data peserta"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":     "Data peserta berhasil disimpan",
		"participant": participant,
	})
}

func UpdateParticipant(c *gin.Context) {
	id := c.Param("id")
	var participant models.Participant

	if err := config.DB.Where("id = ?", id).First(&participant).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Peserta tidak ditemukan"})
		return
	}

	if isBoardFrozen(participant.BoardID) {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Pertandingan telah Selesai. Perubahan data dinonaktifkan (Freeze Data)!",
		})
		return
	}

	var req UpdateParticipantRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data pembaruan tidak valid"})
		return
	}

	if req.ParticipantID != "" {
		participant.ParticipantID = req.ParticipantID
	}
	participant.Team = req.Team
	if req.CompletedMissions >= 0 && req.CompletedMissions <= 5 {
		participant.CompletedMissions = req.CompletedMissions
	}
	participant.TimeMs = req.TimeMs
	if req.TimeStr != "" {
		participant.TimeStr = req.TimeStr
	} else {
		participant.TimeStr = services.FormatTimeMs(req.TimeMs)
	}
	if req.CustomStatus != "" {
		participant.CustomStatus = req.CustomStatus
	}

	if err := config.DB.Save(&participant).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui data peserta"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":     "Data peserta berhasil diperbarui",
		"participant": participant,
	})
}

func DeleteParticipant(c *gin.Context) {
	id := c.Param("id")
	var participant models.Participant

	if err := config.DB.Where("id = ?", id).First(&participant).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Peserta tidak ditemukan"})
		return
	}

	if isBoardFrozen(participant.BoardID) {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Pertandingan telah Selesai. Penghapusan data dinonaktifkan (Freeze Data)!",
		})
		return
	}

	if err := config.DB.Delete(&participant).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus data peserta"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Data peserta berhasil dihapus",
	})
}

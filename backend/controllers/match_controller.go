package controllers

import (
	"net/http"
	"time"

	"leaderboard-backend/config"
	"leaderboard-backend/models"

	"github.com/gin-gonic/gin"
)

type UpdateMatchStatusRequest struct {
	Status string `json:"status" binding:"required"`
}

type UpdateMatchConfigRequest struct {
	EventName string `json:"eventName" binding:"required"`
	EventDate string `json:"eventDate" binding:"required"`
}

func GetMatchByBoard(c *gin.Context) {
	boardID := c.Param("boardId")
	var match models.Match

	if err := config.DB.Where("board_id = ?", boardID).First(&match).Error; err != nil {
		// Buat default jika belum ada
		match = models.Match{
			ID:        "match-" + boardID,
			BoardID:   boardID,
			EventName: "Kompetisi_UAS_Robotika",
			EventDate: time.Now().Format("2006-01-02"),
			Status:    "belum_mulai",
		}
		config.DB.Create(&match)
	}

	c.JSON(http.StatusOK, match)
}

func UpdateMatchStatus(c *gin.Context) {
	boardID := c.Param("boardId")
	var req UpdateMatchStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Status wajib diisi"})
		return
	}

	validStatuses := map[string]bool{
		"belum_mulai": true,
		"berlangsung": true,
		"jeda":        true,
		"selesai":     true,
	}
	if !validStatuses[req.Status] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Status pertandingan tidak valid"})
		return
	}

	var match models.Match
	if err := config.DB.Where("board_id = ?", boardID).First(&match).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pertandingan tidak ditemukan"})
		return
	}

	match.Status = req.Status
	if err := config.DB.Save(&match).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui status pertandingan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Status pertandingan berhasil diperbarui",
		"match":   match,
	})
}

func UpdateMatchConfig(c *gin.Context) {
	boardID := c.Param("boardId")
	var req UpdateMatchConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nama event dan tanggal wajib diisi"})
		return
	}

	var match models.Match
	if err := config.DB.Where("board_id = ?", boardID).First(&match).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pertandingan tidak ditemukan"})
		return
	}

	match.EventName = req.EventName
	match.EventDate = req.EventDate
	if err := config.DB.Save(&match).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui konfigurasi event"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Konfigurasi event berhasil diperbarui",
		"match":   match,
	})
}

package controllers

import (
	"fmt"
	"net/http"

	"leaderboard-backend/config"
	"leaderboard-backend/models"
	"leaderboard-backend/services"

	"github.com/gin-gonic/gin"
)

func ExportLeaderboardExcel(c *gin.Context) {
	boardID := c.DefaultQuery("board", "lb1")
	eventParam := c.Query("event")
	dateParam := c.Query("date")

	var match models.Match
	config.DB.Where("board_id = ?", boardID).First(&match)

	if eventParam == "" {
		if match.EventName != "" {
			boardLabel := "Leaderboard_1"
			if boardID == "lb2" {
				boardLabel = "Leaderboard_2"
			}
			eventParam = fmt.Sprintf("%s_%s", match.EventName, boardLabel)
		} else {
			eventParam = "Kompetisi_UAS"
		}
	}
	if dateParam == "" {
		dateParam = match.EventDate
	}

	var participants []models.Participant
	if err := config.DB.Where("board_id = ?", boardID).Find(&participants).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data peserta"})
		return
	}

	ranked := services.CalculateLeaderboard(participants)

	sheetTitle := "Leaderboard 1"
	if boardID == "lb2" {
		sheetTitle = "Leaderboard 2"
	}

	excelFile, err := services.GenerateLeaderboardExcel(sheetTitle, ranked)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat file Excel"})
		return
	}
	defer excelFile.Close()

	buffer, err := excelFile.WriteToBuffer()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengekspor buffer Excel"})
		return
	}

	fileName := services.BuildExcelFilename(eventParam, dateParam)
	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, fileName))
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer.Bytes())
}

package routes

import (
	"net/http"
	"time"

	"leaderboard-backend/config"
	"leaderboard-backend/controllers"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://127.0.0.1:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Disposition"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	api := r.Group("/api")
	{
		api.GET("/health", func(c *gin.Context) {
			dbStatus := "disconnected"
			if config.DB != nil {
				sqlDB, err := config.DB.DB()
				if err == nil && sqlDB.Ping() == nil {
					dbStatus = "connected"
				}
			}

			c.JSON(http.StatusOK, gin.H{
				"status":    "ok",
				"service":   "leaderboard-backend",
				"database":  dbStatus,
				"timestamp": time.Now().Format(time.RFC3339),
			})
		})

		// Auth Admin
		api.POST("/auth/login", controllers.LoginAdmin)

		// Match Control & Config
		api.GET("/matches/export", controllers.ExportLeaderboardExcel)
		api.GET("/matches/:boardId", controllers.GetMatchByBoard)
		api.PATCH("/matches/:boardId/status", controllers.UpdateMatchStatus)
		api.PUT("/matches/:boardId/config", controllers.UpdateMatchConfig)

		// Leaderboard & Participants
		api.GET("/leaderboard/:boardId", controllers.GetLeaderboard)
		api.POST("/participants", controllers.CreateParticipant)
		api.PUT("/participants/:id", controllers.UpdateParticipant)
		api.DELETE("/participants/:id", controllers.DeleteParticipant)
	}

	return r
}

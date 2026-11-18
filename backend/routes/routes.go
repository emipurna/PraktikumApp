package routes

import (
	"net/http"
	"os"
	"strings"
	"time"

	"leaderboard-backend/config"
	"leaderboard-backend/controllers"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	allowedOrigins := []string{"http://localhost:5173", "http://127.0.0.1:5173"}
	if envOrigins := os.Getenv("FRONTEND_URL"); envOrigins != "" {
		for _, origin := range strings.Split(envOrigins, ",") {
			trimmed := strings.TrimSpace(strings.TrimRight(origin, "/"))
			if trimmed != "" {
				allowedOrigins = append(allowedOrigins, trimmed)
			}
		}
	}

	corsConfig := cors.Config{
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Disposition"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}

	if len(allowedOrigins) == 2 && os.Getenv("GIN_MODE") == "release" {
		// Jika FRONTEND_URL belum diset di production, izinkan semua origin
		corsConfig.AllowAllOrigins = true
		corsConfig.AllowCredentials = false
	} else {
		corsConfig.AllowOrigins = allowedOrigins
	}

	r.Use(cors.New(corsConfig))

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

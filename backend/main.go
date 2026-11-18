package main

import (
	"log"
	"os"

	"leaderboard-backend/config"
	"leaderboard-backend/routes"

	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("File .env tidak ditemukan, menggunakan environment default")
	}

	config.ConnectDatabase()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	r := routes.SetupRouter()

	log.Printf("Server backend berjalan di http://localhost:%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Gagal menjalankan server: %v", err)
	}
}

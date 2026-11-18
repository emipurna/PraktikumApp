package config

import (
	"fmt"
	"log"
	"os"

	"leaderboard-backend/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDatabase() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		host := os.Getenv("DB_HOST")
		port := os.Getenv("DB_PORT")
		user := os.Getenv("DB_USER")
		password := os.Getenv("DB_PASSWORD")
		dbname := os.Getenv("DB_NAME")
		sslmode := os.Getenv("DB_SSLMODE")

		if sslmode == "" {
			sslmode = "disable"
		}

		dsn = fmt.Sprintf(
			"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=Asia/Jakarta",
			host, user, password, dbname, port, sslmode,
		)
	}

	db, err := gorm.Open(postgres.New(postgres.Config{
		DSN:                  dsn,
		PreferSimpleProtocol: true, // Kompatibel penuh dengan Supabase PgBouncer Pooler
	}), &gorm.Config{})
	if err != nil {
		log.Fatalf("Gagal terhubung ke database PostgreSQL: %v", err)
	}

	log.Println("Berhasil terhubung ke database PostgreSQL!")

	if err := db.AutoMigrate(&models.Match{}, &models.Participant{}, &models.LaneTimer{}); err != nil {
		log.Fatalf("Gagal melakukan auto-migrate tabel: %v", err)
	}

	log.Println("Auto-migrate tabel matches & participants berhasil!")
	DB = db
	SeedInitialData()
}

func SeedInitialData() {
	var matchCount int64
	DB.Model(&models.Match{}).Count(&matchCount)
	if matchCount == 0 {
		defaultMatches := []models.Match{
			{
				ID:        "match-lb1",
				BoardID:   "lb1",
				EventName: "Kompetisi_UAS_Robotika",
				EventDate: "2026-11-18",
				Status:    "berlangsung",
			},
			{
				ID:        "match-lb2",
				BoardID:   "lb2",
				EventName: "Kompetisi_UAS_Robotika",
				EventDate: "2026-11-18",
				Status:    "belum_mulai",
			},
		}
		DB.Create(&defaultMatches)
		log.Println("Seed data awal tabel matches berhasil.")
	}

	var participantCount int64
	DB.Model(&models.Participant{}).Count(&participantCount)
	if participantCount == 0 {
		defaultParticipants := []models.Participant{
			{
				ID:                "p-1",
				BoardID:           "lb1",
				ParticipantID:     "TIM-001",
				Team:              "Kelompok Alpha",
				CompletedMissions: 5,
				TimeMs:            65500,
				TimeStr:           "01:05:500",
				CustomStatus:      "Otomatis",
			},
			{
				ID:                "p-2",
				BoardID:           "lb1",
				ParticipantID:     "TIM-002",
				Team:              "Kelompok Beta",
				CompletedMissions: 4,
				TimeMs:            72000,
				TimeStr:           "01:12:000",
				CustomStatus:      "Otomatis",
			},
			{
				ID:                "p-3",
				BoardID:           "lb1",
				ParticipantID:     "TIM-003",
				Team:              "Kelompok Charlie",
				CompletedMissions: 3,
				TimeMs:            78500,
				TimeStr:           "01:18:500",
				CustomStatus:      "Otomatis",
			},
			{
				ID:                "p-201",
				BoardID:           "lb2",
				ParticipantID:     "TIM-101",
				Team:              "Tim RoboNova",
				CompletedMissions: 5,
				TimeMs:            68200,
				TimeStr:           "01:08:200",
				CustomStatus:      "Otomatis",
			},
		}
		DB.Create(&defaultParticipants)
		log.Println("Seed data awal tabel participants berhasil.")
	}
}

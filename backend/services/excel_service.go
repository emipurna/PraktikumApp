package services

import (
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/xuri/excelize/v2"
)

func BuildExcelFilename(eventName, eventDate string) string {
	clean := strings.TrimSpace(eventName)
	if clean == "" {
		clean = "Kompetisi_UAS"
	}
	clean = strings.ReplaceAll(clean, " ", "_")
	re := regexp.MustCompile(`[^a-zA-Z0-9_-]`)
	clean = re.ReplaceAllString(clean, "")

	datePart := strings.TrimSpace(eventDate)
	if datePart == "" {
		datePart = time.Now().Format("2006-01-02")
	}

	return fmt.Sprintf("Hasil_Pertandingan_%s_%s.xlsx", clean, datePart)
}

func GenerateLeaderboardExcel(sheetTitle string, ranked []RankedParticipant) (*excelize.File, error) {
	f := excelize.NewFile()

	sheetName := sheetTitle
	if sheetName == "" {
		sheetName = "Leaderboard"
	}
	if len(sheetName) > 31 {
		sheetName = sheetName[:31]
	}

	defaultSheet := f.GetSheetName(0)
	if defaultSheet != sheetName {
		if err := f.SetSheetName(defaultSheet, sheetName); err != nil {
			return nil, err
		}
	}

	headers := []string{
		"Peringkat",
		"ID Peserta",
		"Nama Peserta/Tim",
		"Jumlah Misi yang Diselesaikan",
		"Waktu (MM:SS:mmm)",
		"Status",
	}

	colLetters := []string{"A", "B", "C", "D", "E", "F"}
	maxLengths := make([]int, len(headers))
	for i, h := range headers {
		maxLengths[i] = len(h)
	}

	// Style Header: Bold + Background Indigo + Teks Putih + Border
	headerStyle, err := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{
			Bold:   true,
			Size:   11,
			Color:  "FFFFFF",
			Family: "Calibri",
		},
		Fill: excelize.Fill{
			Type:    "pattern",
			Pattern: 1,
			Color:   []string{"3730A3"},
		},
		Alignment: &excelize.Alignment{
			Horizontal: "center",
			Vertical:   "center",
		},
		Border: []excelize.Border{
			{Type: "left", Color: "CBD5E1", Style: 1},
			{Type: "top", Color: "CBD5E1", Style: 1},
			{Type: "right", Color: "CBD5E1", Style: 1},
			{Type: "bottom", Color: "1E1B4B", Style: 2},
		},
	})
	if err != nil {
		return nil, err
	}

	// Style Juara 1: Bold + Highlight Kuning Lembut
	rank1CenterStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Size: 11, Family: "Calibri"},
		Fill:      excelize.Fill{Type: "pattern", Pattern: 1, Color: []string{"FEF9C3"}},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
		Border: []excelize.Border{
			{Type: "left", Color: "E2E8F0", Style: 1},
			{Type: "top", Color: "E2E8F0", Style: 1},
			{Type: "right", Color: "E2E8F0", Style: 1},
			{Type: "bottom", Color: "E2E8F0", Style: 1},
		},
	})
	rank1LeftStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Size: 11, Family: "Calibri"},
		Fill:      excelize.Fill{Type: "pattern", Pattern: 1, Color: []string{"FEF9C3"}},
		Alignment: &excelize.Alignment{Horizontal: "left", Vertical: "center"},
		Border: []excelize.Border{
			{Type: "left", Color: "E2E8F0", Style: 1},
			{Type: "top", Color: "E2E8F0", Style: 1},
			{Type: "right", Color: "E2E8F0", Style: 1},
			{Type: "bottom", Color: "E2E8F0", Style: 1},
		},
	})

	// Style Baris Biasa & Zebra
	normalCenterStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Size: 11, Family: "Calibri"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
		Border: []excelize.Border{
			{Type: "left", Color: "E2E8F0", Style: 1},
			{Type: "top", Color: "E2E8F0", Style: 1},
			{Type: "right", Color: "E2E8F0", Style: 1},
			{Type: "bottom", Color: "E2E8F0", Style: 1},
		},
	})
	normalLeftStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Size: 11, Family: "Calibri"},
		Alignment: &excelize.Alignment{Horizontal: "left", Vertical: "center"},
		Border: []excelize.Border{
			{Type: "left", Color: "E2E8F0", Style: 1},
			{Type: "top", Color: "E2E8F0", Style: 1},
			{Type: "right", Color: "E2E8F0", Style: 1},
			{Type: "bottom", Color: "E2E8F0", Style: 1},
		},
	})
	zebraCenterStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Size: 11, Family: "Calibri"},
		Fill:      excelize.Fill{Type: "pattern", Pattern: 1, Color: []string{"F8FAFC"}},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
		Border: []excelize.Border{
			{Type: "left", Color: "E2E8F0", Style: 1},
			{Type: "top", Color: "E2E8F0", Style: 1},
			{Type: "right", Color: "E2E8F0", Style: 1},
			{Type: "bottom", Color: "E2E8F0", Style: 1},
		},
	})
	zebraLeftStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Size: 11, Family: "Calibri"},
		Fill:      excelize.Fill{Type: "pattern", Pattern: 1, Color: []string{"F8FAFC"}},
		Alignment: &excelize.Alignment{Horizontal: "left", Vertical: "center"},
		Border: []excelize.Border{
			{Type: "left", Color: "E2E8F0", Style: 1},
			{Type: "top", Color: "E2E8F0", Style: 1},
			{Type: "right", Color: "E2E8F0", Style: 1},
			{Type: "bottom", Color: "E2E8F0", Style: 1},
		},
	})

	// Tulis Header (Baris 1)
	_ = f.SetRowHeight(sheetName, 1, 26)
	for i, h := range headers {
		cell := fmt.Sprintf("%s1", colLetters[i])
		_ = f.SetCellValue(sheetName, cell, h)
		_ = f.SetCellStyle(sheetName, cell, cell, headerStyle)
	}

	// Tulis Baris Data
	for idx, row := range ranked {
		rowNum := idx + 2
		_ = f.SetRowHeight(sheetName, rowNum, 22)

		pID := row.ParticipantID
		if pID == "" {
			pID = fmt.Sprintf("PESERTA-%03d", row.Rank)
		}

		values := []interface{}{
			row.Rank,
			pID,
			row.Team,
			row.CompletedMissions,
			row.TimeStr,
			row.Status,
		}

		for colIdx, val := range values {
			cell := fmt.Sprintf("%s%d", colLetters[colIdx], rowNum)
			_ = f.SetCellValue(sheetName, cell, val)

			strLen := len(fmt.Sprintf("%v", val))
			if strLen > maxLengths[colIdx] {
				maxLengths[colIdx] = strLen
			}

			var styleID int
			if row.Rank == 1 {
				if colIdx == 2 {
					styleID = rank1LeftStyle
				} else {
					styleID = rank1CenterStyle
				}
			} else if row.Rank%2 == 0 {
				if colIdx == 2 {
					styleID = zebraLeftStyle
				} else {
					styleID = zebraCenterStyle
				}
			} else {
				if colIdx == 2 {
					styleID = normalLeftStyle
				} else {
					styleID = normalCenterStyle
				}
			}
			_ = f.SetCellStyle(sheetName, cell, cell, styleID)
		}
	}

	// Auto-Fit Lebar Kolom Otomatis (PRD 5.3)
	for i, col := range colLetters {
		width := float64(maxLengths[i] + 5)
		if width < 14 {
			width = 14
		}
		_ = f.SetColWidth(sheetName, col, col, width)
	}

	return f, nil
}

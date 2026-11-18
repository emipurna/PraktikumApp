package controllers

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func LoginAdmin(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username dan password wajib diisi"})
		return
	}

	expectedUser := os.Getenv("ADMIN_USERNAME")
	expectedPass := os.Getenv("ADMIN_PASSWORD")

	if expectedUser == "" || expectedPass == "" {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Kredensial admin belum dikonfigurasi di file .env server",
		})
		return
	}

	if req.Username != expectedUser || req.Password != expectedPass {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Username atau password salah"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "Login berhasil",
		"username": req.Username,
		"role":     "admin",
	})
}

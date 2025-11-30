package handlers

import (
	"net/http"
	"time"

	"iot-api/config"

	"github.com/gocql/gocql"
	"github.com/gin-gonic/gin"
)

type Sensor struct {
	SensorID    string    `json:"sensor_id" binding:"required"`
	Type        string    `json:"type"`
	Lat         float64   `json:"lat"`
	Lng         float64   `json:"lng"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}

func CreateSensor(c *gin.Context) {
	var s Sensor
	if err := c.ShouldBindJSON(&s); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	s.CreatedAt = time.Now().UTC()

	if err := config.Session.Query(
		`INSERT INTO smartcity.sensors (sensor_id, type, lat, lng, description, created_at) VALUES (?,?,?,?,?,?)`,
		s.SensorID, s.Type, s.Lat, s.Lng, s.Description, s.CreatedAt,
	).Exec(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to insert sensor", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, s)
}

func GetSensors(c *gin.Context) {
	var sensors []Sensor

	iter := config.Session.Query(`SELECT sensor_id, type, lat, lng, description, created_at FROM smartcity.sensors`).Iter()
	var s Sensor
	for iter.Scan(&s.SensorID, &s.Type, &s.Lat, &s.Lng, &s.Description, &s.CreatedAt) {
		// make a copy before appending because iter.Scan reuses the same variables
		sensors = append(sensors, s)
		s = Sensor{}
	}
	if err := iter.Close(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed reading sensors", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, sensors)
}

func GetSensor(c *gin.Context) {
	sensorID := c.Param("sensor_id")

	var s Sensor
	err := config.Session.Query(`SELECT sensor_id, type, lat, lng, description, created_at FROM smartcity.sensors WHERE sensor_id = ?`, sensorID).Consistency(gocql.One).Scan(&s.SensorID, &s.Type, &s.Lat, &s.Lng, &s.Description, &s.CreatedAt)
	if err != nil {
		if err == gocql.ErrNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "sensor not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed fetching sensor", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, s)
}

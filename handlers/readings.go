package handlers

import (
	"net/http"
	"strconv"
	"time"

	"iot-api/config"

	"github.com/gocql/gocql"
	"github.com/gin-gonic/gin"
)

type Reading struct {
	SensorID  string    `json:"sensor_id"`
	Timestamp time.Time `json:"timestamp"`
	Value     float64   `json:"value" binding:"required"`
	Unit      string    `json:"unit"`
	Status    string    `json:"status"`
}

// ReadingInput is the payload expected from the client when creating a reading.
// It does not include SensorID because that is provided via the URL path parameter.
type ReadingInput struct {
	Timestamp time.Time `json:"timestamp"`
	Value     float64   `json:"value" binding:"required"`
	Unit      string    `json:"unit"`
	Status    string    `json:"status"`
}

func CreateReading(c *gin.Context) {
	sensorID := c.Param("sensor_id")

	var in ReadingInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	r := Reading{
		SensorID:  sensorID,
		Timestamp: in.Timestamp,
		Value:     in.Value,
		Unit:      in.Unit,
		Status:    in.Status,
	}

	if r.Timestamp.IsZero() {
		r.Timestamp = time.Now().UTC()
	}

	if err := config.Session.Query(
		`INSERT INTO smartcity.sensor_readings (sensor_id, timestamp, value, unit, status) VALUES (?,?,?,?,?)`,
		r.SensorID, r.Timestamp, r.Value, r.Unit, r.Status,
	).Exec(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to insert reading", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, r)
}

func GetReadings(c *gin.Context) {
	sensorID := c.Param("sensor_id")

	// optional query params: start, end (RFC3339), limit
	startStr := c.Query("start")
	endStr := c.Query("end")
	limitStr := c.DefaultQuery("limit", "100")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 100
	}

	var rowsIter *gocqlIter

	// Build query depending on presence of start/end
	if startStr != "" || endStr != "" {
		var start time.Time
		var end time.Time
		if startStr != "" {
			start, _ = time.Parse(time.RFC3339, startStr)
		}
		if endStr != "" {
			end, _ = time.Parse(time.RFC3339, endStr)
		}

		// Basic path: both start and end
		if !start.IsZero() && !end.IsZero() {
			rowsIter = newIter(config.Session.Query(`SELECT timestamp, value, unit, status FROM smartcity.sensor_readings WHERE sensor_id = ? AND timestamp >= ? AND timestamp <= ? LIMIT ?`, sensorID, start, end, limit))
		} else if !start.IsZero() {
			rowsIter = newIter(config.Session.Query(`SELECT timestamp, value, unit, status FROM smartcity.sensor_readings WHERE sensor_id = ? AND timestamp >= ? LIMIT ?`, sensorID, start, limit))
		} else if !end.IsZero() {
			rowsIter = newIter(config.Session.Query(`SELECT timestamp, value, unit, status FROM smartcity.sensor_readings WHERE sensor_id = ? AND timestamp <= ? LIMIT ?`, sensorID, end, limit))
		}
	}

	// if no time filters provided
	if rowsIter == nil {
		rowsIter = newIter(config.Session.Query(`SELECT timestamp, value, unit, status FROM smartcity.sensor_readings WHERE sensor_id = ? LIMIT ?`, sensorID, limit))
	}

	var results []Reading
	var ts time.Time
	var val float64
	var unit, status string

	for rowsIter.Scan(&ts, &val, &unit, &status) {
		results = append(results, Reading{
			SensorID:  sensorID,
			Timestamp: ts,
			Value:     val,
			Unit:      unit,
			Status:    status,
		})
	}
	if err := rowsIter.Close(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed reading readings", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, results)
}

func GetAggregates(c *gin.Context) {
	sensorID := c.Param("sensor_id")
	startStr := c.Query("start")
	endStr := c.Query("end")

	var start time.Time
	var end time.Time
	if startStr != "" {
		start, _ = time.Parse(time.RFC3339, startStr)
	}
	if endStr != "" {
		end, _ = time.Parse(time.RFC3339, endStr)
	}

	// Query readings in range and compute aggregates in app
	query := config.Session.Query(`SELECT value FROM smartcity.sensor_readings WHERE sensor_id = ?`, sensorID)
	var iter *gocqlIter
	if !start.IsZero() && !end.IsZero() {
		iter = newIter(config.Session.Query(`SELECT value FROM smartcity.sensor_readings WHERE sensor_id = ? AND timestamp >= ? AND timestamp <= ?`, sensorID, start, end))
	} else if !start.IsZero() {
		iter = newIter(config.Session.Query(`SELECT value FROM smartcity.sensor_readings WHERE sensor_id = ? AND timestamp >= ?`, sensorID, start))
	} else if !end.IsZero() {
		iter = newIter(config.Session.Query(`SELECT value FROM smartcity.sensor_readings WHERE sensor_id = ? AND timestamp <= ?`, sensorID, end))
	} else {
		iter = newIter(query)
	}

	var value float64
	count := 0
	var sum, min, max float64
	first := true
	for iter.Scan(&value) {
		if first {
			min, max = value, value
			first = false
		}
		if value < min {
			min = value
		}
		if value > max {
			max = value
		}
		sum += value
		count++
	}
	if err := iter.Close(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed computing aggregates", "details": err.Error()})
		return
	}

	if count == 0 {
		c.JSON(http.StatusOK, gin.H{"count": 0, "avg": nil, "min": nil, "max": nil})
		return
	}

	avg := sum / float64(count)
	c.JSON(http.StatusOK, gin.H{"count": count, "avg": avg, "min": min, "max": max})
}

// helper wrapper types for gocql iter usage
type gocqlIter = gocql.Iter

func newIter(q *gocql.Query) *gocql.Iter {
	it := q.Iter()
	return it
}

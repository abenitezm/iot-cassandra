package main

import (
	"iot-api/config"
	"iot-api/handlers"

	"github.com/gin-gonic/gin"
)

func main() {
	// Inicialización de Cassandra
	config.InitCassandra()

	r := gin.Default()

	r.GET("", handlers.HealthCheck)

	sensors := r.Group("/sensors")
	{
		// POST /sensors
		sensors.POST("/", handlers.CreateSensor)

		// GET /sensors
		sensors.GET("/", handlers.GetSensors)

		// GET /sensors/:sensor_id
		sensors.GET("/:sensor_id", handlers.GetSensor)
	}

	readings := r.Group("/sensors/:sensor_id/readings")
	{
		// POST /sensors/:sensor_id/readings
		readings.POST("/", handlers.CreateReading)

		// GET /sensors/:sensor_id/readings
		readings.GET("/", handlers.GetReadings)

		// GET /sensors/:sensor_id/readings/aggregates
		readings.GET("/aggregates", handlers.GetAggregates)
	}

	r.Run(":8080")
}

package main

import (
	"iot-api/config"
	"iot-api/handlers"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Inicializar Cassandra
	config.InitCassandra()

	// Crear router Gin
	r := gin.Default()

	// Evitar redirección automática de trailing slash
	r.RedirectTrailingSlash = true

	// Middleware CORS: permite frontend en localhost:5173
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// HealthCheck en la raíz
	r.GET("/", handlers.HealthCheck)

	// Rutas para sensores
	sensors := r.Group("/sensors")
	{
		sensors.POST("", handlers.CreateSensor)              // Crear sensor
		sensors.GET("", handlers.GetSensors)                 // Listar sensores
		sensors.GET("/:sensor_id", handlers.GetSensor)       // Obtener sensor por ID
		sensors.DELETE("/:sensor_id", handlers.DeleteSensor) // Borrar sensor y sus lecturas
	}

	// Rutas para lecturas de sensores
	readings := r.Group("/sensors/:sensor_id/readings")
	{
		readings.POST("", handlers.CreateReading)           // Crear lectura
		readings.GET("", handlers.GetReadings)              // Listar lecturas
		readings.GET("/aggregates", handlers.GetAggregates) // Agregados
	}

	// Manejo de OPTIONS para todas las rutas (preflight CORS)
	r.OPTIONS("/*path", func(c *gin.Context) {
		c.Status(204)
	})

	// Ejecutar servidor en el puerto 8080
	r.Run(":8080")
}

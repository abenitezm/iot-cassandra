package config

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/gocql/gocql"
)

var Session *gocql.Session

func InitCassandra() {
	log.Println("--- Inicializando conexión con Cassandra... ---")
	// Obtención de las variables de entorno
	contactPoints := os.Getenv("CASSANDRA_CONTACT_POINTS")
	localDC := os.Getenv("CASSANDRA_LOCAL_DC")

	// Configuración del cluster
	cluster := gocql.NewCluster(contactPoints)
	cluster.Consistency = gocql.Quorum
	cluster.ProtoVersion = 4
	cluster.ConnectTimeout = time.Second * 10
	cluster.Timeout = time.Second * 10
	cluster.PoolConfig.HostSelectionPolicy = gocql.DCAwareRoundRobinPolicy(localDC)
	
	// Creación de sesión temporal para inicializar el esquema (sin el keyspace)
	session, err := cluster.CreateSession()
	if err != nil {
		log.Fatalf("--- ERROR conectándose a Cassandra: %v ---", err)
	}
	defer session.Close()

	// Inicialización del keyspace y tablas (si no existen ya)
	err = initDb(session)
	if err != nil {
		log.Fatalf("--- ERROR inicializando la base de datos: %v", err)
	}

	// Creación de la sesión con el keyspace
	cluster.Keyspace = "smartcity"
	Session, err = cluster.CreateSession()
	if err != nil {
		log.Fatalf("--- ERROR creando la sesión con el keyspace: %v", err)
	}
	

	log.Println("--- ÉXITO inicializando Cassandra DB ---")
}

func initDb(session *gocql.Session) error {
	// Creación del keyspace "smartcity" (similar a una base de datos en el modelo relacional)
	err := session.Query(`
		CREATE KEYSPACE IF NOT EXISTS smartcity
		WITH replication = {'class': 'SimpleStrategy', 'replication_factor':'1'}
	`).Exec()
	if err != nil {
		return fmt.Errorf("error creando el keyspace - %v", err)
	}

	// Creación de la tabla "sensors" (guarda información de los sensores)
	err = session.Query(`
		CREATE TABLE IF NOT EXISTS smartcity.sensors (
			sensor_id text PRIMARY KEY,
			type text,
			lat double,
			lng double,
			description text,
			created_at timestamp
		)
	`).Exec()
	if err != nil {
		return fmt.Errorf("error creando la tabla de sensores - %v", err)
	}

	// Creación de la tabla "sensor_readings" (para datos temporales)
	err = session.Query(`
		CREATE TABLE IF NOT EXISTS smartcity.sensor_readings (
			sensor_id text,
			timestamp timestamp,
			value double,
			unit text,
			status text,
			PRIMARY KEY (sensor_id, timestamp)
		) WITH CLUSTERING ORDER BY (timestamp DESC)
	`).Exec()
	if err != nil {
		return fmt.Errorf("error creando la tabla de lecturas de sensores - %v", err)
	}
	
	return nil
}


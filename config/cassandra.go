package config

import (
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/gocql/gocql"
)

var Session *gocql.Session

func InitCassandra() {
	log.Println("--- Inicializando conexión con Cassandra... ---")
	
	// Obtención y procesamiento de las variables de entorno
	contactPointsStr := os.Getenv("CASSANDRA_CONTACT_POINTS")
	localDC := os.Getenv("CASSANDRA_LOCAL_DC")
	
	// Dividir la cadena de contact points por comas
	contactPoints := strings.Split(contactPointsStr, ",")
	
	log.Printf("--- Conectando a los nodos: %v ---", contactPoints)

	// Configuración del cluster
	cluster := gocql.NewCluster(contactPoints...)
	cluster.Consistency = gocql.Quorum
	cluster.ProtoVersion = 4
	cluster.ConnectTimeout = time.Second * 30
	cluster.Timeout = time.Second * 30
	
	// Reconexión
	cluster.ReconnectionPolicy = &gocql.ConstantReconnectionPolicy{
		MaxRetries: 10,
		Interval:   5 * time.Second,
	}
	
	if localDC != "" {
		cluster.PoolConfig.HostSelectionPolicy = gocql.DCAwareRoundRobinPolicy(localDC)
	}
	
	// Esperar un poco para asegurar que Cassandra esté listo
	time.Sleep(5 * time.Second)

	// Creación de sesión temporal para inicializar el esquema (sin el keyspace)
	session, err := cluster.CreateSession()
	if err != nil {
		log.Printf("--- ERROR conectándose a Cassandra: %v ---", err)
		log.Println("--- Reintentando en 5 segundos... ---")
		time.Sleep(5 * time.Second)
		
		session, err = cluster.CreateSession()
		if err != nil {
			log.Fatalf("--- ERROR FATAL conectándose a Cassandra después de reintento: %v ---", err)
		}
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
	
	// Verificar estado del cluster
	CheckClusterStatus()
}

func initDb(session *gocql.Session) error {
	// Creación del keyspace "smartcity" 
	err := session.Query(`
		CREATE KEYSPACE IF NOT EXISTS smartcity
		WITH replication = {'class': 'SimpleStrategy', 'replication_factor':'3'}
	`).Exec()
	if err != nil {
		return fmt.Errorf("error creando el keyspace - %v", err)
	}

	// Creación de la tabla "sensors"
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

	// Creación de la tabla "sensor_readings"
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

func CheckClusterStatus() {
	if Session == nil {
		log.Println("--- Sesión no inicializada ---")
		return
	}
	
	// Información del cluster
	iter := Session.Query("SELECT peer, data_center FROM system.peers").Iter()
	
	var peer, dataCenter string
	hostCount := 0
	
	for iter.Scan(&peer, &dataCenter) {
		log.Printf("--- Nodo conectado: %s (DC: %s) ---", peer, dataCenter)
		hostCount++
	}
	
	if err := iter.Close(); err != nil {
		log.Printf("--- Error obteniendo información del cluster: %v ---", err)
		return
	}
	
	log.Printf("--- Total de nodos en el cluster: %d ---", hostCount + 1) // +1 para el nodo local
}

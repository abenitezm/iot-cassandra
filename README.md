# Plataforma de sensores IoT "Smartcity"

Una implementación minimalista de una plataforma IoT para gestión de sensores, basada en [cassandra-iot-sample](https://gitlab.com/webdevcaptain/cassandra-iot-sample/-/tree/main}).

## Tecnologías utilizadas
* Go + Gin (API)
* Cassandra (Base de datos distribuida)
* Python (Simuladores)
* Docker Compose (Orquestación)


## Ejecución

```
# Inicia todos los servicios
docker compose up

# Verifica su estado
curl http://localhost:8080/
```

## Servicios

* ```iot-app:8080``` - API REST
* ```iot-cassandra-{1,2,3}:9042``` - Nodos Cassandra
* ```sensor-{temp,humidity,air}``` - Simuladores de sensores

## Endpoints de la API

### Sensores
* ```POST /sensors``` - Registrar sensor
* ```GET /sensors``` - Listar sensores
* ```GET /sensors/:sensor_id``` - Obtener sensor

### Lecturas
* ```POST /sensors/:sensor_id/readings``` - Enviar lectura
* ```GET /sensors/:sensor_id/readings``` - Consultar lecturas
* ```GET /sensors/:sensor_id/readings/aggregates``` - Estadísticas

## Ejemplos de uso

```
# Registro de un nuevo sensor
curl -X POST http://localhost:8080/sensors/ \
  -H "Content-Type: application/json" \
  -d '{"sensor_id":"test","type":"temperature","lat":40.4,"lng":-3.7}'

# Envío de una lectura
curl -X POST http://localhost:8080/sensors/test/readings/ \
  -H "Content-Type: application/json" \
  -d '{"value":22.5,"unit":"C","status":"normal"}'
```

## Limpieza
```
# Para los servicios y borra los volúmenes de datos
docker compose down -v
```

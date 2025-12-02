#!/usr/bin/env python3
import os
import time
import random
import json
import urllib.request
import urllib.error

# Variables de entorno
SENSOR_ID = os.getenv('SENSOR_ID', 'default_sensor')
SENSOR_TYPE = os.getenv('SENSOR_TYPE', 'generic')
API_URL = os.getenv('API_URL', 'http://localhost:8080')
MIN_VALUE = float(os.getenv('MIN_VALUE', 0))
MAX_VALUE = float(os.getenv('MAX_VALUE', 100))
UNIT = os.getenv('UNIT', 'units')
INTERVAL = int(os.getenv('INTERVAL', 10))

print(f"Sensor: {SENSOR_ID} ({SENSOR_TYPE})")

# Hacer petición HTTP
def make_request(url, data=None, method='POST'):
    headers = {'Content-Type': 'application/json'}
    
    if data:
        data_bytes = json.dumps(data).encode('utf-8')
    else:
        data_bytes = None
    
    req = urllib.request.Request(
        url,
        data=data_bytes,
        headers=headers,
        method=method
    )
    
    try:
        response = urllib.request.urlopen(req, timeout=5)
        return response.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception as e:
        print(f"Error conexión: {e}")
        return None

# Registrar sensor
def register_sensor():
    sensor_data = {
        "sensor_id": SENSOR_ID,
        "type": SENSOR_TYPE,
        "lat": round(random.uniform(40.0, 41.0), 6),
        "lng": round(random.uniform(-3.5, -3.0), 6),
        "description": f"Sensor {SENSOR_TYPE}"
    }
    
    status = make_request(f"{API_URL}/sensors/", sensor_data)
    if status == 201:
        print(f"Sensor registrado")
    else:
        print(f"Status {status}")

# Enviar lectura
def send_reading():
    value = round(random.uniform(MIN_VALUE, MAX_VALUE), 2)
    
    # Estado simple
    if SENSOR_TYPE == "temperature":
        status = "high" if value > 30 else "low" if value < 18 else "normal"
    elif SENSOR_TYPE == "humidity":
        status = "high" if value > 70 else "low" if value < 40 else "normal"
    else:
        status = "normal"
    
    reading = {"value": value, "unit": UNIT, "status": status}
    
    status_code = make_request(
        f"{API_URL}/sensors/{SENSOR_ID}/readings/",
        reading
    )
    
    timestamp = time.strftime("%H:%M:%S")
    
    if status_code == 201:
        print(f"[{timestamp}] {SENSOR_ID}: {value}{UNIT} ({status})")
    else:
        print(f"[{timestamp}] HTTP {status_code}")

# Esperar a que la API esté lista
def wait_for_api():
    print("Esperando API...")
    while True:
        try:
            urllib.request.urlopen(f"{API_URL}", timeout=2)
            print("¡API lista!")
            return
        except:
            time.sleep(3)

if __name__ == "__main__":
    wait_for_api()
    register_sensor()
    
    print(f"Enviando cada {INTERVAL}s...")
    
    try:
        while True:
            send_reading()
            time.sleep(INTERVAL)
    except KeyboardInterrupt:
        print("\nDetenido")

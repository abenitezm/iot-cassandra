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

print(f"Sensor: {SENSOR_ID} ({SENSOR_TYPE}) -> API {API_URL}")

# Hacer petición HTTP 
def make_request(url, data=None, method='POST'):
    headers = {'Content-Type': 'application/json'}
    data_bytes = json.dumps(data).encode('utf-8') if data is not None else None

    req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=6) as response:
            body = response.read().decode('utf-8', errors='replace')
            status = response.getcode()
            print(f"HTTP {method} {url} -> {status}")
            if body:
                print("  Response body:", body)
            return status
    except urllib.error.HTTPError as e:
        try:
            body = e.read().decode('utf-8', errors='replace')
        except:
            body = None
        print(f"HTTPError {e.code} for {method} {url}; body: {body}")
        return e.code
    except Exception as e:
        print(f"Error conexión {method} {url}: {e}")
        return None

# Registrar sensor (sin trailing slash)
def register_sensor():
    sensor_data = {
        "sensor_id": SENSOR_ID,
        "type": SENSOR_TYPE,
        "lat": round(random.uniform(40.0, 41.0), 6),
        "lng": round(random.uniform(-3.5, -3.0), 6),
        "description": f"Sensor {SENSOR_TYPE}"
    }

    url = f"{API_URL.rstrip('/')}/sensors"
    status = make_request(url, sensor_data, method='POST')
    if status == 201:
        print("Sensor registrado")
    else:
        print(f"Registrar sensor -> status {status}")

# Enviar lectura (sin trailing slash)
def send_reading():
    value = round(random.uniform(MIN_VALUE, MAX_VALUE), 2)

    if SENSOR_TYPE == "temperature":
        status_txt = "high" if value > 30 else "low" if value < 18 else "normal"
    elif SENSOR_TYPE == "humidity":
        status_txt = "high" if value > 70 else "low" if value < 40 else "normal"
    else:
        status_txt = "normal"

    reading = {"value": value, "unit": UNIT, "status": status_txt}
    url = f"{API_URL.rstrip('/')}/sensors/{SENSOR_ID}/readings"
    status_code = make_request(url, reading, method='POST')

    timestamp = time.strftime("%H:%M:%S")
    if status_code == 201:
        print(f"[{timestamp}] {SENSOR_ID}: {value}{UNIT} ({status_txt})")
    else:
        print(f"[{timestamp}] POST -> HTTP {status_code}")

# Esperar a que la API esté lista
def wait_for_api():
    print("Esperando API...")
    while True:
        try:
            urllib.request.urlopen(f"{API_URL}", timeout=2)
            print("¡API lista!")
            return
        except Exception as e:
            print("API no disponible:", e)
            time.sleep(2)

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
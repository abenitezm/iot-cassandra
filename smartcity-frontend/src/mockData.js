export const mockSensors = [
  { sensor_id: 'sensor_1', type: 'temperature', lat: 40.4168, lng: -3.7038, description: 'Sensor de temperatura Madrid' },
  { sensor_id: 'sensor_2', type: 'humidity', lat: 41.3851, lng: 2.1734, description: 'Sensor de humedad Barcelona' }
]

export const mockReadings = {
  sensor_1: [
    { timestamp: '10:00', value: 22 },
    { timestamp: '11:00', value: 23 },
    { timestamp: '12:00', value: 21 }
  ],
  sensor_2: [
    { timestamp: '10:00', value: 45 },
    { timestamp: '11:00', value: 50 },
    { timestamp: '12:00', value: 48 }
  ]
}

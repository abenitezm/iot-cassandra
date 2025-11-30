import { useState } from 'react'
import SensorForm from './SensorForm'
import SensorList from './SensorList'
import SensorChart from './SensorChart'
import { mockSensors } from './mockData'

export default function App() {
  const [sensors, setSensors] = useState(mockSensors)
  const [selectedSensor, setSelectedSensor] = useState(mockSensors[0]?.sensor_id || null)

  const addSensor = sensor => {
    setSensors([...sensors, sensor])
    setSelectedSensor(sensor.sensor_id)
  }

  return (
    <div className="app">
      <h1>Smart City Dashboard</h1>
      <SensorForm onCreated={addSensor} />
      <SensorList sensors={sensors} setSensors={setSensors} onSelect={setSelectedSensor} />
      <SensorChart sensor_id={selectedSensor} />
    </div>
  )
}

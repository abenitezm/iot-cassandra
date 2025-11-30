import { LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'
import { mockReadings } from './mockData'

export default function SensorChart({ sensor_id }) {
  if (!sensor_id) return null

  const data = mockReadings[sensor_id] || []

  return (
    <div className="sensor-chart">
      <h2>Lecturas de {sensor_id}</h2>
      <LineChart width={500} height={300} data={data}>
        <Line type="monotone" dataKey="value" stroke="#8884d8" />
        <XAxis dataKey="timestamp" />
        <YAxis />
        <Tooltip />
      </LineChart>
    </div>
  )
}

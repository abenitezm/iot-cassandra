export default function SensorList({ sensors, setSensors, onSelect }) {
  const removeSensor = id => setSensors(sensors.filter(s => s.sensor_id !== id))

  return (
    <div className="sensor-list">
      <h2>Lista de Sensores</h2>
      <ul>
        {sensors.map(s => (
          <li key={s.sensor_id}>
            <span onClick={() => onSelect(s.sensor_id)} style={{ cursor: 'pointer' }}>
              {s.sensor_id} - {s.type}
            </span>
            <button onClick={() => removeSensor(s.sensor_id)}>Eliminar</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

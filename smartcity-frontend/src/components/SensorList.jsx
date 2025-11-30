export default function SensorList({ sensors = [], onSelect, onDelete, loading }) {
  return (
    <div className="sensor-list">
      <h2>Sensores</h2>
      {loading && <div className="muted">Cargando...</div>}
      <ul>
        {sensors.map((s, index) => (
          <li key={s.sensor_id || index}>
            <div className="sensor-info" onClick={() => onSelect?.(s.sensor_id)}>
              <div className="id">{s.sensor_id}</div>
              <div className="type">{s.type}</div>
            </div>
            <div className="actions">
              <button 
                className="small"
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onSelect?.(s.sensor_id); 
                }}
              >
                Ver
              </button>
              <button
                className="small danger"
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (confirm(`¿Eliminar ${s.sensor_id}?`)) onDelete?.(s.sensor_id);
                }}
              >
                Eliminar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

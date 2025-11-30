import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../api';

export default function SensorChart({ sensor_id, sensor }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newReading, setNewReading] = useState({
    value: '',
    unit: '',
    status: 'OK'  // valor por defecto
  });

  const fetchReadings = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/sensors/${sensor_id}/readings?limit=200`);
      if (Array.isArray(res.data)) {
        const d = res.data
          .map(r => ({
            ...r,
            timestamp: new Date(r.timestamp).toLocaleString("es-ES",{
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false
            })
          }))
          .reverse();
        setData(d);
      } else {
        setData([]);
      }
    } catch (err) {
      console.warn('No se pudieron obtener lecturas:', err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!sensor_id) return;
    fetchReadings();
  }, [sensor_id]);

  const handleChange = (e) => {
    setNewReading({ ...newReading, [e.target.name]: e.target.value });
  };

  const handleAddReading = async (e) => {
    e.preventDefault();
    if (!newReading.value) return;

    try {
      await api.post(`/sensors/${sensor_id}/readings`, {
        value: parseFloat(newReading.value),
        unit: newReading.unit,
        status: newReading.status
      });
      setNewReading({ value: '', unit: '', status: 'OK' });
      fetchReadings();
    } catch (err) {
      console.error('Error añadiendo lectura:', err.message);
      alert('Error al añadir lectura');
    }
  };

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div style={{ background: '#222831', padding: '8px', border: '1px solid #6272a4', color: '#fff' }}>
          <div><strong>Hora:</strong> {label}</div>
          <div><strong>Valor:</strong> {p.value} {p.unit}</div>
          <div><strong>Status:</strong> {p.status}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="sensor-chart">
      <h2>
        {sensor_id} {sensor?.description && <small style={{ fontWeight: 'normal', fontSize: '0.7em', color: '#aaa' }}>— {sensor.description}</small>}
      </h2>

      <form onSubmit={handleAddReading} style={{ marginBottom: '10px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
        <input
          type="number"
          step="any"
          name="value"
          placeholder="Valor"
          value={newReading.value}
          onChange={handleChange}
        />
        <input
          type="text"
          name="unit"
          placeholder="Unidad"
          value={newReading.unit}
          onChange={handleChange}
        />
        <select name="status" value={newReading.status} onChange={handleChange}>
          <option value="OK">OK</option>
          <option value="WARN">WARN</option>
          <option value="ERROR">ALERT</option>
        </select>
        <button type="submit">Añadir</button>
      </form>

      {loading && <div className="muted">Cargando lecturas...</div>}
      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ff7e5f" stopOpacity={1}/>
                <stop offset="100%" stopColor="#feb47b" stopOpacity={1}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="timestamp" tick={{ fill: '#cbd5e1' }} />
            <YAxis tick={{ fill: '#cbd5e1' }} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="value" stroke="url(#grad)" strokeWidth={3} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

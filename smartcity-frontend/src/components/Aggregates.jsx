import { useEffect, useState } from 'react';
import { api } from '../api';

const POLL_INTERVAL = 5000;

export default function Aggregates({ sensor_id, sensor }) {
  const [aggs, setAggs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [startLocal, setStartLocal] = useState('');
  const [endLocal, setEndLocal] = useState('');
  const unit = sensor?.unit || '';

  const buildISO = (local) => {
    if (!local) return '';
    const d = new Date(local);
    if (isNaN(d.getTime())) return '';
    return d.toISOString();
  };

  const fetchAggregates = async (silent = false) => {
    if (!sensor_id) {
      setAggs(null);
      return;
    }
    if (!silent) setLoading(true);
    try {
      const params = {};
      const s = buildISO(startLocal);
      const e = buildISO(endLocal);
      if (s) params.start = s;
      if (e) params.end = e;
      const res = await api.get(`/sensors/${sensor_id}/readings/aggregates`, { params });
      if (res && res.data) setAggs(res.data);
    } catch (err) {
      console.error('No se pudieron obtener agregados:', err?.message || err);
    } finally {
      if (!silent) setLoading(false);
      if (initialLoading) setInitialLoading(false);
    }
  };

  useEffect(() => {
    setStartLocal('');
    setEndLocal('');
    if (!sensor_id) return;
    fetchAggregates(true);
    const id = setInterval(() => fetchAggregates(true), POLL_INTERVAL);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sensor_id]);

  const fmt = (v) => {
    if (v === null || v === undefined) return '—';
    if (typeof v === 'number') return Number.isInteger(v) ? v.toString() : v.toFixed(2);
    return String(v);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 36 }}>
      <div style={{ width: '720px' }}>
        <h3 style={{ textAlign: 'center', marginBottom: 8 }}>
          Datos {sensor_id && <small style={{ fontWeight: 'normal', fontSize: '0.8em', color: '#666' }}> — {sensor_id}</small>}
        </h3>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            Inicio:
            <input
              type="datetime-local"
              value={startLocal}
              onChange={(e) => setStartLocal(e.target.value)}
              style={{ padding: '6px 8px' }}
            />
          </label>

          <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            Fin:
            <input
              type="datetime-local"
              value={endLocal}
              onChange={(e) => setEndLocal(e.target.value)}
              style={{ padding: '6px 8px' }}
            />
          </label>

          <button onClick={() => fetchAggregates(false)} disabled={loading} style={{ padding: '6px 10px' }}>
            Aplicar
          </button>

          <button onClick={() => { setStartLocal(''); setEndLocal(''); fetchAggregates(false); }} style={{ padding: '6px 10px' }}>
            Limpiar
          </button>
        </div>

        <div style={{background: '#111827', padding: '5px', borderRadius: 8, color: '#fff', minHeight: 55 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 18 }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>Count</div>
              <div style={{ marginTop: 6, fontWeight: 600 }}>{aggs ? fmt(aggs.count) : (initialLoading ? 'Cargando…' : '—')}</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>Avg</div>
              <div style={{ marginTop: 6, fontWeight: 600 }}>{aggs ? `${fmt(aggs.avg)} ${unit}` : (initialLoading ? 'Cargando…' : '—')}</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>Min</div>
              <div style={{ marginTop: 6, fontWeight: 600 }}>{aggs ? `${fmt(aggs.min)} ${unit}` : (initialLoading ? 'Cargando…' : '—')}</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>Max</div>
              <div style={{ marginTop: 6, fontWeight: 600 }}>{aggs ? `${fmt(aggs.max)} ${unit}` : (initialLoading ? 'Cargando…' : '—')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
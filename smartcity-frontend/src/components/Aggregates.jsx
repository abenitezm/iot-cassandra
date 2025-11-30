import { useEffect, useState } from 'react'
import { api } from '../api'

export default function Aggregates({ sensor_id }) {
  const [agg, setAgg] = useState(null)

  useEffect(() => {
    let mounted = true
    api.get(`/sensors/${sensor_id}/readings/aggregates`)
      .then(res => { if (mounted) setAgg(res.data) })
      .catch(err => { console.warn('aggregates failed', err.message); setAgg(null) })

    return () => { mounted = false }
  }, [sensor_id])

  if (!agg) return <div className="muted">Sin agregados disponibles</div>

  return (
    <div className="aggregates">
      <div className="card">
        <div className="label">Media</div>
        <div className="value">{agg.avg !== null ? agg.avg.toFixed(2) : '—'}</div>
      </div>
      <div className="card">
        <div className="label">Mín</div>
        <div className="value">{agg.min !== null ? agg.min : '—'}</div>
      </div>
      <div className="card">
        <div className="label">Máx</div>
        <div className="value">{agg.max !== null ? agg.max : '—'}</div>
      </div>
    </div>
  )
}

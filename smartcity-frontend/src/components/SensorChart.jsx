import React, { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { api } from '../api'
import Aggregates from './Aggregates'

const POLL_INTERVAL = 5000

export default function SensorChart({ sensor_id, sensor }) {
  const [data, setData] = useState([])
  const [initialLoading, setInitialLoading] = useState(true)

  const fetchReadings = async (silent = false) => {
    if (!sensor_id) return
    try {
      const res = await api.get(`/sensors/${sensor_id}/readings?limit=200`)
      if (Array.isArray(res.data)) {
        const d = res.data
          .map((r) => ({
            ...r,
            timestamp: new Date(r.timestamp).toLocaleString('es-ES', {
              day: '2-digit',
              month: '2-digit'
            })
          }))
          .reverse()
        setData(d)
      } else {
        if (!silent) setData([])
      }
    } catch (err) {
      console.warn('No se pudieron obtener lecturas:', err && err.message ? err.message : err)
    } finally {
      if (initialLoading) setInitialLoading(false)
    }
  }

  useEffect(() => {
    if (!sensor_id) return
    fetchReadings(false)
    const id = setInterval(() => fetchReadings(true), POLL_INTERVAL)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sensor_id])

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload || payload[0]
      return (
        <div style={{ background: '#222831', padding: '8px', border: '1px solid #6272a4', color: '#fff' }}>
          <div><strong>Hora:</strong> {label}</div>
          <div><strong>Valor:</strong> {p.value} {p.unit}</div>
          <div><strong>Status:</strong> {p.status}</div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="sensor-chart">
      <h2>{sensor_id} {sensor?.description && <small style={{ fontWeight: 'normal', fontSize: '0.7em', color: '#aaa' }}>— {sensor.description}</small>}</h2>

      <div className="chart-wrapper">
        <ResponsiveContainer>
          <LineChart data={data}>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ff7e5f" stopOpacity={1} />
                <stop offset="100%" stopColor="#feb47b" stopOpacity={1} />
              </linearGradient>
            </defs>
            <XAxis dataKey="timestamp" tick={{ fill: '#cbd5e1' }} />
            <YAxis tick={{ fill: '#cbd5e1' }} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="value" stroke="url(#grad)" strokeWidth={3} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: 12 }}>
        <Aggregates sensor_id={sensor_id} sensor={sensor} />
      </div>
    </div>
  )
}
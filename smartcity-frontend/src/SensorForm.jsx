import { useState } from 'react'

export default function SensorForm({ onCreated }) {
  const [form, setForm] = useState({ sensor_id: '', type: '', lat: '', lng: '', description: '' })

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = e => {
    e.preventDefault()
    onCreated(form)
    setForm({ sensor_id: '', type: '', lat: '', lng: '', description: '' })
  }

  return (
    <form onSubmit={handleSubmit} className="sensor-form">
      <h2>Crear Sensor</h2>
      <input name="sensor_id" placeholder="ID" value={form.sensor_id} onChange={handleChange} />
      <input name="type" placeholder="Tipo" value={form.type} onChange={handleChange} />
      <input name="lat" placeholder="Latitud" value={form.lat} onChange={handleChange} />
      <input name="lng" placeholder="Longitud" value={form.lng} onChange={handleChange} />
      <input name="description" placeholder="Descripción" value={form.description} onChange={handleChange} />
      <button type="submit">Crear Sensor</button>
    </form>
  )
}

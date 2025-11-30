import { useState } from 'react'

export default function SensorForm({ onCreated }) {
  const [form, setForm] = useState({
    sensor_id: '',
    type: '',
    lat: '',
    lng: '',
    description: ''
  })

  const handleChange = (e) => setForm({...form, [e.target.name]: e.target.value})

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.sensor_id) {
      alert('sensor_id es obligatorio')
      return
    }
    const sensor = {
      ...form,
      lat: form.lat ? parseFloat(form.lat) : 0,
      lng: form.lng ? parseFloat(form.lng) : 0
    }
    onCreated(sensor)
    setForm({sensor_id:'', type:'', lat:'', lng:'', description:''})
  }

  return (
    <form className="sensor-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px', margin: '0 auto' }}>
      <h2>Crear sensor</h2>
      <input name="sensor_id" placeholder="ID (ej: sensor_1)" value={form.sensor_id} onChange={handleChange} />
      <input name="type" placeholder="Tipo (ej: temperatura)" value={form.type} onChange={handleChange} />
      <input name="lat" placeholder="Latitud" value={form.lat} onChange={handleChange} />
      <input name="lng" placeholder="Longitud" value={form.lng} onChange={handleChange} />
      <input name="description" placeholder="Descripción" value={form.description} onChange={handleChange} />
      <button type="submit">Añadir sensor</button>
    </form>
  )
}

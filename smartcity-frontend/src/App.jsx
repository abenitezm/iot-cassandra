import { useEffect, useState } from "react";
import axios from "axios";
import SensorList from "./components/SensorList";
import SensorForm from "./components/SensorForm";
import SensorChart from "./components/SensorChart";

import './App.css';

export default function App() {
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [error, setError] = useState(null);

  const API = "http://localhost:8080";

  const fetchSensors = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API}/sensors`);
      setSensors(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error cargando sensores", err);
      setError("No se pudieron cargar los sensores.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSensors();
  }, []);

  const handleCreateSensor = async (sensor) => {
    try {
      await axios.post(`${API}/sensors`, sensor);
      fetchSensors();
    } catch (err) {
      console.error("Error creando sensor", err);
      alert("Error creando sensor");
    }
  };

  const handleDeleteSensor = async (sensor_id) => {
    try {
      await axios.delete(`${API}/sensors/${sensor_id}`);
      fetchSensors();
      if (selectedSensor === sensor_id) setSelectedSensor(null);
    } catch (err) {
      console.error("Error eliminando sensor", err);
      alert("Error eliminando sensor");
    }
  };

  return (
    <div className="app">
      <h1>Smart City</h1>
      <div className="main-container">
        <div className="sidebar">
          <SensorForm onCreated={handleCreateSensor} />
          <SensorList
            sensors={sensors}
            loading={loading}
            onSelect={setSelectedSensor}
            onDelete={handleDeleteSensor}
          />
          {error && <div className="error">{error}</div>}
        </div>
        <div className="content">
          {selectedSensor ? (
            <SensorChart
              sensor_id={selectedSensor}
              sensor={sensors.find(s => s.sensor_id === selectedSensor)}
            />
          ) : (
            <div>Selecciona un sensor para ver la gráfica</div>
          )}
        </div>
      </div>
    </div>
  );
}

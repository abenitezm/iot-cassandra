import { useEffect, useState } from "react";
import axios from "axios";
import SensorList from "./components/SensorList";
import SensorChart from "./components/SensorChart";
// ...existing code...

const POLL_INTERVAL = 5000;

export default function App() {
  // removed the `loading` state to avoid any "Cargando..." UI flashes
  const [sensors, setSensors] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [error, setError] = useState(null);

  const API = "http://localhost:8080";

  // fetchSensors supports a `silent` flag — when true no UI-loading behavior is triggered
  const fetchSensors = async (silent = true) => {
    try {
      const res = await axios.get(`${API}/sensors`);
      setSensors(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error cargando sensores", err);
      if (!silent) setError("No se pudieron cargar los sensores.");
    }
  };

  // initial load + polling (silent updates keep UI stable)
  useEffect(() => {
    fetchSensors(true); // initial fetch also silent so no loading UI appears
    const id = setInterval(() => fetchSensors(true), POLL_INTERVAL);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeleteSensor = async (sensor_id) => {
    try {
      await axios.delete(`${API}/sensors/${encodeURIComponent(sensor_id)}`);
      // refresh immediately after delete (silent)
      fetchSensors(true);
      if (selectedSensor === sensor_id) setSelectedSensor(null);
    } catch (err) {
      console.error("Error eliminando sensor", err);
      alert("Error eliminando sensor");
    }
  };

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="header-inner">
          <h1 className="title">Smart City</h1>
        </div>
      </header>

      <div className="app-body">
        <aside className="sidebar">
          <div className="sidebar-inner">
            <SensorList
              sensors={sensors}
              loading={false} /* keep prop but always false to avoid "Cargando..." */ 
              onSelect={setSelectedSensor}
              onDelete={handleDeleteSensor}
            />
            {error && <div className="error">{error}</div>}
          </div>
        </aside>

        <main className="main-content">
          <div className="main-inner">
            {selectedSensor ? (
              <SensorChart
                sensor_id={selectedSensor}
                sensor={sensors.find((s) => s.sensor_id === selectedSensor)}
              />
            ) : (
              <div className="placeholder">Selecciona un sensor para ver la gráfica</div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

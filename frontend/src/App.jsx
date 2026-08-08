import { useState, useEffect } from "react";
import Header from "./components/Header";
import VehicleForm from "./components/VehicleForm";
import VehicleList from "./components/VehicleList";
import MechanicView from "./components/MechanicView";
import AnalyticsWidget from "./components/AnalyticsWidget";
import "./App.css";

function App() {
  const [vehicles, setVehicles] = useState([]);
  const [activeTab, setActiveTab] = useState("admin");

  const fetchVehicles = () => {
    fetch("/api/vehicles")
      .then((res) => res.json())
      .then((data) => setVehicles(data))
      .catch((err) => console.error("Error fetching vehicles:", err));
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleVehicleAdded = (newVehicle) => {
    setVehicles([...vehicles, newVehicle]);
  };

  return (
    <div className="dashboard">
      <Header />

      <div className="tabs">
        <button
          className={activeTab === "admin" ? "tab-btn active" : "tab-btn"}
          onClick={() => setActiveTab("admin")}
        >
          Admin Dashboard
        </button>
        <button
          className={activeTab === "mechanic" ? "tab-btn active" : "tab-btn"}
          onClick={() => setActiveTab("mechanic")}
        >
          Mechanic Portal
        </button>
      </div>

      {activeTab === "admin" ? (
        <>
          <AnalyticsWidget vehicles={vehicles} />
          <div className="layout-grid">
            <VehicleForm onVehicleAdded={handleVehicleAdded} />
            <VehicleList vehicles={vehicles} refreshData={fetchVehicles} />
          </div>
        </>
      ) : (
        /* Passing vehicles array into MechanicView */
        <MechanicView vehicles={vehicles} />
      )}
    </div>
  );
}

export default App;

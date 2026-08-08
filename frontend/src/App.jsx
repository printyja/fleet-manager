import { useState, useEffect } from "react";
import Header from "./components/Header";
import VehicleForm from "./components/VehicleForm";
import VehicleList from "./components/VehicleList";
import MechanicView from "./components/MechanicView";
import "./App.css";

function App() {
  const [vehicles, setVehicles] = useState([]);
  const [activeTab, setActiveTab] = useState("admin");

  // Created a reusable function to fetch data so we can call it after uploads
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
        <div className="layout-grid">
          <VehicleForm onVehicleAdded={handleVehicleAdded} />
          {/* Pass the refresh function down to the list */}
          <VehicleList vehicles={vehicles} refreshData={fetchVehicles} />
        </div>
      ) : (
        <MechanicView />
      )}
    </div>
  );
}

export default App;

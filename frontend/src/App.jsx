import { useState, useEffect } from "react";
import { Truck, Activity, Hash } from "lucide-react";
import "./App.css";

function App() {
  const [vehicles, setVehicles] = useState([]);

  // This talks to your backend to get the fleet data when the page loads
  useEffect(() => {
    fetch("/api/vehicles")
      .then((res) => res.json())
      .then((data) => setVehicles(data))
      .catch((err) => console.error("Error fetching vehicles:", err));
  }, []);

  return (
    <div className="dashboard">
      <header className="header">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Truck size={28} color="white" />
          <h1
            style={{
              margin: 0,
              fontSize: "22px",
              fontWeight: "600",
              letterSpacing: "0.5px",
            }}
          >
            Association JP Enterprises Inc - Admin Dashboard
          </h1>
        </div>
        <p style={{ margin: "6px 0 0 0", fontSize: "14px", color: "#cbd5e1" }}>
          Live Fleet Asset Tracking
        </p>
      </header>

      <h2>My Fleet</h2>

      <div className="fleet-grid">
        {vehicles.length === 0 ? (
          <p>Loading vehicles...</p>
        ) : (
          vehicles.map((vehicle) => (
            <div key={vehicle._id} className="card">
              <h3
                style={{
                  borderBottom: "1px solid #eee",
                  paddingBottom: "10px",
                  marginTop: 0,
                }}
              >
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h3>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <Hash size={18} color="#666" />
                <span>
                  <strong>VIN:</strong> {vehicle.vin}
                </span>
              </div>

              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Activity
                  size={18}
                  color={vehicle.status === "Active" ? "green" : "orange"}
                />
                <span>
                  <strong>Status:</strong> {vehicle.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;

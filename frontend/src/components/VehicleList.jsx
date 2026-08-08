import { useState } from "react";
import { Activity, Hash, ExternalLink, Search } from "lucide-react";
import TaskForm from "./TaskForm";
import VehicleQRCode from "./VehicleQRCode";
import DocumentUpload from "./DocumentUpload";

function VehicleList({ vehicles, refreshData }) {
  // Add state to track the user's search input
  const [searchTerm, setSearchTerm] = useState("");

  // Filter the vehicles array before rendering it
  const filteredVehicles = vehicles.filter((vehicle) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      vehicle.make.toLowerCase().includes(searchLower) ||
      vehicle.model.toLowerCase().includes(searchLower) ||
      vehicle.vin.toLowerCase().includes(searchLower) ||
      vehicle.year.toString().includes(searchLower)
    );
  });

  return (
    <div className="fleet-section">
      {/* Visual Search Bar next to the title */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "15px",
        }}
      >
        <h2 style={{ margin: 0 }}>My Fleet</h2>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "white",
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid #ddd",
            width: "100%",
            maxWidth: "300px",
          }}
        >
          <Search size={18} color="#94a3b8" style={{ marginRight: "8px" }} />
          <input
            type="text"
            placeholder="Search Year, Make, Model, VIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              border: "none",
              outline: "none",
              width: "100%",
              fontSize: "14px",
            }}
          />
        </div>
      </div>

      <div className="fleet-grid">
        {/* Map over 'filteredVehicles' instead of 'vehicles' */}
        {filteredVehicles.length === 0 ? (
          <p>No vehicles found matching "{searchTerm}".</p>
        ) : (
          filteredVehicles.map((vehicle) => (
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

              {vehicle.documents && vehicle.documents.length > 0 && (
                <div
                  style={{
                    marginTop: "15px",
                    background: "#f8fafc",
                    padding: "10px",
                    borderRadius: "8px",
                  }}
                >
                  <strong style={{ fontSize: "13px" }}>Saved Files:</strong>
                  <ul
                    style={{
                      margin: "5px 0 0 0",
                      paddingLeft: "20px",
                      fontSize: "13px",
                    }}
                  >
                    {vehicle.documents.map((doc, index) => (
                      <li key={index} style={{ marginBottom: "4px" }}>
                        <a
                          href={`http://localhost:3000${doc.fileUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: "#3b82f6",
                            textDecoration: "none",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          {doc.title} <ExternalLink size={12} />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <DocumentUpload
                vehicleId={vehicle._id}
                onUploadSuccess={refreshData}
              />
              <VehicleQRCode vehicleId={vehicle._id} vin={vehicle.vin} />
              <TaskForm vehicleId={vehicle._id} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default VehicleList;

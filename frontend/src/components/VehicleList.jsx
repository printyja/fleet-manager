import { useState } from "react";
import { Activity, Hash, ExternalLink, Search, Trash2 } from "lucide-react";
import TaskForm from "./TaskForm";
import VehicleQRCode from "./VehicleQRCode";
import DocumentUpload from "./DocumentUpload";

function VehicleList({ vehicles, refreshData }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredVehicles = vehicles.filter((vehicle) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      vehicle.make.toLowerCase().includes(searchLower) ||
      vehicle.model.toLowerCase().includes(searchLower) ||
      vehicle.vin.toLowerCase().includes(searchLower) ||
      vehicle.year.toString().includes(searchLower)
    );
  });

  // --- Handle Deleting a Vehicle ---
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this vehicle?"))
      return;

    try {
      const response = await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
      if (response.ok) {
        refreshData(); // Refresh the grid to remove the deleted truck
      }
    } catch (error) {
      console.error("Error deleting vehicle:", error);
    }
  };

  // --- Handle Status Change ---
  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await fetch(`/api/vehicles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        refreshData(); // Refresh to show the updated color and status
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  return (
    <div className="fleet-section">
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
        {filteredVehicles.length === 0 ? (
          <p>No vehicles found matching "{searchTerm}".</p>
        ) : (
          filteredVehicles.map((vehicle) => (
            <div
              key={vehicle._id}
              className="card"
              style={{ position: "relative" }}
            >
              {/* Delete Button positioned at the top right of the card */}
              <button
                onClick={() => handleDelete(vehicle._id)}
                style={{
                  position: "absolute",
                  top: "20px",
                  right: "20px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#ef4444",
                }}
                title="Delete Vehicle"
              >
                <Trash2 size={20} />
              </button>

              <h3
                style={{
                  borderBottom: "1px solid #eee",
                  paddingBottom: "10px",
                  marginTop: 0,
                  paddingRight: "30px",
                }}
              >
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h3>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "12px",
                }}
              >
                <Hash size={18} color="#666" />
                <span>
                  <strong>VIN:</strong> {vehicle.vin}
                </span>
              </div>

              {/* Status Dropdown to easily change from Active to In Shop */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "12px",
                }}
              >
                <Activity
                  size={18}
                  color={
                    vehicle.status === "Active"
                      ? "green"
                      : vehicle.status === "In Shop"
                        ? "orange"
                        : "red"
                  }
                />
                <strong>Status:</strong>
                <select
                  value={vehicle.status}
                  onChange={(e) =>
                    handleStatusChange(vehicle._id, e.target.value)
                  }
                  style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                    fontSize: "13px",
                  }}
                >
                  <option value="Active">Active</option>
                  <option value="In Shop">In Shop</option>
                  <option value="Out of Service">Out of Service</option>
                </select>
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

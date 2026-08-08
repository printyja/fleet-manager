import { useState } from "react";
import {
  Activity,
  Hash,
  ExternalLink,
  Search,
  Trash2,
  History,
  Download,
} from "lucide-react";
import * as XLSX from "xlsx";
import TaskForm from "./TaskForm";
import VehicleQRCode from "./VehicleQRCode";
import DocumentUpload from "./DocumentUpload";
import VehicleHistoryModal from "./VehicleHistoryModal";

function VehicleList({ vehicles, refreshData }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const filteredVehicles = vehicles.filter((vehicle) => {
    const searchLower = searchTerm.toLowerCase();
    const vNum = vehicle.vehicleNumber
      ? vehicle.vehicleNumber.toLowerCase()
      : "";
    return (
      vNum.includes(searchLower) ||
      vehicle.make.toLowerCase().includes(searchLower) ||
      vehicle.model.toLowerCase().includes(searchLower) ||
      vehicle.vin.toLowerCase().includes(searchLower) ||
      vehicle.year.toString().includes(searchLower)
    );
  });

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this vehicle?"))
      return;
    try {
      const response = await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
      if (response.ok) refreshData();
    } catch (error) {
      console.error("Error deleting vehicle:", error);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await fetch(`/api/vehicles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) refreshData();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleExportExcel = () => {
    const excelData = filteredVehicles.map((v) => ({
      "Vehicle ID#": v.vehicleNumber || "N/A",
      Year: v.year,
      Make: v.make,
      Model: v.model,
      VIN: v.vin,
      Status: v.status,
      "Saved Documents": v.documents ? v.documents.length : 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Fleet_Assets");
    XLSX.writeFile(workbook, "LJG_Fleet_Export.xlsx");
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
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={handleExportExcel}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "#10b981",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            <Download size={16} /> Export Excel
          </button>

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
              placeholder="Search ID, Year, Make, VIN..."
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
                <span style={{ color: "#3b82f6", marginRight: "6px" }}>
                  #{vehicle.vehicleNumber || "N/A"}
                </span>
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

              <button
                onClick={() => setSelectedVehicle(vehicle)}
                style={{
                  width: "100%",
                  padding: "8px",
                  marginBottom: "12px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  color: "#475569",
                  fontWeight: "600",
                }}
              >
                <History size={16} /> View Repair History
              </button>

              {vehicle.documents && vehicle.documents.length > 0 && (
                <div
                  style={{
                    marginTop: "5px",
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

      {selectedVehicle && (
        <VehicleHistoryModal
          vehicle={selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
        />
      )}
    </div>
  );
}

export default VehicleList;

import { useState } from "react";
import {
  Activity,
  ShieldCheck,
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
import VehicleHistoryModal from "./VehicleHistoryModal";

function VehicleList({ vehicles, refreshData, onOpenCompliance }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [visibleQrByVehicle, setVisibleQrByVehicle] = useState({});
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  const getDisplayVehicleId = (vehicle) =>
    vehicle.vehicleNumber || vehicle.vehicleId || vehicle.vehicleID || "N/A";

  const getStatusColor = (status) => {
    if (status === "Active") return "green";
    if (status === "In Shop") return "orange";
    return "red";
  };

  const safeVehicles = Array.isArray(vehicles) ? vehicles : [];

  const filteredVehicles = safeVehicles.filter((vehicle) => {
    const searchLower = searchTerm.toLowerCase();
    const vNum = getDisplayVehicleId(vehicle).toLowerCase();
    const make = String(vehicle.make || "").toLowerCase();
    const model = String(vehicle.model || "").toLowerCase();
    const vin = String(vehicle.vin || "").toLowerCase();
    const year = String(vehicle.year || "");

    return (
      vNum.includes(searchLower) ||
      make.includes(searchLower) ||
      model.includes(searchLower) ||
      vin.includes(searchLower) ||
      year.includes(searchLower)
    );
  });

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this vehicle?"))
      return;
    try {
      const response = await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Delete request failed");
      }
      refreshData();
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      window.alert(
        "Could not delete vehicle. Please make sure the API server is running and try again.",
      );
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

  const startEditing = (vehicle) => {
    setEditError("");
    setEditingVehicleId(vehicle._id);
    setEditDraft({
      vehicleNumber: getDisplayVehicleId(vehicle),
      year: String(vehicle.year ?? ""),
      make: String(vehicle.make ?? ""),
      model: String(vehicle.model ?? ""),
      vin: String(vehicle.vin ?? ""),
      status: String(vehicle.status ?? "Active"),
    });
  };

  const cancelEditing = () => {
    setEditingVehicleId(null);
    setEditDraft(null);
    setEditError("");
    setIsSavingEdit(false);
  };

  const handleEditDraftChange = (field, value) => {
    setEditError("");
    setEditDraft((prev) => {
      if (!prev) {
        return { [field]: value };
      }

      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const saveVehicleEdits = async (vehicleId) => {
    if (!editDraft) return;

    const yearValue = Number(editDraft.year);
    if (!Number.isFinite(yearValue) || yearValue <= 0) {
      setEditError("Please enter a valid year.");
      return;
    }

    const payload = {
      vehicleNumber: String(editDraft.vehicleNumber || "").trim(),
      year: yearValue,
      make: String(editDraft.make || "").trim(),
      model: String(editDraft.model || "").trim(),
      vin: String(editDraft.vin || "").trim(),
      status: String(editDraft.status || "Active"),
    };

    if (
      !payload.vehicleNumber ||
      !payload.make ||
      !payload.model ||
      !payload.vin
    ) {
      setEditError("Vehicle ID, make, model, and VIN are required.");
      return;
    }

    setIsSavingEdit(true);
    setEditError("");

    try {
      const response = await fetch(`/api/vehicles/${vehicleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let result = {};
      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (!response.ok) {
        const detailMessage = result.detail ? ` ${result.detail}` : "";
        throw new Error(
          `${result.error || "Could not update vehicle."}${detailMessage}`,
        );
      }

      await refreshData();
      cancelEditing();
    } catch (error) {
      console.error("Error updating vehicle:", error);
      setEditError(error.message || "Could not update vehicle.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleExportExcel = () => {
    const excelData = filteredVehicles.map((v) => ({
      "Vehicle ID#": getDisplayVehicleId(v),
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
    XLSX.writeFile(workbook, "Fleet_Export.xlsx");
  };

  const toggleVehicleQr = (vehicleId) => {
    setVisibleQrByVehicle((prev) => ({
      ...prev,
      [vehicleId]: !prev[vehicleId],
    }));
  };

  return (
    <div className="fleet-section">
      <div
        style={{
          display: "grid",

          alignItems: "flex-start",
          marginBottom: "15px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <h2
          style={{
            margin: 0,
            color: "#3b82f6",
            height: "30px",
            marginTop: "10px",
          }}
        >
          My Fleet
        </h2>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "white",
              padding: "7px 12px",
              borderRadius: "8px",
              border: "1px solid #ddd",
              width: "100%",
              maxWidth: "400px",
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
          <button
            type="button"
            onClick={handleExportExcel}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              background: "#0f766e",
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
              {editingVehicleId === vehicle._id && (
                <div
                  style={{
                    marginBottom: "12px",
                    padding: "10px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    display: "grid",
                    gap: "8px",
                  }}
                >
                  <input
                    type="text"
                    value={editDraft?.vehicleNumber ?? ""}
                    onChange={(e) =>
                      handleEditDraftChange("vehicleNumber", e.target.value)
                    }
                    placeholder="Vehicle ID"
                  />
                  <input
                    type="number"
                    value={editDraft?.year ?? ""}
                    onChange={(e) =>
                      handleEditDraftChange("year", e.target.value)
                    }
                    placeholder="Year"
                  />
                  <input
                    type="text"
                    value={editDraft?.make ?? ""}
                    onChange={(e) =>
                      handleEditDraftChange("make", e.target.value)
                    }
                    placeholder="Make"
                  />
                  <input
                    type="text"
                    value={editDraft?.model ?? ""}
                    onChange={(e) =>
                      handleEditDraftChange("model", e.target.value)
                    }
                    placeholder="Model"
                  />
                  <input
                    type="text"
                    value={editDraft?.vin ?? ""}
                    onChange={(e) =>
                      handleEditDraftChange("vin", e.target.value)
                    }
                    placeholder="VIN"
                  />
                  <select
                    value={editDraft?.status ?? "Active"}
                    onChange={(e) =>
                      handleEditDraftChange("status", e.target.value)
                    }
                  >
                    <option value="Active">Active</option>
                    <option value="In Shop">In Shop</option>
                    <option value="Out of Service">Out of Service</option>
                  </select>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => saveVehicleEdits(vehicle._id)}
                      disabled={isSavingEdit}
                      style={{
                        flex: 1,
                        padding: "8px 10px",
                        background: "#0f766e",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "600",
                      }}
                    >
                      {isSavingEdit ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      disabled={isSavingEdit}
                      style={{
                        flex: 1,
                        padding: "8px 10px",
                        background: "#e2e8f0",
                        color: "#0f172a",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "600",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                  {editError ? (
                    <p
                      style={{
                        margin: 0,
                        fontSize: "13px",
                        color: "#b91c1c",
                        fontWeight: "600",
                      }}
                    >
                      {editError}
                    </p>
                  ) : null}
                </div>
              )}

              <button
                type="button"
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

              <button
                type="button"
                onClick={() =>
                  editingVehicleId === vehicle._id
                    ? cancelEditing()
                    : startEditing(vehicle)
                }
                style={{
                  position: "absolute",
                  top: "20px",
                  right: "56px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#2563eb",
                  fontSize: "13px",
                  fontWeight: "700",
                }}
                title={
                  editingVehicleId === vehicle._id
                    ? "Cancel editing"
                    : "Edit vehicle"
                }
              >
                {editingVehicleId === vehicle._id ? "Close" : "Edit"}
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
                  #{getDisplayVehicleId(vehicle)}
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
                <Activity size={18} color={getStatusColor(vehicle.status)} />
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
                type="button"
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

              <button
                type="button"
                onClick={() => onOpenCompliance(vehicle)}
                style={{
                  width: "100%",
                  padding: "8px",
                  marginBottom: "12px",
                  background: "#ecfeff",
                  border: "1px solid #bae6fd",
                  borderRadius: "6px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  color: "#0c4a6e",
                  fontWeight: "600",
                }}
              >
                <ShieldCheck size={16} /> Compliance
              </button>

              <button
                type="button"
                onClick={() => toggleVehicleQr(vehicle._id)}
                style={{
                  width: "100%",
                  padding: "8px",
                  marginBottom: "12px",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  borderRadius: "6px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  color: "#1d4ed8",
                  fontWeight: "600",
                }}
              >
                {visibleQrByVehicle[vehicle._id]
                  ? "Hide QR Code"
                  : "Show QR Code"}
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
                      <li
                        key={doc._id || `${doc.fileUrl}-${doc.title}-${index}`}
                        style={{ marginBottom: "4px" }}
                      >
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

              {visibleQrByVehicle[vehicle._id] && (
                <VehicleQRCode vehicleId={vehicle._id} vin={vehicle.vin} />
              )}
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

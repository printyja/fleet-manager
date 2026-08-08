import { Activity, Hash, ExternalLink } from "lucide-react";
import TaskForm from "./TaskForm";
import VehicleQRCode from "./VehicleQRCode";
import DocumentUpload from "./DocumentUpload"; // Import the document tool

function VehicleList({ vehicles, refreshData }) {
  return (
    <div className="fleet-section">
      <h2 style={{ marginTop: 0 }}>My Fleet</h2>
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

              {/* Display list of uploaded documents if they exist */}
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

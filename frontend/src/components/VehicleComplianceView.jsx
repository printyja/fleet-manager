import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  ExternalLink,
  FileText,
  ShieldCheck,
  Upload,
} from "lucide-react";

const UPCOMING_WINDOW_DAYS = 30;

const complianceTypes = [
  { key: "registration", label: "Copy of Registration" },
  { key: "dot_inspection", label: "Annual DOT Inspection" },
];

function getDaysUntil(expirationDate) {
  if (!expirationDate) return null;
  const today = new Date();
  const expires = new Date(expirationDate);
  const millisPerDay = 24 * 60 * 60 * 1000;
  return Math.ceil((expires - today) / millisPerDay);
}

function getDocStatus(doc) {
  if (!doc) {
    return { kind: "missing", message: "Missing - upload required" };
  }

  const daysUntil = getDaysUntil(doc.expirationDate);
  if (daysUntil === null) {
    return { kind: "no-expiry", message: "No expiration date set" };
  }

  if (daysUntil < 0) {
    return {
      kind: "expired",
      message: `Expired ${Math.abs(daysUntil)} day(s) ago`,
    };
  }

  if (daysUntil <= UPCOMING_WINDOW_DAYS) {
    return {
      kind: "upcoming",
      message: `Expiring in ${daysUntil} day(s)`,
    };
  }

  return {
    kind: "current",
    message: `Current (${daysUntil} day(s) remaining)`,
  };
}

function VehicleComplianceView({ vehicle, onBack, onDataChanged }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    documentType: "registration",
    expirationDate: "",
    file: null,
  });

  const loadComplianceDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/vehicles/${vehicle._id}/compliance-documents`,
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to load compliance documents");
      }
      setDocuments(data);
    } catch (error) {
      console.error("Error loading compliance documents:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplianceDocuments();
  }, [vehicle._id]);

  const latestByType = useMemo(() => {
    const latest = {};
    for (const type of complianceTypes) {
      latest[type.key] =
        documents.find((doc) => doc.documentType === type.key) || null;
    }
    return latest;
  }, [documents]);

  const alerts = useMemo(() => {
    return complianceTypes
      .map((type) => {
        const doc = latestByType[type.key];
        const status = getDocStatus(doc);
        return {
          key: type.key,
          label: type.label,
          status,
          doc,
        };
      })
      .filter((entry) =>
        ["missing", "expired", "upcoming"].includes(entry.status.kind),
      );
  }, [latestByType]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!formData.file) return;

    setUploading(true);
    const payload = new FormData();
    payload.append("documentType", formData.documentType);
    payload.append("expirationDate", formData.expirationDate);
    payload.append("document", formData.file);

    try {
      const response = await fetch(
        `/api/vehicles/${vehicle._id}/compliance-documents`,
        {
          method: "POST",
          body: payload,
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setFormData({
        documentType: formData.documentType,
        expirationDate: "",
        file: null,
      });

      await loadComplianceDocuments();
      if (onDataChanged) onDataChanged();
    } catch (error) {
      console.error("Compliance upload failed:", error);
      window.alert(error.message || "Could not upload compliance document");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="compliance-section">
      <div className="compliance-header-row">
        <button type="button" className="back-btn" onClick={onBack}>
          <ArrowLeft size={16} /> Back to Fleet
        </button>
      </div>

      <div className="compliance-hero">
        <h2
          style={{
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <ShieldCheck size={20} /> Compliance Center
        </h2>
        <p style={{ margin: "8px 0 0 0", color: "#475569" }}>
          #{vehicle.vehicleNumber || vehicle.vehicleId || "N/A"} -{" "}
          {vehicle.year} {vehicle.make} {vehicle.model}
        </p>
      </div>

      <div className="compliance-alerts">
        <h3 style={{ marginTop: 0 }}>Automated Alerts</h3>
        {alerts.length === 0 ? (
          <p style={{ margin: 0, color: "#166534" }}>
            All required compliance documents are current.
          </p>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.key}
              className={`compliance-alert ${alert.status.kind}`}
            >
              <AlertTriangle size={16} />
              <div>
                <strong>{alert.label}</strong>
                <div style={{ fontSize: "13px" }}>{alert.status.message}</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="compliance-grid">
        {complianceTypes.map((type) => {
          const doc = latestByType[type.key];
          const status = getDocStatus(doc);
          return (
            <div key={type.key} className="compliance-card">
              <h4
                style={{
                  margin: "0 0 10px 0",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <FileText size={16} /> {type.label}
              </h4>

              {!doc ? (
                <p style={{ margin: 0, color: "#9a3412" }}>
                  No document uploaded yet.
                </p>
              ) : (
                <>
                  <p style={{ margin: "0 0 8px 0" }}>
                    <a
                      href={`http://localhost:3000${doc.fileUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: "#2563eb",
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      View document <ExternalLink size={13} />
                    </a>
                  </p>
                  <p
                    style={{
                      margin: "0 0 6px 0",
                      fontSize: "13px",
                      color: "#475569",
                    }}
                  >
                    Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "13px",
                      color: "#475569",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <CalendarClock size={14} />
                    Expires:{" "}
                    {doc.expirationDate
                      ? new Date(doc.expirationDate).toLocaleDateString()
                      : "Not set"}
                  </p>
                  <div className={`status-pill ${status.kind}`}>
                    {status.message}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="compliance-upload-panel">
        <h3 style={{ marginTop: 0 }}>Upload Compliance Document</h3>
        <form className="compliance-upload-form" onSubmit={handleUpload}>
          <select
            value={formData.documentType}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, documentType: e.target.value }))
            }
            required
          >
            <option value="registration">Copy of Registration</option>
            <option value="dot_inspection">Annual DOT Inspection</option>
          </select>

          <input
            type="date"
            value={formData.expirationDate}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                expirationDate: e.target.value,
              }))
            }
            required
          />

          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                file: e.target.files?.[0] || null,
              }))
            }
            required
          />

          <button type="submit" className="submit-btn" disabled={uploading}>
            <Upload size={14} />{" "}
            {uploading ? "Uploading..." : "Upload Document"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default VehicleComplianceView;

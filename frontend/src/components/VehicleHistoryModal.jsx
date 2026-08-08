/*Maintenance History Tracker: pop-up window (a Modal) that appears when you click a "View History" button on any truck, displaying its complete timeline of pending and completed jobs.*/

import { useState, useEffect } from "react";
import { X, Clock, CheckCircle, History } from "lucide-react";

function VehicleHistoryModal({ vehicle, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/vehicles/${vehicle._id}/tasks`)
      .then((res) => res.json())
      .then((data) => {
        const sortedHistory = [...data].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        );
        setHistory(sortedHistory);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching history:", err);
        setLoading(false);
      });
  }, [vehicle._id]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #94a4ca",
            paddingBottom: "12px",
            marginBottom: "16px",
          }}
        >
          <h2
            style={{
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#1769aa",
            }}
          >
            <History size={22} /> Maintenance History
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            <X size={24} color="#64748b" />
          </button>
        </div>

        <h3 style={{ marginTop: 0, color: "#334155" }}>
          {vehicle.year} {vehicle.make} {vehicle.model}
        </h3>

        {loading ? (
          <p>Loading records...</p>
        ) : history.length === 0 ? (
          <p>No maintenance records found for this vehicle.</p>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {history.map((task) => (
              <div
                key={task._id}
                style={{
                  padding: "12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  background:
                    task.status === "Completed" ? "#f0fdf4" : "#fffbeb",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "10px",
                    marginBottom: "4px",
                    fontSize: "16px",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      overflowWrap: "anywhere",
                      wordBreak: "break-word",
                      lineHeight: 1.4,
                    }}
                  >
                    <strong>{task.description}</strong>
                  </div>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "13px",
                      color:
                        task.status === "Completed" ? "#16a34a" : "#d97706",
                      fontWeight: "bold",
                      flexShrink: 0,
                    }}
                  >
                    {task.status === "Completed" ? (
                      <CheckCircle size={14} />
                    ) : (
                      <Clock size={14} />
                    )}
                    {task.status}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  Date Created: {new Date(task.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default VehicleHistoryModal;

/* Vehicle page opened by scanning a vehicle's QR code (/vehicle/:id): shows the truck's details and its open and completed jobs. */

import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle, Clock, Hash, Activity } from "lucide-react";

function VehicleScanView({ vehicleId, onClose }) {
  const [vehicle, setVehicle] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadVehicle = async () => {
      setLoading(true);
      setError("");

      try {
        const [vehicleResponse, tasksResponse] = await Promise.all([
          fetch(`/api/vehicles/${vehicleId}`),
          fetch(`/api/vehicles/${vehicleId}/tasks`),
        ]);

        if (!vehicleResponse.ok) {
          throw new Error(
            vehicleResponse.status === 404 || vehicleResponse.status === 400
              ? "This QR code doesn't match any vehicle in the fleet. It may have been deleted."
              : "Could not load this vehicle. Please try again.",
          );
        }

        const vehicleData = await vehicleResponse.json();
        const tasksData = tasksResponse.ok ? await tasksResponse.json() : [];
        setVehicle(vehicleData);
        setTasks(Array.isArray(tasksData) ? tasksData : []);
      } catch (err) {
        console.error("Error loading scanned vehicle:", err);
        setError(err.message || "Could not load this vehicle.");
      } finally {
        setLoading(false);
      }
    };

    loadVehicle();
  }, [vehicleId]);

  const completeTask = async (taskId) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Completed" }),
      });

      if (response.ok) {
        const result = await response.json();
        setTasks((prev) =>
          prev.map((task) => (task._id === taskId ? result.data : task)),
        );
      }
    } catch (err) {
      console.error("Error completing task:", err);
    }
  };

  const pendingTasks = tasks
    .filter((task) => task.status !== "Completed")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const completedTasks = tasks
    .filter((task) => task.status === "Completed")
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  const backButton = (
    <button
      type="button"
      onClick={onClose}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        background: "none",
        border: "none",
        color: "#2563eb",
        cursor: "pointer",
        fontWeight: "600",
        padding: 0,
        marginBottom: "15px",
      }}
    >
      <ArrowLeft size={18} /> Back to dashboard
    </button>
  );

  if (loading) {
    return (
      <div className="mechanic-section">
        {backButton}
        <p>Loading vehicle...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mechanic-section">
        {backButton}
        <p style={{ color: "#b91c1c", fontWeight: "600" }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="mechanic-section">
      {backButton}

      <div className="card" style={{ marginBottom: "20px" }}>
        <h2 style={{ marginTop: 0, marginBottom: "12px" }}>
          <span style={{ color: "#3b82f6", marginRight: "6px" }}>
            #{vehicle.vehicleNumber || "N/A"}
          </span>
          {vehicle.year} {vehicle.make} {vehicle.model}
        </h2>
        <p
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            margin: "0 0 8px",
          }}
        >
          <Hash size={18} color="#666" />
          <span>
            <strong>VIN:</strong> {vehicle.vin}
          </span>
        </p>
        <p
          style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0 }}
        >
          <Activity size={18} color="#666" />
          <span>
            <strong>Status:</strong> {vehicle.status}
          </span>
        </p>
      </div>

      <div className="task-columns">
        <div className="task-column pending">
          <h3 className="task-column-title">
            <Clock size={20} color="#d97706" /> Open Jobs
            <span className="task-count-badge">{pendingTasks.length}</span>
          </h3>
          {pendingTasks.length === 0 ? (
            <p className="task-empty-state">No open jobs for this vehicle.</p>
          ) : (
            pendingTasks.map((task) => (
              <div key={task._id} className="task-card">
                <p className="task-description">
                  <strong>Job:</strong> {task.description}
                </p>
                <p className="task-date-label">
                  Created: {new Date(task.createdAt).toLocaleDateString()}
                </p>
                <button
                  type="button"
                  onClick={() => completeTask(task._id)}
                  className="complete-btn"
                >
                  Mark Completed
                </button>
              </div>
            ))
          )}
        </div>

        <div className="task-column completed">
          <h3 className="task-column-title">
            <CheckCircle size={20} color="#16a34a" /> Completed
            <span className="task-count-badge success">
              {completedTasks.length}
            </span>
          </h3>
          {completedTasks.length === 0 ? (
            <p className="task-empty-state">No completed jobs yet.</p>
          ) : (
            completedTasks.map((task) => (
              <div key={task._id} className="task-card success">
                <p className="task-description">
                  <strong>Job:</strong> {task.description}
                </p>
                <p className="task-date-label">
                  Completed: {new Date(task.updatedAt).toLocaleDateString()}
                </p>
                <p className="task-done-label">Done</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default VehicleScanView;

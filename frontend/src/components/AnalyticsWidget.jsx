import { useState, useEffect } from "react";
import { Truck, Activity, Wrench } from "lucide-react";

function AnalyticsWidget({ vehicles }) {
  const [tasks, setTasks] = useState([]);

  // Fetch the tasks to calculate how many are currently pending
  useEffect(() => {
    fetch("/api/tasks")
      .then((res) => res.json())
      .then((data) => setTasks(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching tasks:", err));
  }, []);

  // Calculate our metrics
  const safeVehicles = Array.isArray(vehicles) ? vehicles : [];
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  const totalVehicles = safeVehicles.length;
  const activeVehicles = safeVehicles.filter(
    (v) => v.status === "Active",
  ).length;
  const pendingTasks = safeTasks.filter((t) => t.status === "Pending").length;

  return (
    <div className="analytics-grid">
      <div className="stat-card">
        <div
          className="stat-icon"
          style={{ backgroundColor: "#eff6ff", color: "#3b82f6" }}
        >
          <Truck size={24} />
        </div>
        <div className="stat-details">
          <h3>Total Vehicles</h3>
          <p>{totalVehicles}</p>
        </div>
      </div>

      <div className="stat-card">
        <div
          className="stat-icon"
          style={{ backgroundColor: "#f0fdf4", color: "#22c55e" }}
        >
          <Activity size={24} />
        </div>
        <div className="stat-details">
          <h3>Active on Road</h3>
          <p>{activeVehicles}</p>
        </div>
      </div>

      <div className="stat-card">
        <div
          className="stat-icon"
          style={{ backgroundColor: "#fef2f2", color: "#ef4444" }}
        >
          <Wrench size={24} />
        </div>
        <div className="stat-details">
          <h3>Pending Jobs</h3>
          <p>{pendingTasks}</p>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsWidget;

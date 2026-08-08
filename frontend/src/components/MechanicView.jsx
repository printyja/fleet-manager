import { useState, useEffect } from "react";
import { CheckCircle, Clock, Download } from "lucide-react";
import * as XLSX from "xlsx";

// Accept vehicles array as a prop
function MechanicView({ vehicles }) {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetch("/api/tasks")
      .then((res) => res.json())
      .then((data) => setTasks(data))
      .catch((err) => console.error("Error fetching tasks:", err));
  }, []);

  const completeTask = async (taskId) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Completed" }),
      });

      if (response.ok) {
        const result = await response.json();
        setTasks(
          tasks.map((task) => (task._id === taskId ? result.data : task)),
        );
      }
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  // Helper function to get clean vehicle details for the task
  const getVehicleDetails = (vehicleId) => {
    const vehicle = vehicles.find((v) => v._id === vehicleId);
    if (vehicle) {
      return `Unit #${vehicle.vehicleNumber || "N/A"} - ${vehicle.year} ${vehicle.model}`;
    }
    // Fallback if the vehicle was deleted from the database
    return `Unknown Vehicle (ID: ${vehicleId.slice(-6)})`;
  };

  const handleExportLogs = () => {
    const excelData = tasks.map((t) => ({
      Vehicle: getVehicleDetails(t.vehicleId),
      "Job Description": t.description,
      Status: t.status,
      "Date Created": new Date(t.createdAt).toLocaleDateString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Maintenance_Logs");

    XLSX.writeFile(workbook, "LJG_Maintenance_Logs.xlsx");
  };

  const pendingTasks = tasks
    .filter((task) => task.status === "Pending")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const completedTasks = tasks
    .filter((task) => task.status === "Completed")
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt) -
        new Date(a.updatedAt || a.createdAt),
    );

  return (
    <div className="mechanic-section">
      <div className="mechanic-toolbar">
        <div>
          <h2 className="mechanic-title">Mechanic Task Board</h2>
        </div>

        <button
          type="button"
          onClick={handleExportLogs}
          className="mechanic-export-btn"
        >
          <Download size={16} /> Export Excel
        </button>
      </div>

      <div className="task-columns">
        <div className="task-column pending">
          <h3 className="task-column-title">
            <Clock size={20} color="#d97706" /> Pending Jobs
            <span className="task-count-badge">{pendingTasks.length}</span>
          </h3>
          {pendingTasks.length === 0 ? (
            <p className="task-empty-state">No pending jobs.</p>
          ) : (
            pendingTasks.map((task) => (
              <div key={task._id} className="task-card">
                <p className="task-vehicle-label">
                  {getVehicleDetails(task.vehicleId)}
                </p>
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
                <p className="task-vehicle-label success">
                  {getVehicleDetails(task.vehicleId)}
                </p>
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

export default MechanicView;

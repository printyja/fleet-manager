import { useState, useEffect } from "react";
import { CheckCircle, Clock, Download } from "lucide-react";
import * as XLSX from "xlsx";

function MechanicView() {
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

  // --- UPGRADED: Handle Exporting Logs to Excel (.xlsx) ---
  const handleExportLogs = () => {
    const excelData = tasks.map((t) => ({
      "Vehicle ID": t.vehicleId,
      "Job Description": t.description,
      Status: t.status,
      "Date Created": new Date(t.createdAt).toLocaleDateString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Maintenance_Logs");

    XLSX.writeFile(workbook, "LJG_Maintenance_Logs.xlsx");
  };

  const pendingTasks = tasks.filter((task) => task.status === "Pending");
  const completedTasks = tasks.filter((task) => task.status === "Completed");

  return (
    <div className="mechanic-section">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ margin: 0 }}>Mechanic Task Board</h2>

        <button
          onClick={handleExportLogs}
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
      </div>

      <div className="task-columns">
        <div className="task-column pending">
          <h3
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: 0,
            }}
          >
            <Clock size={20} color="#eab308" /> Pending Jobs (
            {pendingTasks.length})
          </h3>
          {pendingTasks.length === 0 ? (
            <p>No pending jobs!</p>
          ) : (
            pendingTasks.map((task) => (
              <div key={task._id} className="task-card">
                <p>
                  <strong>Vehicle ID:</strong> {task.vehicleId}
                </p>
                <p>
                  <strong>Job:</strong> {task.description}
                </p>
                <button
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
          <h3
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: 0,
            }}
          >
            <CheckCircle size={20} color="#22c55e" /> Completed (
            {completedTasks.length})
          </h3>
          {completedTasks.length === 0 ? (
            <p>No completed jobs yet.</p>
          ) : (
            completedTasks.map((task) => (
              <div key={task._id} className="task-card success">
                <p>
                  <strong>Vehicle ID:</strong> {task.vehicleId}
                </p>
                <p>
                  <strong>Job:</strong> {task.description}
                </p>
                <p
                  style={{
                    color: "green",
                    fontSize: "14px",
                    fontWeight: "bold",
                  }}
                >
                  ✔ Done
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default MechanicView;

import { useState, useEffect } from "react";
import { CheckCircle, Clock } from "lucide-react";

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
        // Automatically updates the task in our local list to move it to the completed column
        setTasks(
          tasks.map((task) => (task._id === taskId ? result.data : task)),
        );
      }
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  const pendingTasks = tasks.filter((task) => task.status === "Pending");
  const completedTasks = tasks.filter((task) => task.status === "Completed");

  return (
    <div className="mechanic-section">
      <h2 style={{ marginTop: 0 }}>Mechanic Task Board</h2>

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

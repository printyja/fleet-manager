import { useState, useEffect } from "react";
import Header from "./components/Header";
import VehicleForm from "./components/VehicleForm";
import VehicleList from "./components/VehicleList";
import MechanicView from "./components/MechanicView";
import AnalyticsWidget from "./components/AnalyticsWidget";
import VehicleComplianceView from "./components/VehicleComplianceView";
import Login from "./components/Login";
import "./App.css";

function App() {
  const [vehicles, setVehicles] = useState([]);
  const [activeTab, setActiveTab] = useState("admin");
  const [selectedComplianceVehicle, setSelectedComplianceVehicle] =
    useState(null);
  const [sessionRole, setSessionRole] = useState(null);
  const [authError, setAuthError] = useState("");
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const fetchVehicles = async () => {
    try {
      const response = await fetch("/api/vehicles");

      if (response.status === 401) {
        setSessionRole(null);
        setAuthError("Session expired. Please log in again.");
        setVehicles([]);
        return;
      }

      const data = await response.json();
      setVehicles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching vehicles:", err);
      setVehicles([]);
    }
  };

  useEffect(() => {
    const loadSession = async () => {
      try {
        const response = await fetch("/api/auth/session");
        if (!response.ok) {
          setSessionRole(null);
          return;
        }

        const data = await response.json();
        setSessionRole(data.role);
        setActiveTab(data.role === "admin" ? "admin" : "mechanic");
      } catch {
        setSessionRole(null);
      } finally {
        setIsAuthChecking(false);
      }
    };

    loadSession();
  }, []);

  useEffect(() => {
    if (!sessionRole) return;
    fetchVehicles();
  }, [sessionRole]);

  const handleVehicleAdded = (newVehicle) => {
    setVehicles((prevVehicles) => {
      if (!newVehicle || typeof newVehicle !== "object") {
        return prevVehicles;
      }

      return [...prevVehicles, newVehicle];
    });
  };

  const handleLogin = async ({ role, password }) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, password }),
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }
      if (!response.ok) {
        setAuthError(data.error || "Login failed.");
        return false;
      }

      setSessionRole(data.role);
      setActiveTab(data.role === "admin" ? "admin" : "mechanic");
      setSelectedComplianceVehicle(null);
      setAuthError("");
      return true;
    } catch {
      setAuthError("Could not reach login service.");
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // No-op; clear local state even if network logout fails.
    }

    setSessionRole(null);
    setActiveTab("admin");
    setSelectedComplianceVehicle(null);
    setAuthError("");
  };

  let content = null;
  const appFooter = (
    <footer className="app-footer">
      Site by Yinet © 2025 Fleet Asset Tracking. All rights reserved.
    </footer>
  );

  if (sessionRole === "mechanic") {
    content = <MechanicView vehicles={vehicles} />;
  } else if (activeTab === "admin") {
    if (selectedComplianceVehicle) {
      content = (
        <VehicleComplianceView
          vehicle={selectedComplianceVehicle}
          onBack={() => setSelectedComplianceVehicle(null)}
          onDataChanged={fetchVehicles}
        />
      );
    } else {
      content = (
        <>
          <AnalyticsWidget vehicles={vehicles} />
          <VehicleForm onVehicleAdded={handleVehicleAdded} />

          <div className="layout-grid">
            <VehicleList
              vehicles={vehicles}
              refreshData={fetchVehicles}
              onOpenCompliance={setSelectedComplianceVehicle}
            />
          </div>
        </>
      );
    }
  } else {
    content = <MechanicView vehicles={vehicles} />;
  }

  if (!sessionRole) {
    return (
      <div className="dashboard">
        <Header />
        <main className="dashboard-main">
          {isAuthChecking ? (
            <div className="login-shell">
              <div className="login-card">
                <p className="login-subtitle" style={{ margin: 0 }}>
                  Checking session...
                </p>
              </div>
            </div>
          ) : (
            <Login onLogin={handleLogin} errorMessage={authError} />
          )}
        </main>
        {appFooter}
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Header />

      <main className="dashboard-main">
        <div className="session-strip">
          <span>
            Signed in as{" "}
            <strong>{sessionRole === "admin" ? "Admin" : "Mechanic"}</strong>
          </span>
          <button
            type="button"
            className="session-switch-btn"
            onClick={handleLogout}
          >
            Switch User
          </button>
        </div>

        {sessionRole === "admin" && (
          <div className="tabs">
            <button
              type="button"
              className={activeTab === "admin" ? "tab-btn active" : "tab-btn"}
              onClick={() => setActiveTab("admin")}
            >
              Admin Dashboard
            </button>
            <button
              type="button"
              className={
                activeTab === "mechanic" ? "tab-btn active" : "tab-btn"
              }
              onClick={() => setActiveTab("mechanic")}
            >
              Mechanic Portal
            </button>
          </div>
        )}

        {content}
      </main>
      {appFooter}
    </div>
  );
}

export default App;

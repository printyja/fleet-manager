import { useState } from "react";
import { ShieldCheck, Wrench, KeyRound } from "lucide-react";

function Login({ onLogin, errorMessage }) {
  const [role, setRole] = useState("mechanic");
  const [password, setPassword] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onLogin({ role, password });
  };

  return (
    <section className="login-shell">
      <div className="login-card">
        <h2 className="login-title" style={{ color: "black" }}>
          Who are You
        </h2>
        <p className="login-subtitle">
          Choose your role to access the appropriate workspace.
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="role-picker">
            <button
              type="button"
              className={`role-btn ${role === "admin" ? "active" : ""}`}
              onClick={() => setRole("admin")}
            >
              <ShieldCheck size={16} /> Admin
            </button>
            <button
              type="button"
              className={`role-btn ${role === "mechanic" ? "active" : ""}`}
              onClick={() => setRole("mechanic")}
            >
              <Wrench size={16} /> Mechanic
            </button>
          </div>

          {role === "admin" && (
            <label className="login-label">
              <span>
                <KeyRound size={14} /> Admin Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                required
              />
            </label>
          )}

          {errorMessage ? <p className="login-error">{errorMessage}</p> : null}

          <button type="submit" className="submit-btn login-submit-btn">
            {role === "admin" ? "Unlock Admin Access" : "Enter Mechanic Board"}
          </button>
        </form>

        {role === "mechanic" ? (
          <p className="login-note">
            Mechanic access does not require a password and only shows the task
            board.
          </p>
        ) : null}
      </div>
    </section>
  );
}

export default Login;

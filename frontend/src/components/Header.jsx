import { Truck } from "lucide-react";

function Header() {
  return (
    <header className="header">
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Truck size={28} color="white" />
        <h1
          style={{
            margin: 0,
            fontSize: "22px",
            fontWeight: "600",
            letterSpacing: "0.5px",
          }}
        >
          Association JP Enterprises Inc - Admin Dashboard
        </h1>
      </div>
      <p style={{ margin: "6px 0 0 0", fontSize: "14px", color: "#cbd5e1" }}>
        Live Fleet Asset Tracking
      </p>
    </header>
  );
}

export default Header;

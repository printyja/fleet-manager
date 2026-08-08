import { QRCodeSVG } from "qrcode.react";

function VehicleQRCode({ vehicleId, vin }) {
  // In a live app, this URL would point to your actual website domain (e.g., https://ljgfreights.com/trucks/...)
  // For now, it points to the local link that a phone on the same network could scan
  const scanUrl = `http://localhost:5173/vehicle/${vehicleId}`;

  return (
    <div
      style={{
        marginTop: "15px",
        padding: "10px",
        background: "#f8fafc",
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        gap: "15px",
        border: "1px solid #e2e8f0",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "5px",
          borderRadius: "4px",
          border: "1px solid #ddd",
        }}
      >
        <QRCodeSVG value={scanUrl} size={60} />
      </div>
      <div>
        <p
          style={{
            margin: "0 0 4px 0",
            fontSize: "13px",
            fontWeight: "bold",
            color: "#334155",
          }}
        >
          Mechanic Quick Scan
        </p>
        <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>
          ID: {vehicleId.slice(-6)}
        </p>
      </div>
    </div>
  );
}

export default VehicleQRCode;

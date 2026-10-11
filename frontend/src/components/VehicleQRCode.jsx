import { QRCodeSVG } from "qrcode.react";

// The QR code must point at an address a phone can reach. By default that is the
// address this page was opened from (the live site in production). When working
// on localhost, set VITE_PUBLIC_APP_URL (e.g. http://192.168.1.20:5173 or the
// deployed site URL) so phones don't get sent to their own "localhost".
const publicAppUrl = (
  import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin
).replace(/\/+$/, "");

function VehicleQRCode({ vehicleId }) {
  const scanUrl = `${publicAppUrl}/vehicle/${vehicleId}`;

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
      <div style={{ minWidth: 0 }}>
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
        <a
          href={scanUrl}
          style={{
            display: "block",
            fontSize: "11px",
            color: "#2563eb",
            overflowWrap: "anywhere",
          }}
        >
          {scanUrl}
        </a>
      </div>
    </div>
  );
}

export default VehicleQRCode;

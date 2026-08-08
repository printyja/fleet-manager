import { useState } from "react";
import { PlusCircle, X } from "lucide-react";

function VehicleForm({ onVehicleAdded }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    vehicleNumber: "",
    year: "",
    make: "",
    model: "",
    vin: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        onVehicleAdded(result.data);
        setFormData({
          vehicleNumber: "",
          year: "",
          make: "",
          model: "",
          vin: "",
        });
        setIsOpen(false); // Close form on success
      }
    } catch (error) {
      console.error("Error saving vehicle:", error);
    }
  };

  if (!isOpen) {
    return (
      <div
        className="form-section"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "30px",
        }}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="submit-btn"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "16px",
            padding: "12px 24px",
          }}
        >
          <PlusCircle size={20} /> Add New Asset
        </button>
      </div>
    );
  }

  return (
    <div className="form-section">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <h2
          style={{
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#1769aa",
          }}
        >
          <PlusCircle size={20} color="#1769aa" /> Add New Asset
        </h2>
        <button
          onClick={() => setIsOpen(false)}
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          <X size={20} color="#64748b" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="vehicle-form">
        <input
          type="text"
          name="vehicleNumber"
          placeholder="Vehicle ID# (e.g. Unit 101)"
          value={formData.vehicleNumber}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="year"
          placeholder="Year"
          value={formData.year}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="make"
          placeholder="Make (e.g. Freightliner)"
          value={formData.make}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="model"
          placeholder="Model (e.g. Cascadia)"
          value={formData.model}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="vin"
          placeholder="VIN Number"
          value={formData.vin}
          onChange={handleChange}
          required
        />

        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            style={{
              flex: 1,
              padding: "12px",
              background: "#f1f5f9",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
              color: "#475569",
            }}
          >
            Cancel
          </button>
          <button type="submit" className="submit-btn" style={{ flex: 2 }}>
            Save Asset
          </button>
        </div>
      </form>
    </div>
  );
}

export default VehicleForm;

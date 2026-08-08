import { useState } from "react";
import { PlusCircle } from "lucide-react";

// We pass in a function called 'onVehicleAdded' to tell the main App when a new truck is saved
function VehicleForm({ onVehicleAdded }) {
  const [formData, setFormData] = useState({
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
        onVehicleAdded(result.data); // Sends the new vehicle back to App.jsx
        setFormData({ year: "", make: "", model: "", vin: "" }); // Clears the form
      }
    } catch (error) {
      console.error("Error saving vehicle:", error);
    }
  };

  return (
    <div className="form-section">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        <PlusCircle size={20} color="#0f172a" />
        <h2 style={{ margin: 0 }}>Add New Asset</h2>
      </div>

      <form onSubmit={handleSubmit} className="vehicle-form">
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
        <button type="submit" className="submit-btn">
          Add to Fleet
        </button>
      </form>
    </div>
  );
}

export default VehicleForm;

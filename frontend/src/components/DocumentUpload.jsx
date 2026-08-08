import { useState } from "react";
import { FileText, Upload } from "lucide-react";

function DocumentUpload({ vehicleId, onUploadSuccess }) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !title) return;

    setUploading(true);

    // We use FormData instead of JSON because we are sending a physical file
    const formData = new FormData();
    formData.append("title", title);
    formData.append("document", file);

    try {
      const response = await fetch(`/api/vehicles/${vehicleId}/documents`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setTitle("");
        setFile(null);
        onUploadSuccess(); // Triggers a refresh to show the new document
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      style={{
        marginTop: "15px",
        paddingTop: "15px",
        borderTop: "1px dashed #ccc",
      }}
    >
      <h4
        style={{
          margin: "0 0 10px 0",
          display: "flex",
          alignItems: "center",
          gap: "5px",
        }}
      >
        <FileText size={16} /> Compliance Docs
      </h4>

      <form
        onSubmit={handleUpload}
        style={{ display: "flex", flexDirection: "column", gap: "8px" }}
      >
        <input
          type="text"
          placeholder="Doc Name (e.g., DOT Inspection)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{
            padding: "8px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "13px",
          }}
        />
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setFile(e.target.files[0])}
            required
            style={{ flex: 1, fontSize: "13px" }}
          />
          <button
            type="submit"
            disabled={uploading}
            style={{
              background: "#3b82f6",
              color: "white",
              border: "none",
              padding: "6px 12px",
              borderRadius: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "13px",
            }}
          >
            <Upload size={14} /> {uploading ? "..." : "Upload"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default DocumentUpload;

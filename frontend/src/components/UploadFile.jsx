import React, { useState } from "react";
import API from "../api/axiosClient";
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";
import "../App.css";

function UploadFile() {
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const uploadFile = async (type) => {
    if (!file) {
      setMsg({ text: "Please select a file first", type: "error" });
      return;
    }

    setLoading(true);
    setMsg(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await API.post(`/upload/${type}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = res.data;
      let successText = `Successfully Uploaded ${data.rowsInserted} rows.`;
      
      if (type === "dispatched" && data.reconciledOrders > 0) {
        successText += ` Reconciled & Closed ${data.reconciledOrders} Pending Orders!`;
      }

      setMsg({ text: successText, type: "success" });
      setFile(null);
      document.getElementById("fileInput").value = "";

    } catch (err) {
      console.error(err);
      setMsg({ text: "Upload failed. Please check the file format.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-main" style={{ maxWidth: "800px" }}>
      <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
        
        <div style={{ background: "#eff6ff", width: "80px", height: "80px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <UploadCloud size={40} color="#2563eb" />
        </div>

        <h1>Upload Data File</h1>
        <p style={{ color: "#6b7280", marginBottom: "30px" }}>
          Upload your daily <b>Pending Orders (.xlsx and .csv)</b> or <b>Dispatch Reports (.xlsx and .csv)</b> to update the dashboard.
        </p>

        {/* Custom File Input */}
        <div style={{ marginBottom: "30px" }}>
          <input
            id="fileInput"
            type="file"
            accept=".csv, .xlsx"
            style={{ display: "none" }}
            onChange={(e) => setFile(e.target.files[0])}
          />
          <label htmlFor="fileInput" className="btn btn-secondary" style={{ padding: "15px 30px", borderStyle: "dashed", borderWidth: "2px", display: "inline-flex", flexDirection: "column", gap: "10px", height: "auto" }}>
            <FileSpreadsheet size={24} />
            {file ? file.name : "Click to select a file"}
          </label>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap" }}>
          <button 
            className="btn btn-primary" 
            style={{ backgroundColor: "#f59e0b" }}
            onClick={() => uploadFile("pending")} 
            disabled={loading}
          >
            {loading ? "Processing..." : "Upload as Pending Orders"}
          </button>

          <button 
            className="btn btn-primary"
            style={{ backgroundColor: "#10b981" }}
            onClick={() => uploadFile("dispatched")} 
            disabled={loading}
          >
            {loading ? "Processing..." : "Upload as Dispatch Report"}
          </button>
        </div>

        {/* Feedback Message */}
        {msg && (
          <div style={{ 
            marginTop: "30px", 
            padding: "15px", 
            borderRadius: "8px",
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            backgroundColor: msg.type === "success" ? "#ecfdf5" : "#fef2f2",
            color: msg.type === "success" ? "#065f46" : "#991b1b"
          }}>
            {msg.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {msg.text}
          </div>
        )}

      </div>
    </div>
  );
}

export default UploadFile;
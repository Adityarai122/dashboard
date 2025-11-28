import React, { useState, useRef } from "react";
import API from "../api/axiosClient";
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertCircle, Loader } from "lucide-react";
import "../App.css";

function UploadFile() {
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Progress State
  const [progress, setProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [statusText, setStatusText] = useState("");
  const startTimeRef = useRef(null);

  const uploadFile = async (type) => {
    if (!file) {
      setMsg({ text: "Please select a file first", type: "error" });
      return;
    }

    setLoading(true);
    setMsg(null);
    setProgress(0);
    setEstimatedTime("Calculating...");
    setStatusText("Uploading to server...");
    startTimeRef.current = Date.now();

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Extended timeout for large processing (though Axios default is usually unlimited for uploads)
      const res = await API.post(`/upload/${type}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 1000 * 60 * 30, // 30 Minutes timeout for the request
        // Track Upload Progress
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);

          // Calculate Estimated Time Remaining
          const timeElapsed = (Date.now() - startTimeRef.current) / 1000; // in seconds
          const uploadSpeed = progressEvent.loaded / timeElapsed; // bytes per second
          const totalBytes = progressEvent.total;
          const remainingBytes = totalBytes - progressEvent.loaded;
          const secondsRemaining = remainingBytes / uploadSpeed;

          if (secondsRemaining < 60) {
            setEstimatedTime(`${Math.ceil(secondsRemaining)} seconds remaining`);
          } else {
            setEstimatedTime(`${Math.ceil(secondsRemaining / 60)} minutes remaining`);
          }

          if (percentCompleted === 100) {
            setStatusText("Server is processing data... (Do not close)");
            setEstimatedTime("This step depends on file size and DB speed.");
          }
        },
      });

      const data = res.data;
      let successText = `Successfully Processed ${data.rowsInserted} rows.`;
      
      if (type === "dispatched" && data.reconciledOrders > 0) {
        successText += ` Reconciled & Closed ${data.reconciledOrders} Pending Orders!`;
      }

      setMsg({ text: successText, type: "success" });
      setFile(null);
      document.getElementById("fileInput").value = "";

    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.error || "Upload failed. Please check the file format or connection.";
      setMsg({ text: errorMessage, type: "error" });
    } finally {
      setLoading(false);
      // Keep progress at 100 if successful so user sees it finished
      if (!msg) setProgress(100); 
      setEstimatedTime(null);
      setStatusText("");
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
          Upload your daily <b>Pending Orders (.xlsx/.csv)</b> or <b>Dispatch Reports (.xlsx/.csv)</b> to update the dashboard.
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
          <label htmlFor="fileInput" className="btn btn-secondary" style={{ padding: "15px 30px", borderStyle: "dashed", borderWidth: "2px", display: "inline-flex", flexDirection: "column", gap: "10px", height: "auto", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}>
            <FileSpreadsheet size={24} />
            {file ? file.name : "Click to select a file"}
          </label>
        </div>

        {/* Progress Bar Section */}
        {loading && (
          <div style={{ marginBottom: "30px", textAlign: "left", background: "#f9fafb", padding: "15px", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", fontSize: "0.9rem", fontWeight: "600", color: "#374151" }}>
              <span>{statusText}</span>
              <span>{progress}%</span>
            </div>
            
            {/* The Bar */}
            <div style={{ width: "100%", height: "10px", background: "#e5e7eb", borderRadius: "5px", overflow: "hidden" }}>
              <div style={{ 
                width: `${progress}%`, 
                height: "100%", 
                background: progress === 100 ? "#10b981" : "#2563eb", 
                transition: "width 0.3s ease" 
              }}></div>
            </div>

            <div style={{ marginTop: "8px", fontSize: "0.85rem", color: "#6b7280", display: "flex", alignItems: "center", gap: "6px" }}>
              <Loader size={14} className={progress < 100 ? "" : "spin"} />
              {estimatedTime}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap" }}>
          <button 
            className="btn btn-primary" 
            style={{ backgroundColor: "#f59e0b", opacity: loading ? 0.6 : 1, pointerEvents: loading ? "none" : "auto" }}
            onClick={() => uploadFile("pending")} 
            disabled={loading}
          >
            {loading ? "Please Wait..." : "Upload as Pending Orders"}
          </button>

          <button 
            className="btn btn-primary"
            style={{ backgroundColor: "#10b981", opacity: loading ? 0.6 : 1, pointerEvents: loading ? "none" : "auto" }}
            onClick={() => uploadFile("dispatched")} 
            disabled={loading}
          >
            {loading ? "Please Wait..." : "Upload as Dispatch Report"}
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
            color: msg.type === "success" ? "#065f46" : "#991b1b",
            maxWidth: "100%"
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
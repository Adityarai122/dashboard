import React, { useState, useRef, useEffect } from "react";
import API from "../api/axiosClient";
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertCircle, Loader, Clock, CheckSquare, X, FileText } from "lucide-react";
import "../App.css";

function UploadFile() {
  const [activeTab, setActiveTab] = useState("pending"); // 'pending' or 'dispatched'
  const [files, setFiles] = useState([]); // Array of files
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Progress State
  const [progress, setProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [statusText, setStatusText] = useState("");
  const startTimeRef = useRef(null);

  // Auto-dismiss message after 4 seconds
  useEffect(() => {
    if (msg) {
      const timer = setTimeout(() => {
        setMsg(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [msg]);

  const handleFileChange = (e) => {
    // Convert FileList to Array and limit to 5
    const selectedFiles = Array.from(e.target.files).slice(0, 5);
    setFiles(selectedFiles);
    setMsg(null);
    setProgress(0);
  };

  const removeFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const uploadFiles = async () => {
    if (files.length === 0) {
      setMsg({ text: "Please select at least one file", type: "error" });
      return;
    }

    setLoading(true);
    setMsg(null);
    setProgress(0);
    setEstimatedTime("Calculating...");
    setStatusText(`Uploading ${files.length} file(s) to server...`);
    startTimeRef.current = Date.now();

    const formData = new FormData();
    // Append all files to the same field name 'file'
    files.forEach((file) => {
      formData.append("file", file);
    });

    const type = activeTab; // Use current active tab as type

    try {
      const res = await API.post(`/upload/${type}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 1000 * 60 * 30, // 30 Min Timeout
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);

          const timeElapsed = (Date.now() - startTimeRef.current) / 1000;
          const uploadSpeed = progressEvent.loaded / timeElapsed;
          const totalBytes = progressEvent.total;
          const remainingBytes = totalBytes - progressEvent.loaded;
          const secondsRemaining = remainingBytes / uploadSpeed;

          if (secondsRemaining < 60) {
            setEstimatedTime(`${Math.ceil(secondsRemaining)} seconds remaining`);
          } else {
            setEstimatedTime(`${Math.ceil(secondsRemaining / 60)} minutes remaining`);
          }

          if (percentCompleted === 100) {
            setStatusText("Server is processing batches... (Do not close)");
            setEstimatedTime("This step depends on total file size.");
          }
        },
      });

      const data = res.data;
      let successText = `Processed ${data.filesProcessed.length} files. ${data.rowsInserted} rows inserted.`;
      
      if (type === "dispatched" && data.reconciledOrders > 0) {
        successText += ` Reconciled ${data.reconciledOrders} orders!`;
      }

      setMsg({ text: successText, type: "success" });
      setFiles([]); // Clear files on success
      
      // Reset input
      const fileInput = document.getElementById(`fileInput-${activeTab}`);
      if (fileInput) fileInput.value = "";

    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.error || "Upload failed. Please check files or connection.";
      setMsg({ text: errorMessage, type: "error" });
    } finally {
      setLoading(false);
      if (!msg) setProgress(100); 
      setEstimatedTime(null);
      setStatusText("");
    }
  };

  return (
    <div className="container-main" style={{ maxWidth: "1000px", position: "relative" }}>
      <div style={{ textAlign: "center", marginBottom: "50px" }}>
        <h1 style={{ 
          fontSize: "3rem", 
          marginBottom: "15px", 
          background: "-webkit-linear-gradient(45deg, #111827, #374151)", 
          WebkitBackgroundClip: "text", 
          WebkitTextFillColor: "transparent",
          fontWeight: "800",
          letterSpacing: "-1px"
        }}>
          Data Import Center
        </h1>
        <p style={{ color: "#6b7280", fontSize: "1.1rem", fontWeight: "500" }}>Select the type of data you want to upload below.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", alignItems: "stretch" }}>
        
        {/* --- LEFT SECTION: PENDING ORDERS --- */}
        <div 
          onClick={() => { if (!loading) { setActiveTab("pending"); setFiles([]); setMsg(null); setProgress(0); } }}
          className={`card ${activeTab === "pending" ? "active-upload-card" : "inactive-upload-card"}`}
          style={{ 
            padding: "40px 30px", 
            cursor: loading ? "not-allowed" : "pointer",
            border: activeTab === "pending" ? "3px solid #f59e0b" : "1px solid #e5e7eb",
            background: activeTab === "pending" ? "linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)" : "#f9fafb",
            opacity: loading && activeTab !== "pending" ? 0.4 : (activeTab === "dispatched" ? 0.6 : 1), 
            filter: activeTab === "dispatched" ? "grayscale(100%)" : "none", 
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: activeTab === "pending" ? "scale(1.02)" : "scale(0.98)",
            boxShadow: activeTab === "pending" ? "0 20px 25px -5px rgba(245, 158, 11, 0.15), 0 10px 10px -5px rgba(245, 158, 11, 0.1)" : "none",
            borderRadius: "20px",
            position: "relative",
            overflow: "hidden"
          }}
        >
          {activeTab === "pending" && (
            <div style={{ 
              position: "absolute", top: "20px", right: "20px", 
              background: "#fef3c7", color: "#d97706", 
              padding: "6px 12px", borderRadius: "20px", 
              fontSize: "0.75rem", fontWeight: "800", 
              textTransform: "uppercase", letterSpacing: "1px",
              boxShadow: "0 2px 4px rgba(245, 158, 11, 0.1)"
            }}>
              Active
            </div>
          )}
          
          <div style={{ 
            background: activeTab === "pending" ? "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)" : "#e5e7eb", 
            width: "80px", height: "80px", borderRadius: "24px", 
            display: "flex", alignItems: "center", justifyContent: "center", 
            marginBottom: "25px", 
            boxShadow: activeTab === "pending" ? "0 10px 15px -3px rgba(245, 158, 11, 0.3)" : "none",
            transition: "all 0.3s ease"
          }}>
            <Clock size={40} color={activeTab === "pending" ? "white" : "#9ca3af"} strokeWidth={2.5} />
          </div>
          
          <h2 style={{ fontSize: "1.5rem", color: activeTab === "pending" ? "#92400e" : "#6b7280", marginBottom: "12px", fontWeight: "800" }}>1. Pending Orders</h2>
          <p style={{ fontSize: "1rem", color: activeTab === "pending" ? "#b45309" : "#9ca3af", lineHeight: "1.6", fontWeight: "500" }}>
            Upload new orders waiting to be processed.
          </p>
        </div>

        {/* --- RIGHT SECTION: DISPATCHED ORDERS --- */}
        <div 
          onClick={() => { if (!loading) { setActiveTab("dispatched"); setFiles([]); setMsg(null); setProgress(0); } }}
          className={`card ${activeTab === "dispatched" ? "active-upload-card" : "inactive-upload-card"}`}
          style={{ 
            padding: "40px 30px", 
            cursor: loading ? "not-allowed" : "pointer",
            border: activeTab === "dispatched" ? "3px solid #10b981" : "1px solid #e5e7eb",
            background: activeTab === "dispatched" ? "linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%)" : "#f9fafb",
            opacity: loading && activeTab !== "dispatched" ? 0.4 : (activeTab === "pending" ? 0.6 : 1), 
            filter: activeTab === "pending" ? "grayscale(100%)" : "none", 
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: activeTab === "dispatched" ? "scale(1.02)" : "scale(0.98)",
            boxShadow: activeTab === "dispatched" ? "0 20px 25px -5px rgba(16, 185, 129, 0.15), 0 10px 10px -5px rgba(16, 185, 129, 0.1)" : "none",
            borderRadius: "20px",
            position: "relative",
            overflow: "hidden"
          }}
        >
          {activeTab === "dispatched" && (
            <div style={{ 
              position: "absolute", top: "20px", right: "20px", 
              background: "#d1fae5", color: "#059669", 
              padding: "6px 12px", borderRadius: "20px", 
              fontSize: "0.75rem", fontWeight: "800", 
              textTransform: "uppercase", letterSpacing: "1px",
              boxShadow: "0 2px 4px rgba(16, 185, 129, 0.1)"
            }}>
              Active
            </div>
          )}

          <div style={{ 
            background: activeTab === "dispatched" ? "linear-gradient(135deg, #34d399 0%, #059669 100%)" : "#e5e7eb", 
            width: "80px", height: "80px", borderRadius: "24px", 
            display: "flex", alignItems: "center", justifyContent: "center", 
            marginBottom: "25px", 
            boxShadow: activeTab === "dispatched" ? "0 10px 15px -3px rgba(16, 185, 129, 0.3)" : "none",
            transition: "all 0.3s ease"
          }}>
            <CheckSquare size={40} color={activeTab === "dispatched" ? "white" : "#9ca3af"} strokeWidth={2.5} />
          </div>
          
          <h2 style={{ fontSize: "1.5rem", color: activeTab === "dispatched" ? "#065f46" : "#6b7280", marginBottom: "12px", fontWeight: "800" }}>2. Dispatch Reports</h2>
          <p style={{ fontSize: "1rem", color: activeTab === "dispatched" ? "#047857" : "#9ca3af", lineHeight: "1.6", fontWeight: "500" }}>
            Upload completed shipments to update history.
          </p>
        </div>

      </div>

      {/* --- ACTION AREA (Dynamic based on Selection) --- */}
      <div className="card" style={{ 
        marginTop: "40px", 
        padding: "50px", 
        textAlign: "center", 
        border: "none", 
        borderRadius: "24px",
        background: "white",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)",
        position: "relative",
        overflow: "visible" 
      }}>
        {/* Accent Bar at Top */}
        <div style={{ 
          position: "absolute", top: 0, left: 0, right: 0, height: "6px", 
          background: activeTab === "pending" ? "linear-gradient(to right, #f59e0b, #d97706)" : "linear-gradient(to right, #10b981, #059669)",
          transition: "background 0.3s ease"
        }}></div>
        
        <h3 style={{ marginBottom: "30px", color: "#1f2937", fontSize: "1.5rem", fontWeight: "700" }}>
          Upload {activeTab === "pending" ? "Pending Orders" : "Dispatch Reports"} (Max 5)
        </h3>

        {/* File Input */}
        <div style={{ marginBottom: "40px", display: "flex", justifyContent: "center" }}>
          <input
            id={`fileInput-${activeTab}`}
            type="file"
            accept=".csv, .xlsx"
            multiple // Allow multiple selection
            style={{ display: "none" }}
            onChange={handleFileChange}
            disabled={loading}
          />
          <label 
            htmlFor={`fileInput-${activeTab}`} 
            className="btn"
            style={{ 
              padding: "50px", 
              border: `3px dashed ${activeTab === "pending" ? "#fcd34d" : "#6ee7b7"}`, 
              borderRadius: "20px",
              cursor: loading ? "not-allowed" : "pointer", 
              background: activeTab === "pending" ? "#fffbeb" : "#ecfdf5",
              width: "100%",
              maxWidth: "600px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            }}
            onMouseOver={(e) => { if(!loading) {
              e.currentTarget.style.transform = "translateY(-5px)";
              e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.05)";
              e.currentTarget.style.borderColor = activeTab === "pending" ? "#f59e0b" : "#10b981";
            }}}
            onMouseOut={(e) => { if(!loading) {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.borderColor = activeTab === "pending" ? "#fcd34d" : "#6ee7b7";
            }}}
          >
            <div style={{ 
              background: "white", padding: "20px", borderRadius: "50%", 
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" 
            }}>
              <UploadCloud size={60} color={activeTab === "pending" ? "#f59e0b" : "#10b981"} strokeWidth={1.5} />
            </div>
            <div>
              <span style={{ display: "block", fontSize: "1.25rem", fontWeight: "700", color: "#374151", marginBottom: "5px" }}>
                {files.length > 0 ? `${files.length} File(s) Selected` : "Click to Browse Files"}
              </span>
              <span style={{ fontSize: "0.9rem", color: "#6b7280", fontWeight: "500" }}>
                Supports .xlsx and .csv formats
              </span>
            </div>
          </label>
        </div>

        {/* Selected Files List */}
        {files.length > 0 && (
          <div style={{ marginBottom: "30px", textAlign: "left", maxWidth: "600px", margin: "0 auto 30px auto" }}>
            <h4 style={{ fontSize: "0.9rem", color: "#6b7280", marginBottom: "10px" }}>Selected Files:</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {files.map((f, idx) => (
                <div key={idx} style={{ 
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  background: "#f9fafb", padding: "10px 15px", borderRadius: "8px", border: "1px solid #e5e7eb"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <FileText size={16} color="#6b7280" />
                    <span style={{ fontSize: "0.9rem", fontWeight: "500", color: "#374151" }}>{f.name}</span>
                  </div>
                  {!loading && (
                    <button onClick={() => removeFile(idx)} style={{ border: "none", background: "none", cursor: "pointer", color: "#ef4444" }}>
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {loading && (
          <div style={{ maxWidth: "600px", margin: "0 auto 40px auto", textAlign: "left" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.95rem", fontWeight: "700", color: "#374151" }}>
              <span>{statusText}</span>
              <span>{progress}%</span>
            </div>
            <div style={{ width: "100%", height: "12px", background: "#f3f4f6", borderRadius: "6px", overflow: "hidden", boxShadow: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)" }}>
              <div style={{ 
                width: `${progress}%`, 
                height: "100%", 
                background: activeTab === "pending" ? "linear-gradient(to right, #fbbf24, #d97706)" : "linear-gradient(to right, #34d399, #059669)", 
                transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                borderRadius: "6px"
              }}></div>
            </div>
            <div style={{ marginTop: "12px", fontSize: "0.9rem", color: "#6b7280", display: "flex", alignItems: "center", gap: "8px", fontWeight: "500" }}>
              <Loader size={16} className={progress < 100 ? "" : "spin"} />
              {estimatedTime || "Processing..."}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button 
          onClick={uploadFiles}
          disabled={loading || files.length === 0}
          className="btn"
          style={{ 
            background: loading || files.length === 0 ? "#f3f4f6" : (activeTab === "pending" ? "linear-gradient(to right, #f59e0b, #d97706)" : "linear-gradient(to right, #10b981, #059669)"),
            color: loading || files.length === 0 ? "#9ca3af" : "white",
            padding: "16px 50px",
            fontSize: "1.1rem",
            fontWeight: "700",
            border: "none",
            borderRadius: "12px",
            cursor: loading || files.length === 0 ? "not-allowed" : "pointer",
            boxShadow: loading || files.length === 0 ? "none" : (activeTab === "pending" ? "0 10px 20px -5px rgba(245, 158, 11, 0.4)" : "0 10px 20px -5px rgba(16, 185, 129, 0.4)"),
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: loading || files.length === 0 ? "none" : "translateY(0)"
          }}
          onMouseOver={(e) => { if(!loading && files.length > 0) e.currentTarget.style.transform = "translateY(-2px)" }}
          onMouseOut={(e) => { if(!loading && files.length > 0) e.currentTarget.style.transform = "translateY(0)" }}
        >
          {loading ? "Processing..." : `Upload ${files.length > 0 ? files.length : ""} File${files.length !== 1 ? "s" : ""} to ${activeTab === "pending" ? "Pending" : "History"}`}
        </button>

      </div>

      {/* --- TOAST NOTIFICATION (POPUP) --- */}
      {msg && (
        <div style={{ 
          position: "fixed",
          bottom: "30px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          background: msg.type === "success" ? "#ffffff" : "#fef2f2",
          borderLeft: `6px solid ${msg.type === "success" ? "#10b981" : "#ef4444"}`,
          borderRadius: "12px",
          padding: "16px 24px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          display: "flex",
          alignItems: "center",
          gap: "15px",
          minWidth: "350px",
          maxWidth: "90%",
          animation: "slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        }}>
          <div style={{ 
            background: msg.type === "success" ? "#ecfdf5" : "#fee2e2", 
            padding: "8px", 
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            {msg.type === "success" ? <CheckCircle size={24} color="#059669" /> : <AlertCircle size={24} color="#b91c1c" />}
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: "0 0 4px 0", color: msg.type === "success" ? "#065f46" : "#991b1b", fontSize: "1rem" }}>
              {msg.type === "success" ? "Upload Successful" : "Upload Failed"}
            </h4>
            <p style={{ margin: 0, color: msg.type === "success" ? "#047857" : "#b91c1c", fontSize: "0.9rem" }}>
              {msg.text}
            </p>
          </div>
          <button 
            onClick={() => setMsg(null)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: "4px" }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}

export default UploadFile;
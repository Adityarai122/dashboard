import React, { useEffect, useState, useCallback } from "react";
import API from "../api/axiosClient";
import OrdersTable from "../components/OrdersTable";
import { ChevronDown, ChevronUp, Users, PackageOpen, AlertCircle } from "lucide-react";
import "../App.css";

export default function OpenOrdersPage() {
  const [groupedData, setGroupedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState({}); // Track which customers are expanded

  // Fetch Function
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get(`/orders/pending`);
      setGroupedData(res.data);
      
      // FIX: Do NOT expand automatically. Start with everything collapsed.
      // This makes the UI cleaner initially and lets the user choose what to see.
      setExpanded({}); 

    } catch (err) {
      console.error("Error fetching open orders", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const toggleGroup = (customerId) => {
    setExpanded(prev => ({
      ...prev,
      [customerId]: !prev[customerId]
    }));
  };

  const totalOrders = groupedData.reduce((acc, group) => acc + group.count, 0);

  return (
    <div className="container-main">
      {/* Header Section */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "end", 
        marginBottom: "40px", 
        paddingBottom: "20px",
        borderBottom: "1px solid #e5e7eb"
      }}>
        <div>
          <h1 style={{ 
            marginBottom: "10px", 
            fontSize: "2.5rem", 
            background: "-webkit-linear-gradient(45deg, #111827, #374151)", 
            WebkitBackgroundClip: "text", 
            WebkitTextFillColor: "transparent",
            fontWeight: "800",
            letterSpacing: "-1px"
          }}>
            Open Orders Dashboard
          </h1>
          <p style={{ color: "#6b7280", maxWidth: "600px", lineHeight: "1.5", fontSize: "1.1rem" }}>
            Overview of all pending deliverables organized by Customer. 
            Click on a customer card to view detailed line items.
          </p>
        </div>
        
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.9rem", color: "#6b7280", marginBottom: "5px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Pending Items</div>
          <div style={{ 
            fontSize: "2.5rem", 
            fontWeight: "800", 
            color: "#d97706", 
            background: "#fffbeb", 
            padding: "5px 25px", 
            borderRadius: "16px",
            display: "inline-block",
            boxShadow: "0 4px 6px -1px rgba(245, 158, 11, 0.1)"
          }}>
            {totalOrders}
          </div>
        </div>
      </div>

      {/* --- GROUPED DATA LIST --- */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "80px", color: "#9ca3af" }}>
           <div className="loader" style={{ marginBottom: "15px" }}></div>
           <p style={{ fontSize: "1.1rem" }}>Fetching live order data...</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {groupedData.length === 0 ? (
            <div style={{ 
              textAlign: "center", 
              padding: "80px", 
              background: "white", 
              borderRadius: "24px",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)"
            }}>
              <PackageOpen size={64} color="#d1d5db" style={{ marginBottom: "20px" }} />
              <h3 style={{ color: "#374151", fontSize: "1.5rem", marginBottom: "10px" }}>All Caught Up!</h3>
              <p style={{ color: "#9ca3af", fontSize: "1.1rem" }}>No pending orders found in the system.</p>
            </div>
          ) : (
            groupedData.map((group) => (
              <div 
                key={group._id} 
                className="card" 
                style={{ 
                  padding: "0", 
                  overflow: "hidden", 
                  border: expanded[group._id] ? "2px solid #2563eb" : "1px solid #e5e7eb",
                  borderRadius: "16px",
                  boxShadow: expanded[group._id] ? "0 20px 25px -5px rgba(37, 99, 235, 0.1)" : "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                  transition: "all 0.3s ease"
                }}
              >
                
                {/* Stylish Header */}
                <div 
                  onClick={() => toggleGroup(group._id)}
                  style={{ 
                    padding: "20px 30px", 
                    background: expanded[group._id] ? "linear-gradient(to right, #eff6ff, #ffffff)" : "white",
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    cursor: "pointer",
                    userSelect: "none",
                    borderLeft: expanded[group._id] ? "6px solid #2563eb" : "6px solid transparent",
                    transition: "background 0.3s ease"
                  }}
                  className="group-header-hover"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    <div style={{ 
                      background: expanded[group._id] ? "#2563eb" : "#f3f4f6", 
                      width: "50px", 
                      height: "50px", 
                      borderRadius: "14px", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      color: expanded[group._id] ? "white" : "#6b7280",
                      transition: "all 0.3s ease",
                      boxShadow: expanded[group._id] ? "0 10px 15px -3px rgba(37, 99, 235, 0.3)" : "none"
                    }}>
                      <Users size={24} />
                    </div>
                    <div>
                      <h3 style={{ margin: "0 0 5px 0", fontSize: "1.25rem", color: "#1f2937", fontWeight: "700" }}>
                        {group._id || "Unknown Customer"}
                      </h3>
                      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                        <span style={{ fontSize: "0.9rem", color: expanded[group._id] ? "#1d4ed8" : "#6b7280", fontWeight: "500", display: "flex", alignItems: "center", gap: "6px" }}>
                          <AlertCircle size={14} color={expanded[group._id] ? "#1d4ed8" : "#9ca3af"} />
                          {group.count} Orders Pending
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ 
                    background: expanded[group._id] ? "#dbeafe" : "#f9fafb",
                    padding: "10px",
                    borderRadius: "50%",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    transform: expanded[group._id] ? "rotate(180deg)" : "rotate(0deg)"
                  }}>
                    <ChevronDown size={24} color={expanded[group._id] ? "#2563eb" : "#9ca3af"} />
                  </div>
                </div>

                {/* Body - Only shows when expanded */}
                {expanded[group._id] && (
                  <div style={{ padding: "20px 30px 30px 30px", background: "#ffffff", borderTop: "1px solid #e5e7eb", animation: "fadeIn 0.3s ease-in-out" }}>
                    <OrdersTable data={group.orders} />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .group-header-hover:hover {
          background-color: #f9fafb;
        }
      `}</style>
    </div>
  );
}
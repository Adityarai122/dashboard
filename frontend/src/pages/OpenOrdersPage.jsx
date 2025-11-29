import React, { useEffect, useState, useCallback } from "react";
import API from "../api/axiosClient";
import OrdersTable from "../components/OrdersTable";
import { ChevronDown, ChevronUp, Users, PackageOpen, AlertCircle, TrendingUp, Layers } from "lucide-react";
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
    <div className="container-main" style={{ backgroundColor: "#f8fafc", minHeight: "100vh", padding: "40px" }}>
      
      {/* Header Section */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "50px", 
        paddingBottom: "25px",
        borderBottom: "2px solid #e2e8f0"
      }}>
        {/* Main Title Block */}
        <div>
          <h1 style={{ 
            margin: "0 0 10px 0", 
            fontSize: "2.8rem", 
            color: "#0f172a", // Dark Slate
            fontWeight: "900",
            letterSpacing: "-1px",
            display: "flex",
            alignItems: "center",
            gap: "15px"
          }}>
            <Layers size={45} color="#3b82f6" />
            Open Orders Dashboard
          </h1>
          <p style={{ color: "#475569", fontSize: "1.1rem", fontWeight: "500", margin: 0, maxWidth: "600px", lineHeight: "1.5" }}>
            Track and manage all pending deliverables. Orders are grouped by customer for efficient batch processing.
          </p>
        </div>
        
        {/* Dark Themed Stat Card */}
        <div style={{ 
          background: "linear-gradient(145deg, #1e293b, #0f172a)", // Dark gradient background
          padding: "25px 45px", 
          borderRadius: "24px",
          color: "white",
          boxShadow: "0 20px 40px -10px rgba(15, 23, 42, 0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
          textAlign: "center",
          border: "1px solid rgba(255,255,255,0.05)",
          minWidth: "200px"
        }}>
          <div style={{ 
            fontSize: "0.9rem", 
            color: "#94a3b8", 
            marginBottom: "8px", 
            fontWeight: "600", 
            textTransform: "uppercase", 
            letterSpacing: "2px",
            opacity: 0.9
          }}>
            Pending Items
          </div>
          <div style={{ 
            fontSize: "4rem", 
            fontWeight: "800", 
            background: "linear-gradient(to right, #fbbf24, #f59e0b)", 
            WebkitBackgroundClip: "text", 
            WebkitTextFillColor: "transparent",
            lineHeight: "1",
            marginBottom: "5px",
            letterSpacing: "-2px",
            filter: "drop-shadow(0 4px 8px rgba(245, 158, 11, 0.3))"
          }}>
            {totalOrders}
          </div>
          <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "500" }}>Total Count</div>
        </div>
      </div>

      {/* --- GROUPED DATA LIST --- */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "100px", color: "#64748b" }}>
           <div className="loader" style={{ marginBottom: "20px", width: "40px", height: "40px", borderTopColor: "#0f172a" }}></div>
           <p style={{ fontSize: "1.2rem", fontWeight: "600", color: "#334155" }}>Fetching live order data...</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
          {groupedData.length === 0 ? (
            <div style={{ 
              textAlign: "center", 
              padding: "100px", 
              background: "white", 
              borderRadius: "30px",
              boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.05)",
              border: "1px solid #e2e8f0"
            }}>
              <PackageOpen size={80} color="#cbd5e1" strokeWidth={1.5} style={{ marginBottom: "25px" }} />
              <h3 style={{ color: "#334155", fontSize: "1.8rem", marginBottom: "15px", fontWeight: "700" }}>All Caught Up!</h3>
              <p style={{ color: "#64748b", fontSize: "1.1rem" }}>No pending orders found in the system right now.</p>
            </div>
          ) : (
            groupedData.map((group) => (
              <div 
                key={group._id} 
                className="card-hover-effect"
                style={{ 
                  borderRadius: "20px",
                  background: "white",
                  border: expanded[group._id] ? "2px solid #3b82f6" : "1px solid #e2e8f0",
                  boxShadow: expanded[group._id] ? "0 20px 40px -5px rgba(59, 130, 246, 0.15)" : "0 4px 6px -1px rgba(0, 0, 0, 0.02)",
                  overflow: "hidden",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                }}
              >
                
                {/* Stylish Header */}
                <div 
                  onClick={() => toggleGroup(group._id)}
                  style={{ 
                    padding: "25px 35px", 
                    background: expanded[group._id] ? "linear-gradient(to right, #eff6ff, #ffffff)" : "white",
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    cursor: "pointer",
                    userSelect: "none",
                    transition: "background 0.3s ease"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "25px" }}>
                    
                    {/* Customer Icon Avatar */}
                    <div style={{ 
                      background: expanded[group._id] ? "#0f172a" : "#f1f5f9", // Dark background when expanded
                      width: "60px", 
                      height: "60px", 
                      borderRadius: "18px", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      color: expanded[group._id] ? "#fbbf24" : "#94a3b8", // Gold icon when expanded
                      transition: "all 0.3s ease",
                      boxShadow: expanded[group._id] ? "0 10px 20px -5px rgba(15, 23, 42, 0.3)" : "none"
                    }}>
                      <Users size={28} strokeWidth={2} />
                    </div>

                    <div>
                      <h3 style={{ 
                        margin: "0 0 6px 0", 
                        fontSize: "1.4rem", 
                        color: "#1e293b", 
                        fontWeight: "800",
                        letterSpacing: "-0.5px"
                      }}>
                        {group._id || "Unknown Customer"}
                      </h3>
                      
                      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                        <span style={{ 
                          fontSize: "0.9rem", 
                          color: expanded[group._id] ? "#1d4ed8" : "#64748b", 
                          fontWeight: "600", 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "8px",
                          background: expanded[group._id] ? "#dbeafe" : "transparent",
                          padding: expanded[group._id] ? "4px 10px" : "0",
                          borderRadius: "8px",
                          transition: "all 0.3s"
                        }}>
                          <AlertCircle size={16} color={expanded[group._id] ? "#1d4ed8" : "#94a3b8"} />
                          {group.count} Orders Pending
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expand/Collapse Button */}
                  <div style={{ 
                    background: expanded[group._id] ? "#e0e7ff" : "#f8fafc",
                    padding: "12px",
                    borderRadius: "50%",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    transform: expanded[group._id] ? "rotate(180deg)" : "rotate(0deg)",
                    color: expanded[group._id] ? "#3730a3" : "#cbd5e1"
                  }}>
                    <ChevronDown size={24} strokeWidth={2.5} />
                  </div>
                </div>

                {/* Body - Only shows when expanded */}
                {expanded[group._id] && (
                  <div style={{ 
                    padding: "30px", 
                    background: "#ffffff", 
                    borderTop: "1px solid #f1f5f9", 
                    animation: "slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1)" 
                  }}>
                    <OrdersTable data={group.orders} />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
      
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .card-hover-effect:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 30px -5px rgba(0, 0, 0, 0.08);
        }
      `}</style>
    </div>
  );
}
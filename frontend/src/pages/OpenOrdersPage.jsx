import React, { useEffect, useState, useCallback } from "react";
import API from "../api/axiosClient";
import OrdersTable from "../components/OrdersTable";
import { ChevronDown, ChevronUp, Users, PackageOpen } from "lucide-react";
import "../App.css";

export default function OpenOrdersPage() {
  const [groupedData, setGroupedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState({}); // Track which customers are expanded

  // Fetch Function (No filters needed anymore as per request)
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      // Just fetch the pending orders. Backend already groups them by customer.
      const res = await API.get(`/orders/pending`);
      setGroupedData(res.data);
      
      // Default: Expand groups with less than 5 orders, collapse huge ones to save space?
      // Or just expand all. Let's expand all for visibility.
      const initialExpandState = {};
      res.data.forEach(group => {
        initialExpandState[group._id] = true;
      });
      setExpanded(initialExpandState);

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
        marginBottom: "30px",
        paddingBottom: "20px",
        borderBottom: "1px solid #e5e7eb"
      }}>
        <div>
          <h1 style={{ marginBottom: "10px" }}>Open Orders Dashboard</h1>
          <p style={{ color: "#6b7280", maxWidth: "600px", lineHeight: "1.5" }}>
            Overview of all pending deliverables organized by Customer. 
            Prioritize shipments based on the volume below.
          </p>
        </div>
        
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.9rem", color: "#6b7280", marginBottom: "5px" }}>Total Pending Items</div>
          <div style={{ 
            fontSize: "2rem", 
            fontWeight: "800", 
            color: "#2563eb", 
            background: "#eff6ff", 
            padding: "5px 20px", 
            borderRadius: "12px",
            display: "inline-block"
          }}>
            {totalOrders}
          </div>
        </div>
      </div>

      {/* --- GROUPED DATA LIST --- */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#9ca3af" }}>
           <div className="loader" style={{ marginBottom: "10px" }}>Loading...</div>
           <p>Fetching live order data</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
          {groupedData.length === 0 ? (
            <div style={{ 
              textAlign: "center", 
              padding: "60px", 
              background: "white", 
              borderRadius: "12px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)"
            }}>
              <PackageOpen size={48} color="#d1d5db" style={{ marginBottom: "15px" }} />
              <h3 style={{ color: "#374151" }}>All Caught Up!</h3>
              <p style={{ color: "#9ca3af" }}>No pending orders found in the system.</p>
            </div>
          ) : (
            groupedData.map((group) => (
              <div 
                key={group._id} 
                className="card" 
                style={{ 
                  padding: "0", 
                  overflow: "hidden", 
                  border: "none",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
                }}
              >
                
                {/* Stylish Header */}
                <div 
                  onClick={() => toggleGroup(group._id)}
                  style={{ 
                    padding: "18px 25px", 
                    background: "linear-gradient(to right, #ffffff, #f9fafb)", 
                    borderBottom: expanded[group._id] ? "1px solid #e5e7eb" : "none",
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    cursor: "pointer",
                    userSelect: "none",
                    transition: "background 0.2s"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = "#f3f4f6"}
                  onMouseOut={(e) => e.currentTarget.style.background = "linear-gradient(to right, #ffffff, #f9fafb)"}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                    <div style={{ 
                      background: "#2563eb", 
                      width: "40px", 
                      height: "40px", 
                      borderRadius: "10px", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      color: "white",
                      boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.3)"
                    }}>
                      <Users size={20} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#1f2937", fontWeight: "700" }}>
                        {group._id || "Unknown Customer"}
                      </h3>
                      <span style={{ fontSize: "0.85rem", color: "#6b7280", display: "flex", alignItems: "center", gap: "5px" }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f59e0b" }}></span>
                        {group.count} Items Waiting
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ 
                    background: expanded[group._id] ? "#eff6ff" : "transparent",
                    padding: "8px",
                    borderRadius: "50%",
                    transition: "all 0.2s"
                  }}>
                    {expanded[group._id] ? <ChevronUp size={20} color="#2563eb" /> : <ChevronDown size={20} color="#9ca3af" />}
                  </div>
                </div>

                {/* Body */}
                {expanded[group._id] && (
                  <div style={{ padding: "15px", background: "#ffffff" }}>
                    <OrdersTable data={group.orders} />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
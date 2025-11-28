import React, { useEffect, useState } from "react";
import API from "../api/axiosClient";
import OrdersTable from "../components/OrdersTable";
import { ChevronDown, ChevronUp, PackageCheck } from "lucide-react";
import "../App.css";

export default function AllOrdersPage() {
  const [groupedData, setGroupedData] = useState([]);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    async function load() {
      try {
        const res = await API.get("/orders/all");
        setGroupedData(res.data);
      } catch (err) {
        console.error("Failed to load history", err);
      }
    }
    load();
  }, []);

  const toggleGroup = (customerId) => {
    setExpanded(prev => ({
      ...prev,
      [customerId]: !prev[customerId]
    }));
  };

  return (
    <div className="container-main">
      <h1>Dispatch History (Grouped)</h1>
      <p style={{ color: "#6b7280", marginBottom: "20px" }}>
        View all completed and dispatched orders, organized by customer.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        {groupedData.map((group) => (
          <div key={group._id} className="card" style={{ padding: "0", overflow: "hidden", borderLeft: "4px solid #10b981" }}>
            
            <div 
              onClick={() => toggleGroup(group._id)}
              style={{ 
                padding: "15px 20px", 
                background: "#f0fdf4", 
                borderBottom: expanded[group._id] ? "1px solid #e5e7eb" : "none",
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                cursor: "pointer"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ background: "#d1fae5", padding: "8px", borderRadius: "50%" }}>
                  <PackageCheck size={20} color="#059669" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#064e3b" }}>
                    {group._id || "Unknown Customer"}
                  </h3>
                  <span style={{ fontSize: "0.85rem", color: "#065f46" }}>
                    {group.count} Orders Dispatched
                  </span>
                </div>
              </div>
              
              {expanded[group._id] ? <ChevronUp size={20} color="#065f46" /> : <ChevronDown size={20} color="#065f46" />}
            </div>

            {expanded[group._id] && (
              <div style={{ padding: "10px" }}>
                <OrdersTable data={group.orders} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
import React, { useEffect, useState } from "react";
import API from "../api/axiosClient";
import { Link } from "react-router-dom";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell 
} from "recharts";
import { ArrowRight, Clock, CheckCircle, Truck, DollarSign, Users, Calendar, FileText, RefreshCw } from "lucide-react";
import "../App.css";

const COLORS_PENDING = ['#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trendRange, setTrendRange] = useState("1M"); 
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async (range, isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      else setRefreshing(true);
      
      const res = await API.get(`/orders/stats?range=${range}`);
      setData(res.data);
    } catch (err) {
      console.error("Failed to load dashboard stats", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats(trendRange);
    
    // Auto-refresh every 10 seconds to catch new uploads quickly
    const interval = setInterval(() => {
        loadStats(trendRange, true);
    }, 10000);
    return () => clearInterval(interval);
  }, [trendRange]);

  const handleRangeChange = (newRange) => {
    setTrendRange(newRange);
    loadStats(newRange);
  };

  if (!data && loading) {
    return (
      <div className="container-main" style={{ display: "flex", justifyContent: "center", paddingTop: "100px" }}>
        <div style={{ textAlign: "center", color: "#6b7280" }}>
          <div className="loader"></div>
          <p>Analyzing factory data...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumSignificantDigits: 3 }).format(val);
  const formatDate = (isoString) => new Date(isoString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  // Reusable Gradient Card
  const StatCard = ({ title, value, subValue, icon: Icon, gradient, link, linkText }) => (
    <div className="card" style={{ 
      background: gradient, 
      color: "white", 
      border: "none", 
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      position: "relative",
      overflow: "hidden"
    }}>
      <div style={{ position: "absolute", right: -20, top: -20, opacity: 0.2 }}>
        <Icon size={120} color="white" />
      </div>
      <div style={{ position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
          <div>
            <p style={{ margin: 0, fontSize: "0.9rem", opacity: 0.9, fontWeight: "500" }}>{title}</p>
            <h2 style={{ fontSize: "2.5rem", margin: "10px 0", fontWeight: "800", letterSpacing: "-1px" }}>{value}</h2>
            <div style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)", padding: "4px 10px", borderRadius: "8px", display: "inline-block", fontSize: "0.85rem", fontWeight: "500" }}>
              {subValue}
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.2)", padding: "10px", borderRadius: "12px" }}>
            <Icon size={24} color="white" />
          </div>
        </div>
        {link && (
          <Link to={link} style={{ marginTop: "20px", display: "inline-flex", alignItems: "center", gap: "5px", textDecoration: "none", color: "white", fontWeight: "600", fontSize: "0.85rem", opacity: 0.9 }}>
            {linkText} <ArrowRight size={16} />
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <div className="container-main">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: "30px" }}>
        <div>
          <h1 style={{ marginBottom: "5px", background: "-webkit-linear-gradient(45deg, #2563eb, #9333ea)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Executive Dashboard
          </h1>
          <p style={{ color: "#6b7280", margin: 0, fontWeight: "500" }}>Factory performance at a glance.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            {refreshing && <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>Updating...</span>}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#ffffff", padding: "8px 16px", borderRadius: "30px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
            <span style={{ height: "10px", width: "10px", background: "#10b981", borderRadius: "50%", display: "block", boxShadow: "0 0 0 2px #d1fae5" }}></span>
            <span style={{ fontSize: "0.85rem", color: "#374151", fontWeight: "600" }}>System Live</span>
            </div>
        </div>
      </div>
      
      {/* --- KPI CARDS --- */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "25px", marginBottom: "35px" }}>
        <StatCard title="Today's Output" value={data?.today?.totalCount || 0} subValue={`Val: ${formatCurrency(data?.today?.totalValue || 0)}`} icon={Truck} gradient="linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" />
        <StatCard title="Pending Orders" value={data?.pending?.totalCount || 0} subValue={`${data?.pending?.totalQuantity || 0} Items Queued`} icon={Clock} gradient="linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)" link="/open-orders" linkText="Manage Queue" />
        <StatCard title="Total Dispatched" value={data?.dispatched?.totalCount || 0} subValue={`${data?.dispatched?.totalQuantity || 0} Items Total`} icon={CheckCircle} gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)" link="/orders" linkText="View History" />
        <StatCard title="Pipeline Value" value={formatCurrency(data?.pending?.totalValue || 0)} subValue="Revenue at Risk" icon={DollarSign} gradient="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "25px", marginBottom: "30px" }}>
        
        {/* --- GRAPH: TOP PENDING COMPANIES (QUANTITY) --- */}
        <div className="card" style={{ padding: "25px", borderRadius: "16px", border: "1px solid #e5e7eb" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "25px" }}>
             <div style={{ background: "#fffbeb", padding: "8px", borderRadius: "8px" }}><Clock size={20} color="#d97706" /></div>
             <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "700", color: "#1f2937" }}>Top Pending Companies (Qty)</h2>
          </div>
          <div style={{ height: "500px", width: "100%" }}> {/* Increased Height for better visibility */}
            <ResponsiveContainer>
              <BarChart data={data?.topPendingByQty || []} layout="vertical" margin={{ left: 0, right: 30 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11, fill: "#4b5563", fontWeight: 600 }} />
                <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }} formatter={(value) => [value, "Pending Items"]} />
                <Bar dataKey="qty" radius={[0, 6, 6, 0]} barSize={28}>
                  {data?.topPendingByQty?.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS_PENDING[index % COLORS_PENDING.length]} />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* --- SECTION: RECENT UPLOAD LOG (Scrollable) --- */}
        <div className="card" style={{ padding: "25px", borderRadius: "16px", border: "1px solid #e5e7eb", overflow: "hidden", display: "flex", flexDirection: "column", background: "white", maxHeight: "600px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyItems: "space-between", marginBottom: "20px" }}>
             <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ background: "#eff6ff", padding: "8px", borderRadius: "8px" }}><FileText size={20} color="#2563eb" /></div>
                <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "700", color: "#1f2937" }}>Upload History</h2>
             </div>
             <button onClick={() => loadStats(trendRange, true)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer" }}>
                <RefreshCw size={16} color="#94a3b8" className={refreshing ? "spin" : ""} />
             </button>
          </div>
          
          <div style={{ overflowY: "auto", paddingRight: "5px", flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
            {data?.recentUploadLogs?.map((log, idx) => (
              <div key={idx} style={{ 
                padding: "16px", 
                borderLeft: `4px solid ${log.batchId === "PENDING" ? "#f59e0b" : "#10b981"}`, // Color coded border
                borderRadius: "8px", 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                background: "#f8fafc",
                boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                transition: "all 0.2s"
              }}>
                <div>
                  <div style={{ fontWeight: "700", color: "#1e293b", fontSize: "0.95rem", marginBottom: "4px" }}>
                    {log.fileName || "Unknown File"}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Calendar size={12} /> {formatDate(log.uploadDate)}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ 
                    fontSize: "1rem", fontWeight: "800", 
                    color: "#0f172a", 
                    marginBottom: "2px"
                  }}>
                    {log.totalItems} Items
                  </div>
                  <span style={{ 
                    fontSize: "0.7rem", 
                    color: log.batchId === "PENDING" ? "#d97706" : "#059669", 
                    background: log.batchId === "PENDING" ? "#fffbeb" : "#ecfdf5", 
                    padding: "2px 8px", 
                    borderRadius: "10px", 
                    fontWeight: "700",
                    textTransform: "uppercase"
                  }}>
                    {log.batchId || "UPLOAD"}
                  </span>
                </div>
              </div>
            ))}
            {(!data?.recentUploadLogs || data.recentUploadLogs.length === 0) && (
              <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8", fontStyle: "italic" }}>
                No uploads recorded yet.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
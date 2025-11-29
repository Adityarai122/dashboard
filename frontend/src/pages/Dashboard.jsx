import React, { useEffect, useState } from "react";
import API from "../api/axiosClient";
import { Link } from "react-router-dom";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, 
  AreaChart, Area, CartesianGrid 
} from "recharts";
import { ArrowRight, Clock, CheckCircle, Truck, DollarSign, Users, Activity, Calendar, FileText } from "lucide-react";
import "../App.css";

const COLORS_PENDING = ['#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f'];
const COLORS_DISPATCH = ['#10b981', '#059669', '#047857', '#065f46', '#064e3b'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trendRange, setTrendRange] = useState("1M"); 

  const loadStats = async (range) => {
    try {
      setLoading(true);
      const res = await API.get(`/orders/stats?range=${range}`);
      setData(res.data);
    } catch (err) {
      console.error("Failed to load dashboard stats", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats(trendRange);
  }, []);

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
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#ffffff", padding: "8px 16px", borderRadius: "30px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
          <span style={{ height: "10px", width: "10px", background: "#10b981", borderRadius: "50%", display: "block", boxShadow: "0 0 0 2px #d1fae5" }}></span>
          <span style={{ fontSize: "0.85rem", color: "#374151", fontWeight: "600" }}>System Live</span>
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
        
        {/* --- MAIN GRAPH: DISPATCH TREND --- */}
        <div className="card" style={{ padding: "25px", borderRadius: "16px", border: "1px solid #e5e7eb" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
             <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ background: "#ecfdf5", padding: "8px", borderRadius: "8px" }}><Activity size={20} color="#10b981" /></div>
                <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "700", color: "#1f2937" }}>Output Trend (Value)</h2>
             </div>
             <div style={{ display: "flex", background: "#f3f4f6", padding: "4px", borderRadius: "10px" }}>
                {['1W', '1M', '6M', '1Y'].map((range) => (
                  <button key={range} onClick={() => handleRangeChange(range)} style={{ border: "none", background: trendRange === range ? "white" : "transparent", color: trendRange === range ? "#0f172a" : "#64748b", fontWeight: trendRange === range ? "600" : "500", padding: "6px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", boxShadow: trendRange === range ? "0 2px 4px rgba(0,0,0,0.05)" : "none", transition: "all 0.2s" }}>{range}</button>
                ))}
             </div>
          </div>
          <div style={{ height: "300px", width: "100%" }}>
             <ResponsiveContainer>
              <AreaChart data={data?.trend || []}>
                <defs>
                  <linearGradient id="colorOutput" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} tickFormatter={(val) => val ? val.substring(5) : ""} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }} formatter={(value) => [formatCurrency(value), "Value"]} labelFormatter={(label) => `Date: ${label}`} />
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorOutput)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* --- GRAPH 2: TOP PENDING COMPANIES (QUANTITY) --- */}
        <div className="card" style={{ padding: "25px", borderRadius: "16px", border: "1px solid #e5e7eb" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "25px" }}>
             <div style={{ background: "#fffbeb", padding: "8px", borderRadius: "8px" }}><Clock size={20} color="#d97706" /></div>
             <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "700", color: "#1f2937" }}>Top Pending (Qty)</h2>
          </div>
          <div style={{ height: "300px", width: "100%" }}>
            <ResponsiveContainer>
              <BarChart data={data?.topPendingByQty || []} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: "#4b5563", fontWeight: 600 }} />
                <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }} formatter={(value) => [value, "Pending Items"]} />
                <Bar dataKey="qty" radius={[0, 6, 6, 0]} barSize={24}>
                  {data?.topPendingByQty?.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS_PENDING[index % COLORS_PENDING.length]} />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "25px" }}>
        
        {/* --- GRAPH 3: TOP DISPATCHED COMPANIES (QUANTITY) --- */}
        <div className="card" style={{ padding: "25px", borderRadius: "16px", border: "1px solid #e5e7eb" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "25px" }}>
             <div style={{ background: "#ecfdf5", padding: "8px", borderRadius: "8px" }}><Truck size={20} color="#059669" /></div>
             <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "700", color: "#1f2937" }}>Top Dispatched (Qty)</h2>
          </div>
          <div style={{ height: "350px", width: "100%" }}>
            <ResponsiveContainer>
              <BarChart data={data?.topDispatchedByQty || []} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11, fill: "#4b5563", fontWeight: 600 }} />
                <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }} formatter={(value) => [value, "Dispatched Items"]} />
                <Bar dataKey="qty" radius={[0, 6, 6, 0]} barSize={24}>
                  {data?.topDispatchedByQty?.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS_DISPATCH[index % COLORS_DISPATCH.length]} />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* --- NEW SECTION: RECENT UPLOAD LOG (File History) --- */}
        <div className="card" style={{ padding: "25px", borderRadius: "16px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
             <div style={{ background: "#eff6ff", padding: "8px", borderRadius: "8px" }}><FileText size={20} color="#2563eb" /></div>
             <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "700", color: "#1f2937" }}>Upload History (Log)</h2>
          </div>
          
          <div style={{ maxHeight: "350px", overflowY: "auto", paddingRight: "5px" }}>
            {data?.recentUploadLogs?.map((log, idx) => (
              <div key={idx} style={{ 
                marginBottom: "12px", 
                padding: "15px", 
                border: "1px solid #f3f4f6", 
                borderRadius: "12px", 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                background: "#f9fafb"
              }}>
                <div>
                  <div style={{ fontWeight: "600", color: "#374151", marginBottom: "4px" }}>
                    {log.fileName || "Unknown File"}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#9ca3af", display: "flex", alignItems: "center", gap: "5px" }}>
                    <Calendar size={12} /> {formatDate(log.uploadDate)}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ 
                    fontSize: "0.9rem", fontWeight: "700", 
                    color: "#10b981", background: "#ecfdf5", 
                    padding: "4px 10px", borderRadius: "6px",
                    display: "inline-block"
                  }}>
                    {log.totalItems} Items
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#10b981", marginTop: "4px", fontWeight: "500" }}>
                    Dispatched
                  </div>
                </div>
              </div>
            ))}
            {(!data?.recentUploadLogs || data.recentUploadLogs.length === 0) && (
              <div style={{ textAlign: "center", padding: "30px", color: "#9ca3af", fontStyle: "italic" }}>
                No uploads recorded yet.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
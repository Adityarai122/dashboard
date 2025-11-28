import React, { useEffect, useState } from "react";
import API from "../api/axiosClient";
import { Link } from "react-router-dom";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, 
  AreaChart, Area, CartesianGrid
} from "recharts";
import { ArrowRight, Clock, CheckCircle, Truck, DollarSign, Users, Activity } from "lucide-react";
import "../App.css";

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316'];

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Gradient Card Component
  const StatCard = ({ title, value, subValue, icon: Icon, gradient, link, linkText }) => (
    <div className="card" style={{ 
      background: gradient, 
      color: "white", 
      border: "none", 
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Background Decor */}
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
      
      {/* --- COLORFUL KPI CARDS --- */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "25px", marginBottom: "35px" }}>
        
        {/* Card 1: Today's Dispatch (Violet Gradient) */}
        <StatCard 
          title="Today's Output"
          value={data?.today?.totalCount || 0}
          subValue={`Value: ${formatCurrency(data?.today?.totalValue || 0)}`}
          icon={Truck}
          gradient="linear-gradient(135deg, #6366f1 0%, #a855f7 100%)"
        />

        {/* Card 2: Pending Orders (Orange Gradient) */}
        <StatCard 
          title="Pending Orders"
          value={data?.pending?.totalCount || 0}
          subValue={`${data?.pending?.totalQuantity || 0} Items Queued`}
          icon={Clock}
          gradient="linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)"
          link="/open-orders"
          linkText="Manage Queue"
        />

        {/* Card 3: Pipeline Value (Blue Gradient) */}
        <StatCard 
          title="Pipeline Value"
          value={formatCurrency(data?.pending?.totalValue || 0)}
          subValue="Projected Revenue"
          icon={DollarSign}
          gradient="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
        />

        {/* Card 4: Total Dispatched (Emerald Gradient) */}
        <StatCard 
          title="Total Dispatched"
          value={data?.dispatched?.totalCount || 0}
          subValue="Lifetime Completed"
          icon={CheckCircle}
          gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
          link="/orders"
          linkText="View History"
        />
      </div>

      {/* --- GRAPHS SECTION --- */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))", gap: "25px" }}>
        
        {/* Graph 1: Dispatch Trend */}
        <div className="card" style={{ padding: "25px", borderRadius: "16px", border: "1px solid #e5e7eb" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", flexWrap: "wrap", gap: "10px" }}>
             <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ background: "#ecfdf5", padding: "8px", borderRadius: "8px" }}>
                  <Activity size={20} color="#10b981" />
                </div>
                <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "700", color: "#1f2937" }}>Output Trend</h2>
             </div>
             
             {/* Trend Range Buttons */}
             <div style={{ display: "flex", background: "#f3f4f6", padding: "4px", borderRadius: "10px" }}>
                {['1W', '1M', '6M', '1Y'].map((range) => (
                  <button 
                    key={range}
                    onClick={() => handleRangeChange(range)}
                    style={{
                      border: "none",
                      background: trendRange === range ? "white" : "transparent",
                      color: trendRange === range ? "#0f172a" : "#64748b",
                      fontWeight: trendRange === range ? "600" : "500",
                      padding: "6px 14px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      boxShadow: trendRange === range ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
                      transition: "all 0.2s"
                    }}
                  >
                    {range}
                  </button>
                ))}
             </div>
          </div>

          <div style={{ height: "350px", width: "100%", position: "relative" }}>
             {loading && data && (
               <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(255,255,255,0.7)", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                 <div className="loader"></div>
               </div>
             )}

             <ResponsiveContainer>
              <AreaChart data={data?.trend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOutput" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11, fill: "#9ca3af" }} 
                  tickFormatter={(val) => val ? val.substring(5) : ""} 
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <Tooltip 
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                  formatter={(value) => [formatCurrency(value), "Dispatch Value"]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorOutput)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph 2: Top Customers */}
        <div className="card" style={{ padding: "25px", borderRadius: "16px", border: "1px solid #e5e7eb" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ background: "#dbeafe", padding: "8px", borderRadius: "8px" }}>
                  <Users size={20} color="#2563eb" />
                </div>
                <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "700", color: "#1f2937" }}>Top Clients (Pending)</h2>
             </div>
          </div>
          
          <div style={{ height: "350px", width: "100%" }}>
            <ResponsiveContainer>
              <BarChart data={data?.topCustomers || []} layout="vertical" margin={{ left: 0, right: 30 }}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={140} 
                  tick={{ fontSize: 12, fill: "#4b5563", fontWeight: 600 }} 
                />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }} 
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                  formatter={(value) => [formatCurrency(value), "Pending Value"]}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={32} animationDuration={1500}>
                  {data?.topCustomers?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
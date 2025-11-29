import React, { useState, useEffect, useCallback } from "react";
import API from "../api/axiosClient";
import { 
  Search, Sliders, X, ChevronDown, ChevronUp, 
  Package, Calendar, User, FileText, Truck, AlertCircle, CheckCircle, Info, Tag, DollarSign, Layers
} from "lucide-react";
import "../App.css";

// --- SUB-COMPONENTS FOR CLEANER CODE ---

const DetailRow = ({ label, value, icon: Icon }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
    <span style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.8px" }}>
      {label}
    </span>
    <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#1e293b", fontWeight: "600", fontSize: "0.95rem" }}>
      {Icon && <Icon size={16} color="#64748b" />}
      {value || <span style={{ color: "#cbd5e1" }}>-</span>}
    </div>
  </div>
);

const SearchResultCard = ({ order }) => {
  const [expanded, setExpanded] = useState(false);
  
  const isPending = order.status === "Pending";
  const statusColor = isPending ? "#f59e0b" : "#10b981"; 
  // Subtle gradient for card background
  const bgGradient = "white";

  const getRaw = (key) => order.raw?.[key] || order.raw?.[key.toUpperCase()] || "-";
  const description = order.raw?.["Item Description"] || order.raw?.["Description"] || "No description available.";

  return (
    <div className="card-hover-effect" style={{ 
      marginBottom: "20px", 
      padding: "0", 
      border: expanded ? `1px solid ${statusColor}` : "1px solid #e2e8f0",
      overflow: "hidden",
      borderRadius: "16px",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      background: "white",
      boxShadow: expanded ? "0 20px 40px -5px rgba(0, 0, 0, 0.1)" : "0 4px 6px -1px rgba(0, 0, 0, 0.05)"
    }}>
      {/* --- COLLAPSED HEADER --- */}
      <div 
        onClick={() => setExpanded(!expanded)}
        style={{ 
          padding: "20px 30px", 
          cursor: "pointer", 
          background: bgGradient,
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          borderLeft: `6px solid ${statusColor}`
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "25px", flex: 1 }}>
          
          {/* Status Icon */}
          <div style={{ 
            background: isPending ? "#fff7ed" : "#f0fdf4", 
            padding: "14px", 
            borderRadius: "14px",
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            boxShadow: isPending ? "0 4px 6px -1px rgba(245, 158, 11, 0.1)" : "0 4px 6px -1px rgba(16, 185, 129, 0.1)"
          }}>
            {isPending ? <AlertCircle size={24} color="#d97706" strokeWidth={2.5} /> : <CheckCircle size={24} color="#059669" strokeWidth={2.5} />}
          </div>

          {/* Primary Info */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
              <h3 style={{ margin: "0", fontSize: "1.2rem", color: "#0f172a", fontWeight: "800", letterSpacing: "-0.5px" }}>
                {order.poNumber || "No PO Number"}
              </h3>
              {order.lineItemNumber && (
                <span style={{ fontSize: "0.75rem", color: "#475569", background: "#f1f5f9", padding: "3px 8px", borderRadius: "6px", fontWeight: "700" }}>
                  Line: {order.lineItemNumber}
                </span>
              )}
               <span style={{ 
                  fontSize: "0.7rem", 
                  color: isPending ? "#92400e" : "#065f46", 
                  background: isPending ? "#fef3c7" : "#d1fae5", 
                  padding: "3px 10px", 
                  borderRadius: "20px",
                  fontWeight: "800",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  {isPending ? "Pending" : "Dispatched"}
                </span>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "25px", fontSize: "0.95rem", color: "#64748b" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "500" }}>
                <User size={16} strokeWidth={2} /> {order.customerName}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "500" }}>
                <Package size={16} strokeWidth={2} /> {order.productCode}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side Stats */}
        <div style={{ display: "flex", alignItems: "center", gap: "40px" }}>
          <div style={{ textAlign: "right", borderRight: "2px solid #f1f5f9", paddingRight: "30px" }}>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: "700", marginBottom: "2px" }}>Quantity</div>
            <div style={{ fontWeight: "900", color: "#1e293b", fontSize: "1.4rem" }}>
              {isPending ? order.pendingQuantity : order.dispatchQuantity} <span style={{fontSize: "0.9rem", fontWeight: "600", color: "#cbd5e1"}}>{getRaw("Unit")}</span>
            </div>
          </div>
          <div style={{ 
            background: expanded ? "#eff6ff" : "#f8fafc", 
            padding: "10px", 
            borderRadius: "50%", 
            color: expanded ? "#2563eb" : "#94a3b8",
            transition: "all 0.3s"
          }}>
            {expanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </div>
        </div>
      </div>

      {/* --- EXPANDED DETAILS SECTION --- */}
      {expanded && (
        <div style={{ padding: "30px", borderTop: "1px solid #f1f5f9", background: "#ffffff", animation: "slideDown 0.3s ease-out" }}>
          
          {/* Full Item Description */}
          <div style={{ marginBottom: "30px", padding: "20px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <h4 style={{ margin: "0 0 10px 0", fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}>
              <Info size={16} /> Item Description
            </h4>
            <p style={{ margin: 0, color: "#334155", lineHeight: "1.7", fontSize: "1rem", fontWeight: "500" }}>
              {description}
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "30px" }}>
            
            {/* Section 1: Product Specs */}
            <div>
              <h4 style={{ margin: "0 0 20px 0", fontSize: "1rem", color: "#0f172a", fontWeight: "800", display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{background: "#eff6ff", padding: "6px", borderRadius: "8px"}}><Package size={18} color="#3b82f6" /></div> Product Specs
              </h4>
              <div style={{ display: "grid", gap: "20px", padding: "20px", background: "white", border: "1px solid #e2e8f0", borderRadius: "16px" }}>
                <DetailRow label="Part Number" value={order.partNumber} icon={Tag} />
                <DetailRow label="Size / Dimensions" value={order.size} />
                <DetailRow label="Drawing No." value={order.drawingNumber} />
                <DetailRow label="Gross Weight" value={`${order.grossWeight || 0} kg`} />
                <DetailRow label="Rate" value={order.rate} icon={DollarSign} />
              </div>
            </div>

            {/* Section 2: Order Reference */}
            <div>
              <h4 style={{ margin: "0 0 20px 0", fontSize: "1rem", color: "#0f172a", fontWeight: "800", display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{background: "#f0fdf4", padding: "6px", borderRadius: "8px"}}><FileText size={18} color="#10b981" /></div> Reference Info
              </h4>
              <div style={{ display: "grid", gap: "20px", padding: "20px", background: "white", border: "1px solid #e2e8f0", borderRadius: "16px" }}>
                <DetailRow label="SO Number" value={order.soNumber} />
                <DetailRow label="Order Date" value={order.orderDate ? order.orderDate.substring(0, 10) : ""} icon={Calendar} />
                <DetailRow label="Source" value={isPending ? "Pending List" : "Dispatch Report"} icon={Layers} />
                <DetailRow label="Line Item ID" value={order.lineItemNumber} />
                <DetailRow label="Department" value={order.departmentRemark || getRaw("Department")} />
              </div>
            </div>

            {/* Section 3: Shipping / Status */}
            <div>
              <h4 style={{ margin: "0 0 20px 0", fontSize: "1rem", color: "#0f172a", fontWeight: "800", display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{background: "#fff7ed", padding: "6px", borderRadius: "8px"}}><Truck size={18} color="#f97316" /></div> Logistics
              </h4>
              <div style={{ display: "grid", gap: "20px", padding: "20px", background: "white", border: "1px solid #e2e8f0", borderRadius: "16px" }}>
                {isPending ? (
                   <>
                     <DetailRow label="Expected Delivery" value={order.expectedDeliveryDate ? order.expectedDeliveryDate.substring(0, 10) : "Not Set"} icon={Calendar} />
                     <DetailRow label="Pending Qty" value={order.pendingQuantity} />
                     <DetailRow label="Original Order Qty" value={order.quantity} />
                   </>
                ) : (
                   <>
                     <DetailRow label="Dispatch Date" value={order.dispatchDate ? order.dispatchDate.substring(0, 10) : "-"} icon={Calendar} />
                     <DetailRow label="Invoice Number" value={order.invoiceNumber} />
                     <DetailRow label="Transporter" value={order.transport || order.truckNumber} />
                     <DetailRow label="Pack Slip No" value={getRaw("Pack Slip No")} />
                   </>
                )}
              </div>
            </div>
            
          </div>

          {/* Remarks Footer */}
          {(order.departmentRemark || order.soSpecialRemark) && (
             <div style={{ marginTop: "30px", padding: "20px", background: "#fffbeb", borderRadius: "12px", border: "1px solid #fcd34d", display: "flex", gap: "15px", alignItems: "start" }}>
               <Info size={22} color="#d97706" style={{ flexShrink: 0, marginTop: "2px" }} />
               <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "#92400e", textTransform: "uppercase", marginBottom: "5px" }}>Remarks</div>
                  <div style={{ color: "#b45309", lineHeight: "1.5" }}>{order.departmentRemark} {order.soSpecialRemark}</div>
               </div>
             </div>
          )}

        </div>
      )}
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---

export default function SearchPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Search State
  const [query, setQuery] = useState("");
  const [advancedFilters, setAdvancedFilters] = useState({
    poNumber: "",
    customer: "",
    startDate: "",
    endDate: ""
  });

  // The Search Function
  const executeSearch = useCallback(async () => {
    if (!query && !advancedFilters.poNumber && !advancedFilters.customer && !advancedFilters.startDate) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (query) params.append("q", query);
      if (advancedFilters.poNumber) params.append("poNumber", advancedFilters.poNumber);
      if (advancedFilters.customer) params.append("customer", advancedFilters.customer);
      if (advancedFilters.startDate) params.append("startDate", advancedFilters.startDate);
      if (advancedFilters.endDate) params.append("endDate", advancedFilters.endDate);

      const res = await API.get(`/orders/search?${params.toString()}`);
      setResults(res.data);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setLoading(false);
    }
  }, [query, advancedFilters]);

  // Real-time Debounce Effect
  useEffect(() => {
    const timer = setTimeout(() => {
      executeSearch();
    }, 500); 
    return () => clearTimeout(timer);
  }, [executeSearch]);

  const handleAdvancedChange = (e) => {
    setAdvancedFilters({ ...advancedFilters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setQuery("");
    setAdvancedFilters({ poNumber: "", customer: "", startDate: "", endDate: "" });
    setResults([]);
  };

  return (
    <div className="container-main" style={{ background: "#f8fafc", minHeight: "100vh" }}>
      
      {/* --- HERO SECTION --- */}
      <div style={{ 
        background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", 
        padding: "60px 20px 100px 20px", 
        marginBottom: "-60px",
        textAlign: "center",
        color: "white" // Force text color to white for contrast
      }}>
        <h1 style={{ 
          fontSize: "3.5rem", // Larger size
          marginBottom: "20px", 
          fontWeight: "800",
          letterSpacing: "-1px",
          color: "#ffffff", // Pure white for heading
          textShadow: "0 4px 15px rgba(0,0,0,0.5)" // Enhanced shadow for readability
        }}>
          Global Order Search
        </h1>
        <p style={{ 
          color: "#cbd5e1", // Lighter grey for subtext
          fontSize: "1.2rem", 
          maxWidth: "700px", 
          margin: "0 auto", 
          lineHeight: "1.6",
          fontWeight: "500",
          textShadow: "0 2px 4px rgba(0,0,0,0.3)" 
        }}>
          Instantly locate orders across pending and dispatched databases. <br/>
          <span style={{ color: "#94a3b8", fontSize: "1rem" }}>Use the advanced filters for precise tracking.</span>
        </p>
      </div>
      
      {/* --- SEARCH CARD --- */}
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 20px" }}>
        <div className="card" style={{ 
          padding: "40px", 
          border: "none", 
          borderRadius: "24px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.2)"
        }}>
          
          <div style={{ position: "relative", marginBottom: "25px" }}>
            <Search size={28} style={{ position: "absolute", left: "25px", top: "22px", color: "#3b82f6" }} />
            <input 
              className="input-field" 
              style={{ 
                paddingLeft: "70px", 
                fontSize: "1.3rem", 
                paddingTop: "20px", 
                paddingBottom: "20px", 
                borderRadius: "16px",
                border: "2px solid #e2e8f0",
                width: "100%",
                background: "#f8fafc",
                fontWeight: "500",
                color: "#1e293b",
                transition: "all 0.2s"
              }}
              placeholder="Search by PO, Serial, Product Code, or Customer..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={(e) => { e.target.style.borderColor = "#3b82f6"; e.target.style.background = "white"; e.target.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.1)"; }}
              onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc"; e.target.style.boxShadow = "none"; }}
            />
            {query && (
              <button 
                onClick={() => setQuery("")}
                style={{ position: "absolute", right: "25px", top: "24px", background: "#f1f5f9", border: "none", borderRadius: "50%", padding: "6px", cursor: "pointer", color: "#64748b", transition: "background 0.2s" }}
                onMouseOver={(e) => e.currentTarget.style.background = "#e2e8f0"}
                onMouseOut={(e) => e.currentTarget.style.background = "#f1f5f9"}
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Toggle Advanced Filters */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button 
              className="btn" 
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{ 
                color: showAdvanced ? "#2563eb" : "#475569", 
                background: showAdvanced ? "#eff6ff" : "white",
                border: "1px solid",
                borderColor: showAdvanced ? "#bfdbfe" : "#cbd5e1",
                padding: "10px 20px",
                borderRadius: "10px",
                fontSize: "0.95rem",
                fontWeight: "600",
                display: "flex", alignItems: "center", gap: "8px",
                transition: "all 0.2s"
              }}
            >
              <Sliders size={18} />
              {showAdvanced ? "Hide Filters" : "Advanced Filters"}
            </button>
            
            {(query || advancedFilters.poNumber || advancedFilters.customer || advancedFilters.startDate) && (
              <button onClick={clearFilters} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.95rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                <X size={16} /> Clear All
              </button>
            )}
          </div>

          {/* --- COLLAPSIBLE ADVANCED PANEL --- */}
          {showAdvanced && (
            <div style={{ 
              marginTop: "30px", 
              paddingTop: "30px", 
              borderTop: "2px dashed #e2e8f0", 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", 
              gap: "25px",
              animation: "slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            }}>
              
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "0.85rem", fontWeight: "700", color: "#475569", textTransform: "uppercase" }}>Exact PO Number</label>
                <input className="input-field" name="poNumber" value={advancedFilters.poNumber} onChange={handleAdvancedChange} placeholder="e.g. 4500123" style={{ padding: "12px", borderRadius: "10px" }} />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "0.85rem", fontWeight: "700", color: "#475569", textTransform: "uppercase" }}>Customer Name</label>
                <input className="input-field" name="customer" value={advancedFilters.customer} onChange={handleAdvancedChange} placeholder="Filter by customer" style={{ padding: "12px", borderRadius: "10px" }} />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "0.85rem", fontWeight: "700", color: "#475569", textTransform: "uppercase" }}>Start Date</label>
                <input type="date" className="input-field" name="startDate" value={advancedFilters.startDate} onChange={handleAdvancedChange} style={{ padding: "12px", borderRadius: "10px" }} />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "0.85rem", fontWeight: "700", color: "#475569", textTransform: "uppercase" }}>End Date</label>
                <input type="date" className="input-field" name="endDate" value={advancedFilters.endDate} onChange={handleAdvancedChange} style={{ padding: "12px", borderRadius: "10px" }} />
              </div>

            </div>
          )}
        </div>

        {/* --- RESULTS SECTION --- */}
        <div style={{ marginTop: "40px" }}>
          {results.length > 0 && (
            <div style={{ marginBottom: "20px", color: "#64748b", fontWeight: "700", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ background: "#e2e8f0", color: "#0f172a", padding: "4px 10px", borderRadius: "8px", fontSize: "0.9rem" }}>{results.length}</div>
              Matching Records Found
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: "center", padding: "80px", color: "#94a3b8" }}>
               <div className="loader" style={{ marginBottom: "20px", width: "40px", height: "40px", borderTopColor: "#3b82f6" }}></div>
               <p style={{ marginTop: "15px", fontSize: "1.2rem", fontWeight: "500" }}>Searching global database...</p>
            </div>
          ) : (
            <div>
              {results.map((order, idx) => (
                 <SearchResultCard key={idx} order={order} />
              ))}
            </div>
          )}
          
          {!loading && results.length === 0 && (query || advancedFilters.poNumber) && (
            <div style={{ textAlign: "center", padding: "80px", background: "white", borderRadius: "24px", border: "1px solid #f1f5f9", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.05)" }}>
              <Search size={60} color="#cbd5e1" strokeWidth={1.5} style={{ marginBottom: "25px" }} />
              <h3 style={{ color: "#334155", margin: "0 0 10px 0", fontSize: "1.5rem" }}>No records found</h3>
              <p style={{ color: "#94a3b8", margin: 0, fontSize: "1.1rem" }}>We couldn't find any orders matching your criteria.</p>
            </div>
          )}
        </div>

      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .card-hover-effect:hover {
          transform: translateY(-4px);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
          border-color: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
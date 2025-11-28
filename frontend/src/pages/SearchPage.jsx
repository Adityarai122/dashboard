import React, { useState, useEffect, useCallback } from "react";
import API from "../api/axiosClient";
import { 
  Search, Sliders, X, ChevronDown, ChevronUp, 
  Package, Calendar, User, FileText, Truck, AlertCircle, CheckCircle, Info, Tag, DollarSign, Layers
} from "lucide-react";
import "../App.css";

// --- SUB-COMPONENTS FOR CLEANER CODE ---

const DetailRow = ({ label, value, icon: Icon }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
    <span style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
      {label}
    </span>
    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#1f2937", fontWeight: "500", fontSize: "0.95rem" }}>
      {Icon && <Icon size={15} color="#6b7280" />}
      {value || <span style={{ color: "#d1d5db" }}>-</span>}
    </div>
  </div>
);

const SearchResultCard = ({ order }) => {
  const [expanded, setExpanded] = useState(false);
  
  const isPending = order.status === "Pending";
  const statusColor = isPending ? "#f59e0b" : "#10b981"; // Orange vs Green
  const bgGradient = isPending 
    ? "linear-gradient(to right, #fffbeb, #ffffff)" 
    : "linear-gradient(to right, #ecfdf5, #ffffff)";

  // Helper to extract raw fields safely if top-level schema misses them
  const getRaw = (key) => order.raw?.[key] || order.raw?.[key.toUpperCase()] || "-";
  const description = order.raw?.["Item Description"] || order.raw?.["Description"] || "No description available.";

  return (
    <div className="card" style={{ 
      marginBottom: "15px", 
      padding: "0", 
      border: "1px solid #e5e7eb",
      overflow: "hidden",
      transition: "all 0.2s ease",
      boxShadow: expanded ? "0 10px 15px -3px rgba(0, 0, 0, 0.1)" : "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
    }}>
      {/* --- COLLAPSED HEADER (Always Visible) --- */}
      <div 
        onClick={() => setExpanded(!expanded)}
        style={{ 
          padding: "18px 25px", 
          cursor: "pointer", 
          background: bgGradient,
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          borderLeft: `5px solid ${statusColor}`
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px", flex: 1 }}>
          
          {/* Status Icon */}
          <div style={{ 
            background: isPending ? "#fef3c7" : "#d1fae5", 
            padding: "12px", 
            borderRadius: "50%",
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
          }}>
            {isPending ? <AlertCircle size={22} color="#d97706" /> : <CheckCircle size={22} color="#059669" />}
          </div>

          {/* Primary Info */}
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
              <h3 style={{ margin: "0", fontSize: "1.15rem", color: "#111827", fontWeight: "700" }}>
                {order.poNumber || "No PO Number"}
              </h3>
              {order.lineItemNumber && (
                <span style={{ fontSize: "0.85rem", color: "#6b7280", background: "#f3f4f6", padding: "2px 8px", borderRadius: "4px" }}>
                  Line: {order.lineItemNumber}
                </span>
              )}
               <span style={{ 
                  fontSize: "0.75rem", 
                  color: "white", 
                  background: isPending ? "#f59e0b" : "#10b981", 
                  padding: "2px 8px", 
                  borderRadius: "10px",
                  fontWeight: "600",
                  textTransform: "uppercase"
                }}>
                  {isPending ? "Pending" : "Dispatched"}
                </span>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "20px", fontSize: "0.9rem", color: "#4b5563", marginTop: "6px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <User size={15} color="#9ca3af" /> {order.customerName}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Package size={15} color="#9ca3af" /> {order.productCode}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side Stats */}
        <div style={{ display: "flex", alignItems: "center", gap: "30px" }}>
          <div style={{ textAlign: "right", borderRight: "1px solid #e5e7eb", paddingRight: "20px" }}>
            <div style={{ fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase" }}>Quantity</div>
            <div style={{ fontWeight: "800", color: "#1f2937", fontSize: "1.2rem" }}>
              {isPending ? order.pendingQuantity : order.dispatchQuantity} <span style={{fontSize: "0.8rem", fontWeight: "500", color: "#9ca3af"}}>{getRaw("Unit")}</span>
            </div>
          </div>
          <div style={{ color: "#9ca3af" }}>
            {expanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </div>
        </div>
      </div>

      {/* --- EXPANDED DETAILS SECTION --- */}
      {expanded && (
        <div style={{ padding: "25px", borderTop: "1px solid #f3f4f6", background: "#ffffff" }}>
          
          {/* Full Item Description */}
          <div style={{ marginBottom: "25px", padding: "15px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <h4 style={{ margin: "0 0 8px 0", fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "700" }}>
              Item Description
            </h4>
            <p style={{ margin: 0, color: "#334155", lineHeight: "1.6", fontSize: "0.95rem" }}>
              {description}
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "25px" }}>
            
            {/* Section 1: Product Specs */}
            <div style={{ background: "#f9fafb", padding: "20px", borderRadius: "12px", border: "1px solid #f3f4f6" }}>
              <h4 style={{ margin: "0 0 15px 0", fontSize: "0.95rem", color: "#2563eb", display: "flex", alignItems: "center", gap: "8px", fontWeight: "700" }}>
                <Package size={18} /> Product Specifications
              </h4>
              <div style={{ display: "grid", gap: "15px" }}>
                <DetailRow label="Part Number" value={order.partNumber} icon={Tag} />
                <DetailRow label="Size / Dimensions" value={order.size} />
                <DetailRow label="Drawing No." value={order.drawingNumber} />
                <DetailRow label="Gross Weight" value={`${order.grossWeight || 0} kg`} />
                <DetailRow label="Rate" value={order.rate} icon={DollarSign} />
              </div>
            </div>

            {/* Section 2: Order Reference */}
            <div style={{ background: "#f9fafb", padding: "20px", borderRadius: "12px", border: "1px solid #f3f4f6" }}>
              <h4 style={{ margin: "0 0 15px 0", fontSize: "0.95rem", color: "#2563eb", display: "flex", alignItems: "center", gap: "8px", fontWeight: "700" }}>
                <FileText size={18} /> Reference Details
              </h4>
              <div style={{ display: "grid", gap: "15px" }}>
                <DetailRow label="SO Number" value={order.soNumber} />
                <DetailRow label="Order Date" value={order.orderDate ? order.orderDate.substring(0, 10) : ""} icon={Calendar} />
                <DetailRow label="Source" value={isPending ? "Pending List" : "Dispatch Report"} icon={Layers} />
                <DetailRow label="Line Item ID" value={order.lineItemNumber} />
                <DetailRow label="Department" value={order.departmentRemark || getRaw("Department")} />
              </div>
            </div>

            {/* Section 3: Shipping / Status */}
            <div style={{ background: "#f9fafb", padding: "20px", borderRadius: "12px", border: "1px solid #f3f4f6" }}>
              <h4 style={{ margin: "0 0 15px 0", fontSize: "0.95rem", color: "#2563eb", display: "flex", alignItems: "center", gap: "8px", fontWeight: "700" }}>
                <Truck size={18} /> Logistics & Status
              </h4>
              <div style={{ display: "grid", gap: "15px" }}>
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
             <div style={{ marginTop: "20px", padding: "15px", background: "#fff7ed", borderRadius: "8px", borderLeft: "4px solid #f97316", color: "#9a3412", fontSize: "0.9rem", display: "flex", gap: "10px" }}>
               <Info size={20} style={{ flexShrink: 0 }} />
               <div>
                  <strong>Remarks:</strong> {order.departmentRemark} {order.soSpecialRemark}
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
    <div className="container-main">
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "10px", background: "-webkit-linear-gradient(45deg, #111827, #4b5563)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Search Database
        </h1>
        <p style={{ color: "#6b7280" }}>Find any order, product, or dispatch record instantly.</p>
      </div>
      
      {/* --- HERO SEARCH BAR --- */}
      <div className="card" style={{ marginBottom: "40px", padding: "30px", border: "none", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}>
        <div style={{ position: "relative", marginBottom: "20px" }}>
          <Search size={24} style={{ position: "absolute", left: "20px", top: "18px", color: "#2563eb" }} />
          <input 
            className="input-field" 
            style={{ 
              paddingLeft: "60px", 
              fontSize: "1.2rem", 
              paddingTop: "16px", 
              paddingBottom: "16px", 
              borderRadius: "12px",
              border: "2px solid #e5e7eb",
              transition: "border-color 0.2s"
            }}
            placeholder="Search by PO, Serial, Product Code, or Customer..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={(e) => e.target.style.borderColor = "#2563eb"}
            onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
          />
          {query && (
            <button 
              onClick={() => setQuery("")}
              style={{ position: "absolute", right: "20px", top: "18px", background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}
            >
              <X size={24} />
            </button>
          )}
        </div>

        {/* Toggle Advanced Filters */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button 
            className="btn" 
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{ 
              color: showAdvanced ? "#2563eb" : "#4b5563", 
              background: showAdvanced ? "#eff6ff" : "white",
              border: "1px solid",
              borderColor: showAdvanced ? "#bfdbfe" : "#e5e7eb",
              display: "flex", alignItems: "center", gap: "8px"
            }}
          >
            <Sliders size={16} />
            {showAdvanced ? "Hide Filters" : "Advanced Filters"}
          </button>
          
          <button onClick={clearFilters} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.9rem", fontWeight: "600", opacity: 0.8 }}>
            Clear All
          </button>
        </div>

        {/* --- COLLAPSIBLE ADVANCED PANEL --- */}
        {showAdvanced && (
          <div style={{ marginTop: "25px", paddingTop: "25px", borderTop: "1px dashed #e5e7eb", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "25px" }}>
            
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "0.85rem", fontWeight: "700", color: "#374151" }}>Exact PO Number</label>
              <input className="input-field" name="poNumber" value={advancedFilters.poNumber} onChange={handleAdvancedChange} placeholder="e.g. 4500123" />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "0.85rem", fontWeight: "700", color: "#374151" }}>Customer Name</label>
              <input className="input-field" name="customer" value={advancedFilters.customer} onChange={handleAdvancedChange} placeholder="Filter by customer" />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "0.85rem", fontWeight: "700", color: "#374151" }}>Start Date</label>
              <input type="date" className="input-field" name="startDate" value={advancedFilters.startDate} onChange={handleAdvancedChange} />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "0.85rem", fontWeight: "700", color: "#374151" }}>End Date</label>
              <input type="date" className="input-field" name="endDate" value={advancedFilters.endDate} onChange={handleAdvancedChange} />
            </div>

          </div>
        )}
      </div>

      {/* --- RESULTS SECTION --- */}
      {results.length > 0 && (
        <div style={{ marginBottom: "20px", color: "#4b5563", fontWeight: "600", fontSize: "1.1rem" }}>
          Found {results.length} records:
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#6b7280" }}>
           <div className="loader"></div>
           <p style={{ marginTop: "15px" }}>Searching global database...</p>
        </div>
      ) : (
        <div>
          {results.map((order, idx) => (
             <SearchResultCard key={idx} order={order} />
          ))}
        </div>
      )}
      
      {!loading && results.length === 0 && (query || advancedFilters.poNumber) && (
        <div style={{ textAlign: "center", padding: "60px", background: "white", borderRadius: "16px", border: "2px dashed #e5e7eb" }}>
          <Search size={48} color="#d1d5db" style={{ marginBottom: "20px" }} />
          <h3 style={{ color: "#374151", margin: "0 0 10px 0" }}>No matching records found</h3>
          <p style={{ color: "#9ca3af", margin: 0 }}>Try adjusting your filters or search query.</p>
        </div>
      )}

    </div>
  );
}
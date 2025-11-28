import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, UploadCloud, Search, Package } from "lucide-react";
import "../App.css";

export default function Navbar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? "nav-link active" : "nav-link";

  return (
    <nav style={{ 
      background: "white", 
      borderBottom: "1px solid #e5e7eb", 
      padding: "0.75rem 2rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      position: "sticky",
      top: 0,
      zIndex: 100
    }}>
      {/* Clickable Logo Area - UPDATED NAME */}
      <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ background: "#eff6ff", padding: "8px", borderRadius: "8px" }}>
          <Package color="#2563eb" size={24} />
        </div>
        <span style={{ fontWeight: "800", fontSize: "1.3rem", color: "#111827", letterSpacing: "-0.5px" }}>
          TrackDashboard
        </span>
      </Link>

      <div style={{ display: "flex", gap: "10px" }}>
        <NavLink to="/" icon={<LayoutDashboard size={18} />} text="Dashboard" active={location.pathname === "/"} />
        <NavLink to="/open-orders" icon={<FileText size={18} />} text="Open Orders" active={location.pathname === "/open-orders"} />
        <NavLink to="/search" icon={<Search size={18} />} text="Search" active={location.pathname === "/search"} />
        <NavLink to="/upload" icon={<UploadCloud size={18} />} text="Upload" active={location.pathname === "/upload"} />
      </div>
    </nav>
  );
}

function NavLink({ to, icon, text, active }) {
  return (
    <Link to={to} style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      textDecoration: "none",
      color: active ? "#2563eb" : "#4b5563",
      fontWeight: active ? "600" : "500",
      padding: "8px 16px",
      borderRadius: "8px",
      backgroundColor: active ? "#eff6ff" : "transparent",
      transition: "all 0.2s",
      fontSize: "0.9rem"
    }}>
      {icon}
      <span>{text}</span>
    </Link>
  );
}
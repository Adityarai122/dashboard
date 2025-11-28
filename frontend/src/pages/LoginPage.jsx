import React, { useState } from "react";
import API from "../api/axiosClient";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, Key, ShieldCheck } from "lucide-react";
import "../App.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = Email, 2 = OTP
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await API.post("/auth/send-otp", { email });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send OTP. Check email.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await API.post("/auth/verify-otp", { email, otp });
      localStorage.setItem("token", res.data.token);
      navigate("/"); 
    } catch (err) {
      setError(err.response?.data?.error || "Invalid Code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f4f6" }}>
      <div className="card" style={{ width: "100%", maxWidth: "400px", padding: "40px", textAlign: "center" }}>
        
        <div style={{ background: "#eff6ff", width: "60px", height: "60px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <Lock size={30} color="#2563eb" />
        </div>

        <h1 style={{ fontSize: "1.5rem", marginBottom: "10px" }}>Admin Access</h1>
        <p style={{ color: "#6b7280", marginBottom: "30px" }}>
          {step === 1 ? "Enter authorized email address." : `Enter code sent to ${email}`}
        </p>

        {error && (
          <div style={{ background: "#fef2f2", color: "#991b1b", padding: "10px", borderRadius: "8px", marginBottom: "20px", fontSize: "0.9rem" }}>
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOtp}>
            <div style={{ marginBottom: "20px", textAlign: "left" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "#374151" }}>Email Address</label>
              <div style={{ position: "relative", marginTop: "5px" }}>
                <Mail size={18} style={{ position: "absolute", left: "12px", top: "12px", color: "#9ca3af" }} />
                <input 
                  type="email" 
                  required
                  className="input-field" 
                  style={{ paddingLeft: "40px" }}
                  placeholder="admin@factory.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={loading}>
              {loading ? "Sending..." : "Send Verification Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div style={{ marginBottom: "20px", textAlign: "left" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "#374151" }}>One-Time Password</label>
              <div style={{ position: "relative", marginTop: "5px" }}>
                <Key size={18} style={{ position: "absolute", left: "12px", top: "12px", color: "#9ca3af" }} />
                <input 
                  type="text" 
                  required
                  className="input-field" 
                  style={{ paddingLeft: "40px", letterSpacing: "5px", fontSize: "1.2rem" }}
                  placeholder="• • • • • •"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginBottom: "15px" }} disabled={loading}>
              {loading ? "Verifying..." : "Secure Login"} <ShieldCheck size={18} />
            </button>
            <button type="button" onClick={() => setStep(1)} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", textDecoration: "underline" }}>
              Change Email
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
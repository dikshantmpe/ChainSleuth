import React, { useState } from "react";
import { ChevronLeft, UserPlus, Lock, Mail, User } from "lucide-react";

// Dynamic API URL: Uses Vercel env var in production, falls back to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

export default function Register({ onRegister, onBack, switchToLogin }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role: "investigator" }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      // Save to localStorage
      localStorage.setItem("chainsleuth_token", data.token);
      localStorage.setItem("chainsleuth_user", JSON.stringify(data.user));

      // Pass full user data to App.jsx
      onRegister(data.user);
    } catch (err) {
      setError("Connection error - make sure backend is running on port 5001");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px", background: "#070a0c" }}>
      <style>{`
        .lg-card{ width:100%; max-width:380px; background:#0f1416; border:1px solid rgba(255,255,255,.08); border-radius:20px; padding:34px; }
        .lg-mark{ width:44px;height:44px;border-radius:12px;background:#b6ff00; display:grid; place-items:center; margin:0 auto 18px; }
        .lg-title{ text-align:center; font-size:19px; margin:0 0 4px; color:#f2f5f3; }
        .lg-sub{ text-align:center; font-size:12px; color:#626c70; margin:0 0 22px; }
        .lg-field{ margin-bottom:14px; }
        .lg-field label{ display:block; font-size:11px; color:#8c969a; margin-bottom:7px; }
        .lg-inputwrap{ display:flex; align-items:center; gap:9px; background:#080b0d; border:1px solid rgba(255,255,255,.08); border-radius:10px; padding:12px 13px; }
        .lg-inputwrap input{ background:none; border:0; outline:0; color:#fff; font-size:13px; flex:1; }
        .lg-inputwrap input::placeholder { color:#626c70; }
        .lg-back{ display:flex; align-items:center; gap:6px; color:#626c70; font-size:12px; background:none; border:0; cursor:pointer; margin-bottom:18px; }
        .lg-back:hover{ color:#b6ff00; }
        .lg-foot{ text-align:center; font-size:11px; color:#626c70; margin-top:18px; }
        .lg-switch{ color:#b6ff00; background:none; border:0; cursor:pointer; font-weight:700; padding:0; margin-left:4px; }
        .lg-error{ color:#ff5c67; font-size:12px; margin-bottom:12px; padding:8px; background:rgba(255,92,103,.1); border-radius:8px; text-align:center; }
        .cx-btn{ border:0;border-radius:10px;padding:12px 18px;font-weight:800;font-size:13px;cursor:pointer;transition:all .2s; }
        .cx-btn-primary{ background:#b6ff00; color:#081000; }
        .cx-btn-primary:hover:not(:disabled){ opacity:0.9; transform:translateY(-2px); }
        .cx-btn-primary:disabled{ opacity:0.6; cursor:not-allowed; }
        .cx-spinner{ width:16px;height:16px;border:2px solid rgba(0,0,0,.2); border-top-color:#071000; border-radius:50%;animation:spin .7s linear infinite;display:inline-block; }
        @keyframes spin{ to{transform:rotate(360deg)} }
      `}</style>
      
      <div className="lg-card">
        <button className="lg-back" onClick={onBack}><ChevronLeft size={14} /> Back to Home</button>
        
        <div className="lg-mark"><UserPlus size={19} color="#081000" /></div>
        <h2 className="lg-title">Investigator Registration</h2>
        <p className="lg-sub">Create your Cyber Cell access profile</p>

        {error && <div className="lg-error">{error}</div>}

        <form onSubmit={submit}>
          <div className="lg-field">
            <label>FULL NAME</label>
            <div className="lg-inputwrap"><User size={14} color="#626c70" /><input type="text" placeholder="e.g. Investigator Sharma" value={name} onChange={(e) => setName(e.target.value)} required /></div>
          </div>
          
          <div className="lg-field">
            <label>OFFICIAL EMAIL</label>
            <div className="lg-inputwrap"><Mail size={14} color="#626c70" /><input type="email" placeholder="name@cybercell.gov.in" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          </div>
          
          <div className="lg-field">
            <label>PASSWORD</label>
            <div className="lg-inputwrap"><Lock size={14} color="#626c70" /><input type="password" placeholder="Minimum 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
          </div>

          <button className="cx-btn cx-btn-primary" style={{ width: "100%", marginTop: 6, display: "flex", justifyContent: "center", gap: 8 }} disabled={loading}>
            {loading ? (<><span className="cx-spinner" /> Creating Account</>) : "Register Profile"}
          </button>
        </form>
        
        <div className="lg-foot">
          Already have an account?
          <button className="lg-switch" onClick={switchToLogin}>Sign In Here</button>
        </div>
      </div>
    </div>
  );
}
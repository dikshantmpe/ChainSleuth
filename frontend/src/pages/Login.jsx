import React, { useState } from "react";
import { Search, ChevronLeft, ShieldAlert, Lock, Mail } from "lucide-react";

// Dynamic API URL: Uses Vercel env var in production, falls back to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

export default function Login({ onLogin, onBack, switchToRegister }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [role, setRole] = useState("investigator");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      // Construct user object
      const userData = { name: data.name, email: data.email, role: data.role };
      
      // Save to localStorage
      localStorage.setItem("chainsleuth_token", data.token);
      localStorage.setItem("chainsleuth_user", JSON.stringify(userData));

      // Pass full user data to App.jsx
      onLogin(userData);
    } catch (err) {
      setError("Connection error - make sure backend is running on port 5001");
      setLoading(false);
    }
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setEmail("");
    setPassword("");
    setError("");
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px", background: "#070a0c" }}>
      <style>{`
        .lg-card{ width:100%; max-width:380px; background:#0f1416; border:1px solid rgba(255,255,255,.08); border-radius:20px; padding:34px; }
        .lg-mark{ width:44px;height:44px;border-radius:12px;background:#b6ff00; display:grid; place-items:center; margin:0 auto 18px; }
        .lg-title{ text-align:center; font-size:19px; margin:0 0 4px; color:#f2f5f3; }
        .lg-sub{ text-align:center; font-size:12px; color:#626c70; margin:0 0 22px; }
        .lg-roles{ display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:20px; }
        .lg-role{ border:1px solid rgba(255,255,255,.08); background:#080b0d; border-radius:10px; padding:12px 10px; cursor:pointer; text-align:center; transition:all .2s; }
        .lg-role:hover{ border-color:#b6ff00; }
        .lg-role.active{ border-color:#b6ff00; background:rgba(182,255,0,.06); }
        .lg-role svg { margin: 0 auto; }
        .lg-role div.rlabel{ font-size:12px; font-weight:700; color:#fff; margin-top:6px; }
        .lg-role div.rsub{ font-size:9.5px; color:#626c70; margin-top:2px; }
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
        <button className="lg-back" onClick={onBack}><ChevronLeft size={14} /> Back</button>
        <div className="lg-mark"><Lock size={19} color="#081000" /></div>
        <h2 className="lg-title">Secure Login Portal</h2>
        <p className="lg-sub">Chandigarh Cyber Cell — restricted access</p>

        <div className="lg-roles">
          <div className={`lg-role ${role === "investigator" ? "active" : ""}`} onClick={() => handleRoleChange("investigator")}>
            <Search size={16} color={role === "investigator" ? "#b6ff00" : "#626c70"} style={{margin: "0 auto"}} />
            <div className="rlabel">Investigator</div>
            <div className="rsub">Case &amp; wallet access</div>
          </div>
          <div className={`lg-role ${role === "admin" ? "active" : ""}`} onClick={() => handleRoleChange("admin")}>
            <ShieldAlert size={16} color={role === "admin" ? "#b6ff00" : "#626c70"} style={{margin: "0 auto"}} />
            <div className="rlabel">Admin</div>
            <div className="rsub">Full system access</div>
          </div>
        </div>

        {error && <div className="lg-error">{error}</div>}

        <form onSubmit={submit}>
          <div className="lg-field">
            <label>OFFICIAL EMAIL</label>
            <div className="lg-inputwrap"><Mail size={14} color="#626c70" /><input type="email" placeholder="your-email@cybercell.gov.in" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          </div>
          <div className="lg-field">
            <label>PASSWORD</label>
            <div className="lg-inputwrap"><Lock size={14} color="#626c70" /><input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
          </div>
          <button className="cx-btn cx-btn-primary" style={{ width: "100%", marginTop: 6, display: "flex", justifyContent: "center", gap: 8 }} disabled={loading}>
            {loading ? (<><span className="cx-spinner" /> Verifying</>) : `Sign In as ${role === "admin" ? "Admin" : "Investigator"}`}
          </button>
        </form>
        <div className="lg-foot">
          Don't have an account?
          <button className="lg-switch" onClick={switchToRegister}>Register Here</button>
        </div>
      </div>
    </div>
  );
}
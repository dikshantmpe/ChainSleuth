import React, { useState } from "react";

export default function AdminView({ toast }) {
  // Local state to simulate a live database of system users
  const [users, setUsers] = useState([
    { id: 1, name: "Admin Sharma", unit: "Cyber Cell - HQ", role: "Admin", status: "Active" },
    { id: 2, name: "Investigator Singh", unit: "Financial Fraud Div", role: "Investigator", status: "Active" },
    { id: 3, name: "Analyst Patel", unit: "Blockchain Forensics", role: "Investigator", status: "Active" },
    { id: 4, name: "Officer Kumar", unit: "Field Operations", role: "Investigator", status: "Offline" },
  ]);

  const handleInvite = () => {
    const newUser = {
      id: Date.now(),
      name: "New Investigator",
      unit: "Pending Assignment",
      role: "Investigator",
      status: "Pending"
    };
    
    // Dynamically append the new user to the list
    setUsers([...users, newUser]);
    
    if (toast) {
      toast("Invitation sent. New investigator added to the ledger.");
    }
  };

  return (
    <div className="cx-fade-up" style={{ padding: 24 }}>
      <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--line)", fontWeight: 700, fontSize: 14, color: "#fff" }}>
          System Access Management
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr", gap: 10, padding: "10px 18px", fontSize: 10, color: "var(--dim)", letterSpacing: ".05em" }}>
          <span>NAME</span><span>UNIT</span><span>ROLE</span><span>STATUS</span>
        </div>
        {users.map((u) => (
          <div key={u.id} style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr", gap: 10, alignItems: "center", padding: "13px 18px", borderBottom: "1px solid rgba(255,255,255,.05)", fontSize: 12.5 }}>
            <span style={{ fontWeight: 600, color: "#fff" }}>{u.name}</span>
            <span style={{ color: "var(--muted)" }}>{u.unit}</span>
            <span style={{ color: u.role === "Admin" ? "var(--lime)" : "var(--muted)" }}>{u.role}</span>
            <span className="cx-badge" style={{ 
              background: u.status === "Active" ? "rgba(182,255,0,.12)" : u.status === "Pending" ? "rgba(255,189,74,.12)" : "rgba(113,128,135,.15)", 
              color: u.status === "Active" ? "var(--lime)" : u.status === "Pending" ? "var(--warning)" : "var(--dim)", 
              width: "fit-content" 
            }}>
              {u.status}
            </span>
          </div>
        ))}
      </div>
      <button 
        className="cx-btn cx-btn-secondary" 
        style={{ marginTop: 14 }} 
        onClick={handleInvite}
      >
        + Invite Investigator
      </button>
    </div>
  );
}
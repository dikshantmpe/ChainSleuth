import React from "react";
import { Shield, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { NAV } from "../data/mockData.js";

export default function Sidebar({ view, setView, collapsed, setCollapsed, onLogout, role }) {
  const items = NAV.filter((n) => !n.adminOnly || role === "admin");
  return (
    <aside style={{
      width: collapsed ? 66 : 220, flexShrink: 0, borderRight: "1px solid var(--line)",
      padding: "18px 12px", display: "flex", flexDirection: "column", transition: "width .2s ease", background: "#0a0e10",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 6px 18px", borderBottom: "1px solid var(--line)", marginBottom: 14 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--lime)", display: "grid", placeItems: "center", flexShrink: 0 }}>
          <Shield size={15} color="#081000" />
        </div>
        {!collapsed && (
          <div style={{ minWidth: 0 }}>
            <b style={{ fontSize: 13, display: "block" }}>ChainSleuth</b>
            <small style={{ fontSize: 8.5, color: "var(--dim)", letterSpacing: ".1em", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: 99, background: "var(--lime)", display: "inline-block" }} /> SECURE MODE
            </small>
          </div>
        )}
      </div>
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3, overflowY: "auto" }} className="cx-scroll">
        {items.map((n) => {
          const Icon = n.icon;
          const active = view === n.id;
          return (
            <button key={n.id} onClick={() => setView(n.id)} title={n.label} style={{
              display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", borderRadius: 9,
              border: 0, cursor: "pointer", fontSize: 12.5, textAlign: "left", width: "100%",
              background: active ? "var(--lime)" : "transparent", color: active ? "#081000" : "var(--muted)",
              fontWeight: active ? 700 : 500, transition: "background .15s",
            }}>
              <Icon size={16} style={{ flexShrink: 0 }} />
              {!collapsed && n.label}
            </button>
          );
        })}
      </nav>
      <div style={{ borderTop: "1px solid var(--line)", paddingTop: 12, marginTop: 8 }}>
        {!collapsed && <div style={{ fontSize: 10, color: "var(--dim)", lineHeight: 1.6, padding: "0 6px 10px" }}>All actions logged to immutable audit ledger.</div>}
        <button onClick={onLogout} style={{ display: "flex", alignItems: "center", gap: 9, background: "none", border: 0, color: "var(--muted)", fontSize: 12, cursor: "pointer", padding: "8px 6px", width: "100%" }}>
          <LogOut size={14} /> {!collapsed && "Log out"}
        </button>
        <button onClick={() => setCollapsed((c) => !c)} style={{ display: "flex", alignItems: "center", gap: 9, background: "none", border: 0, color: "var(--dim)", fontSize: 11, cursor: "pointer", padding: "8px 6px", width: "100%" }}>
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />} {!collapsed && "Collapse"}
        </button>
      </div>
    </aside>
  );
}

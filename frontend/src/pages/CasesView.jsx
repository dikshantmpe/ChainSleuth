import React, { useState, useEffect } from "react";
import { Briefcase, ArrowRight, Clock, Users } from "lucide-react";
import { riskColor } from "../utils/risk.js";

const API_BASE_URL = "http://localhost:5001";

export default function CasesView({ onOpen, toast }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [officer, setOfficer] = useState("");
  const [risk, setRisk] = useState("medium");

  // 1. GET cases from Neo4j
  const fetchCases = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/cases`);
      if (res.ok) {
        const data = await res.json();
        setCases(data.cases || []);
      }
    } catch (err) {
      console.error("Error fetching cases:", err);
      toast && toast("Database connection failed. Using empty list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  // 2. POST new case to Neo4j
  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !officer.trim()) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/cases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          investigator: officer.trim(),
          risk: risk 
        }),
      });

      if (res.ok) {
        toast && toast("Investigation saved to Neo4j database.");
        setTitle(""); 
        setOfficer(""); 
        setRisk("medium"); 
        setShowForm(false);
        fetchCases(); // Instantly refresh the UI with new database records
      } else {
        toast && toast("Failed to create case record.");
      }
    } catch (err) {
      toast && toast("Network error creating case.");
    }
  };

  // Pre-fill officer name when opening the form
  const openForm = () => {
    const storedUser = JSON.parse(localStorage.getItem("chainsleuth_user") || "{}");
    setOfficer(storedUser.name || "");
    setShowForm(true);
  };

  return (
    <div className="cx-fade-up" style={{ padding: 24, position: "relative" }}>
      <style>{`
        .cv-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
        .cv-card{ background:var(--card); border:1px solid var(--line); border-radius:16px; padding:18px; cursor:pointer; transition:transform .15s, border-color .15s; }
        .cv-card:hover{ border-color:rgba(182,255,0,.35); transform:translateY(-2px); }
        .cv-card .top{ display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
        .cv-id{ font-size:10px; color:var(--dim); font-family:monospace; }
        .cv-title{ font-size:14px; font-weight:700; margin:4px 0 12px; line-height:1.4; }
        .cv-meta{ font-size:11px; color:var(--muted); display:flex; align-items:center; gap:6px; margin-bottom:5px; }
        .cv-foot{ display:flex; justify-content:space-between; align-items:center; margin-top:12px; }
        .cv-new{ border:1px dashed var(--line); border-radius:16px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; color:var(--dim); cursor:pointer; min-height:150px; transition:border-color .15s, color .15s; }
        .cv-new:hover{ border-color:rgba(182,255,0,.4); color:var(--lime); }
        .cv-modal-bg{ position:fixed; inset:0; background:rgba(0,0,0,.6); z-index:200; display:flex; align-items:center; justify-content:center; }
        .cv-modal{ width:min(420px,90%); background:var(--card); border:1px solid rgba(182,255,0,.25); border-radius:18px; padding:24px; }
        .cv-field{ margin-bottom:14px; }
        .cv-field label{ display:block; font-size:11px; color:var(--muted); margin-bottom:7px; }
        .cv-field input, .cv-field select{ width:100%; background:#080b0d; border:1px solid var(--line); border-radius:9px; padding:11px 12px; color:#fff; font-size:13px; outline:none; }
        .cv-field input:focus, .cv-field select:focus{ border-color:rgba(182,255,0,.5); }
        .cv-loading{ grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--dim); }
        @media(max-width:900px){ .cv-grid{grid-template-columns:1fr} }
      `}</style>

      <button className="cx-btn cx-btn-primary" style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }} onClick={openForm}>
        + New Case
      </button>

      <div className="cv-grid">
        <div className="cv-new" onClick={openForm}>
          <Briefcase size={20} />
          <span style={{ fontSize: 12.5, fontWeight: 700 }}>Create New Case</span>
        </div>
        
        {loading ? (
          <div className="cv-loading">Loading live investigations...</div>
        ) : (
          cases.map((c) => (
            <div className="cv-card" key={c.id} onClick={() => onOpen(c)}>
              <div className="top">
                <span className="cv-id">{c.id}</span>
                <span className="cx-badge" style={{ background: `${riskColor(c.risk || "medium")}22`, color: riskColor(c.risk || "medium") }}>
                  {c.status}
                </span>
              </div>
              <div className="cv-title">{c.title}</div>
              {/* Note: Mapped to backend keys 'investigator' and 'date_opened' */}
              <div className="cv-meta"><Users size={12} /> {c.investigator}</div>
              <div className="cv-meta"><Clock size={12} /> Opened {c.date_opened}</div>
              <div className="cv-foot">
                <span style={{ fontSize: 11, color: "var(--dim)" }}>{c.wallets || 0} wallets</span>
                <ArrowRight size={13} color="var(--dim)" />
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <div className="cv-modal-bg" onClick={() => setShowForm(false)}>
          <div className="cv-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 10, color: "var(--lime)", fontWeight: 800, letterSpacing: ".1em", marginBottom: 4 }}>NEW CASE</div>
            <h3 style={{ fontSize: 17, margin: "2px 0 18px" }}>Open an investigation</h3>
            <form onSubmit={submit}>
              <div className="cv-field">
                <label>CASE TITLE</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Cross-Border Layering Probe #19" required />
              </div>
              <div className="cv-field">
                <label>ASSIGNED OFFICER</label>
                <input value={officer} onChange={(e) => setOfficer(e.target.value)} placeholder="e.g. Insp. R. Sharma" required />
              </div>
              <div className="cv-field">
                <label>INITIAL RISK LEVEL</label>
                <select value={risk} onChange={(e) => setRisk(e.target.value)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
                <button type="button" className="cx-btn cx-btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="cx-btn cx-btn-primary" style={{ flex: 1 }}>Create Case</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
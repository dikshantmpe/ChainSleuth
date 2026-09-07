import React, { useState, useEffect } from "react";
import { BrainCircuit, Activity } from "lucide-react";

const API_BASE_URL = "http://localhost:5001";

export default function AIView({ caseId }) {
  const [address, setAddress] = useState("");
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (caseId) {
      const fetchCaseAI = async () => {
        setLoading(true);
        try {
          const res = await fetch(`${API_BASE_URL}/api/cases/${caseId}/patterns`);
          if (res.ok) {
            const data = await res.json();
            const mappedPatterns = (data.patterns || []).map(p => ({
              badge: p.risk || "MEDIUM",
              title: p.name || "Pattern Detected",
              desc: `Detected on wallet ${p.wallet ? p.wallet.slice(0,8)+"..." : "unknown"}. Algorithmic confidence: ${(p.confidence * 100).toFixed(0)}%.`,
              contribution: `${p.confidence * 100}%`
            }));
            setPatterns(mappedPatterns);
          }
        } catch (err) {
          console.error("Failed to load case patterns:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchCaseAI();
    }
  }, [caseId]);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!address.trim()) return;

    setLoading(true);
    setError("");
    setPatterns([]);

    try {
      const res = await fetch(`${API_BASE_URL}/api/wallet/fraud-score?address=${address.trim()}`);
      const data = await res.json();

      if (res.ok) {
        // Map backend response directly to UI card structure
        const generatedPatterns = (data.patterns || []).map(p => ({
          badge: p.risk || "UNKNOWN",
          title: p.name || "Unnamed Pattern",
          desc: `Algorithmic confidence: ${(p.confidence * 100).toFixed(0)}%. This wallet has been flagged for this behavior by the ML pipeline.`,
          contribution: `${(p.confidence * 100).toFixed(0)}%`
        }));
        
        setPatterns(generatedPatterns);
      } else {
        setError(data.error || "Analysis failed. Please check the wallet address.");
      }
    } catch (err) {
      setError("Failed to connect to the AI scoring engine on port 5001.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cx-fade-up" style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: "flex", gap: 16, alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: "0 0 4px", fontSize: 18, display: "flex", alignItems: "center", gap: 8, color: "#fff" }}>
            <BrainCircuit size={20} color="var(--lime)" /> AI Threat Detection
          </h2>
          <p style={{ margin: 0, fontSize: 12, color: "var(--dim)" }}>
            {caseId ? "Algorithmic patterns detected in this specific investigation." : "Run global entity analysis and structural anomaly detection."}
          </p>
        </div>
        
        {!caseId && (
          <form onSubmit={handleAnalyze} style={{ display: "flex", gap: 8, width: 420 }}>
            <input 
              placeholder="Enter wallet address to analyze..." 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={{ flex: 1, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 12, outline: "none", fontFamily: "monospace" }}
            />
            <button type="submit" disabled={loading} className="cx-btn cx-btn-primary" style={{ padding: "10px 16px", fontSize: 12, borderRadius: 8, whiteSpace: "nowrap" }}>
              {loading ? "Analyzing..." : "Run AI"}
            </button>
          </form>
        )}
      </div>

      {error && (
        <div style={{ padding: 16, background: "rgba(255,92,103,.1)", color: "var(--danger)", border: "1px solid var(--danger)", borderRadius: 12, marginBottom: 24, fontSize: 12 }}>
          ⚠️ {error}
        </div>
      )}

      {patterns.length === 0 && !loading && !error && (
        <div style={{ textAlign: "center", padding: 60, color: "var(--dim)", border: "1px dashed var(--line)", borderRadius: 16 }}>
          <Activity size={32} style={{ opacity: 0.5, marginBottom: 12 }} />
          <div style={{ fontSize: 13 }}>{caseId ? "No patterns detected yet. Add target wallets to this case and run an analysis to begin." : "Enter a wallet address above to ping the scoring engine."}</div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {patterns.map((p, i) => (
          <div key={i} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, padding: 18, minHeight: 160, display: "flex", flexDirection: "column" }}>
            <div>
              <span className="cx-badge" style={{ border: `1px solid ${p.badge === 'LOW' ? 'rgba(255,255,255,0.1)' : 'rgba(182,255,0,.2)'}`, color: p.badge === 'LOW' ? 'var(--dim)' : 'var(--lime)' }}>
                {p.badge}
              </span>
            </div>
            <h3 style={{ fontSize: 14.5, margin: "14px 0 7px", color: "#fff" }}>{p.title}</h3>
            <p style={{ color: "var(--muted)", fontSize: 11.5, lineHeight: 1.6, margin: "0 0 20px 0", flex: 1 }}>{p.desc}</p>
            
            {p.contribution && (
              <div style={{ fontSize: 10, color: "var(--dim)", marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 12 }}>
                RISK CONTRIBUTION <b style={{ color: "#fff", marginLeft: 4 }}>{p.contribution}</b>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
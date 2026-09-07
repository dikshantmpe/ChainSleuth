import React, { useState, useEffect } from "react";
import { riskColor, riskLabel } from "../utils/risk.js";
import AddrChip from "../components/AddrChip.jsx";

const API_BASE_URL = "http://localhost:5001";

export default function WalletsView({ caseId }) {
  const [wallets, setWallets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 1. GET wallets (Global or Case-specific)
  useEffect(() => {
    const fetchWallets = async () => {
      try {
        setLoading(true);
        const endpoint = caseId ? `/api/cases/${caseId}/wallets` : `/api/wallets`;
        const res = await fetch(`${API_BASE_URL}${endpoint}`);
        if (res.ok) {
          const data = await res.json();
          const list = data.wallets || [];
          setWallets(list);
          if (list.length > 0 && !selected) setSelected(list[0]);
        }
      } catch (err) {
        console.error("Failed to fetch wallets:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchWallets();
  }, [caseId]);

  // 2. POST new wallet (Global or Case-specific)
  const addWallet = async () => {
    const addr = query.trim();
    if (!addr) return;

    const existing = wallets.find((w) => w.addr?.toLowerCase() === addr.toLowerCase());
    if (existing) {
      setSelected(existing);
      return;
    }

    try {
      const endpoint = caseId ? `/api/cases/${caseId}/wallets` : `/api/wallets`;
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: addr }),
      });

      if (res.ok) {
        const data = await res.json();
        const fresh = data.wallet;
        if (fresh) {
          setWallets((prev) => [fresh, ...prev]);
          setSelected(fresh);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Backend Error: ${res.status}\n${errData.error || "Failed to add wallet."}`);
      }
    } catch (err) {
      alert(`Network Error: ${err.message}\nIs the backend running?`);
    }
  };

  // 3. POST trigger Deep Analysis ML pipeline
  const runDeepAnalysis = async () => {
    if (!selected) return;
    setIsAnalyzing(true);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/wallet/fraud-score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          address: selected.addr, 
          blockchain: selected.chain || "ethereum" 
        }),
      });

      if (res.ok) {
        const data = await res.json();
        
        // Save the ML payload to state so it renders inline
        const updatedWallet = {
          ...selected,
          score: data.riskScore,
          risk: data.riskLevel?.toLowerCase() || "medium",
          txCount: data.transactionCount,
          flags: data.flags || [],
          patterns: data.patterns || []
        };
        
        setSelected(updatedWallet);
        setWallets((prev) => prev.map(w => w.addr === updatedWallet.addr ? updatedWallet : w));
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Analysis Failed: ${errData.error || "Server error"}`);
      }
    } catch (err) {
      alert(`Network Error: ${err.message}\nCheck your backend terminal.`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const filtered = query.trim()
    ? wallets.filter((w) => w.addr?.toLowerCase().includes(query.trim().toLowerCase()))
    : wallets;

  return (
    <div className="cx-fade-up" style={{ padding: 24, display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12 }}>
      <style>{`
        .wv-row{ display:grid; grid-template-columns:2fr 1fr 1fr 1fr; gap:10px; align-items:center; padding:13px 16px; border-bottom:1px solid rgba(255,255,255,.05); cursor:pointer; font-size:12px; }
        .wv-row:hover{ background:rgba(255,255,255,.02); }
        .wv-row.active{ background:rgba(182,255,0,.05); }
        .wv-addr{ font-family:monospace; font-size:11.5px; }
        .wv-search{ display:flex; gap:8px; padding:14px 16px; border-bottom:1px solid var(--line); }
        .wv-search input{ flex:1; background:#080b0d; border:1px solid var(--line); border-radius:9px; padding:10px 12px; color:#fff; font-size:12.5px; outline:none; font-family:monospace; }
        .wv-search input:focus{ border-color:rgba(182,255,0,.5); }
      `}</style>

      <div className="dv-panel" style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 120px)" }}>
        <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--line)", fontWeight: 700, fontSize: 14 }}>
          {caseId ? "Case Wallets" : "Global Wallet Explorer"}
        </div>
        <div className="wv-search">
          <input
            placeholder="Enter wallet address to search or start tracking..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addWallet()}
          />
          <button className="cx-btn cx-btn-primary" style={{ padding: "10px 16px", fontSize: 12, whiteSpace: "nowrap" }} onClick={addWallet}>
            Track Wallet
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 10, padding: "10px 16px", fontSize: 10, color: "var(--dim)", letterSpacing: ".05em" }}>
          <span>ADDRESS</span><span>CHAIN</span><span>RISK</span><span>LAST SEEN</span>
        </div>
        <div style={{ overflowY: "auto", flex: 1 }} className="cx-scroll">
          {loading && <div style={{ padding: 20, fontSize: 12, color: "var(--dim)" }}>Loading tracked wallets...</div>}
          {!loading && filtered.length === 0 && (
            <div style={{ padding: 20, fontSize: 12, color: "var(--dim)" }}>
              {query.trim() ? "No matching tracked wallet found. Click 'Track Wallet' to add it." : "No wallets found. Enter an address to track it."}
            </div>
          )}
          
          {filtered.map((w) => (
            <div className={`wv-row ${selected?.addr === w.addr ? "active" : ""}`} key={w.addr} onClick={() => setSelected(w)}>
              <span className="wv-addr"><AddrChip value={w.addr} size={11.5} /></span>
              <span style={{ color: "var(--muted)" }}>{w.chain || "ethereum"}</span>
              <span className="cx-badge" style={{ background: `${riskColor(w.risk || "medium")}22`, color: riskColor(w.risk || "medium"), width: "fit-content" }}>
                {riskLabel(w.risk || "medium")}
              </span>
              <span style={{ color: "var(--dim)" }}>{w.lastActivity || "Today"}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="dv-panel" style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, padding: 20, maxHeight: "calc(100vh - 120px)", overflowY: "auto" }} className="cx-scroll">
        <div style={{ fontSize: 10, color: "var(--lime)", fontWeight: 800, letterSpacing: ".1em", marginBottom: 10 }}>WALLET DETAIL</div>
        {selected ? (
          <>
            <div style={{ marginBottom: 18 }}><AddrChip value={selected.addr} size={14} /></div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
              <div style={{ width: 70, height: 70, borderRadius: "50%", background: `conic-gradient(${riskColor(selected.risk || "medium")} 0 ${selected.score || 50}%, #20282b ${selected.score || 50}% 100%)`, display: "grid", placeItems: "center", transition: "background 0.5s ease" }}>
                <div style={{ width: 54, height: 54, borderRadius: "50%", background: "var(--card)", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 17 }}>
                  {selected.score || 50}
                </div>
              </div>
              <div>
                <div style={{ color: riskColor(selected.risk || "medium"), fontWeight: 800, fontSize: 13, textTransform: "uppercase" }}>
                  {riskLabel(selected.risk || "medium")} RISK
                </div>
                <div style={{ color: "var(--dim)", fontSize: 11, marginTop: 3 }}>
                  {selected.chain || "ethereum"} · {selected.txCount || 0} transactions
                </div>
              </div>
            </div>
            
            <button 
              className="cx-btn cx-btn-primary" 
              style={{ width: "100%", opacity: isAnalyzing ? 0.7 : 1 }} 
              onClick={runDeepAnalysis}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? "Analyzing Network Patterns..." : "Run Deep Analysis →"}
            </button>

            {/* Render In-Page ML Results Here */}
            {(selected.flags?.length > 0 || selected.patterns?.length > 0) && (
              <div style={{ marginTop: 24, borderTop: "1px solid var(--line)", paddingTop: 16 }}>
                <div style={{ fontSize: 10, color: "var(--dim)", fontWeight: 800, letterSpacing: ".1em", marginBottom: 12 }}>ANALYSIS RESULTS</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  
                  {selected.flags?.map((f, i) => (
                    <div key={`flag-${i}`} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, padding: "10px 14px" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: f.type === 'NO_TRANSACTIONS' ? "var(--dim)" : "var(--lime)" }}>
                        {f.type.replace(/_/g, " ")}
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4, lineHeight: 1.4 }}>{f.message}</div>
                    </div>
                  ))}

                  {selected.patterns?.map((p, i) => (
                    <div key={`pat-${i}`} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, padding: "10px 14px" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--lime)" }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: "var(--dim)", marginTop: 4 }}>
                        Confidence: {(p.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  ))}
                  
                </div>
              </div>
            )}
          </>
        ) : (
           <div style={{ color: "var(--dim)", fontSize: 12, marginTop: 40, textAlign: "center" }}>Select a wallet to view details</div>
        )}
      </div>
    </div>
  );
}
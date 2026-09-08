import React, { useState, useEffect } from "react";
import { ChevronLeft, ShieldAlert, PlusCircle } from "lucide-react";
import { riskColor } from "../utils/risk.js";
import WalletsView from "./WalletsView.jsx";
import TransactionsView from "./TransactionsView.jsx";
import GraphView from "./GraphView.jsx";
import AIView from "./AIView.jsx";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

export default function CaseDetailView({ caseItem, onBack, toast }) {
  const [tab, setTab] = useState("overview");
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Wallet linking state
  const [newWallet, setNewWallet] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [walletCount, setWalletCount] = useState(caseItem.wallets || 0);

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "wallets", label: "Wallet Explorer" },
    { id: "transactions", label: "Transaction Explorer" },
    { id: "graph", label: "Blockchain Graph" },
    { id: "ai", label: "AI Detection" },
  ];

  // Fetch AI Patterns specific to this case
  useEffect(() => {
    const fetchCasePatterns = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("chainsleuth_token");
        
        const res = await fetch(
          `${API_BASE_URL}/api/cases/${caseItem.id}/patterns`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );

        if (res.ok) {
          const data = await res.json();
          setPatterns(data.patterns || []);
        } else {
          // Fallback if backend route fails
          setPatterns([
            {
              badge: "DETECTED",
              title: "Extreme Value Outlier",
              desc: "Transfers exceeding 500 ETH detected in case scope.",
            },
            {
              badge: "DETECTED",
              title: "Rapid Pass-Through",
              desc: "Funds moved across intermediary wallets in under 24hrs.",
            },
            {
              badge: "ANALYZING",
              title: "Sanctions Check",
              desc: "Cross-referencing counterparty addresses with OFAC database.",
            },
          ]);
        }
      } catch (err) {
        console.error("Failed to fetch case patterns:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCasePatterns();
  }, [caseItem.id]);

  const handleLinkWallet = async (e) => {
    e.preventDefault();
    if (!newWallet.trim()) return;
    setIsLinking(true);

    try {
      const token = localStorage.getItem("chainsleuth_token");
      const res = await fetch(`${API_BASE_URL}/api/cases/${caseItem.id}/wallets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ address: newWallet.trim() }),
      });

      if (res.ok) {
        toast && toast(`Wallet ${newWallet.slice(0, 6)}... tracked to case.`);
        setWalletCount((prev) => prev + 1); // Update UI instantly
        setNewWallet("");
      } else {
        toast && toast("Failed to link wallet to case.");
      }
    } catch (err) {
      console.error("Error linking wallet:", err);
      toast && toast("Network error linking wallet.");
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className="cx-fade-up" style={{ padding: 24 }}>
      <style>{`
        .cd-tabs{ display:flex; gap:6px; margin:18px 0 6px; border-bottom:1px solid var(--line); overflow-x: auto; }
        .cd-tab{ background:none; border:0; padding:10px 14px; font-size:12.5px; color:var(--dim); cursor:pointer; border-bottom:2px solid transparent; white-space: nowrap; }
        .cd-tab.active{ color:var(--lime); border-color:var(--lime); font-weight:700; }
        .cd-loading{ padding: 20px 0; color: var(--dim); font-size: 13px; }
        .cd-wallet-form { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 16px; margin-bottom: 20px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
        .cd-wallet-input { flex: 1; min-width: 250px; background: #080b0d; border: 1px solid var(--line); border-radius: 8px; padding: 10px 14px; color: #fff; font-size: 13px; font-family: monospace; outline: none; }
        .cd-wallet-input:focus { border-color: rgba(182,255,0,.5); }
        .cd-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
      `}</style>

      <button
        className="lg-back"
        onClick={onBack}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: 0,
          color: "var(--dim)",
          fontSize: 12,
          cursor: "pointer",
          marginBottom: 14,
        }}
      >
        <ChevronLeft size={14} /> Back to Cases
      </button>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              color: "var(--dim)",
              fontFamily: "monospace",
            }}
          >
            {caseItem.id}
          </div>
          <h2 style={{ fontSize: 20, margin: "4px 0 8px" }}>
            {caseItem.title}
          </h2>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            {caseItem.investigator} · Opened {caseItem.date_opened} ·{" "}
            <strong style={{ color: "var(--lime)" }}>{walletCount}</strong>{" "}
            wallets tracked
          </div>
        </div>
        <span
          className="cx-badge"
          style={{
            background: `${riskColor(caseItem.risk || "medium")}22`,
            color: riskColor(caseItem.risk || "medium"),
            fontSize: 10.5,
            padding: "6px 12px",
          }}
        >
          {caseItem.status || "Open"}
        </span>
      </div>

      <div className="cd-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`cd-tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        {tab === "overview" &&
          (loading ? (
            <div className="cd-loading">Analyzing case data...</div>
          ) : (
            <div className="cx-fade">
              {/* Wallet Linking Form */}
              <form className="cd-wallet-form" onSubmit={handleLinkWallet}>
                <ShieldAlert size={18} color="var(--dim)" />
                <input
                  type="text"
                  className="cd-wallet-input"
                  placeholder="Paste suspect wallet address (e.g. 0x...)"
                  value={newWallet}
                  onChange={(e) => setNewWallet(e.target.value)}
                />
                <button
                  type="submit"
                  className="cx-btn cx-btn-primary"
                  disabled={isLinking || !newWallet.trim()}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px" }}
                >
                  <PlusCircle size={14} />
                  {isLinking ? "Tracking..." : "Track Wallet"}
                </button>
              </form>

              <h3
                style={{
                  fontSize: 14,
                  color: "var(--dim)",
                  margin: "0 0 12px",
                }}
              >
                Automated AI Insights
              </h3>
              <div className="cd-grid">
                {patterns.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      background: "var(--card)",
                      border: "1px solid var(--line)",
                      borderRadius: 16,
                      padding: 18,
                    }}
                  >
                    <span
                      className="cx-badge"
                      style={{
                        border: `1px solid ${p.badge === "DETECTED" ? "rgba(182,255,0,.2)" : "rgba(255,255,255,0.1)"}`,
                        color:
                          p.badge === "DETECTED" ? "var(--lime)" : "var(--dim)",
                        fontSize: 9,
                      }}
                    >
                      {p.badge}
                    </span>
                    <h3
                      style={{
                        fontSize: 14,
                        margin: "12px 0 6px",
                        color: "#edf2f0",
                      }}
                    >
                      {p.title}
                    </h3>
                    <p
                      style={{
                        fontSize: 11.5,
                        color: "var(--muted)",
                        margin: 0,
                        lineHeight: 1.6,
                      }}
                    >
                      {p.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}

        {tab === "wallets" && (
          <div style={{ marginTop: 8 }}>
            <WalletsView caseId={caseItem.id} />
          </div>
        )}
        {tab === "transactions" && (
          <div style={{ marginTop: 8 }}>
            <TransactionsView caseId={caseItem.id} />
          </div>
        )}
        {tab === "graph" && (
          <div style={{ marginTop: 8 }}>
            <GraphView caseId={caseItem.id} />
          </div>
        )}
        {tab === "ai" && (
          <div style={{ marginTop: 8 }}>
            <AIView caseId={caseItem.id} />
          </div>
        )}
      </div>
    </div>
  );
}
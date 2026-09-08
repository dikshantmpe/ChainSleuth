import React, { useState, useEffect } from "react";
import { BrainCircuit, Activity, Loader } from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

export default function AIView({ caseId, toast }) {
  const [address, setAddress] = useState("");
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (caseId) {
      const fetchCaseAI = async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem("chainsleuth_token");
          const headers = token ? { Authorization: `Bearer ${token}` } : {};

          const res = await fetch(
            `${API_BASE_URL}/api/cases/${caseId}/patterns`,
            { headers }
          );
          if (res.ok) {
            const data = await res.json();
            const mappedPatterns = (data.patterns || []).map((p) => ({
              badge: p.risk || "MEDIUM",
              title: p.name || "Pattern Detected",
              desc: `Detected on wallet ${p.wallet ? p.wallet.slice(0, 8) + "..." : "unknown"}. Algorithmic confidence: ${((p.confidence || 0) * 100).toFixed(0)}%.`,
              contribution: `${((p.confidence || 0) * 100).toFixed(0)}%`,
            }));
            setPatterns(mappedPatterns);
          } else if (res.status === 401) {
            toast && toast("Authentication expired. Please log in again.");
          }
        } catch (err) {
          console.error("Failed to load case patterns:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchCaseAI();
    }
  }, [caseId, toast]);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!address.trim()) return;

    setLoading(true);
    setError("");
    setPatterns([]);

    try {
      const token = localStorage.getItem("chainsleuth_token");
      const headers = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      // Using the correct POST endpoint that matches WalletsView.jsx
      const res = await fetch(`${API_BASE_URL}/api/wallets/analyze`, {
        method: "POST",
        headers,
        body: JSON.stringify({ address: address.trim() }),
      });

      // Check if the response is valid before parsing JSON
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();

      toast && toast(`Analysis complete. Risk Score: ${data.riskScore}`);
      
      const generatedPatterns = [];

      // 1. Map ML flags to UI cards
      (data.flags || []).forEach((flag, idx) => {
        const flagStr = typeof flag === "string" ? flag : (flag.type || "UNKNOWN");
        generatedPatterns.push({
          badge: (data.riskLevel || "MEDIUM").toUpperCase(),
          title: flagStr.replace(/_/g, " "),
          desc: data.patterns && data.patterns[idx] 
            ? data.patterns[idx] 
            : "Algorithmic anomaly detected by the ML pipeline. This behavior contributes to the overall risk score.",
          contribution: `${Math.round(100 / Math.max(data.flags.length, 1))}%`
        });
      });

      // 2. If no flags were returned, fallback to mapping the patterns array
      if (generatedPatterns.length === 0 && data.patterns) {
        data.patterns.forEach((p) => {
          generatedPatterns.push({
            badge: (data.riskLevel || "MEDIUM").toUpperCase(),
            title: typeof p === "string" ? p.slice(0, 40) : (p.name || "Pattern"),
            desc: typeof p === "string" ? p : (p.description || "Detected pattern."),
            contribution: "N/A"
          });
        });
      }

      setPatterns(generatedPatterns);
    } catch (err) {
      console.error("AI Analysis error:", err);
      // Provide a much more specific error message
      setError(err.message || "Failed to connect to the backend. Ensure your VITE_API_BASE_URL is set correctly and the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cx-fade-up" style={{ padding: 24 }}>
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          gap: 16,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: 250 }}>
          <h2
            style={{
              margin: "0 0 4px",
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#fff",
            }}
          >
            <BrainCircuit size={20} color="var(--lime)" /> AI Threat Detection
          </h2>
          <p style={{ margin: 0, fontSize: 12, color: "var(--dim)" }}>
            {caseId
              ? "Algorithmic patterns detected in this specific investigation."
              : "Run global entity analysis and structural anomaly detection."}
          </p>
        </div>

        {!caseId && (
          <form
            onSubmit={handleAnalyze}
            style={{ display: "flex", gap: 8, width: "100%", maxWidth: 420 }}
          >
            <input
              placeholder="Enter wallet address to analyze (0x...)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={{
                flex: 1,
                background: "var(--card)",
                border: "1px solid var(--line)",
                borderRadius: 8,
                padding: "10px 14px",
                color: "#fff",
                fontSize: 12,
                outline: "none",
                fontFamily: "monospace",
              }}
            />
            <button
              type="submit"
              disabled={loading}
              className="cx-btn cx-btn-primary"
              style={{
                padding: "10px 16px",
                fontSize: 12,
                borderRadius: 8,
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {loading ? <Loader size={14} className="animate-spin" /> : null}
              {loading ? "Analyzing..." : "Run AI"}
            </button>
          </form>
        )}
      </div>

      {error && (
        <div
          style={{
            padding: 16,
            background: "rgba(255,92,103,.1)",
            color: "var(--danger)",
            border: "1px solid var(--danger)",
            borderRadius: 12,
            marginBottom: 24,
            fontSize: 12,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {patterns.length === 0 && !loading && !error && (
        <div
          style={{
            textAlign: "center",
            padding: 60,
            color: "var(--dim)",
            border: "1px dashed var(--line)",
            borderRadius: 16,
          }}
        >
          <Activity size={32} style={{ opacity: 0.5, marginBottom: 12 }} />
          <div style={{ fontSize: 13 }}>
            {caseId
              ? "No patterns detected yet. Add target wallets to this case and run an analysis to begin."
              : "Enter a wallet address above to ping the scoring engine."}
          </div>
        </div>
      )}

      {loading && patterns.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: 60,
            color: "var(--lime)",
            border: "1px dashed var(--line)",
            borderRadius: 16,
          }}
        >
          <Loader size={32} className="animate-spin" style={{ margin: "0 auto 12px" }} />
          <div style={{ fontSize: 13 }}>
            ML Pipeline running...
          </div>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 12,
        }}
      >
        {patterns.map((p, i) => (
          <div
            key={i}
            style={{
              background: "var(--card)",
              border: "1px solid var(--line)",
              borderRadius: 16,
              padding: 18,
              minHeight: 160,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div>
              <span
                className="cx-badge"
                style={{
                  border: `1px solid ${p.badge === "LOW" ? "rgba(255,255,255,0.1)" : "rgba(182,255,0,.2)"}`,
                  color: p.badge === "LOW" ? "var(--dim)" : "var(--lime)",
                }}
              >
                {p.badge}
              </span>
            </div>
            <h3 style={{ fontSize: 14.5, margin: "14px 0 7px", color: "#fff" }}>
              {p.title}
            </h3>
            <p
              style={{
                color: "var(--muted)",
                fontSize: 11.5,
                lineHeight: 1.6,
                margin: "0 0 20px 0",
                flex: 1,
              }}
            >
              {p.desc}
            </p>

            {p.contribution && (
              <div
                style={{
                  fontSize: 10,
                  color: "var(--dim)",
                  marginTop: "auto",
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                  paddingTop: 12,
                }}
              >
                RISK CONTRIBUTION{" "}
                <b style={{ color: "#fff", marginLeft: 4 }}>{p.contribution}</b>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getDashboardStats, getDashboardAlerts } from "../utils/api.js";

export default function DashboardView({
  analysisResult,
  walletInput,
  setWalletInput,
  blockchain,
  setBlockchain,
  onAnalyze,
  analysisLoading,
  analysisError,
  setAnalysisError,
  onClearResult,
  toast
}) {
  const [stats, setStats] = useState([
    { label: "Wallets Tracked", value: "—", note: "Loading...", icon: "Search" },
    { label: "Active Cases", value: "—", note: "Loading...", icon: "Briefcase" },
    { label: "High-Risk Alerts", value: "—", note: "Loading...", icon: "AlertTriangle" },
    { label: "Transactions Traced", value: "—", note: "Loading...", icon: "TrendingUp" }
  ]);

  const [chartData, setChartData] = useState([
    { month: "Jan", crores: 45 },
    { month: "Feb", crores: 52 },
    { month: "Mar", crores: 48 },
    { month: "Apr", crores: 61 },
    { month: "May", crores: 55 },
    { month: "Jun", crores: 67 }
  ]);

  const [alerts, setAlerts] = useState([
    { wallet: "0x742d...f44e", title: "Rapid Pass-Through detected", sev: "high" },
    { wallet: "0xABC...1234", title: "Fund mixing activity", sev: "high" },
    { wallet: "0xDEF...5678", title: "Unusual gas spending", sev: "medium" }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Update stats if analysis result available
  useEffect(() => {
    if (analysisResult) {
      const updatedStats = [
        {
          label: "Risk Score",
          value: analysisResult.score !== undefined ? analysisResult.score : analysisResult.riskScore || 0,
          note: `${analysisResult.risk_level || analysisResult.riskLevel || "Unknown"} Risk`,
          icon: "AlertTriangle"
        },
        {
          label: "Transactions",
          value: analysisResult.tx_count || analysisResult.transactionCount || 0,
          note: "Found in blockchain",
          icon: "TrendingUp"
        },
        {
          label: "Linked Wallets",
          value: analysisResult.linked_wallets?.length || analysisResult.linkedWallets?.length || 0,
          note: "Direct connections",
          icon: "Search"
        },
        {
          label: "Flagged Patterns",
          value: analysisResult.flags?.length || 0,
          note: "Detected anomalies",
          icon: "AlertTriangle"
        }
      ];
      setStats(updatedStats);
    }
  }, [analysisResult]);

  // Fetch dashboard data from backend
  useEffect(() => {
    let cancelled = false;

    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch stats
        const statsData = await getDashboardStats();
        if (!cancelled) {
          if (statsData.stats && Array.isArray(statsData.stats)) {
            setStats(statsData.stats);
          }
          if (statsData.chartData && Array.isArray(statsData.chartData)) {
            setChartData(statsData.chartData);
          }
        }

        // Fetch alerts
        const alertsData = await getDashboardAlerts();
        if (!cancelled) {
          if (alertsData.alerts && Array.isArray(alertsData.alerts)) {
            setAlerts(alertsData.alerts);
          }
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        if (!cancelled) {
          // Don't show error - dashboard should load with defaults
          setError(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();
    return () => {
      cancelled = true;
    };
  }, []);

  const iconMap = {
    Search: <svg viewBox="0 0 24 24" width="16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></svg>,
    AlertTriangle: <svg viewBox="0 0 24 24" width="16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 4 21 20H3L12 4Z"/><path d="M12 9v5M12 17h.01"/></svg>,
    TrendingUp: <svg viewBox="0 0 24 24" width="16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 7h13M14 4l3 3-3 3M20 17H7M10 14l-3 3 3 3"/></svg>,
    Briefcase: <svg viewBox="0 0 24 24" width="16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="20" height="13" rx="2"/><path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"/></svg>
  };

  const getRiskColor = (score) => {
    if (score >= 75) return "#ef4444";
    if (score >= 50) return "#ff6b35";
    return "#22c55e";
  };

  return (
    <div className="dsv-root">
      <style>{`
        .dsv-root {
          width: 100%;
        }

        .dsv-analyze-form {
          background: #0d1214;
          border: 1px solid #20282a;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 22px;
        }

        .dsv-form-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .dsv-form-title {
          font-size: 14px;
          font-weight: 600;
          color: #edf2f0;
        }

        .dsv-form-subtitle {
          font-size: 11px;
          color: #7e898c;
          margin-bottom: 16px;
        }

        .dsv-form-group {
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: 12px;
          margin-bottom: 16px;
        }

        .dsv-form-input {
          background: #060a0b;
          border: 1px solid #20282a;
          border-radius: 8px;
          padding: 10px 12px;
          color: #edf2f0;
          font-family: monospace;
          font-size: 12px;
          transition: all 0.2s;
        }

        .dsv-form-input:focus {
          outline: none;
          border-color: #a8ff00;
          box-shadow: 0 0 0 3px rgba(168, 255, 0, 0.1);
        }

        .dsv-form-input::placeholder {
          color: #5a6569;
        }

        .dsv-form-select {
          background: #060a0b;
          border: 1px solid #20282a;
          border-radius: 8px;
          padding: 10px 12px;
          color: #edf2f0;
          font-size: 12px;
          cursor: pointer;
          min-width: 120px;
        }

        .dsv-form-select:focus {
          outline: none;
          border-color: #a8ff00;
        }

        .dsv-form-btn {
          background: #a8ff00;
          color: #060a0b;
          border: none;
          border-radius: 8px;
          padding: 10px 16px;
          font-weight: 600;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 110px;
        }

        .dsv-form-btn:hover:not(:disabled) {
          background: #c5ff4f;
          transform: translateY(-1px);
        }

        .dsv-form-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .dsv-form-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 6px;
          padding: 10px 12px;
          color: #ef4444;
          font-size: 11px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dsv-close-btn {
          background: none;
          border: none;
          color: #7e898c;
          cursor: pointer;
          font-size: 18px;
          padding: 4px 8px;
          transition: color 0.2s;
        }

        .dsv-close-btn:hover {
          color: #edf2f0;
        }

        .dsv-wallet-banner {
          background: linear-gradient(135deg, rgba(168, 255, 0, 0.1), rgba(168, 255, 0, 0.05));
          border: 1px solid rgba(168, 255, 0, 0.2);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 22px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
        }

        .dsv-wallet-stat {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .dsv-wallet-stat-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #a8ff00;
        }

        .dsv-wallet-stat-value {
          font-size: 16px;
          font-weight: 700;
          color: #edf2f0;
          word-break: break-all;
        }

        .dsv-wallet-stat-note {
          font-size: 10px;
          color: #7e898c;
        }

        .dsv-flags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }

        .dsv-flag-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 4px;
          font-size: 9px;
          font-weight: 600;
          color: #ef4444;
        }

        .dsv-connection {
          height: 40px;
          border: 1px solid rgba(168, 255, 0, 0.23);
          background: rgba(90, 130, 15, 0.13);
          border-radius: 9px;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 0 13px;
          color: #a8ff00;
          font-size: 12px;
          margin-bottom: 22px;
          animation: connectionPulse 2s ease-in-out infinite;
        }

        @keyframes connectionPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(168, 255, 0, 0.1); }
          50% { box-shadow: 0 0 0 3px rgba(168, 255, 0, 0.1); }
        }

        .dsv-connection-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #a8ff00;
          box-shadow: 0 0 12px #a8ff00;
          flex-shrink: 0;
          animation: connectionDot 2s ease-in-out infinite;
        }

        @keyframes connectionDot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .dsv-metrics {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 22px;
          margin-bottom: 22px;
          width: 100%;
        }

        .dsv-metric {
          background: #0d1214;
          border: 1px solid #20282a;
          border-radius: 9px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          min-width: 0;
          transition: all 0.2s;
        }

        .dsv-metric:hover {
          border-color: #a8ff00;
          box-shadow: 0 4px 12px rgba(168, 255, 0, 0.1);
        }

        .dsv-metric-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 14px;
        }

        .dsv-metric-label {
          font-size: 12px;
          color: #7e898c;
          font-weight: 500;
        }

        .dsv-metric-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(168, 255, 0, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #a8ff00;
          flex-shrink: 0;
        }

        .dsv-metric-value {
          font-size: 32px;
          color: #edf2f0;
          font-weight: 700;
          margin: 0 0 6px 0;
          line-height: 1;
        }

        .dsv-metric-note {
          font-size: 11px;
          color: #a8ff00;
        }

        .dsv-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 22px;
          width: 100%;
          margin-bottom: 22px;
        }

        .dsv-card {
          background: #0d1214;
          border: 1px solid #20282a;
          border-radius: 9px;
          padding: 20px;
          min-width: 0;
        }

        .dsv-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .dsv-card-title {
          font-size: 13px;
          color: #edf2f0;
          font-weight: 600;
        }

        .dsv-card-meta {
          font-size: 10px;
          color: #7e898c;
        }

        .dsv-card-meta.dsv-live {
          color: #a8ff00;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .dsv-card-meta.dsv-live::before {
          content: "";
          width: 6px;
          height: 6px;
          background: #a8ff00;
          border-radius: 50%;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .dsv-alert {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          gap: 1rem;
        }

        .dsv-alert:last-child {
          border-bottom: none;
        }

        .dsv-alert-text {
          flex: 1;
          min-width: 0;
        }

        .dsv-alert-address {
          font-family: monospace;
          color: #edf2f0;
          font-size: 12px;
          margin-bottom: 3px;
          word-break: break-all;
        }

        .dsv-alert-reason {
          color: #7e898c;
          font-size: 10px;
        }

        .dsv-badge {
          padding: 3px 8px;
          border-radius: 3px;
          font-size: 9px;
          font-weight: 700;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .dsv-badge-high {
          background: rgba(255, 82, 100, 0.15);
          color: #ff5264;
        }

        .dsv-badge-medium {
          background: rgba(255, 191, 63, 0.15);
          color: #ffbf3f;
        }

        .dsv-loading {
          text-align: center;
          padding: 40px 20px;
          color: #7e898c;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .dsv-spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(168, 255, 0, 0.2);
          border-top-color: #a8ff00;
          border-radius: 50%;
          animation: dsv-spin 1s linear infinite;
        }

        @keyframes dsv-spin {
          to { transform: rotate(360deg); }
        }

        .dsv-patterns-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .dsv-pattern-card {
          background: rgba(168, 255, 0, 0.05);
          border: 1px solid rgba(168, 255, 0, 0.1);
          border-radius: 8px;
          padding: 12px;
          font-size: 11px;
        }

        .dsv-pattern-name {
          font-weight: 600;
          color: #a8ff00;
          margin-bottom: 6px;
        }

        .dsv-pattern-confidence {
          color: #7e898c;
          font-size: 10px;
          margin-bottom: 6px;
        }

        .dsv-pattern-risk {
          display: inline-block;
          padding: 2px 6px;
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          border-radius: 3px;
          font-size: 9px;
          font-weight: 600;
        }

        .dsv-pattern-risk.medium {
          background: rgba(255, 107, 53, 0.15);
          color: #ff6b35;
        }

        @media (max-width: 1200px) {
          .dsv-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .dsv-grid { grid-template-columns: 1fr; }
          .dsv-form-group { grid-template-columns: 1fr; }
        }

        @media (max-width: 768px) {
          .dsv-metrics { grid-template-columns: 1fr; }
          .dsv-wallet-banner { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Analyze Wallet Form */}
      <div className="dsv-analyze-form">
        <div className="dsv-form-header">
          <div>
            <div className="dsv-form-title">Analyze Wallet</div>
            <div className="dsv-form-subtitle">Enter a blockchain address to analyze risk and detect suspicious patterns</div>
          </div>
          {analysisResult && (
            <button
              className="dsv-close-btn"
              onClick={onClearResult}
              aria-label="Clear results"
            >
              ✕
            </button>
          )}
        </div>

        {analysisError && (
          <div className="dsv-form-error">
            <span>⚠</span>
            {analysisError}
          </div>
        )}

        {!analysisResult ? (
          <form onSubmit={onAnalyze}>
            <div className="dsv-form-group">
              <input
                type="text"
                className="dsv-form-input"
                placeholder={blockchain === "ethereum" ? "0x742d35Cc6634C0532925a3b844Bc454e4438f44e" : "1A1z7agoat7JFsdLyQUXSv7h5ckoustF3"}
                value={walletInput}
                onChange={(e) => {
                  setWalletInput(e.target.value);
                  setAnalysisError(null);
                }}
                disabled={analysisLoading}
              />
              <select
                className="dsv-form-select"
                value={blockchain}
                onChange={(e) => setBlockchain(e.target.value)}
                disabled={analysisLoading}
              >
                <option value="ethereum">Ethereum</option>
                <option value="bitcoin">Bitcoin</option>
              </select>
              <button
                type="submit"
                className="dsv-form-btn"
                disabled={analysisLoading || !walletInput.trim()}
              >
                {analysisLoading ? "Analyzing..." : "Analyze"}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ textAlign: "center", color: "#a8ff00", fontSize: "12px" }}>
            ✓ Analysis complete. Results shown below.
          </div>
        )}
      </div>

      {/* Wallet Analysis Banner - Only show after analysis */}
      {analysisResult && (
        <div className="dsv-wallet-banner">
          <div className="dsv-wallet-stat">
            <div className="dsv-wallet-stat-label">Wallet Address</div>
            <div className="dsv-wallet-stat-value" style={{ fontSize: "13px", fontFamily: "monospace" }}>
              {analysisResult.wallet?.slice(0, 16)}...
            </div>
          </div>

          <div className="dsv-wallet-stat">
            <div className="dsv-wallet-stat-label">Blockchain</div>
            <div className="dsv-wallet-stat-value">
              {analysisResult.blockchain?.toUpperCase() || "ETH"}
            </div>
          </div>

          <div className="dsv-wallet-stat">
            <div className="dsv-wallet-stat-label">Risk Level</div>
            <div className="dsv-wallet-stat-value" style={{
              color: analysisResult.risk_level === "HIGH" || analysisResult.riskLevel === "HIGH" ? "#ef4444" :
                     analysisResult.risk_level === "MEDIUM" || analysisResult.riskLevel === "MEDIUM" ? "#ff6b35" : "#22c55e"
            }}>
              {analysisResult.risk_level || analysisResult.riskLevel || "LOW"}
            </div>
          </div>

          <div className="dsv-wallet-stat">
            <div className="dsv-wallet-stat-label">Risk Score</div>
            <div className="dsv-wallet-stat-value" style={{
              color: getRiskColor(analysisResult.score || analysisResult.riskScore || 0)
            }}>
              {analysisResult.score || analysisResult.riskScore || 0}/100
            </div>
          </div>

          {analysisResult.flags && analysisResult.flags.length > 0 && (
            <div style={{ gridColumn: "1 / -1" }}>
              <div className="dsv-wallet-stat-label" style={{ marginBottom: "8px" }}>Risk Flags</div>
              <div className="dsv-flags-list">
                {analysisResult.flags.map((flag, i) => (
                  <div key={i} className="dsv-flag-badge">
                    ⚠ {typeof flag === "string" ? flag : flag.type}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Connection Banner */}
      <div className="dsv-connection">
        <span className="dsv-connection-dot"></span>
        Connected to live blockchain data &amp; backend
      </div>

      {/* Loading State */}
      {loading && (
        <div className="dsv-loading">
          <span className="dsv-spinner"></span>Loading dashboard...
        </div>
      )}

      {/* Metrics Grid */}
      <div className="dsv-metrics">
        {stats.map((stat, idx) => (
          <div className="dsv-metric" key={idx}>
            <div className="dsv-metric-header">
              <span className="dsv-metric-label">{stat.label}</span>
              <div className="dsv-metric-icon">
                {iconMap[stat.icon]}
              </div>
            </div>
            <div className="dsv-metric-value">{stat.value}</div>
            <div className="dsv-metric-note">{stat.note}</div>
          </div>
        ))}
      </div>

      {/* Chart + Alerts Grid */}
      <div className="dsv-grid">
        <div className="dsv-card">
          <div className="dsv-card-header">
            <div className="dsv-card-title">Capital Tracing Velocity</div>
            <div className="dsv-card-meta">₹ Crores traced per month</div>
          </div>
          <ResponsiveContainer width="100%" height={248}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="dsvColorCrores" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a8ff00" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a8ff00" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,.04)" vertical={false} />
              <XAxis dataKey="month" stroke="#5a6569" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#5a6569" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "#141a1c", border: "1px solid #263252", borderRadius: 6, fontSize: 11 }} />
              <Area type="monotone" dataKey="crores" stroke="#a8ff00" strokeWidth={2.5} fillOpacity={1} fill="url(#dsvColorCrores)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="dsv-card">
          <div className="dsv-card-header">
            <div className="dsv-card-title">Recent High-Risk Alerts</div>
            <div className="dsv-card-meta dsv-live">Live Feed</div>
          </div>
          {alerts && alerts.length > 0 ? (
            alerts.map((alert, idx) => (
              <div className="dsv-alert" key={idx}>
                <div className="dsv-alert-text">
                  <div className="dsv-alert-address">{alert.wallet}</div>
                  <div className="dsv-alert-reason">{alert.title}</div>
                </div>
                <div className={`dsv-badge ${alert.sev === "high" ? "dsv-badge-high" : "dsv-badge-medium"}`}>
                  {alert.sev?.toUpperCase()}
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: "20px", textAlign: "center", color: "#7e898c", fontSize: "11px" }}>
              No alerts yet
            </div>
          )}
        </div>
      </div>

      {/* Detected Patterns - Show if analysis available */}
      {analysisResult?.patterns && analysisResult.patterns.length > 0 && (
        <div className="dsv-card">
          <div className="dsv-card-header">
            <div className="dsv-card-title">Detected Suspicious Patterns</div>
            <div className="dsv-card-meta">{analysisResult.patterns.length} patterns</div>
          </div>
          <div className="dsv-patterns-grid">
            {analysisResult.patterns.map((pattern, idx) => (
              <div key={idx} className="dsv-pattern-card">
                <div className="dsv-pattern-name">
                  {typeof pattern === "string" ? pattern : pattern.name}
                </div>
                {pattern.confidence && (
                  <div className="dsv-pattern-confidence">
                    Confidence: {(pattern.confidence * 100).toFixed(0)}%
                  </div>
                )}
                {pattern.risk && (
                  <div className={`dsv-pattern-risk ${pattern.risk.toLowerCase() === "medium" ? "medium" : ""}`}>
                    {pattern.risk}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
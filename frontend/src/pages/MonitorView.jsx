import React, { useState, useEffect, useRef } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

export default function MonitorView({ toast }) {
  const [feed, setFeed] = useState([]);
  const [isPolling, setIsPolling] = useState(true);
  const feedEndRef = useRef(null);

  useEffect(() => {
    const fetchLiveAlerts = async () => {
      try {
        const token = localStorage.getItem("chainsleuth_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await fetch(`${API_BASE_URL}/api/dashboard/alerts`, { headers });
        
        if (res.status === 401) {
          if (toast) toast("Authentication expired. Please log in again.");
          setIsPolling(false); // Stop polling if auth fails
          return;
        }

        if (res.ok) {
          const data = await res.json();

          // Map the backend data, ensuring we inject a timestamp and fallback description
          const freshAlerts = (data.alerts || []).map((a, i) => ({
            ...a,
            id: `alert-${Date.now()}-${i}`,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
            desc:
              a.desc ||
              "System detected anomalous routing matching algorithmic risk profiles.",
          }));

          // Prepend new alerts and keep the list to a maximum of 50 recent events
          setFeed((prevFeed) => {
            const combined = [...freshAlerts, ...prevFeed];
            // Deduplicate by title+wallet to prevent spamming the exact same alert every 5 seconds
            const unique = combined.filter(
              (v, i, a) =>
                a.findIndex(
                  (t) => t.title === v.title && t.wallet === v.wallet,
                ) === i,
            );
            return unique.slice(0, 50);
          });
        }
      } catch (err) {
        console.error("Live feed connection lost:", err);
      }
    };

    // Initial fetch
    fetchLiveAlerts();

    // Set up background polling every 5 seconds for faster real-time feel
    const interval = setInterval(() => {
      if (isPolling) fetchLiveAlerts();
    }, 5000);

    return () => clearInterval(interval);
  }, [isPolling, toast]);

  // Auto-scroll to top when a new alert comes in (since we prepend)
  // Or keep it simple, the scroll container handles it.

  return (
    <div className="cx-fade" style={{ padding: 24, height: "100%", display: "flex", flexDirection: "column" }}>
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(182,255,0, 0.7); }
          70% { box-shadow: 0 0 0 6px rgba(182,255,0, 0); }
          100% { box-shadow: 0 0 0 0 rgba(182,255,0, 0); }
        }
        @keyframes slideIn {
          0% { transform: translateX(20px); opacity: 0; background: rgba(182,255,0, 0.05); }
          100% { transform: translateX(0); opacity: 1; background: transparent; }
        }
        .live-alert-item {
          animation: slideIn 0.5s ease-out forwards;
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      `}</style>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 13,
            color: isPolling ? "var(--lime)" : "var(--danger)",
            fontWeight: 700,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 99,
              background: isPolling ? "var(--lime)" : "var(--danger)",
              animation: isPolling ? "pulse 2s infinite" : "none",
            }}
          />
          {isPolling ? "LIVE FEED ACTIVE" : "FEED PAUSED"}
        </div>
        <button
          onClick={() => setIsPolling(!isPolling)}
          style={{
            background: "transparent",
            border: "1px solid var(--line)",
            color: isPolling ? "var(--danger)" : "var(--lime)",
            fontSize: 11,
            padding: "6px 12px",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          {isPolling ? "PAUSE FEED" : "RESUME FEED"}
        </button>
      </div>

      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--line)",
          borderRadius: 16,
          overflowY: "auto",
          flex: 1,
          maxHeight: "calc(100vh - 180px)",
          background: "radial-gradient(circle at top right, rgba(182,255,0,0.03), transparent 40%), var(--card)",
        }}
      >
        {feed.length === 0 ? (
          <div
            style={{
              padding: 60,
              textAlign: "center",
              color: "var(--dim)",
              fontSize: 13,
            }}
          >
            <div style={{ marginBottom: 8, fontSize: 24 }}>📡</div>
            Listening for network anomalies...<br/>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>High-risk transactions will appear here in real-time.</span>
          </div>
        ) : (
          feed.map((a, index) => (
            <div
              key={a.id}
              className="live-alert-item"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 20px",
                borderBottom: "1px solid rgba(255,255,255,.05)",
                transition: "background 0.2s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "4px 8px",
                    borderRadius: 4,
                    background:
                      a.sev === "high"
                        ? "rgba(255,92,103,.15)"
                        : a.sev === "medium"
                          ? "rgba(255,189,74,.15)"
                          : "rgba(113,128,135,.15)",
                    color:
                      a.sev === "high"
                        ? "var(--danger)"
                        : a.sev === "medium"
                          ? "var(--warning)"
                          : "var(--dim)",
                    minWidth: 60,
                    textAlign: "center",
                  }}
                >
                  {a.sev.toUpperCase()}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: "#fff" }}>
                      {a.title}
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>
                    {a.desc}
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: 10.5, color: "var(--dim)", marginTop: 6 }}>
                    {a.wallet}
                  </div>
                </div>
              </div>
              <span style={{ fontSize: 10.5, color: "var(--dim)", whiteSpace: "nowrap", marginLeft: 16 }}>
                {a.time}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
import React, { useState, useEffect } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

export default function MonitorView() {
  const [feed, setFeed] = useState([]);
  const [isPolling, setIsPolling] = useState(true);

  useEffect(() => {
    const fetchLiveAlerts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/dashboard/alerts`);
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

          // Prepend new alerts and keep the list to a maximum of 25 recent events
          setFeed((prevFeed) => {
            const combined = [...freshAlerts, ...prevFeed];
            // Deduplicate by title+wallet to prevent spamming the exact same alert every 8 seconds
            const unique = combined.filter(
              (v, i, a) =>
                a.findIndex(
                  (t) => t.title === v.title && t.wallet === v.wallet,
                ) === i,
            );
            return unique.slice(0, 25);
          });
        }
      } catch (err) {
        console.error("Live feed connection lost:", err);
      }
    };

    // Initial fetch
    fetchLiveAlerts();

    // Set up background polling every 8 seconds
    const interval = setInterval(() => {
      if (isPolling) fetchLiveAlerts();
    }, 8000);

    return () => clearInterval(interval);
  }, [isPolling]);

  return (
    <div className="cx-fade" style={{ padding: 24 }}>
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
            gap: 8,
            fontSize: 12.5,
            color: "var(--lime)",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 99,
              background: "var(--lime)",
              boxShadow: "0 0 0 4px rgba(182,255,0,.15)",
              animation: "pulse 2s infinite",
            }}
          />
          Live feed — connected to port 5001
        </div>
        <button
          onClick={() => setIsPolling(!isPolling)}
          style={{
            background: "transparent",
            border: "1px solid var(--line)",
            color: "var(--dim)",
            fontSize: 11,
            padding: "4px 10px",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          {isPolling ? "Pause Feed" : "Resume Feed"}
        </button>
      </div>

      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--line)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {feed.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: "var(--dim)",
              fontSize: 12,
            }}
          >
            Listening for network anomalies...
          </div>
        ) : (
          feed.map((a) => (
            <div
              key={a.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 20px",
                borderBottom: "1px solid rgba(255,255,255,.05)",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    className="cx-badge"
                    style={{
                      background:
                        a.sev === "high"
                          ? "rgba(255,92,103,.12)"
                          : a.sev === "medium"
                            ? "rgba(255,189,74,.12)"
                            : "rgba(113,128,135,.15)",
                      color:
                        a.sev === "high"
                          ? "var(--danger)"
                          : a.sev === "medium"
                            ? "var(--warning)"
                            : "var(--dim)",
                    }}
                  >
                    {a.sev.toUpperCase()}
                  </span>
                  <span
                    style={{ fontWeight: 700, fontSize: 13, color: "#fff" }}
                  >
                    {a.title}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: "var(--muted)",
                    marginTop: 6,
                  }}
                >
                  {a.desc}
                </div>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 10.5,
                    color: "var(--dim)",
                    marginTop: 6,
                  }}
                >
                  {a.wallet}
                </div>
              </div>
              <span
                style={{
                  fontSize: 10.5,
                  color: "var(--dim)",
                  whiteSpace: "nowrap",
                }}
              >
                {a.time}
              </span>
            </div>
          ))
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

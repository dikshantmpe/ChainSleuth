import React, { useState, useEffect } from "react";
import { FileText, Download, Loader2 } from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

export default function ReportsView({ toast }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    const fetchCasesForReports = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("chainsleuth_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await fetch(`${API_BASE_URL}/api/cases`, { headers });
        const data = await res.json();

        if (res.ok) {
          const liveReports = (data.cases || []).map((c) => ({
            id: `REP-${c.id}`,
            title: `Forensic Summary: ${c.title}`,
            case: c.id,
            generated: c.date_opened 
              ? new Date(c.date_opened).toLocaleDateString() 
              : new Date().toLocaleDateString(),
            investigator: c.investigator || "Unknown",
          }));
          setReports(liveReports);
        } else {
          if (res.status === 401) {
            setError("Authentication expired. Please log in again.");
          } else {
            setError("Failed to load case data.");
          }
        }
      } catch (err) {
        setError("Connection error - backend not available.");
      } finally {
        setLoading(false);
      }
    };

    fetchCasesForReports();
  }, []);

  // Generate report using existing /wallets endpoint instead of /export-data
  const handleDownload = async (report) => {
    setDownloadingId(report.id);
    try {
      const token = localStorage.getItem("chainsleuth_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Fetch wallets for this specific case
      const res = await fetch(
        `${API_BASE_URL}/api/cases/${report.case}/wallets`,
        { headers }
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch case wallets");
      }

      const wallets = data.wallets || [];

      let content = `
======================================================
           CHAINSLEUTH FORENSIC REPORT
======================================================

CASE ID:        ${report.case}
TITLE:          ${report.title}
PREPARED BY:    ${report.investigator}
DATE OPENED:    ${report.generated}

------------------------------------------------------
INVESTIGATION SUMMARY:
This document serves as the official forensic export 
for case ${report.case}. A total of ${wallets.length} wallets 
were tracked and analyzed using the ChainSleuth ML engine.

------------------------------------------------------
SUBJECT WALLETS & AI RISK ASSESSMENT:
`.trim();

      if (wallets.length === 0) {
        content += "\n\nNo wallets currently tracked in this case.\n";
      } else {
        wallets.forEach((w, i) => {
          // Safely format volume to prevent crashes if null
          const vol = Number(w.total_volume || 0).toFixed(4);
          
          content += `\n[${i + 1}] WALLET: ${w.address}\n`;
          content += `    Risk Score: ${w.score || 0}/100 (${(w.risk || w.level || "low").toUpperCase()})\n`;
          content += `    Transactions Recorded: ${w.tx_count || w.txCount || 0}\n`;
          content += `    Total Volume Moved: ${vol} ETH\n`;

          if (w.patterns && w.patterns.length > 0) {
            content += `    ML Detected Patterns:\n`;
            w.patterns.forEach((p) => {
              const conf = ((p.confidence || 0) * 100).toFixed(0);
              const pName = typeof p === "string" ? p : (p.name || "Pattern");
              const pRisk = typeof p === "object" ? (p.risk || "N/A") : "N/A";
              content += `      - ${pName} (Risk: ${pRisk}, Confidence: ${conf}%)\n`;
            });
          } else if (w.flags && w.flags.length > 0) {
            content += `    ML Detected Flags:\n`;
            w.flags.forEach((f) => {
              const fStr = typeof f === "string" ? f : (f.type || "Flag");
              content += `      - ${fStr.replace(/_/g, " ")}\n`;
            });
          } else {
            content += `    ML Detected Patterns: None (Unanalyzed)\n`;
          }
        });
      }

      content += `\n------------------------------------------------------\n*** END OF REPORT ***\n`;

      // Create a Blob containing the text data
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);

      // Create an invisible anchor tag to trigger the download
      const link = document.createElement("a");
      link.href = url;
      link.download = `${report.id}_Court_Export.txt`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (toast) toast(`Court report exported: ${report.id}_Court_Export.txt`);
    } catch (err) {
      console.error("Export error:", err);
      if (toast) toast(`Error: ${err.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="cx-fade-up" style={{ padding: 24 }}>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <FileText size={18} color="var(--lime)" />
        <h2 style={{ margin: 0, fontSize: 18, color: "#fff" }}>
          Court Report Generation
        </h2>
      </div>
      <p style={{ margin: "0 0 24px 0", fontSize: 12, color: "var(--dim)" }}>
        Export immutable forensic summaries of tracked wallets and ML risk
        assessments for legal proceedings.
      </p>

      {error && (
        <div
          style={{
            padding: 16,
            background: "rgba(255,92,103,.1)",
            color: "var(--danger)",
            border: "1px solid var(--danger)",
            borderRadius: 12,
            marginBottom: 16,
            fontSize: 12,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--line)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: "var(--dim)",
              fontSize: 12,
            }}
          >
            Compiling forensic reports from active cases...
          </div>
        ) : reports.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: "var(--dim)",
              fontSize: 12,
            }}
          >
            No investigations found. Create a Case first to generate a report.
          </div>
        ) : (
          reports.map((r) => (
            <div
              key={r.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 20px",
                borderBottom: "1px solid rgba(255,255,255,.05)",
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#fff" }}>
                  {r.title}
                </div>
                <div
                  style={{ fontSize: 11, color: "var(--dim)", marginTop: 4 }}
                >
                  Case {r.case} · Compiled {r.generated} · Prepared by{" "}
                  {r.investigator}
                </div>
              </div>
              <button
                className="cx-btn cx-btn-secondary"
                style={{ display: "flex", alignItems: "center", gap: 7 }}
                onClick={() => handleDownload(r)}
                disabled={downloadingId === r.id}
              >
                {downloadingId === r.id ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Download size={13} /> Export File
                  </>
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
import React, { useState, useEffect } from "react";
import Topbar from "../components/Topbar.jsx";
import DashboardView from "./DashboardView.jsx";
import CasesView from "./CasesView.jsx";
import CaseDetailView from "./CaseDetailView.jsx";
import WalletsView from "./WalletsView.jsx";
import TransactionsView from "./TransactionsView.jsx";
import GraphView from "./GraphView.jsx";
import AIView from "./AIView.jsx";
import MonitorView from "./MonitorView.jsx";
import ReportsView from "./ReportsView.jsx";
import SettingsView from "./SettingsView.jsx";
import AdminView from "./AdminView.jsx";
import { getCases, analyzeFraudScore, getWalletConnections } from "../utils/api.js";

export default function Dashboard({ onLogout, role, user }) {
  const [view, setView] = useState(() => {
    return localStorage.getItem("cs_view") || "dashboard";
  });

  const [activeCase, setActiveCase] = useState(null);
  const [cases, setCases] = useState([]);
  const [casesLoading, setCasesLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("success");

  // Wallet analysis state
  const [walletInput, setWalletInput] = useState("");
  const [blockchain, setBlockchain] = useState("ethereum");
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(() => {
    // Check if wallet data was passed from landing page
    const storedData = localStorage.getItem("cs_wallet_data");
    return storedData ? JSON.parse(storedData) : null;
  });

  // Fetch cases from backend on mount
  useEffect(() => {
    const fetchCases = async () => {
      setCasesLoading(true);
      try {
        const data = await getCases();
        setCases(Array.isArray(data.cases) ? data.cases : []);
      } catch (err) {
        console.error("Failed to fetch cases:", err);
        setCases([]);
        toast("Failed to load cases", "error");
      } finally {
        setCasesLoading(false);
      }
    };

    fetchCases();
  }, []);

  // Clean up wallet data from landing page after loading
  useEffect(() => {
    if (analysisResult && localStorage.getItem("cs_wallet_data")) {
      localStorage.removeItem("cs_wallet_data");
      localStorage.removeItem("cs_wallet_address");
      localStorage.removeItem("cs_is_demo");
    }
  }, [analysisResult]);

  // Validate wallet address format
  const isValidWallet = (addr) => {
    if (blockchain === "ethereum") {
      return /^0x[a-fA-F0-9]{40}$/.test(addr);
    } else if (blockchain === "bitcoin") {
      return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(addr) || /^bc1[a-z0-9]{39,59}$/.test(addr);
    }
    return false;
  };

  // Analyze wallet
  const handleAnalyzeWallet = async (e) => {
    e.preventDefault();
    setAnalysisError(null);

    if (!walletInput.trim()) {
      setAnalysisError("Please enter a wallet address");
      return;
    }

    if (!isValidWallet(walletInput.trim())) {
      setAnalysisError(
        blockchain === "ethereum"
          ? "Invalid Ethereum address (must start with 0x and be 42 chars)"
          : "Invalid Bitcoin address format"
      );
      return;
    }

    setAnalysisLoading(true);

    try {
      // 1. Fetch ML Fraud Score
      const result = await analyzeFraudScore({
        address: walletInput.trim(),
        blockchain: blockchain || "ethereum"
      });

      // 2. Fetch Neo4j Linked Wallets
      try {
        const connectionData = await getWalletConnections(walletInput.trim());
        result.linkedWallets = connectionData.connected_wallets || [];
      } catch (connErr) {
        console.error("Connection fetch error:", connErr);
        result.linkedWallets = [];
      }

      setAnalysisResult(result);
      setWalletInput("");
      setAnalysisError(null);
      toast("Wallet analysis complete", "success");
    } catch (err) {
      console.error("Analysis error:", err);
      setAnalysisError(err.message || "Analysis failed. Please try again.");
      toast(err.message || "Analysis failed", "error");
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Save view preference
  useEffect(() => {
    localStorage.setItem("cs_view", view);
  }, [view]);

  const toast = (msg, type = "success") => {
    setToastMsg(msg);
    setToastType(type);
    window.setTimeout(() => setToastMsg(""), 3000);
  };

  const isAdmin = role === "admin";
  
  // Get display name from user prop, fallback to generic
  const displayName = user?.name || (isAdmin ? "Admin Sharma" : "Investigator Singh");
  const unitLabel = isAdmin ? "System Administration" : "Chandigarh Cyber Cell";

  const titles = {
    dashboard: ["Investigation Command Center", `Welcome back, ${displayName} · ${unitLabel}`],
    cases: ["Active Cases", "Investigations currently open across your unit"],
    wallets: ["Wallet Explorer", "Search and inspect tracked wallet addresses"],
    transactions: ["Transaction Explorer", "Look up any transaction hash"],
    graph: ["Blockchain Graph", "Visual fund-flow trace for the current case"],
    ai: ["AI Pattern Detection", "Patterns contributing to suspicion scores"],
    monitor: ["Realtime Monitor", "Live alert feed across all tracked wallets"],
    reports: ["Court Reports", "Generate and export evidence-ready reports"],
    admin: ["Admin Panel", "Manage investigator accounts and access"],
    settings: ["Settings", "Manage your investigator profile"],
  };

  const [title, subtitle] = view === "cases" && activeCase
    ? [activeCase.title, `Case file · ${activeCase.id}`]
    : [titles[view]?.[0], titles[view]?.[1]];

  const openView = (id) => {
    setActiveCase(null);
    setView(id);
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      background: "#060a0b",
      color: "#edf2f0",
      overflow: "hidden"
    }}>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html, body {
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
        }

        body {
          background: #060a0b;
          color: "#edf2f0";
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif;
        }

        #root {
          width: 100%;
          height: 100%;
        }
      `}</style>

      {/* Topbar */}
      <Topbar view={view} setView={openView} onLogout={onLogout} role={role} user={user} />

      {/* Main Content Area */}
      <main style={{
        flex: 1,
        overflowY: "auto",
        background: "#060a0b",
        scrollBehavior: "smooth"
      }}>
        <div style={{
          width: "100%",
          maxWidth: "1390px",
          margin: "0 auto",
          padding: "28px 24px 44px"
        }}>
          {/* Header Section */}
          <div style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "22px",
            flexWrap: "wrap",
            gap: "1rem"
          }}>
            <div>
              <h1 style={{
                fontSize: "24px",
                letterSpacing: "-0.7px",
                margin: "0 0 6px",
                fontWeight: 700,
                color: "#edf2f0"
              }}>
                {title}
              </h1>
              <p style={{
                margin: 0,
                color: "#7e898c",
                fontSize: "13px"
              }}>
                {subtitle}
              </p>
            </div>
          </div>

          {/* Content Section */}
          {view === "dashboard" && (
            <DashboardView
              analysisResult={analysisResult}
              walletInput={walletInput}
              setWalletInput={setWalletInput}
              blockchain={blockchain}
              setBlockchain={setBlockchain}
              onAnalyze={handleAnalyzeWallet}
              analysisLoading={analysisLoading}
              analysisError={analysisError}
              setAnalysisError={setAnalysisError}
              onClearResult={() => {
                setAnalysisResult(null);
                setAnalysisError(null);
              }}
              toast={toast}
            />
          )}
          {view === "cases" && (
            activeCase
              ? <CaseDetailView caseItem={activeCase} onBack={() => setActiveCase(null)} />
              : <CasesView
                  cases={cases}
                  loading={casesLoading}
                  onOpen={(c) => setActiveCase(c)}
                  isAdmin={isAdmin}
                  onAddCase={(c) => setCases((prev) => [c, ...prev])}
                  toast={toast}
                />
          )}
          {view === "wallets" && <WalletsView />}
          {view === "transactions" && <TransactionsView />}
          {view === "graph" && <GraphView />}
          {view === "ai" && <AIView />}
          {view === "monitor" && <MonitorView />}
          {view === "reports" && <ReportsView toast={toast} />}
          {view === "admin" && isAdmin && <AdminView toast={toast} />}
          {view === "settings" && <SettingsView toast={toast} role={role} user={user} />}
        </div>
      </main>

      {/* Toast Notification */}
      {toastMsg && (
        <div style={{
          position: "fixed",
          right: "24px",
          bottom: "24px",
          background: toastType === "error" ? "#1a0f0f" : "#0f1213",
          border: `1px solid ${toastType === "error" ? "#ef4444" : "#1f2729"}`,
          color: toastType === "error" ? "#ef4444" : "#d4dbd8",
          borderRadius: "8px",
          padding: "12px 16px",
          fontSize: "11px",
          boxShadow: "0 16px 40px rgba(0, 0, 0, 0.6)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          animation: "toastSlideIn 0.3s ease",
          zIndex: 50
        }}>
          <span>{toastType === "error" ? "⚠" : "✓"}</span>
          {toastMsg}
          <style>{`
            @keyframes toastSlideIn {
              from {
                transform: translateX(100%);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
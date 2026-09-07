import React, { useState, useEffect } from "react";
import * as d3 from "d3";
import { LANDING_HTML } from "../data/landingHtml.js";
import { loadDemoData } from "../utils/api.js";
import chainSleuthLogo from "../assets/chainsleuth-full-logo.png";

export default function Landing({ onLaunch }) {
  const [demoResult, setDemoResult] = useState(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState(null);

  const handleLoadDemo = async (e) => {
    e.preventDefault();
    setDemoLoading(true);
    setDemoError(null);

    try {
      let demo;
      try {
        demo = await loadDemoData();
      } catch (apiErr) {
        console.log("Using fallback demo data");
        demo = {
          wallet: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
          blockchain: "ethereum",
          riskScore: 87,
          riskLevel: "HIGH",
          patterns: [
            { name: "Rapid Pass-Through", risk: "HIGH", confidence: 0.92 },
            { name: "Fund Splitting", risk: "MEDIUM", confidence: 0.78 },
            { name: "Timing Anomaly", risk: "MEDIUM", confidence: 0.65 }
          ],
          linkedWallets: [
            { address: "0xABC123...", type: "exchange", risk: "HIGH" },
            { address: "0xDEF456...", type: "mixer", risk: "CRITICAL" },
            { address: "0xGHI789...", type: "flagged", risk: "HIGH" }
          ],
          transactionCount: 247,
          flags: [
            { type: "OFAC", message: "Address flagged in OFAC database" },
            { type: "MIXER", message: "Connected to known mixing service" }
          ],
          timestamp: new Date().toISOString()
        };
      }
      setDemoResult(demo);
      setDemoLoading(false);
      // Scroll to results
      setTimeout(() => {
        document.getElementById("demo-results")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      console.error("Demo load failed:", err);
      setDemoError("Failed to load demo data");
      setDemoLoading(false);
    }
  };

  useEffect(() => {
    // 0. Replace logo with image and style it
    const logoIcon = document.querySelector(".nav-logo-icon");
    if (logoIcon) {
      logoIcon.innerHTML = "";
      logoIcon.style.background = "#B6FF00";
      logoIcon.style.borderRadius = "12px";
      logoIcon.style.width = "40px";
      logoIcon.style.height = "40px";
      logoIcon.style.display = "flex";
      logoIcon.style.alignItems = "center";
      logoIcon.style.justifyContent = "center";
      logoIcon.style.flexShrink = "0";
      
      const img = document.createElement("img");
      img.src = chainSleuthLogo;
      img.alt = "ChainSleuth";
      img.style.height = "28px";
      img.style.width = "auto";
      img.style.objectFit = "contain";
      logoIcon.appendChild(img);
    }

    // 1. Hook up navigation buttons
    const handleNavigate = (e) => {
      e.preventDefault();
      onLaunch();
    };

    const navBtns = ["login-btn", "launch-btn", "analyzeBtn", "footer-investigate"];
    navBtns.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("click", handleNavigate);
    });

    // 2. Setup Navbar scroll effect
    const navbar = document.getElementById("navbar");
    const handleScroll = () => {
      if (window.scrollY > 50) navbar?.classList.add("scrolled");
      else navbar?.classList.remove("scrolled");
    };
    window.addEventListener("scroll", handleScroll);

    // 3. Render D3 graph
    const svg = d3.select("#heroGraph");
    if (!svg.empty()) {
      svg.selectAll("*").remove();
      svg.attr("viewBox", "0 0 500 500");

      const heroNodes = [
        { id: "A", x: 150, y: 100, type: "target" },
        { id: "B", x: 350, y: 150, type: "suspicious" },
        { id: "C", x: 250, y: 250, type: "suspicious" },
        { id: "D", x: 120, y: 350, type: "normal" },
        { id: "E", x: 380, y: 350, type: "flagged" }
      ];
      const heroLinks = [
        { source: "A", target: "B" },
        { source: "B", target: "C" },
        { source: "C", target: "D" },
        { source: "C", target: "E" }
      ];

      const links = svg
        .selectAll(".hero-link")
        .data(heroLinks)
        .enter()
        .append("line")
        .attr("class", "hero-link")
        .attr("x1", (d) => heroNodes.find((n) => n.id === d.source).x)
        .attr("y1", (d) => heroNodes.find((n) => n.id === d.source).y)
        .attr("x2", (d) => heroNodes.find((n) => n.id === d.target).x)
        .attr("y2", (d) => heroNodes.find((n) => n.id === d.target).y)
        .attr("stroke", "#B6FF00")
        .attr("stroke-width", 2)
        .attr("stroke-opacity", 0.4)
        .attr("stroke-dasharray", "5,5");

      function animateLinks() {
        links
          .transition()
          .duration(2000)
          .ease(d3.easeLinear)
          .attrTween("stroke-dashoffset", function () {
            return d3.interpolate(20, 0);
          })
          .on("end", animateLinks);
      }
      animateLinks();

      const nodeGroups = svg
        .selectAll(".hero-node")
        .data(heroNodes)
        .enter()
        .append("g")
        .attr("class", "hero-node")
        .attr("transform", (d) => `translate(${d.x},${d.y})`);

      nodeGroups
        .append("circle")
        .attr("r", 24)
        .attr("fill", (d) =>
          d.type === "flagged" ? "#EF4444" : d.type === "suspicious" ? "#FF6B35" : "#B6FF00"
        )
        .attr("fill-opacity", 0.15)
        .attr("stroke", (d) =>
          d.type === "flagged" ? "#EF4444" : d.type === "suspicious" ? "#FF6B35" : "#B6FF00"
        )
        .attr("stroke-width", 2);

      nodeGroups
        .append("circle")
        .attr("r", 8)
        .attr("fill", (d) =>
          d.type === "flagged" ? "#EF4444" : d.type === "suspicious" ? "#FF6B35" : "#B6FF00"
        );

      const targetNode = nodeGroups.filter((d) => d.type === "target");
      const pulseCircle = targetNode
        .append("circle")
        .attr("r", 24)
        .attr("fill", "none")
        .attr("stroke", "#B6FF00")
        .attr("stroke-width", 2)
        .attr("opacity", 0.8);

      function animatePulse() {
        pulseCircle
          .transition()
          .duration(2000)
          .ease(d3.easeSinOut)
          .attr("r", 48)
          .attr("opacity", 0)
          .on("end", function () {
            d3.select(this).attr("r", 24).attr("opacity", 0.8);
            animatePulse();
          });
      }
      animatePulse();

      nodeGroups
        .append("text")
        .attr("dy", 45)
        .attr("text-anchor", "middle")
        .attr("fill", "#8B9499")
        .attr("font-size", "11px")
        .attr("font-family", "JetBrains Mono, monospace")
        .text((d) => `Wallet ${d.id}`);
    }

    // 4. Hook up demo button
    const loadDemoBtn = document.getElementById("loadDemoBtn");
    loadDemoBtn?.removeEventListener("click", handleLoadDemo);
    loadDemoBtn?.addEventListener("click", handleLoadDemo);

    return () => {
      navBtns.forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.removeEventListener("click", handleNavigate);
      });
      window.removeEventListener("scroll", handleScroll);
      loadDemoBtn?.removeEventListener("click", handleLoadDemo);
    };
  }, [onLaunch]);

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: LANDING_HTML }} />

      {/* Demo Results Panel */}
      {(demoResult || demoLoading || demoError) && (
        <section style={styles.demoSection} id="demo-results">
          <div style={styles.container}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Demo Investigation Results</h2>
              <button
                onClick={() => setDemoResult(null)}
                style={styles.closeBtn}
                aria-label="Close demo results"
              >
                ✕
              </button>
            </div>

            {demoLoading && (
              <div style={styles.loadingContainer}>
                <div style={styles.spinner}></div>
                <p style={styles.loadingText}>Loading demo investigation...</p>
              </div>
            )}

            {demoError && (
              <div style={styles.errorBox}>
                <span>⚠</span>
                <p>{demoError}</p>
              </div>
            )}

            {demoResult && !demoLoading && (
              <div style={styles.resultsGrid}>
                {/* Risk Score */}
                <div style={styles.resultCard}>
                  <div style={styles.cardLabel}>Risk Score</div>
                  <div style={styles.riskScore(demoResult.riskScore)}>
                    {demoResult.riskScore}/100
                  </div>
                  <div style={styles.riskLevel(demoResult.riskLevel)}>
                    {demoResult.riskLevel}
                  </div>
                </div>

                {/* Wallet Info */}
                <div style={styles.resultCard}>
                  <div style={styles.cardLabel}>Wallet Address</div>
                  <div style={styles.addressValue}>{demoResult.wallet}</div>
                  <div style={styles.blockchain}>{demoResult.blockchain.toUpperCase()}</div>
                </div>

                {/* Stats */}
                <div style={styles.resultCard}>
                  <div style={styles.cardLabel}>Transaction Count</div>
                  <div style={styles.statValue}>{demoResult.transactionCount}</div>
                  <div style={styles.cardLabel} style={{ marginTop: "1rem" }}>
                    Linked Wallets
                  </div>
                  <div style={styles.statValue}>{demoResult.linkedWallets.length}</div>
                </div>

                {/* Flags */}
                <div style={styles.resultCard}>
                  <div style={styles.cardLabel}>Risk Flags</div>
                  <div style={styles.flagsList}>
                    {demoResult.flags.map((flag, i) => (
                      <div key={i} style={styles.flagItem}>
                        <span style={styles.flagType}>{flag.type}</span>
                        <span style={styles.flagMsg}>{flag.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {demoResult && !demoLoading && (
              <div style={styles.patternsSection}>
                <h3 style={styles.patternsTitle}>Detected Patterns</h3>
                <div style={styles.patternsList}>
                  {demoResult.patterns.map((pattern, i) => (
                    <div key={i} style={styles.patternItem}>
                      <div style={styles.patternHeader}>
                        <span style={styles.patternName}>{pattern.name}</span>
                        <span style={styles.patternRisk(pattern.risk)}>{pattern.risk}</span>
                      </div>
                      <div style={styles.patternMeta}>
                        Confidence: {(pattern.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {demoResult && !demoLoading && (
              <div style={styles.demoActions}>
                <button
                  onClick={() => {
                    localStorage.setItem("cs_analysis_result", JSON.stringify(demoResult));
                    localStorage.setItem("cs_current_wallet", demoResult.wallet);
                    onLaunch();
                  }}
                  style={styles.continuBtn}
                >
                  Continue to Full Dashboard →
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      <style>{`
        .hero {
          padding-top: 12rem !important;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

const styles = {
  demoSection: {
    padding: "6rem 0",
    background: "linear-gradient(135deg, rgba(13,17,20,0.5), rgba(7,10,12,0.8))",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    animation: "fadeIn 0.4s ease"
  },
  container: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "0 2rem"
  },
  sectionHeader: {
    position: "relative",
    marginBottom: "2rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },
  sectionTitle: {
    fontSize: "2rem",
    fontWeight: 800,
    letterSpacing: "-0.02em",
    color: "#F4F7F5"
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#8B9499",
    fontSize: "1.5rem",
    cursor: "pointer",
    padding: "0.5rem",
    transition: "color 0.2s"
  },
  loadingContainer: {
    textAlign: "center",
    padding: "3rem 2rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1rem"
  },
  spinner: {
    width: 40,
    height: 40,
    border: "3px solid rgba(139,148,153,0.2)",
    borderTopColor: "#B6FF00",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  loadingText: {
    color: "#8B9499",
    fontSize: "0.9375rem"
  },
  errorBox: {
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: 12,
    padding: "1rem 1.25rem",
    display: "flex",
    gap: "0.75rem",
    alignItems: "center",
    color: "#EF4444",
    marginBottom: "1.5rem"
  },
  resultsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "1rem",
    marginBottom: "2rem"
  },
  resultCard: {
    background: "#12171A",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem"
  },
  cardLabel: {
    fontSize: "0.75rem",
    fontWeight: 600,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#8B9499",
    marginBottom: "0.5rem"
  },
  riskScore: (score) => ({
    fontSize: "2rem",
    fontWeight: 800,
    color: score > 75 ? "#EF4444" : score > 50 ? "#FF6B35" : "#22C55E",
    fontFamily: "JetBrains Mono, monospace"
  }),
  riskLevel: (level) => ({
    fontSize: "0.875rem",
    fontWeight: 700,
    color: level === "HIGH" ? "#EF4444" : level === "MEDIUM" ? "#FF6B35" : "#22C55E",
    display: "inline-block",
    padding: "0.25rem 0.75rem",
    background: level === "HIGH" ? "rgba(239,68,68,0.1)" : level === "MEDIUM" ? "rgba(255,107,53,0.1)" : "rgba(34,197,94,0.1)",
    borderRadius: 6
  }),
  addressValue: {
    fontSize: "0.8125rem",
    fontFamily: "JetBrains Mono, monospace",
    color: "#B6FF00",
    wordBreak: "break-all"
  },
  blockchain: {
    fontSize: "0.75rem",
    color: "#8B9499",
    marginTop: "0.25rem"
  },
  statValue: {
    fontSize: "1.75rem",
    fontWeight: 700,
    color: "#F4F7F5",
    fontFamily: "JetBrains Mono, monospace"
  },
  flagsList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem"
  },
  flagItem: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    padding: "0.5rem 0",
    borderBottom: "1px solid rgba(255,255,255,0.05)"
  },
  flagType: {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#EF4444"
  },
  flagMsg: {
    fontSize: "0.8125rem",
    color: "#8B9499"
  },
  patternsSection: {
    marginBottom: "2rem"
  },
  patternsTitle: {
    fontSize: "1.25rem",
    fontWeight: 700,
    marginBottom: "1rem",
    color: "#F4F7F5"
  },
  patternsList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "1rem"
  },
  patternItem: {
    background: "#12171A",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem"
  },
  patternHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },
  patternName: {
    fontSize: "0.9375rem",
    fontWeight: 600,
    color: "#F4F7F5"
  },
  patternRisk: (risk) => ({
    fontSize: "0.75rem",
    fontWeight: 700,
    padding: "0.25rem 0.5rem",
    borderRadius: 4,
    background: risk === "HIGH" ? "rgba(239,68,68,0.15)" : "rgba(255,107,53,0.15)",
    color: risk === "HIGH" ? "#EF4444" : "#FF6B35"
  }),
  patternMeta: {
    fontSize: "0.8125rem",
    color: "#8B9499"
  },
  demoActions: {
    display: "flex",
    gap: "1rem",
    justifyContent: "center",
    marginTop: "2rem"
  },
  continuBtn: {
    background: "#B6FF00",
    color: "#070A0C",
    padding: "0.875rem 2rem",
    borderRadius: 12,
    border: "none",
    fontWeight: 600,
    fontSize: "0.9375rem",
    cursor: "pointer",
    transition: "all 0.2s",
    fontFamily: "inherit"
  }
};
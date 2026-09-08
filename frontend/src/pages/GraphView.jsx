import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import * as d3 from "d3";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

// Fraud flag color mapping (visual badges) - Expanded to match fraud_detection.py
const FRAUD_FLAGS = {
  // Frontend originals
  FUND_SPLITTING: "#ff5c67",
  RAPID_PASS_THROUGH: "#ff9800",
  MIXING_PATTERN: "#ffc107",
  LARGE_TRANSFER: "#f44336",
  UNUSUAL_TIMING: "#ffb300",
  DUST_ATTACK: "#ff6f00",
  WALLET_HOPPING: "#e91e63",
  SYBIL_ACTIVITY: "#9c27b0",

  // Backend ML flags
  OFAC_SANCTIONED: "#d32f2f", // Deep Red
  EXTREME_VALUE_OUTLIER: "#b71c1c", // Darker Red
  HIGH_VALUE_OUTLIER: "#f44336", // Red
  UNUSUAL_VALUE_PATTERN: "#e91e63", // Pink
  HIGH_RECIPIENT_DIVERSITY: "#9c27b0", // Purple
  LOW_TX_COUNT: "#ff9800", // Orange
  HIGH_VOLUME: "#ffc107", // Amber
  REPEATED_TRANSACTIONS: "#ff5722", // Deep Orange
  NORMAL_PATTERN: "#4caf50", // Green
  ERROR_IN_SCORING: "#9e9e9e", // Grey
};

const scoreToRiskLevel = (score) => {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  return "low";
};

const scoreToColor = (score) => {
  const s = Math.min(100, Math.max(0, score || 0));
  if (s >= 75) return "#ff5c67";
  if (s >= 50) return "#ff9800";
  if (s >= 25) return "#ffc107";
  return "#4caf50";
};

// Added toast to props for error notifications
export default function GraphView({ caseId = null, refreshTrigger = null, toast }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hoveredNode, setHoveredNode] = useState(null);
  const [copied, setCopied] = useState(false);
  const [zoomTransform, setZoomTransform] = useState(d3.zoomIdentity);
  const [analyzing, setAnalyzing] = useState(false); // New state for ML button loading

  const stats = useMemo(() => {
    if (!nodes.length)
      return { total: 0, highRisk: 0, avgScore: 0, flagCount: 0 };
    const total = nodes.length;
    const highRisk = nodes.filter((n) => (n.score || 0) >= 50).length;
    const sumScore = nodes.reduce((acc, n) => acc + (n.score || 0), 0);
    const avgScore = Math.round(sumScore / total);

    const uniqueFlags = new Set();
    nodes.forEach((n) => {
      (n.flags || []).forEach((f) =>
        uniqueFlags.add(
          typeof f === "string" ? f : f.type || JSON.stringify(f),
        ),
      );
      (n.patterns || []).forEach((p) =>
        uniqueFlags.add(
          typeof p === "string" ? p : p.name || JSON.stringify(p),
        ),
      );
    });

    return { total, highRisk, avgScore, flagCount: uniqueFlags.size };
  }, [nodes]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Trigger ML Pipeline from the UI
  const handleDeepAnalysis = async (walletId) => {
    try {
      setAnalyzing(true);
      setError("");

      const token = localStorage.getItem("chainsleuth_token");
      const headers = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      // Updated to use the correct POST endpoint matching WalletsView.jsx
      const response = await fetch(`${API_BASE_URL}/api/wallets/analyze`, {
        method: "POST",
        headers,
        body: JSON.stringify({ address: walletId }),
      });
      const data = await response.json();

      if (response.ok) {
        const updatedNodeData = {
          score: data.riskScore,
          risk: (data.riskLevel || "low").toLowerCase(),
          txCount: data.transactionCount,
          // Safely extract string flag names from the backend array of objects
          flags: (data.flags || []).map((f) => f.type || f),
          patterns: data.patterns || [],
        };

        // Update nodes array to trigger D3 re-render (changes node color immediately)
        setNodes((prevNodes) =>
          prevNodes.map((n) =>
            n.id === walletId ? { ...n, ...updatedNodeData } : n,
          ),
        );

        // Update selected node to instantly reflect changes in the details panel
        setSelected((prevSelected) =>
          prevSelected && prevSelected.id === walletId
            ? { ...prevSelected, ...updatedNodeData }
            : prevSelected,
        );
        
        toast && toast(`Analysis complete. Risk Score: ${data.riskScore}`);
      } else {
        if (response.status === 401) {
          toast && toast("Authentication expired. Please log in again.");
        } else {
          setError(data.error || "ML Analysis failed for this wallet.");
          toast && toast(data.error || "ML Analysis failed.");
        }
      }
    } catch (err) {
      setError("Connection error during ML analysis.");
      toast && toast("Connection error during ML analysis.");
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("chainsleuth_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const url = caseId
          ? `${API_BASE_URL}/api/graph?case_id=${caseId}`
          : `${API_BASE_URL}/api/graph`;

        const response = await fetch(url, { headers });
        const data = await response.json();

        if (response.ok) {
          const rawNodes = data.nodes || [];
          const rawLinks = data.links || [];

          if (rawNodes.length === 0) {
            setNodes([]);
            setLinks([]);
            return;
          }

          const enrichedNodes = rawNodes.map((n) => ({
            ...n,
            score: n.score || 0,
            patterns: n.patterns || [],
            flags: n.flags || [],
            risk: n.risk || scoreToRiskLevel(n.score || 0),
            txCount: n.txCount || 0,
          }));

          const validNodeIds = new Set(enrichedNodes.map((n) => n.id));
          const safeLinks = rawLinks.filter(
            (l) => validNodeIds.has(l[0]) && validNodeIds.has(l[1]),
          );

          const simNodes = enrichedNodes.map((n, i) => ({
            ...n,
            x: Math.sin(i * 0.5) * 400 + (Math.random() - 0.5) * 300,
            y: Math.cos(i * 0.7) * 400 + (Math.random() - 0.5) * 300,
          }));
          const simLinks = safeLinks.map((l) => ({
            source: l[0],
            target: l[1],
          }));

          const simulation = d3
            .forceSimulation(simNodes)
            .force(
              "link",
              d3
                .forceLink(simLinks)
                .id((d) => d.id)
                .distance(120)
                .strength(0.2),
            )
            .force("charge", d3.forceManyBody().strength(-450).distanceMax(800))
            .force("x", d3.forceX(0).strength(0.01))
            .force("y", d3.forceY(0).strength(0.01))
            .force("collide", d3.forceCollide(24))
            .alphaTarget(0)
            .stop();

          for (let i = 0; i < 800; ++i) simulation.tick();

          const [xMin, xMax] = d3.extent(simNodes, (d) => d.x);
          const [yMin, yMax] = d3.extent(simNodes, (d) => d.y);

          const xScale = d3
            .scaleLinear()
            .domain([xMin || -1, xMax || 1])
            .range([0.08, 0.92]);
          const yScale = d3
            .scaleLinear()
            .domain([yMin || -1, yMax || 1])
            .range([0.08, 0.92]);

          simNodes.forEach((n) => {
            n.x = xScale(n.x);
            n.y = yScale(n.y);
          });

          setNodes(simNodes);
          setLinks(safeLinks);
          if (simNodes.length > 0 && !selected) {
            setSelected(simNodes[0]);
          }
        } else {
          if (response.status === 401) {
            toast && toast("Authentication expired. Please log in again.");
          }
          setError(data.error || "Failed to fetch graph data");
        }
      } catch (err) {
        setError("Connection error - backend not available");
        setNodes([]);
        setLinks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGraphData();
  }, [caseId, refreshTrigger, toast]);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const svg = d3.select(svgEl);
    const zoom = d3
      .zoom()
      .scaleExtent([0.3, 4])
      .on("zoom", (event) => setZoomTransform(event.transform));

    svg.call(zoom);
  }, []);

  const draw = useCallback(() => {
    const svgEl = svgRef.current;
    const container = containerRef.current;
    if (!svgEl || !container || nodes.length === 0) return;

    const svg = d3.select(svgEl);
    svg.selectAll("*").remove();

    const w = container.clientWidth || 600;
    const h = container.clientHeight || 460;
    if (w === 0 || h === 0) return;

    svg.attr("viewBox", `0 0 ${w} ${h}`);

    const defs = svg.append("defs");
    const filter = defs.append("filter").attr("id", "gx-glow");
    filter
      .append("feGaussianBlur")
      .attr("stdDeviation", "4")
      .attr("result", "b");
    const merge = filter.append("feMerge");
    merge.append("feMergeNode").attr("in", "b");
    merge.append("feMergeNode").attr("in", "SourceGraphic");

    defs
      .append("marker")
      .attr("id", "flow-arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 16)
      .attr("refY", 0)
      .attr("markerWidth", 5)
      .attr("markerHeight", 5)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "rgba(182,255,0,.35)");

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const sx = (n) => Math.max(10, Math.min(w - 10, (n.x || 0.5) * w));
    const sy = (n) => Math.max(10, Math.min(h - 10, (n.y || 0.5) * h));

    const g = svg.append("g").attr("transform", zoomTransform.toString());

    links.forEach(([fromId, toId]) => {
      const from = nodeMap.get(fromId);
      const to = nodeMap.get(toId);
      if (!from || !to) return;

      g.append("line")
        .attr("x1", sx(from))
        .attr("y1", sy(from))
        .attr("x2", sx(to))
        .attr("y2", sy(to))
        .attr("stroke", "rgba(182,255,0,.2)")
        .attr("stroke-width", 1.2)
        .attr("marker-end", "url(#flow-arrow)");
    });

    nodes.forEach((n) => {
      const color = scoreToColor(n.score);
      const isTarget = selected && selected.id === n.id;
      const isHovered = hoveredNode && hoveredNode.id === n.id;
      const isHub = n.txCount > 50;
      const hasFlags =
        (n.flags && n.flags.length > 0) ||
        (n.patterns && n.patterns.length > 0);

      const grp = g
        .append("g")
        .attr("transform", `translate(${sx(n)},${sy(n)})`)
        .style("cursor", "pointer")
        .on("click", () => setSelected(n))
        .on("mouseenter", () => setHoveredNode(n))
        .on("mouseleave", () => setHoveredNode(null));

      if (isTarget) {
        grp
          .append("circle")
          .attr("r", 16)
          .attr("fill", "none")
          .attr("stroke", color)
          .attr("stroke-width", 2)
          .attr("opacity", 0.9);
      }
      if (isHovered) {
        grp
          .append("circle")
          .attr("r", 14)
          .attr("fill", "none")
          .attr("stroke", color)
          .attr("stroke-width", 1.5)
          .attr("opacity", 0.5)
          .attr("filter", "url(#gx-glow)");
      }

      grp
        .append("circle")
        .attr("r", isTarget ? 10 : isHub ? 7 : 5)
        .attr("fill", "#0a0e10")
        .attr("stroke", color)
        .attr("stroke-width", 2);

      grp
        .append("circle")
        .attr("r", isTarget || isHub ? 3 : 2)
        .attr("fill", color);

      if (hasFlags) {
        grp
          .append("circle")
          .attr("cx", 8)
          .attr("cy", -8)
          .attr("r", 3)
          .attr("fill", "#ff5c67")
          .attr("stroke", "#0a0e10")
          .attr("stroke-width", 1);
      }

      if (isTarget || isHub) {
        grp
          .append("text")
          .attr("y", 20)
          .attr("text-anchor", "middle")
          .attr("fill", "#a9b1b3")
          .attr("font-size", "10")
          .attr("font-weight", isTarget ? "bold" : "normal")
          .style("user-select", "none")
          .style("pointer-events", "none")
          .text(n.id.slice(0, 6) + "...");
      }

      if (isTarget) {
        grp
          .append("text")
          .attr("y", -16)
          .attr("text-anchor", "middle")
          .attr("fill", color)
          .attr("font-size", "11")
          .attr("font-weight", "bold")
          .style("user-select", "none")
          .style("pointer-events", "none")
          .text(`Risk: ${n.score || 0}`);
      }
    });
  }, [nodes, links, selected, hoveredNode, zoomTransform]);

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver(() => draw());
    resizeObserver.observe(containerRef.current);

    const t = window.setTimeout(draw, 100);
    return () => {
      resizeObserver.disconnect();
      window.clearTimeout(t);
    };
  }, [draw]);

  if (error)
    return <div style={{ padding: 24, color: "#ff5c67" }}>⚠️ {error}</div>;
  if (loading)
    return (
      <div style={{ padding: 24, color: "#626c70" }}>
        Loading blockchain graph...
      </div>
    );
  if (nodes.length === 0)
    return (
      <div style={{ padding: 24, color: "#626c70" }}>
        No network data found. Try analyzing a wallet first.
      </div>
    );

  return (
    <div
      className="cx-scale"
      style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}
    >
      {/* 1. TOP STAT SUMMARY CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
        }}
      >
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: "var(--muted)",
              fontWeight: 700,
              letterSpacing: ".05em",
            }}
          >
            ANALYZED WALLETS
          </span>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#f2f5f3" }}>
            {stats.total}
          </div>
        </div>
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: "var(--muted)",
              fontWeight: 700,
              letterSpacing: ".05em",
            }}
          >
            HIGH / CRITICAL RISK
          </span>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#ff5c67" }}>
            {stats.highRisk}
            <span
              style={{
                fontSize: 12,
                color: "var(--muted)",
                marginLeft: 6,
                fontWeight: 500,
              }}
            >
              ({Math.round((stats.highRisk / (stats.total || 1)) * 100)}%)
            </span>
          </div>
        </div>
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: "var(--muted)",
              fontWeight: 700,
              letterSpacing: ".05em",
            }}
          >
            NETWORK RISK INDEX
          </span>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: scoreToColor(stats.avgScore),
            }}
          >
            {stats.avgScore}{" "}
            <span
              style={{ fontSize: 12, color: "var(--muted)", fontWeight: 400 }}
            >
              / 100
            </span>
          </div>
        </div>
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: "var(--muted)",
              fontWeight: 700,
              letterSpacing: ".05em",
            }}
          >
            ACTIVE ML ALERTS
          </span>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#ffc107" }}>
            {stats.flagCount}
          </div>
        </div>
      </div>

      {/* 2. MAIN GRAPH WORKSPACE */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12 }}
      >
        {/* Graph Canvas */}
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--line)",
            borderRadius: 16,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              padding: "16px 18px",
              borderBottom: "1px solid var(--line)",
              fontWeight: 700,
              fontSize: 14,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>Transaction Flow Graph</span>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>
              {nodes.length} wallets • {links.length} flows
            </span>
          </div>
          <div
            ref={containerRef}
            style={{
              height: 480,
              background:
                "radial-gradient(circle at center, rgba(182,255,0,.045), transparent 55%)",
            }}
          >
            <svg
              ref={svgRef}
              style={{ width: "100%", height: "100%", display: "block" }}
            />
          </div>
        </div>

        {/* Details Panel */}
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--line)",
            borderRadius: 16,
            padding: 20,
            overflowY: "auto",
            maxHeight: 540,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {selected ? (
            <>
              {/* Wallet Address */}
              <div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--lime)",
                    fontWeight: 800,
                    letterSpacing: ".1em",
                    marginBottom: 8,
                  }}
                >
                  WALLET ADDRESS
                </div>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 11,
                    wordBreak: "break-all",
                    color: "#f2f5f3",
                    background: "rgba(0,0,0,.2)",
                    padding: 8,
                    borderRadius: 6,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span>{selected.id}</span>
                  <button
                    onClick={() => handleCopy(selected.id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: copied ? "var(--lime)" : "var(--muted)",
                      cursor: "pointer",
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    {copied ? "COPIED" : "COPY"}
                  </button>
                </div>
              </div>

              {/* Run ML Analysis Button */}
              <button
                onClick={() => handleDeepAnalysis(selected.id)}
                disabled={analyzing}
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: analyzing ? "#20282b" : "var(--lime)",
                  color: analyzing ? "var(--muted)" : "#0a0e10",
                  border: "none",
                  fontWeight: 800,
                  fontSize: 12,
                  cursor: analyzing ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  opacity: analyzing ? 0.7 : 1,
                }}
              >
                {analyzing ? "RUNNING ML ANALYSIS..." : "RUN ML DEEP ANALYSIS"}
              </button>

              {/* Risk Score Gauge */}
              <div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--muted)",
                    fontWeight: 700,
                    marginBottom: 10,
                  }}
                >
                  FRAUD RISK SCORE
                </div>
                <div
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    background: `conic-gradient(${scoreToColor(selected.score)} 0 ${selected.score || 0}%, #20282b ${selected.score || 0}% 100%)`,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      background: "var(--card)",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 800,
                      fontSize: 24,
                      color: scoreToColor(selected.score),
                    }}
                  >
                    {selected.score || 0}
                  </div>
                </div>
              </div>

              {/* Risk Level Badge */}
              <div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--muted)",
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  RISK LEVEL
                </div>
                <div
                  style={{
                    display: "inline-block",
                    padding: "6px 12px",
                    borderRadius: 6,
                    background: scoreToColor(selected.score) + "20",
                    color: scoreToColor(selected.score),
                    fontSize: 12,
                    fontWeight: 700,
                    border: `1px solid ${scoreToColor(selected.score)}40`,
                  }}
                >
                  {scoreToRiskLevel(selected.score).toUpperCase()}
                </div>
              </div>

              {/* Fraud Flags / Patterns */}
              {selected.flags && selected.flags.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "#ff5c67",
                      fontWeight: 800,
                      letterSpacing: ".1em",
                      marginBottom: 8,
                    }}
                  >
                    🚨 FRAUD FLAGS
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {selected.flags.map((flag, idx) => {
                      // Safely extract string if backend returned an object
                      const flagStr =
                        typeof flag === "string"
                          ? flag
                          : flag.type || JSON.stringify(flag);
                      const color = FRAUD_FLAGS[flagStr] || "#ff5c67"; // Fallback color
                      return (
                        <div
                          key={idx}
                          style={{
                            padding: "4px 8px",
                            borderRadius: 4,
                            background: color + "20",
                            color: color,
                            fontSize: 10,
                            fontWeight: 600,
                            border: `1px solid ${color}40`,
                          }}
                        >
                          {flagStr.replace(/_/g, " ")}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Detected Patterns */}
              {selected.patterns && selected.patterns.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--lime)",
                      fontWeight: 800,
                      letterSpacing: ".1em",
                      marginBottom: 8,
                    }}
                  >
                    DETECTED PATTERNS
                  </div>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    {selected.patterns.map((pattern, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: 8,
                          borderRadius: 6,
                          background: "rgba(76, 175, 80, 0.1)",
                          border: "1px solid rgba(76, 175, 80, 0.3)",
                          fontSize: 11,
                          color: "#a9b1b3",
                          lineHeight: 1.4,
                        }}
                      >
                        {typeof pattern === "string"
                          ? pattern
                          : pattern.name || JSON.stringify(pattern)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Network Stats */}
              <div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--muted)",
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  NETWORK ACTIVITY
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#f2f5f3",
                    padding: 8,
                    background: "rgba(0,0,0,.2)",
                    borderRadius: 6,
                  }}
                >
                  {selected.txCount || 0} recorded transactions
                </div>
              </div>
            </>
          ) : (
            <div
              style={{
                color: "var(--dim)",
                fontSize: 13,
                textAlign: "center",
                paddingTop: 80,
                paddingBottom: 80,
              }}
            >
              ↖️ Click a wallet node
              <br /> to inspect ML analysis
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
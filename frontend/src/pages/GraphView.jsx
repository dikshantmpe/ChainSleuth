import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import * as d3 from "d3";
import { Search, Loader } from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

// Fraud flag color mapping
const FRAUD_FLAGS = {
  FUND_SPLITTING: "#ff5c67",
  RAPID_PASS_THROUGH: "#ff9800",
  MIXING_PATTERN: "#ffc107",
  LARGE_TRANSFER: "#f44336",
  UNUSUAL_TIMING: "#ffb300",
  DUST_ATTACK: "#ff6f00",
  WALLET_HOPPING: "#e91e63",
  SYBIL_ACTIVITY: "#9c27b0",
  OFAC_SANCTIONED: "#d32f2f",
  EXTREME_VALUE_OUTLIER: "#b71c1c",
  HIGH_VALUE_OUTLIER: "#f44336",
  UNUSUAL_VALUE_PATTERN: "#e91e63",
  HIGH_RECIPIENT_DIVERSITY: "#9c27b0",
  LOW_TX_COUNT: "#ff9800",
  HIGH_VOLUME: "#ffc107",
  REPEATED_TRANSACTIONS: "#ff5722",
  NORMAL_PATTERN: "#4caf50",
  ERROR_IN_SCORING: "#9e9e9e",
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

export default function GraphView({ caseId = null, refreshTrigger = null, toast }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hoveredNode, setHoveredNode] = useState(null);
  const [copied, setCopied] = useState(false);
  const [zoomTransform, setZoomTransform] = useState(d3.zoomIdentity);
  const [analyzing, setAnalyzing] = useState(false);
  
  // New states for search
  const [searchInput, setSearchInput] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

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
        uniqueFlags.add(typeof f === "string" ? f : f.type || JSON.stringify(f))
      );
      (n.patterns || []).forEach((p) =>
        uniqueFlags.add(typeof p === "string" ? p : p.name || JSON.stringify(p))
      );
    });

    return { total, highRisk, avgScore, flagCount: uniqueFlags.size };
  }, [nodes]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Main function to handle search, ML analysis, and graph filtering
  const handleAnalyzeAndVisualize = async (e) => {
    if (e) e.preventDefault();
    const address = searchInput.trim();
    if (!address) {
      toast && toast("Please enter a wallet address.");
      return;
    }

    try {
      setAnalyzing(true);
      setLoading(true);
      setError("");
      setHasSearched(true);

      const token = localStorage.getItem("chainsleuth_token");
      const headers = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      // 1. Run ML Analysis
      const mlResponse = await fetch(`${API_BASE_URL}/api/wallets/analyze`, {
        method: "POST",
        headers,
        body: JSON.stringify({ address }),
      });
      const mlData = await mlResponse.json();

      if (!mlResponse.ok) {
        throw new Error(mlData.error || "ML Analysis failed.");
      }
      toast && toast(`Analysis complete. Risk Score: ${mlData.riskScore}`);

      // 2. Fetch Graph Data
      const graphUrl = caseId
        ? `${API_BASE_URL}/api/graph?case_id=${caseId}`
        : `${API_BASE_URL}/api/graph`;
        
      const graphResponse = await fetch(graphUrl, { headers });
      const graphData = await graphResponse.json();

      if (!graphResponse.ok) {
        throw new Error(graphData.error || "Failed to fetch graph data");
      }

      const rawNodes = graphData.nodes || [];
      const rawLinks = graphData.links || [];

      // 3. Filter Graph to only show searched node and its immediate neighbors
      const validNodeIds = new Set([address]);
      rawLinks.forEach((link) => {
        if (link[0] === address) validNodeIds.add(link[1]);
        if (link[1] === address) validNodeIds.add(link[0]);
      });

      const filteredNodes = rawNodes.filter((n) => validNodeIds.has(n.id));
      const filteredLinks = rawLinks.filter(
        (l) => validNodeIds.has(l[0]) && validNodeIds.has(l[1])
      );

      if (filteredNodes.length === 0) {
        setNodes([]);
        setLinks([]);
        return;
      }

      const enrichedNodes = filteredNodes.map((n) => ({
        ...n,
        score: n.score || 0,
        patterns: n.patterns || [],
        flags: n.flags || [],
        risk: n.risk || scoreToRiskLevel(n.score || 0),
        txCount: n.txCount || 0,
      }));

      const simNodes = enrichedNodes.map((n, i) => ({
        ...n,
        x: Math.sin(i * 0.5) * 400 + (Math.random() - 0.5) * 300,
        y: Math.cos(i * 0.7) * 400 + (Math.random() - 0.5) * 300,
      }));
      const simLinks = filteredLinks.map((l) => ({
        source: l[0],
        target: l[1],
      }));

      const simulation = d3
        .forceSimulation(simNodes)
        .force(
          "link",
          d3.forceLink(simLinks).id((d) => d.id).distance(120).strength(0.2)
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

      const xScale = d3.scaleLinear().domain([xMin || -1, xMax || 1]).range([0.08, 0.92]);
      const yScale = d3.scaleLinear().domain([yMin || -1, yMax || 1]).range([0.08, 0.92]);

      simNodes.forEach((n) => {
        n.x = xScale(n.x);
        n.y = yScale(n.y);
      });

      setNodes(simNodes);
      setLinks(filteredLinks);

      // 4. Auto-select the searched node and inject ML data
      const searchedNode = simNodes.find((n) => n.id === address);
      if (searchedNode) {
        const updatedNodeData = {
          score: mlData.riskScore,
          risk: (mlData.riskLevel || "low").toLowerCase(),
          txCount: mlData.transactionCount,
          flags: (mlData.flags || []).map((f) => f.type || f),
          patterns: mlData.patterns || [],
        };
        setSelected({ ...searchedNode, ...updatedNodeData });
      }

    } catch (err) {
      console.error("Analyze error:", err);
      setError(err.message || "Connection error during analysis.");
      toast && toast(err.message || "Connection error during analysis.");
      setNodes([]);
      setLinks([]);
    } finally {
      setAnalyzing(false);
      setLoading(false);
    }
  };

  // Re-run ML on a node that is already selected in the graph
  const handleReAnalyzeNode = async (walletId) => {
    setSearchInput(walletId);
    // Programmatically trigger the search function
    handleAnalyzeAndVisualize();
  };

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
    filter.append("feGaussianBlur").attr("stdDeviation", "4").attr("result", "b");
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
        grp.append("circle").attr("r", 16).attr("fill", "none").attr("stroke", color).attr("stroke-width", 2).attr("opacity", 0.9);
      }
      if (isHovered) {
        grp.append("circle").attr("r", 14).attr("fill", "none").attr("stroke", color).attr("stroke-width", 1.5).attr("opacity", 0.5).attr("filter", "url(#gx-glow)");
      }

      grp.append("circle").attr("r", isTarget ? 10 : isHub ? 7 : 5).attr("fill", "#0a0e10").attr("stroke", color).attr("stroke-width", 2);
      grp.append("circle").attr("r", isTarget || isHub ? 3 : 2).attr("fill", color);

      if (hasFlags) {
        grp.append("circle").attr("cx", 8).attr("cy", -8).attr("r", 3).attr("fill", "#ff5c67").attr("stroke", "#0a0e10").attr("stroke-width", 1);
      }

      if (isTarget || isHub) {
        grp.append("text")
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
        grp.append("text")
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

  // EMPTY STATE: Before any search is made
  if (!hasSearched && !loading && !analyzing) {
    return (
      <div style={{ padding: 24, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ maxWidth: 600, width: "100%", textAlign: "center" }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#f2f5f3", marginBottom: 8 }}>
            Blockchain Graph Explorer
          </h2>
          <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 24 }}>
            Enter a wallet address to run a deep ML analysis and visualize its transaction network.
          </p>
          <form onSubmit={handleAnalyzeAndVisualize} style={{ display: "flex", gap: 12 }}>
            <input
              type="text"
              placeholder="Enter wallet address (0x...)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{
                flex: 1,
                background: "var(--card)",
                border: "1px solid var(--line)",
                borderRadius: 10,
                padding: "14px 16px",
                color: "#fff",
                fontSize: 13,
                outline: "none",
                fontFamily: "monospace",
              }}
            />
            <button
              type="submit"
              style={{
                background: "var(--lime)",
                color: "#081000",
                border: 0,
                borderRadius: 10,
                padding: "14px 24px",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Search size={14} /> Analyze & Visualize
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading || analyzing)
    return (
      <div style={{ padding: 24, color: "#626c70", display: "flex", alignItems: "center", gap: 12 }}>
        <Loader size={18} className="animate-spin" />
        {analyzing ? "Running ML Deep Analysis..." : "Loading blockchain graph..."}
      </div>
    );

  if (error && nodes.length === 0)
    return (
      <div style={{ padding: 24 }}>
        <div style={{ color: "#ff5c67", marginBottom: 16 }}>⚠️ {error}</div>
        <button onClick={() => { setHasSearched(false); setSearchInput(""); setNodes([]); }} style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--lime)", padding: "10px 16px", borderRadius: 8, cursor: "pointer" }}>
          Try Another Address
        </button>
      </div>
    );

  if (nodes.length === 0)
    return (
      <div style={{ padding: 24 }}>
        <div style={{ color: "#626c70", marginBottom: 16 }}>No network data found for this address. Try analyzing a different wallet.</div>
        <button onClick={() => { setHasSearched(false); setSearchInput(""); setNodes([]); }} style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--lime)", padding: "10px 16px", borderRadius: 8, cursor: "pointer" }}>
          Search Again
        </button>
      </div>
    );

  // MAIN GRAPH VIEW (After search)
  return (
    <div className="cx-scale" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      
      {/* Search Bar (Stays at top) */}
      <form onSubmit={handleAnalyzeAndVisualize} style={{ display: "flex", gap: 12, marginBottom: 8 }}>
        <input
          type="text"
          placeholder="Enter wallet address to analyze (0x...)"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{
            flex: 1,
            background: "var(--card)",
            border: "1px solid var(--line)",
            borderRadius: 10,
            padding: "12px 14px",
            color: "#fff",
            fontSize: 13,
            outline: "none",
            fontFamily: "monospace",
          }}
        />
        <button
          type="submit"
          disabled={analyzing}
          style={{
            background: analyzing ? "#20282b" : "var(--lime)",
            color: analyzing ? "var(--muted)" : "#081000",
            border: 0,
            borderRadius: 10,
            padding: "12px 20px",
            fontWeight: 700,
            cursor: analyzing ? "not-allowed" : "pointer",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 6,
            whiteSpace: "nowrap",
          }}
        >
          {analyzing ? <Loader size={14} className="animate-spin" /> : <Search size={14} />}
          {analyzing ? "Analyzing..." : "Analyze & Visualize"}
        </button>
      </form>

      {/* 1. TOP STAT SUMMARY CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700, letterSpacing: ".05em" }}>ANALYZED WALLETS</span>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#f2f5f3" }}>{stats.total}</div>
        </div>
        <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700, letterSpacing: ".05em" }}>HIGH / CRITICAL RISK</span>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#ff5c67" }}>{stats.highRisk}<span style={{ fontSize: 12, color: "var(--muted)", marginLeft: 6, fontWeight: 500 }}>({Math.round((stats.highRisk / (stats.total || 1)) * 100)}%)</span></div>
        </div>
        <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700, letterSpacing: ".05em" }}>NETWORK RISK INDEX</span>
          <div style={{ fontSize: 22, fontWeight: 800, color: scoreToColor(stats.avgScore) }}>{stats.avgScore} <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 400 }}>/ 100</span></div>
        </div>
        <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700, letterSpacing: ".05em" }}>ACTIVE ML ALERTS</span>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#ffc107" }}>{stats.flagCount}</div>
        </div>
      </div>

      {/* 2. MAIN GRAPH WORKSPACE */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12 }}>
        {/* Graph Canvas */}
        <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden", position: "relative" }}>
          <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--line)", fontWeight: 700, fontSize: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Transaction Flow Graph</span>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>{nodes.length} wallets • {links.length} flows</span>
          </div>
          <div ref={containerRef} style={{ height: 480, background: "radial-gradient(circle at center, rgba(182,255,0,.045), transparent 55%)" }}>
            <svg ref={svgRef} style={{ width: "100%", height: "100%", display: "block" }} />
          </div>
        </div>

        {/* Details Panel */}
        <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, padding: 20, overflowY: "auto", maxHeight: 540, display: "flex", flexDirection: "column", gap: 16 }}>
          {selected ? (
            <>
              <div>
                <div style={{ fontSize: 10, color: "var(--lime)", fontWeight: 800, letterSpacing: ".1em", marginBottom: 8 }}>WALLET ADDRESS</div>
                <div style={{ fontFamily: "monospace", fontSize: 11, wordBreak: "break-all", color: "#f2f5f3", background: "rgba(0,0,0,.2)", padding: 8, borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <span>{selected.id}</span>
                  <button onClick={() => handleCopy(selected.id)} style={{ background: "transparent", border: "none", color: copied ? "var(--lime)" : "var(--muted)", cursor: "pointer", fontSize: 10, fontWeight: 700 }}>{copied ? "COPIED" : "COPY"}</button>
                </div>
              </div>

              <button onClick={() => handleReAnalyzeNode(selected.id)} disabled={analyzing} style={{ padding: "10px 14px", borderRadius: 8, background: analyzing ? "#20282b" : "var(--lime)", color: analyzing ? "var(--muted)" : "#0a0e10", border: "none", fontWeight: 800, fontSize: 12, cursor: analyzing ? "not-allowed" : "pointer", transition: "all 0.2s", opacity: analyzing ? 0.7 : 1 }}>
                {analyzing ? "RUNNING ML ANALYSIS..." : "RE-RUN ML DEEP ANALYSIS"}
              </button>

              <div>
                <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700, marginBottom: 10 }}>FRAUD RISK SCORE</div>
                <div style={{ width: 100, height: 100, borderRadius: "50%", background: `conic-gradient(${scoreToColor(selected.score)} 0 ${selected.score || 0}%, #20282b ${selected.score || 0}% 100%)`, display: "grid", placeItems: "center" }}>
                  <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--card)", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 24, color: scoreToColor(selected.score) }}>{selected.score || 0}</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700, marginBottom: 8 }}>RISK LEVEL</div>
                <div style={{ display: "inline-block", padding: "6px 12px", borderRadius: 6, background: scoreToColor(selected.score) + "20", color: scoreToColor(selected.score), fontSize: 12, fontWeight: 700, border: `1px solid ${scoreToColor(selected.score)}40` }}>{scoreToRiskLevel(selected.score).toUpperCase()}</div>
              </div>

              {selected.flags && selected.flags.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, color: "#ff5c67", fontWeight: 800, letterSpacing: ".1em", marginBottom: 8 }}>🚨 FRAUD FLAGS</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {selected.flags.map((flag, idx) => {
                      const flagStr = typeof flag === "string" ? flag : flag.type || JSON.stringify(flag);
                      const color = FRAUD_FLAGS[flagStr] || "#ff5c67";
                      return <div key={idx} style={{ padding: "4px 8px", borderRadius: 4, background: color + "20", color: color, fontSize: 10, fontWeight: 600, border: `1px solid ${color}40` }}>{flagStr.replace(/_/g, " ")}</div>;
                    })}
                  </div>
                </div>
              )}

              {selected.patterns && selected.patterns.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, color: "var(--lime)", fontWeight: 800, letterSpacing: ".1em", marginBottom: 8 }}>DETECTED PATTERNS</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {selected.patterns.map((pattern, idx) => (
                      <div key={idx} style={{ padding: 8, borderRadius: 6, background: "rgba(76, 175, 80, 0.1)", border: "1px solid rgba(76, 175, 80, 0.3)", fontSize: 11, color: "#a9b1b3", lineHeight: 1.4 }}>{typeof pattern === "string" ? pattern : pattern.name || JSON.stringify(pattern)}</div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700, marginBottom: 8 }}>NETWORK ACTIVITY</div>
                <div style={{ fontSize: 12, color: "#f2f5f3", padding: 8, background: "rgba(0,0,0,.2)", borderRadius: 6 }}>{selected.txCount || 0} recorded transactions</div>
              </div>
            </>
          ) : (
            <div style={{ color: "var(--dim)", fontSize: 13, textAlign: "center", paddingTop: 80, paddingBottom: 80 }}>↖️ Click a wallet node<br />to inspect ML analysis</div>
          )}
        </div>
      </div>
    </div>
  );
}
// API utility functions for ChainSleuth backend

const API_BASE = process.env.API_BASE_URL;

// Helper function to handle API errors
const handleApiError = (response, data) => {
  if (!response.ok) {
    const errorMsg = data?.error || data?.message || `API Error: ${response.status}`;
    throw new Error(errorMsg);
  }
  return data;
};

// Helper for mock fallback
const createMockFraudResponse = (address, blockchain) => {
  return {
    wallet: address,
    blockchain,
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
};

// Authentication
export const login = async (email, password, role = "investigator") => {
  const response = await fetch(`${API_BASE}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role })
  });
  const data = await response.json();
  return handleApiError(response, data);
};

// Wallet Analysis - POST version (recommended)
export const analyzeFraudScore = async (params) => {
  const { address, blockchain = "ethereum", mode = "full" } = params;
  
  try {
    const response = await fetch(`${API_BASE}/api/wallet/fraud-score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, blockchain, mode })
    });
    const data = await response.json();
    return handleApiError(response, data);
  } catch (error) {
    console.warn("Fraud score API failed, using mock data:", error.message);
    return createMockFraudResponse(address, blockchain);
  }
};

// Wallet Analysis - GET version (legacy compatibility)
export const analyzeFraudScoreGet = async (address, blockchain = "ethereum") => {
  try {
    const response = await fetch(
      `${API_BASE}/api/wallet/fraud-score?address=${encodeURIComponent(address)}&blockchain=${blockchain}`,
      { method: "GET", headers: { "Content-Type": "application/json" } }
    );
    const data = await response.json();
    return handleApiError(response, data);
  } catch (error) {
    console.warn("Fraud score API failed, using mock data:", error.message);
    return createMockFraudResponse(address, blockchain);
  }
};

export const analyzeWallet = async (address, blockchain = "ethereum", mode = "full") => {
  const response = await fetch(`${API_BASE}/api/wallet/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, blockchain, mode })
  });
  const data = await response.json();
  return handleApiError(response, data);
};

// Get Neo4j Wallet Connections
export const getWalletConnections = async (address) => {
  try {
    const response = await fetch(`${API_BASE}/api/wallet/connections?address=${encodeURIComponent(address)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });
    const data = await response.json();
    return handleApiError(response, data);
  } catch (error) {
    console.warn("Failed to fetch wallet connections:", error.message);
    return { connected_wallets: [] };
  }
};

// Dashboard Data
export const getDashboardStats = async () => {
  const response = await fetch(`${API_BASE}/api/dashboard/stats`, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });
  const data = await response.json();
  return handleApiError(response, data);
};

export const getDashboardAlerts = async () => {
  const response = await fetch(`${API_BASE}/api/dashboard/alerts`, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });
  const data = await response.json();
  return handleApiError(response, data);
};

// Cases Management
export const getCases = async () => {
  const response = await fetch(`${API_BASE}/api/cases`, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });
  const data = await response.json();
  return handleApiError(response, data);
};

export const getCaseDetail = async (caseId) => {
  const response = await fetch(`${API_BASE}/api/cases/${caseId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });
  const data = await response.json();
  return handleApiError(response, data);
};

export const createCase = async (caseData) => {
  const response = await fetch(`${API_BASE}/api/cases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(caseData)
  });
  const data = await response.json();
  return handleApiError(response, data);
};

export const updateCase = async (caseId, caseData) => {
  const response = await fetch(`${API_BASE}/api/cases/${caseId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(caseData)
  });
  const data = await response.json();
  return handleApiError(response, data);
};

// Wallets
export const getWallets = async (caseId = null) => {
  const url = caseId 
    ? `${API_BASE}/api/cases/${caseId}/wallets`
    : `${API_BASE}/api/wallets`;
  
  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });
  const data = await response.json();
  return handleApiError(response, data);
};

export const getWalletDetail = async (address) => {
  const response = await fetch(`${API_BASE}/api/wallets/${encodeURIComponent(address)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });
  const data = await response.json();
  return handleApiError(response, data);
};

// Transactions
export const getTransactions = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.walletAddress) params.append("wallet", filters.walletAddress);
  if (filters.minAmount) params.append("minAmount", filters.minAmount);
  if (filters.maxAmount) params.append("maxAmount", filters.maxAmount);
  if (filters.limit) params.append("limit", filters.limit);

  const response = await fetch(`${API_BASE}/api/transactions?${params}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });
  const data = await response.json();
  return handleApiError(response, data);
};

export const searchTransactions = async (query) => {
  const response = await fetch(
    `${API_BASE}/api/transactions/search?q=${encodeURIComponent(query)}`,
    { method: "GET", headers: { "Content-Type": "application/json" } }
  );
  const data = await response.json();
  return handleApiError(response, data);
};

// Graph Data
export const getGraphData = async (caseId = null) => {
  const url = caseId 
    ? `${API_BASE}/api/cases/${caseId}/graph`
    : `${API_BASE}/api/graph`;
  
  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });
  const data = await response.json();
  return handleApiError(response, data);
};

// Patterns
export const getPatterns = async (caseId = null) => {
  const url = caseId 
    ? `${API_BASE}/api/cases/${caseId}/patterns`
    : `${API_BASE}/api/patterns`;
  
  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });
  const data = await response.json();
  return handleApiError(response, data);
};

// Reports
export const generateReport = async (caseId, format = "pdf") => {
  const response = await fetch(`${API_BASE}/api/cases/${caseId}/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ format })
  });
  const data = await response.json();
  return handleApiError(response, data);
};

// Admin
export const getInvestigators = async () => {
  const response = await fetch(`${API_BASE}/api/admin/investigators`, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });
  const data = await response.json();
  return handleApiError(response, data);
};

export const createInvestigator = async (investigatorData) => {
  const response = await fetch(`${API_BASE}/api/admin/investigators`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(investigatorData)
  });
  const data = await response.json();
  return handleApiError(response, data);
};

export const updateInvestigator = async (investigatorId, investigatorData) => {
  const response = await fetch(`${API_BASE}/api/admin/investigators/${investigatorId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(investigatorData)
  });
  const data = await response.json();
  return handleApiError(response, data);
};

export const deleteInvestigator = async (investigatorId) => {
  const response = await fetch(`${API_BASE}/api/admin/investigators/${investigatorId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" }
  });
  const data = await response.json();
  return handleApiError(response, data);
};

// Demo Data
export const loadDemoData = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/demo/investigation`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("cs_token") || ""}`
      }
    });

    if (!response.ok) {
      throw new Error("Failed to load demo data");
    }

    const data = await response.json();

    return {
      wallet: data.wallet || "0x28c9f404b6b5e42c3f3182d33565903c91288dcf",
      blockchain: "ethereum",
      score: data.score || data.riskScore || 87,
      riskScore: data.riskScore || data.score || 87,
      risk_level: data.risk_level || data.riskLevel || "HIGH",
      riskLevel: data.riskLevel || data.risk_level || "HIGH",
      patterns: data.patterns || [
        { name: "Rapid Pass-Through", risk: "HIGH", confidence: 0.92 },
        { name: "Fund Splitting", risk: "MEDIUM", confidence: 0.78 },
        { name: "Timing Anomaly", risk: "MEDIUM", confidence: 0.65 }
      ],
      linkedWallets: data.linkedWallets || [
        { address: "0xABC...", type: "exchange", risk: "HIGH" },
        { address: "0xDEF...", type: "mixer", risk: "CRITICAL" },
        { address: "0xGHI...", type: "flagged", risk: "HIGH" }
      ],
      tx_count: data.tx_count || data.transactionCount || 247,
      transactionCount: data.transactionCount || data.tx_count || 247,
      flags: data.flags || [
        { type: "OFAC", message: "Address flagged in OFAC database" },
        { type: "MIXER", message: "Connected to known mixing service" }
      ],
      timestamp: new Date().toISOString(),
      graphData: data.graphData || null,
      analysis: data
    };
  } catch (error) {
    console.error("Demo load failed:", error);
    throw error;
  }
};

// Wallet Search
export const searchWallet = async (address, blockchain = "ethereum") => {
  try {
    const response = await fetch(
      `${API_BASE}/api/wallet/search?address=${encodeURIComponent(address)}&blockchain=${blockchain}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("cs_token") || ""}`
        }
      }
    );

    if (!response.ok) {
      throw new Error("Wallet search failed");
    }

    return await response.json();
  } catch (error) {
    console.error("Search failed:", error);
    throw error;
  }
};

// Network Graph
export const getNetworkGraph = async (address, blockchain = "ethereum", depth = 2) => {
  try {
    const response = await fetch(`${API_BASE}/api/graph/network`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("cs_token") || ""}`
      },
      body: JSON.stringify({
        startAddress: address,
        blockchain,
        depth
      })
    });

    if (!response.ok) {
      throw new Error("Graph fetch failed");
    }

    return await response.json();
  } catch (error) {
    console.error("Graph fetch failed:", error);
    throw error;
  }
};

// Court Report Export
export const exportCourtReport = async (caseId, format = "pdf") => {
  try {
    const response = await fetch(`${API_BASE}/api/cases/${caseId}/export`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("cs_token") || ""}`
      },
      body: JSON.stringify({ format })
    });

    if (!response.ok) {
      throw new Error("Export failed");
    }

    return await response.blob();
  } catch (error) {
    console.error("Export failed:", error);
    throw error;
  }
};

// API Health Check
export const checkAPIHealth = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
};
import { Activity, ArrowLeftRight, Bell, Briefcase, Cpu, FileText, LayoutDashboard, Search, Settings, Share2, ShieldAlert, UserCog, Users } from "lucide-react";

export const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "cases", label: "Cases", icon: Briefcase },
  { id: "wallets", label: "Wallet Explorer", icon: Search },
  { id: "transactions", label: "Transaction Explorer", icon: ArrowLeftRight },
  { id: "graph", label: "Blockchain Graph", icon: Share2 },
  { id: "ai", label: "AI Detection", icon: Cpu },
  { id: "monitor", label: "Realtime Monitor", icon: Activity },
  { id: "reports", label: "Court Reports", icon: FileText },
  { id: "admin", label: "Admin Panel", icon: UserCog, adminOnly: true },
  { id: "settings", label: "Settings", icon: Settings },
];

export const USERS_SEED = [
  { name: "Investigator Singh", unit: "Cyber Cell, Unit 5", role: "Investigator", status: "Active" },
  { name: "SI M. Verma", unit: "Cyber Cell, Unit 2", role: "Investigator", status: "Active" },
  { name: "Insp. A. Kaur", unit: "Cyber Cell, Unit 1", role: "Investigator", status: "Active" },
  { name: "ASI P. Rana", unit: "Cyber Cell, Unit 5", role: "Investigator", status: "Inactive" },
  { name: "Admin Sharma", unit: "System Administration", role: "Admin", status: "Active" },
];

export const CHART_DATA = [
  { month: "Jan", crores: 1.2 }, { month: "Feb", crores: 1.8 }, { month: "Mar", crores: 1.5 },
  { month: "Apr", crores: 2.6 }, { month: "May", crores: 3.1 }, { month: "Jun", crores: 2.9 },
  { month: "Jul", crores: 4.2 },
];

export const STATS = [
  { label: "Total Investigations", value: "34", note: "+12% this month", icon: Briefcase },
  { label: "High Risk Wallets", value: "9", note: "3 flagged today", icon: ShieldAlert },
  { label: "Tracked Entities", value: "212", note: "Clusters verified", icon: Users },
  { label: "Active Alerts", value: "14", note: "Requires review", icon: Bell },
];

export const CASES = [
  { id: "CASE-2026011", title: "Cross-Border Layering Probe #10", officer: "ASI P. Rana", opened: "2026-01-01", status: "Open", risk: "high", wallets: 6 },
  { id: "CASE-2026012", title: "Terror Financing Inquiry #11", officer: "Insp. R. Sharma", opened: "2026-01-01", status: "Open", risk: "high", wallets: 4 },
  { id: "CASE-2026013", title: "Investment Scam Cluster #12", officer: "Insp. A. Kaur", opened: "2026-01-01", status: "Open", risk: "medium", wallets: 8 },
  { id: "CASE-2026014", title: "Operation Chandigarh Secure #13", officer: "SI M. Verma", opened: "2026-01-01", status: "Low", risk: "low", wallets: 2 },
  { id: "CASE-2026015", title: "Darknet Vendor Takedown #14", officer: "SI N. Chauhan", opened: "2026-01-01", status: "Low", risk: "medium", wallets: 5 },
  { id: "CASE-2026016", title: "Ransomware Payout Trace #15", officer: "ASI P. Rana", opened: "2026-01-01", status: "Low", risk: "high", wallets: 7 },
  { id: "CASE-2026017", title: "Cross-Border Layering Probe #16", officer: "Insp. R. Sharma", opened: "2026-01-01", status: "Open", risk: "medium", wallets: 3 },
  { id: "CASE-2026018", title: "Terror Financing Inquiry #17", officer: "Insp. A. Kaur", opened: "2026-01-01", status: "Open", risk: "high", wallets: 9 },
  { id: "CASE-2026019", title: "Investment Scam Cluster #18", officer: "SI M. Verma", opened: "2026-01-01", status: "Open", risk: "low", wallets: 1 },
];

export const WALLETS = [
  { addr: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", chain: "Ethereum", risk: "high", score: 87, lastActivity: "2h ago", txCount: 247 },
  { addr: "0x19a3f8b12c9e5d0a3f8b1c4e5d6a7b8c9d0e1f2a", chain: "Ethereum", risk: "low", score: 22, lastActivity: "1d ago", txCount: 12 },
  { addr: "0x5fe2119a8b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e", chain: "Ethereum", risk: "high", score: 74, lastActivity: "5h ago", txCount: 58 },
  { addr: "bc1qbfa550f2a8c1d4e5f6a7b8c9d0e1f2a3b4c5d", chain: "Bitcoin", risk: "medium", score: 56, lastActivity: "3h ago", txCount: 9 },
  { addr: "bc1q3a3ea0f8b1c2d3e4f5a6b7c8d9e0f1a2b3c4d", chain: "Bitcoin", risk: "low", score: 18, lastActivity: "2d ago", txCount: 6 },
  { addr: "0xf08d91cc3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d", chain: "Ethereum", risk: "high", score: 96, lastActivity: "40m ago", txCount: 63 },
  { addr: "bc1qaa6100a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5", chain: "Bitcoin", risk: "medium", score: 61, lastActivity: "6h ago", txCount: 14 },
];

export const TRANSACTIONS = [
  { hash: "0x3c6eb4a1f2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7...84d4", from: "0xcd2da8...645a", to: "0xbdb660...9b92", value: "12.4 ETH", fee: "0.002 ETH", gas: "21,000", status: "Confirmed", date: "2026-01-01 00:00", risk: 12 },
  { hash: "0x3c8da3f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7...9ded", from: "0x19a3f8...8bc2", to: "0x5fe211...119a", value: "39,800 USDT", fee: "0.004 ETH", gas: "45,000", status: "Confirmed", date: "2026-01-01 00:00", risk: 61 },
  { hash: "0x3cac92b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7...3706", from: "0x5fe211...119a", to: "0xa817d9...d921", value: "19,500 USDT", fee: "0.003 ETH", gas: "38,000", status: "Confirmed", date: "2026-01-01 00:00", risk: 58 },
  { hash: "0x3ccb81a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8...d01f", from: "bc1qbfa5...834ab", to: "bc1q3a3e...f0ee", value: "0.42 BTC", fee: "0.0001 BTC", gas: "—", status: "Confirmed", date: "2026-01-01 00:00", risk: 34 },
  { hash: "0x3cea70b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9...6938", from: "0xb20cee...7370", to: "0xf08d91...91cc", value: "0.8 ETH", fee: "0.002 ETH", gas: "21,000", status: "Confirmed", date: "2026-01-01 00:00", risk: 89 },
  { hash: "0x3d095fc4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0...8251", from: "0x91de20...20ac", to: "0x40bc77...77a1", value: "0.05 ETH", fee: "0.001 ETH", gas: "21,000", status: "Confirmed", date: "2026-01-01 00:00", risk: 9 },
];

export const PATTERNS = [
  { badge: "DETECTED", title: "Fund Splitting", desc: "Funds divided across multiple intermediary wallets in a short period.", contribution: "+24" },
  { badge: "DETECTED", title: "Rapid Pass-Through", desc: "Funds moved through multiple wallets within an unusually short interval.", contribution: "+31" },
  { badge: "POSSIBLE", title: "Peel Chain", desc: "Repeated intermediary transfers where amounts gradually separate from the original flow.", contribution: "+18" },
  { badge: "DETECTED", title: "Flagged Connection", desc: "Direct or indirect connection to an address present on a public flagged-address list.", contribution: "+14" },
  { badge: "POSSIBLE", title: "Mixer Interaction", desc: "Transaction routed through a contract associated with coin-mixing services.", contribution: "+9" },
  { badge: "DETECTED", title: "High-Velocity Inflow", desc: "Wallet received an unusually high number of deposits within a 24-hour window.", contribution: "+21" },
];

export const ALERT_SEEDS = [
  { sev: "high", title: "Multiple intermediary wallets", desc: "A chain of 7 wallets was detected between the source and destination.", wallet: "0xf08d91...91cc" },
  { sev: "medium", title: "Unusual transaction frequency", desc: "Transaction volume increased sharply during a 13-minute interval.", wallet: "0xb20cee...ee73" },
  { sev: "high", title: "Flagged wallet connection", desc: "An indirect connection to a known flagged address was identified.", wallet: "0x5fe211...119a" },
  { sev: "low", title: "New wallet activity", desc: "First outbound transaction observed from a newly created wallet.", wallet: "0x91de20...20ac" },
];

export const GRAPH_NODES = [
  { id: "A", label: "0x742d…f44e", risk: "high", x: 0.5, y: 0.5, score: 87, txCount: 247, linked: 34, patterns: ["Fund Splitting", "Rapid Pass-Through"] },
  { id: "B", label: "0x19a3…8bc2", risk: "normal", x: 0.28, y: 0.3, score: 22, txCount: 12, linked: 5, patterns: [] },
  { id: "C", label: "0x5fe2…119a", risk: "high", x: 0.7, y: 0.26, score: 74, txCount: 58, linked: 11, patterns: ["Rapid Pass-Through"] },
  { id: "D", label: "0xa817…d921", risk: "suspicious", x: 0.85, y: 0.52, score: 56, txCount: 9, linked: 4, patterns: ["Peel Chain"] },
  { id: "E", label: "0xb20c…ee73", risk: "suspicious", x: 0.63, y: 0.76, score: 61, txCount: 14, linked: 6, patterns: ["Fund Splitting"] },
  { id: "F", label: "0x91de…20ac", risk: "normal", x: 0.3, y: 0.7, score: 18, txCount: 6, linked: 3, patterns: [] },
  { id: "G", label: "0x40bc…77a1", risk: "normal", x: 0.1, y: 0.55, score: 15, txCount: 4, linked: 2, patterns: [] },
  { id: "H", label: "0xf08d…91cc", risk: "flagged", x: 0.92, y: 0.8, score: 96, txCount: 63, linked: 19, patterns: ["Flagged Connection", "Peel Chain"] },
];

export const GRAPH_LINKS = [["A","B"],["A","C"],["B","F"],["B","G"],["C","D"],["C","E"],["D","H"],["E","H"],["F","G"]];

export const REPORTS = [
  { id: "RPT-0142", case: "CS-2026-0142", title: "High-risk transaction cluster — evidence summary", pages: 18, generated: "2026-01-02" },
  { id: "RPT-0139", case: "CS-2026-0139", title: "Cross-border layering probe — wallet linkage report", pages: 24, generated: "2025-12-29" },
  { id: "RPT-0131", case: "CS-2026-0131", title: "Investment scam cluster — fund flow reconstruction", pages: 11, generated: "2025-12-20" },
];

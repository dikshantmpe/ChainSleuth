import React, { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, Copy } from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

export default function TransactionsView({ caseId, toast }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchAddress, setSearchAddress] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(20);
  const [copied, setCopied] = useState("");

  // Reset to page 0 whenever a new search is submitted
  useEffect(() => {
    setPage(0);
  }, [searchAddress]);

  // Fetch transactions from backend
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("chainsleuth_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const url = searchAddress
          ? `${API_BASE_URL}/api/transactions/search?q=${searchAddress}`
          : `${API_BASE_URL}/api/transactions?limit=${pageSize}&offset=${page * pageSize}`;

        const response = await fetch(url, { headers });
        const data = await response.json();

        if (response.ok) {
          setTransactions(data.transactions || []);
          setTotal(data.total || 0);
        } else {
          if (response.status === 401) {
            toast && toast("Authentication expired. Please log in again.");
          } else {
            toast && toast(data.error || "Failed to fetch transactions");
          }
          setTransactions([]);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        toast && toast("Connection error - backend not available");
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [searchAddress, page, pageSize, toast]);

  const handleSearch = (e) => {
    e.preventDefault();
    // The useEffect on searchAddress will handle the actual fetch and page reset
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(""), 2000);
    toast && toast("Address copied to clipboard.");
  };

  const shortAddr = (addr) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "N/A";

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="cx-fade-up" style={{ padding: 24 }}>
      <style>{`
        .tx-container { display: flex; flex-direction: column; gap: 16px; }
        .tx-search { display: flex; gap: 12px; margin-bottom: 20px; }
        .tx-search input { flex: 1; background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 12px 14px; color: #fff; font-size: 13px; outline: none; font-family: monospace; }
        .tx-search input::placeholder { color: var(--dim); }
        .tx-search input:focus { border-color: rgba(182,255,0,.5); }
        .tx-search button { background: var(--lime); color: #081000; border: 0; border-radius: 10px; padding: 12px 20px; font-weight: 700; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 6px; }
        .tx-search button:hover { opacity: 0.9; }
        .tx-table { background: var(--card); border: 1px solid var(--line); border-radius: 16px; overflow: hidden; }
        .tx-header { display: grid; grid-template-columns: 2fr 2fr 1.5fr 1fr 1fr; gap: 16px; padding: 16px 20px; background: rgba(255,255,255,.02); font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--muted); border-bottom: 1px solid var(--line); }
        .tx-row { display: grid; grid-template-columns: 2fr 2fr 1.5fr 1fr 1fr; gap: 16px; padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,.04); align-items: center; font-size: 12px; }
        .tx-row:last-child { border-bottom: 0; }
        .tx-row:hover { background: rgba(182,255,0,.02); }
        .tx-addr { display: flex; align-items: center; gap: 8px; font-family: monospace; color: var(--text); cursor: pointer; }
        .tx-addr:hover { color: var(--lime); }
        .tx-amount { color: var(--lime); font-weight: 600; }
        .tx-pagination { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; font-size: 12px; color: var(--dim); }
        .tx-nav { display: flex; gap: 8px; }
        .tx-nav button { background: var(--card); border: 1px solid var(--line); border-radius: 8px; padding: 6px 12px; color: #fff; cursor: pointer; font-size: 11px; display: flex; align-items: center; gap: 4px; }
        .tx-nav button:disabled { opacity: 0.5; cursor: not-allowed; }
        .tx-nav button:hover:not(:disabled) { border-color: var(--lime); color: var(--lime); }
        .tx-empty { padding: 40px; text-align: center; color: var(--dim); font-size: 13px; }
      `}</style>

      <div className="tx-container">
        {/* Search Bar */}
        <form className="tx-search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search by wallet address (0x...)"
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
          />
          <button type="submit">
            <Search size={14} /> Search
          </button>
        </form>

        {/* Transactions Table */}
        <div className="tx-table">
          {loading ? (
            <div className="tx-empty">Loading live transactions from Neo4j...</div>
          ) : transactions.length === 0 ? (
            <div className="tx-empty">No transactions found. Try analyzing a wallet first to populate the database.</div>
          ) : (
            <>
              <div className="tx-header">
                <div>From Address</div>
                <div>To Address</div>
                <div>Amount (ETH)</div>
                <div>Count</div>
                <div>Last Seen</div>
              </div>
              {transactions.map((tx, i) => (
                <div className="tx-row" key={i}>
                  <div
                    className="tx-addr"
                    onClick={() => copyToClipboard(tx.from)}
                    title={tx.from}
                  >
                    {shortAddr(tx.from)}
                    <Copy size={12} color="var(--dim)" />
                  </div>
                  <div
                    className="tx-addr"
                    onClick={() => copyToClipboard(tx.to)}
                    title={tx.to}
                  >
                    {shortAddr(tx.to)}
                    <Copy size={12} color="var(--dim)" />
                  </div>
                  <div className="tx-amount">{tx.amount.toFixed(4)}</div>
                  <div>{tx.count}</div>
                  <div>
                    {tx.timestamp
                      ? new Date(tx.timestamp * 1000).toLocaleDateString()
                      : "N/A"}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Pagination */}
        {!searchAddress && transactions.length > 0 && (
          <div className="tx-pagination">
            <span>
              Page {page + 1} of {totalPages} — {total} total transactions
            </span>
            <div className="tx-nav">
              <button disabled={page === 0} onClick={() => setPage(page - 1)}>
                <ChevronLeft size={14} /> Prev
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
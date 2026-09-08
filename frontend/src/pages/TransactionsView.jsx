import React, { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, Copy, X } from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

export default function TransactionsView({ caseId, toast }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(20);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("chainsleuth_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const url = searchQuery
          ? `${API_BASE_URL}/api/transactions/search?q=${searchQuery}&limit=${pageSize}&offset=${page * pageSize}`
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
  }, [searchQuery, page, pageSize, toast]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
    setPage(0);
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
    setPage(0);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(""), 2000);
    toast && toast("Address copied to clipboard.");
  };

  // Removed shortAddr to show the full address in the table
  const renderAddress = (addr) => (
    <div
      className="tx-addr"
      onClick={() => copyToClipboard(addr)}
      title={addr}
    >
      <span className="tx-full-addr">{addr || "N/A"}</span>
      <Copy size={12} color="var(--dim)" />
    </div>
  );

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="cx-fade-up" style={{ padding: 24 }}>
      <style>{`
        .tx-container { display: flex; flex-direction: column; gap: 16px; }
        .tx-search { display: flex; gap: 12px; margin-bottom: 20px; }
        .tx-search input { flex: 1; background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 12px 14px; color: #fff; font-size: 13px; outline: none; font-family: monospace; }
        .tx-search input::placeholder { color: var(--dim); }
        .tx-search input:focus { border-color: rgba(182,255,0,.5); }
        .tx-search button { background: var(--lime); color: #081000; border: 0; border-radius: 10px; padding: 12px 20px; font-weight: 700; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 6px; transition: opacity 0.2s; white-space: nowrap; }
        .tx-search button:hover { opacity: 0.9; }
        .tx-clear { background: var(--card) !important; color: var(--dim) !important; border: 1px solid var(--line) !important; }
        .tx-clear:hover { border-color: var(--danger) !important; color: var(--danger) !important; opacity: 1 !important; }
        
        /* Search Banner */
        .tx-banner { display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: rgba(182,255,0,0.05); border: 1px solid rgba(182,255,0,0.2); border-radius: 10px; font-size: 13px; margin-bottom: 16px; }
        .tx-banner-label { color: var(--dim); }
        .tx-banner-addr { color: var(--lime); font-family: monospace; word-break: break-all; flex: 1; }
        
        /* Table Styles */
        .tx-table { background: var(--card); border: 1px solid var(--line); border-radius: 16px; overflow: hidden; }
        .tx-header { display: grid; grid-template-columns: 3fr 3fr 1.5fr 1fr 1.5fr; gap: 16px; padding: 16px 20px; background: rgba(255,255,255,.02); font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--muted); border-bottom: 1px solid var(--line); }
        .tx-row { display: grid; grid-template-columns: 3fr 3fr 1.5fr 1fr 1.5fr; gap: 16px; padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,.04); align-items: center; font-size: 12px; }
        .tx-row:last-child { border-bottom: 0; }
        .tx-row:hover { background: rgba(182,255,0,.02); }
        
        .tx-addr { display: flex; align-items: center; gap: 8px; font-family: monospace; color: var(--text); cursor: pointer; min-width: 0; }
        .tx-addr:hover { color: var(--lime); }
        .tx-full-addr { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 11px; }
        
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
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchQuery && (
            <button type="button" className="tx-clear" onClick={clearSearch}>
              <X size={14} /> Clear
            </button>
          )}
          <button type="submit">
            <Search size={14} /> Search
          </button>
        </form>

        {/* Search Results Banner */}
        {searchQuery && !loading && (
          <div className="tx-banner">
            <span className="tx-banner-label">Showing transactions for:</span>
            <span className="tx-banner-addr">{searchQuery}</span>
            <button 
              onClick={() => copyToClipboard(searchQuery)} 
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--dim)' }}
              title="Copy Address"
            >
              <Copy size={14} />
            </button>
          </div>
        )}

        {/* Transactions Table */}
        <div className="tx-table">
          {loading ? (
            <div className="tx-empty">Loading live transactions from Neo4j...</div>
          ) : transactions.length === 0 ? (
            <div className="tx-empty">
              No transactions found. Try analyzing a wallet first or searching for a different address.
            </div>
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
                  {renderAddress(tx.from)}
                  {renderAddress(tx.to)}
                  <div className="tx-amount">
                    {Number(tx.amount || 0).toFixed(4)}
                  </div>
                  <div>{tx.count || 1}</div>
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
        {transactions.length > 0 && (
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
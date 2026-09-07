import React, { useState, useEffect, useRef } from "react";
import chainSleuthLogo from "../assets/chainsleuth-full-logo.png";

export default function Topbar({ view, setView, onLogout, role, user }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Get data from props (passed down from App.jsx -> Dashboard.jsx)
  const isAdmin = role === "admin";
  const name = user?.name || (isAdmin ? "Admin Sharma" : "Investigator Singh");
  const unit = isAdmin ? "System Administration" : "Chandigarh Cyber Cell";
  const email = user?.email || "unknown@cybercell.gov.in";
  
  // Calculate initials from name
  const calcInitials = (fullName) => {
    if (!fullName) return isAdmin ? "AS" : "IS";
    const parts = fullName.split(" ");
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };
  const initials = calcInitials(name);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Removed "Settings" from main nav items
  const navItems = [
    { id: "dashboard", label: "Dashboard", svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
    { id: "cases", label: "Cases", svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 7h16v13H4z"/><path d="M8 7V5h8v2M9 11v5M15 11v5"/></svg> },
    { id: "wallets", label: "Wallet Explorer", svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></svg> },
    { id: "transactions", label: "Transaction Explorer", svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 7h13M14 4l3 3-3 3M20 17H7M10 14l-3 3 3 3"/></svg> },
    { id: "graph", label: "Blockchain Graph", svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6" cy="12" r="2"/><circle cx="17.5" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="m7.8 11 7.8-4M7.8 13l8.2 4"/></svg> },
    { id: "ai", label: "AI Detection", svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="5" width="14" height="14" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/><path d="M9 10h6M9 14h4"/></svg> },
    { id: "monitor", label: "Realtime Monitor", svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 13h4l2-7 4 12 2-6h6"/></svg> },
    { id: "reports", label: "Court Reports", svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 3h9l4 4v14H6z"/><path d="M15 3v5h4M9 12h6M9 16h6"/></svg> },
    ...(isAdmin ? [{ id: "admin", label: "Admin Panel", svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="9" cy="8" r="3"/><path d="M3 19c.8-3 2.7-4.5 5.5-4.5s4.7 1.5 5.5 4.5M16 13v6M13 16h6"/></svg> }] : [])
  ];

  return (
    <header style={{
      height: "104px",
      borderBottom: "1px solid #20282a",
      display: "flex",
      alignItems: "center",
      background: "rgba(6,10,11,.94)",
      backdropFilter: "blur(18px)",
      position: "sticky",
      top: 0,
      zIndex: 20,
      width: "100%",
      padding: "0 26px"
    }}>
      <style>{`
        .topbar-inner {
          width: 100%;
          max-width: 1580px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 22px;
          height: 100%;
        }

        .topbar-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 26px;
          cursor: pointer;
          flex-shrink: 0;
          height: 100%;
          min-width: 174px;
        }

        .topbar-brand-logo {
          height: 62px;
          width: auto;
          object-fit: contain;
          display: block;
          flex-shrink: 0;
        }

        .topbar-brand-badge {
          font-size: 9px;
          color: #697579;
          letter-spacing: 1.45px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .topbar-brand-badge i {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #a8ff00;
          box-shadow: 0 0 8px #a8ff00;
          display: block;
        }

        .topbar-nav {
          display: flex;
          align-items: stretch;
          justify-content: center;
          gap: 2px;
          flex: 1;
          min-width: 0;
          height: 100%;
          overflow: visible;
        }

        .topbar-nav::-webkit-scrollbar {
          display: none;
        }

        .topbar-nav-item {
          position: relative;
          min-width: 74px;
          height: 100%;
          padding: 13px 7px 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 7px;
          color: #758083;
          background: transparent;
          cursor: pointer;
          white-space: nowrap;
          font-size: 10px;
          font-weight: 500;
          transition: color 0.22s ease, background 0.22s ease;
          border: none;
          border-radius: 0;
        }

        .topbar-nav-item svg {
          width: 21px;
          height: 21px;
          stroke-width: 1.7;
          transition: transform 0.22s ease;
        }

        .topbar-nav-item:hover svg {
          transform: translateY(-1px);
        }

        .topbar-nav-item:hover {
          color: #c8cccf;
        }

        .topbar-nav-item.active {
          color: #b6ff00;
        }

        .topbar-nav-item.active::after {
          content: "";
          position: absolute;
          height: 2px;
          left: 0;
          right: 0;
          bottom: 0;
          background: #b6ff00;
          box-shadow: 0 0 10px rgba(182, 255, 0, 0.5);
        }

        .topbar-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-left: auto;
          flex-shrink: 0;
          height: 100%;
        }

        .search-box {
          width: 226px;
          height: 42px;
          border: 1px solid #20282a;
          border-radius: 11px;
          background: #0c1113;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 0 12px;
          color: #687478;
          transition: 0.25s ease;
        }

        .search-box:focus-within {
          border-color: #3b4b4f;
          box-shadow: 0 0 0 3px rgba(168,255,0,.04);
        }

        .search-box svg {
          width: 16px;
        }

        .search-box input {
          border: 0;
          outline: 0;
          background: transparent;
          color: #edf2f0;
          width: 100%;
          font-size: 12px;
        }

        .search-box input::placeholder {
          color: #596467;
        }

        .icon-btn {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: transparent;
          color: #7f898c;
          display: grid;
          place-items: center;
          cursor: pointer;
          position: relative;
          border: none;
          transition: 0.2s;
        }

        .icon-btn:hover {
          background: #101719;
          color: #e8eeeb;
        }

        .icon-btn svg {
          width: 18px;
        }

        .icon-badge {
          position: absolute;
          top: -1px;
          right: -2px;
          min-width: 18px;
          height: 18px;
          border-radius: 10px;
          padding: 0 5px;
          background: #ff5264;
          color: #fff;
          font-size: 9px;
          font-weight: 800;
          display: grid;
          place-items: center;
          border: 2px solid #060a0b;
        }

        .profile-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          cursor: pointer;
          padding: 4px 4px 4px 4px;
          border-radius: 8px;
          border: none;
          transition: all 0.2s ease;
        }

        .profile-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: linear-gradient(135deg, #b8ff70, #5eea68);
          color: #0a0d0e;
          display: grid;
          place-items: center;
          font-size: 10px;
          font-weight: 800;
        }

        .profile-info {
          text-align: left;
        }

        .profile-name {
          font-size: 11px;
          color: #e8eeeb;
          font-weight: 600;
        }

        .profile-unit {
          font-size: 8px;
          color: #7a8084;
          margin-top: 2px;
        }

        .profile-dropdown {
          position: absolute;
          right: 0;
          top: 48px;
          width: 200px;
          background: #0f1213;
          border: 1px solid #1f2729;
          border-radius: 8px;
          padding: 6px;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
          opacity: 0;
          visibility: hidden;
          transform: translateY(-4px) scale(0.98);
          transition: all 0.2s ease;
          z-index: 50;
        }

        .profile-dropdown.open {
          opacity: 1;
          visibility: visible;
          transform: none;
        }

        .drop-item {
          width: 100%;
          background: transparent;
          color: #9ca6a8;
          padding: 9px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
          text-align: left;
          cursor: pointer;
          font-size: 11px;
          border: none;
          transition: all 0.2s ease;
        }

        .drop-item:hover {
          background: #151d1f;
          color: #e8eeeb;
        }

        .drop-item.logout {
          color: #ff7a85;
        }

        .drop-item.logout:hover {
          background: rgba(255, 122, 133, 0.1);
        }
      `}</style>

      <div className="topbar-inner">
        {/* Brand Section */}
        <div className="topbar-brand" onClick={() => setView("dashboard")}>
          <img className="topbar-brand-logo" src={chainSleuthLogo} alt="ChainSleuth" />
          <span className="topbar-brand-badge"><i></i>SECURE MODE</span>
        </div>

        {/* Navigation */}
        <nav className="topbar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`topbar-nav-item ${view === item.id ? "active" : ""}`}
              onClick={() => setView(item.id)}
            >
              {item.svg}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Actions Section */}
        <div className="topbar-actions">
          <label className="search-box">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="10" cy="10" r="6"/>
              <path d="m15 15 5 5"/>
            </svg>
            <input placeholder="Search wallets, tx, cases..." />
          </label>

          <button className="icon-btn" aria-label="Notifications">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>
            </svg>
            <span className="icon-badge">14</span>
          </button>

          <div style={{ position: "relative" }} ref={profileRef}>
            <button className="profile-btn" onClick={() => setProfileOpen(!profileOpen)}>
              <div className="profile-avatar">{initials}</div>
              <div className="profile-info">
                <div className="profile-name">{name}</div>
                <div className="profile-unit">{unit}</div>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>

            <div className={`profile-dropdown ${profileOpen ? "open" : ""}`}>
              <div style={{ padding: "8px 9px", borderBottom: "1px solid #1a1f21", marginBottom: 4, color: "#e8eeeb" }}>
                <div style={{ fontSize: "11px", fontWeight: 600 }}>{name}</div>
                <div style={{ fontSize: "9px", color: "#7a8084", marginTop: 3 }}>{email}</div>
              </div>
              <button className="drop-item" onClick={() => { setView("settings"); setProfileOpen(false); }}>
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit Profile
              </button>
              <button className="drop-item logout" onClick={onLogout}>
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M10 17l5-5-5-5M15 12H3M21 4v16"/>
                </svg>
                Log out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
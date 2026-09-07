import React, { useState, useEffect } from "react";
import "./LandingPage.css";

import { STYLE } from "./styles/dashboardStyles.js";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";

// =============================================================================
// ROOT
// =============================================================================
export default function ChainSleuthApp() {
  // 1. Initialize state from localStorage
  const [screen, setScreen] = useState(() => {
    return localStorage.getItem("cs_screen") || "landing";
  }); 
  const [role, setRole] = useState(() => {
    return localStorage.getItem("cs_role") || "investigator";
  });
  const [user, setUser] = useState(() => {
    return JSON.parse(localStorage.getItem("chainsleuth_user") || "{}");
  });

  // 2. Save to localStorage whenever screen or role changes
  useEffect(() => {
    localStorage.setItem("cs_screen", screen);
    localStorage.setItem("cs_role", role);
  }, [screen, role]);

  // 3. Clear data on logout so another user doesn't auto-login
  const handleLogout = () => {
    setScreen("landing");
    setUser({});
    setRole("investigator");
    localStorage.removeItem("cs_screen");
    localStorage.removeItem("cs_role");
    localStorage.removeItem("cs_view");
    localStorage.removeItem("chainsleuth_user");
    localStorage.removeItem("chainsleuth_token");
  };

  return (
    <div className="cx-root">
      <style>{STYLE}</style>
      
      {screen === "landing" && <Landing onLaunch={() => setScreen("login")} />}
      
      {screen === "login" && (
        <Login 
          onLogin={(userData) => { 
            setUser(userData); 
            setRole(userData.role || "investigator"); 
            setScreen("app"); 
          }} 
          onBack={() => setScreen("landing")} 
          switchToRegister={() => setScreen("register")} 
        />
      )}
      
      {screen === "register" && (
        <Register 
          onRegister={(userData) => { 
            setUser(userData); 
            setRole(userData.role || "investigator"); 
            setScreen("app"); 
          }} 
          onBack={() => setScreen("landing")} 
          switchToLogin={() => setScreen("login")} 
        />
      )}
      
      {screen === "app" && <Dashboard role={role} user={user} onLogout={handleLogout} />}
    </div>
  );
}
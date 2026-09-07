import React, { useState } from "react";
import { analyzeFraudScore } from "../utils/api";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

export default function Login({ onLogin, onBack }) {
  const [email, setEmail] = useState("Noir@cybercell.gov.in");
  const [password, setPassword] = useState("password123");
  const [selectedRole, setSelectedRole] = useState("investigator");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showRegister, setShowRegister] = useState(false);

  // Register state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState("investigator");
  const [regError, setRegError] = useState(null);
  const [regLoading, setRegLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate inputs
      if (!email.trim()) {
        setError("Email is required");
        setLoading(false);
        return;
      }

      if (!password.trim()) {
        setError("Password is required");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
          role: selectedRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      // Store user data
      localStorage.setItem("cs_user", JSON.stringify(data));
      localStorage.setItem("cs_email", data.email);
      localStorage.setItem("cs_role", selectedRole);
      localStorage.setItem("cs_token", data.token || "demo-token");

      setLoading(false);
      onLogin(selectedRole);
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Connection error - check backend");
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError(null);
    setRegLoading(true);

    try {
      if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
        setRegError("All fields are required");
        setRegLoading(false);
        return;
      }

      if (!regEmail.includes("@cybercell.gov.in")) {
        setRegError("Use official @cybercell.gov.in email");
        setRegLoading(false);
        return;
      }

      if (regPassword.length < 6) {
        setRegError("Password must be at least 6 characters");
        setRegLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          password: regPassword.trim(),
          role: regRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setRegError(data.error || "Registration failed");
        setRegLoading(false);
        return;
      }

      // Auto-login after registration
      localStorage.setItem("cs_user", JSON.stringify(data));
      localStorage.setItem("cs_email", data.email);
      localStorage.setItem("cs_role", regRole);
      localStorage.setItem("cs_token", data.token || "demo-token");

      setRegLoading(false);
      onLogin(regRole);
    } catch (err) {
      console.error("Register error:", err);
      setRegError(err.message || "Registration failed");
      setRegLoading(false);
    }
  };

  if (showRegister) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <button onClick={() => setShowRegister(false)} style={styles.backBtn}>
            ← Back
          </button>

          <div style={styles.header}>
            <div style={styles.icon}>👤</div>
            <h1 style={styles.title}>Create Account</h1>
            <p style={styles.subtitle}>Chandigarh Cyber Cell — restricted access</p>
          </div>

          {regError && <div style={styles.errorBox}>{regError}</div>}

          <form onSubmit={handleRegister}>
            <div style={styles.formGroup}>
              <label style={styles.label}>FULL NAME</label>
              <input
                type="text"
                placeholder="Your name"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                disabled={regLoading}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>OFFICIAL EMAIL</label>
              <input
                type="email"
                placeholder="yourname@cybercell.gov.in"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                disabled={regLoading}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>PASSWORD</label>
              <input
                type="password"
                placeholder="Min 6 characters"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                disabled={regLoading}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>ROLE</label>
              <select value={regRole} onChange={(e) => setRegRole(e.target.value)} style={styles.select}>
                <option value="investigator">Investigator</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button type="submit" disabled={regLoading} style={styles.submitBtn}>
              {regLoading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <button onClick={onBack} style={styles.backBtn}>
          ← Back
        </button>

        <div style={styles.header}>
          <div style={styles.icon}>🔒</div>
          <h1 style={styles.title}>Secure Login Portal</h1>
          <p style={styles.subtitle}>Chandigarh Cyber Cell — restricted access</p>
        </div>

        <div style={styles.roleSelector}>
          <button
            onClick={() => setSelectedRole("investigator")}
            style={{
              ...styles.roleButton,
              ...(selectedRole === "investigator" ? styles.roleButtonActive : {}),
            }}
          >
            <div style={styles.roleIcon}>🔍</div>
            <div style={styles.roleName}>Investigator</div>
            <div style={styles.roleDesc}>Case & wallet access</div>
          </button>

          <button
            onClick={() => setSelectedRole("admin")}
            style={{
              ...styles.roleButton,
              ...(selectedRole === "admin" ? styles.roleButtonActive : {}),
            }}
          >
            <div style={styles.roleIcon}>🛡️</div>
            <div style={styles.roleName}>Admin</div>
            <div style={styles.roleDesc}>Full system access</div>
          </button>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div style={styles.formGroup}>
            <label style={styles.label}>OFFICIAL EMAIL</label>
            <input
              type="email"
              placeholder="Noir@cybercell.gov.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>PASSWORD</label>
            <input
              type="password"
              placeholder="••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              style={styles.input}
              required
            />
          </div>

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? "Signing in..." : `Sign In as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`}
          </button>
        </form>

        <div style={styles.footer}>
          Don't have an account?{" "}
          <button onClick={() => setShowRegister(true)} style={styles.registerLink}>
            Register Here
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#060a0b",
    padding: "20px",
  },
  card: {
    background: "#0d1214",
    border: "1px solid #20282b",
    borderRadius: "20px",
    padding: "40px",
    maxWidth: "500px",
    width: "100%",
    position: "relative",
  },
  backBtn: {
    position: "absolute",
    top: "20px",
    left: "20px",
    background: "none",
    border: "none",
    color: "#7e898c",
    fontSize: "14px",
    cursor: "pointer",
    padding: "8px 12px",
    borderRadius: "8px",
    transition: "all 0.2s",
  },
  header: {
    textAlign: "center",
    marginBottom: "30px",
  },
  icon: {
    fontSize: "48px",
    marginBottom: "16px",
    display: "block",
  },
  title: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#edf2f0",
    margin: "0 0 8px",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: "14px",
    color: "#7e898c",
    margin: 0,
  },
  roleSelector: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "24px",
  },
  roleButton: {
    background: "#12171a",
    border: "1px solid #20282b",
    borderRadius: "12px",
    padding: "16px",
    cursor: "pointer",
    textAlign: "center",
    transition: "all 0.2s",
    color: "#8B9499",
  },
  roleButtonActive: {
    background: "rgba(182, 255, 0, 0.1)",
    border: "2px solid #b6ff00",
    color: "#b6ff00",
  },
  roleIcon: {
    fontSize: "24px",
    marginBottom: "8px",
  },
  roleName: {
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "4px",
    color: "inherit",
  },
  roleDesc: {
    fontSize: "11px",
    opacity: 0.7,
  },
  errorBox: {
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "8px",
    padding: "12px",
    color: "#ef4444",
    fontSize: "12px",
    marginBottom: "16px",
    textAlign: "center",
  },
  formGroup: {
    marginBottom: "16px",
  },
  label: {
    display: "block",
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#7e898c",
    marginBottom: "8px",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    background: "#060a0b",
    border: "1px solid #20282b",
    borderRadius: "8px",
    color: "#edf2f0",
    fontSize: "14px",
    fontFamily: "monospace",
    transition: "all 0.2s",
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    padding: "12px 14px",
    background: "#060a0b",
    border: "1px solid #20282b",
    borderRadius: "8px",
    color: "#edf2f0",
    fontSize: "14px",
    cursor: "pointer",
    boxSizing: "border-box",
  },
  submitBtn: {
    width: "100%",
    padding: "14px",
    background: "#b6ff00",
    color: "#060a0b",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.2s",
    marginTop: "8px",
  },
  footer: {
    textAlign: "center",
    fontSize: "13px",
    color: "#7e898c",
    marginTop: "16px",
  },
  registerLink: {
    background: "none",
    border: "none",
    color: "#b6ff00",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "inherit",
  },
};
import React, { useState, useEffect } from "react";
import { Save, UserCircle, ShieldAlert } from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

export default function SettingsView({ toast, user }) {
  // Fallback to localStorage if user prop is missing or incomplete
  const storedUser = !user || !user.email 
    ? JSON.parse(localStorage.getItem("chainsleuth_user") || '{}') 
    : user;

  // Initialize state from the user prop or localStorage
  const [name, setName] = useState(storedUser?.name || "");
  const [email] = useState(storedUser?.email || "");
  const [role] = useState(storedUser?.role || "investigator");

  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("chainsleuth_token");
      const headers = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/api/user/update`, {
        method: "POST",
        headers,
        body: JSON.stringify({ email, name, newPassword }),
      });
      const data = await res.json();

      if (res.ok) {
        // Update local storage so Topbar updates instantly too
        const updatedUser = data.user;
        localStorage.setItem("chainsleuth_user", JSON.stringify(updatedUser));

        // Update local state
        setName(updatedUser.name);
        setNewPassword(""); // clear password field

        if (toast) toast("Profile updated successfully");
      } else {
        if (res.status === 401) {
          setError("Authentication expired. Please log in again.");
        } else {
          setError(data.error || "Failed to update profile");
        }
      }
    } catch (err) {
      setError("Connection error - backend not available.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="cx-fade-up"
      style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}
    >
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <UserCircle size={28} color="var(--lime)" />
        <h2 style={{ margin: 0, fontSize: 20, color: "#fff" }}>
          Account Settings
        </h2>
      </div>

      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--line)",
          borderRadius: 16,
          padding: 28,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 24,
            paddingBottom: 24,
            borderBottom: "1px solid var(--line)",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(182,255,0,.1)",
              display: "grid",
              placeItems: "center",
              fontSize: 24,
              fontWeight: 800,
              color: "var(--lime)",
            }}
          >
            {name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div>
            <h3 style={{ margin: "0 0 4px", fontSize: 16, color: "#fff" }}>
              {name || "Unknown User"}
            </h3>
            <div style={{ fontSize: 12, color: "var(--dim)" }}>{email}</div>
            <div style={{ marginTop: 6 }}>
              <span
                className="cx-badge"
                style={{
                  border: "1px solid var(--lime)",
                  color: "var(--lime)",
                }}
              >
                {role?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: 12,
              background: "rgba(255,92,103,.1)",
              color: "var(--danger)",
              border: "1px solid var(--danger)",
              borderRadius: 10,
              marginBottom: 16,
              fontSize: 12,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <form
          onSubmit={handleUpdate}
          style={{ display: "flex", flexDirection: "column", gap: 18 }}
        >
          <div>
            <label
              style={{
                fontSize: 11,
                color: "var(--dim)",
                marginBottom: 6,
                display: "block",
              }}
            >
              FULL NAME
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: "100%",
                background: "rgba(0,0,0,.2)",
                border: "1px solid var(--line)",
                borderRadius: 10,
                padding: "12px 14px",
                color: "#fff",
                fontSize: 13,
                outline: "none",
              }}
            />
          </div>

          <div>
            <label
              style={{
                fontSize: 11,
                color: "var(--dim)",
                marginBottom: 6,
                display: "block",
              }}
            >
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              value={email}
              disabled
              style={{
                width: "100%",
                background: "rgba(0,0,0,.4)",
                border: "1px solid var(--line)",
                borderRadius: 10,
                padding: "12px 14px",
                color: "var(--dim)",
                fontSize: 13,
                outline: "none",
                cursor: "not-allowed",
              }}
            />
          </div>

          <div>
            <label
              style={{
                fontSize: 11,
                color: "var(--dim)",
                marginBottom: 6,
                display: "block",
              }}
            >
              NEW PASSWORD (Optional)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
              style={{
                width: "100%",
                background: "rgba(0,0,0,.2)",
                border: "1px solid var(--line)",
                borderRadius: 10,
                padding: "12px 14px",
                color: "#fff",
                fontSize: 13,
                outline: "none",
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={loading}
              className="cx-btn cx-btn-primary"
              style={{
                padding: "12px 20px",
                fontSize: 13,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Save size={15} />
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      <div
        style={{
          background: "rgba(255,92,103,.05)",
          border: "1px solid rgba(255,92,103,.2)",
          borderRadius: 16,
          padding: 20,
          display: "flex",
          gap: 12,
          alignItems: "center",
        }}
      >
        <ShieldAlert size={20} color="var(--danger)" />
        <div>
          <h4 style={{ margin: "0 0 4px", fontSize: 13, color: "#fff" }}>
            Danger Zone
          </h4>
          <p style={{ margin: 0, fontSize: 11.5, color: "var(--muted)" }}>
            Changing your role requires database administrator intervention.
            Ensure your password is strong and secure.
          </p>
        </div>
      </div>
    </div>
  );
}
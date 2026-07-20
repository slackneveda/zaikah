"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Props {
  children: (admin: AdminUser, logout: () => void) => React.ReactNode;
}

const SESSION_KEY = "zaikah_admin_session";

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid var(--border-color)",
  color: "var(--text-primary)",
  borderRadius: "10px",
  outline: "none",
  padding: "11px 14px",
  width: "100%",
  fontSize: "15px",
  transition: "border-color 0.15s",
};

export default function AdminLoginGate({ children }: Props) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [checked, setChecked] = useState(false);

  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  // Change-password modal state
  const [showChangePw, setShowChangePw] = useState(false);
  const [cpForm, setCpForm] = useState({ current: "", next: "", confirm: "" });
  const [cpError, setCpError] = useState("");
  const [cpSuccess, setCpSuccess] = useState(false);
  const [cpLoading, setCpLoading] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) setAdmin(JSON.parse(stored));
    } catch { /* ignore */ }
    setChecked(true);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setAdmin(null);
    setEmail("");
    setPassword("");
    setError("");
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Login failed"); return; }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
      setAdmin(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePw = async (e: React.FormEvent) => {
    e.preventDefault();
    setCpError("");
    setCpSuccess(false);
    if (cpForm.next !== cpForm.confirm) { setCpError("New passwords do not match."); return; }
    if (cpForm.next.length < 6) { setCpError("New password must be at least 6 characters."); return; }
    setCpLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: admin!.id, currentPassword: cpForm.current, newPassword: cpForm.next }),
      });
      const data = await res.json();
      if (!res.ok) { setCpError(data.error ?? "Failed to change password"); return; }
      setCpSuccess(true);
      setCpForm({ current: "", next: "", confirm: "" });
      setTimeout(() => setShowChangePw(false), 1500);
    } catch {
      setCpError("Network error. Please try again.");
    } finally {
      setCpLoading(false);
    }
  };

  // Don't render until we've checked session storage
  if (!checked) return null;

  // ── Logged in ─────────────────────────────────────────────
  if (admin) {
    return (
      <>
        {children(admin, logout)}

        {/* Floating admin bar at bottom-right */}
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: "14px",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            zIndex: 100,
            boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
          }}
        >
          <div>
            <p style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 700 }}>{admin.name}</p>
            <p style={{ color: "var(--text-muted)", fontSize: "11px" }}>{admin.email}</p>
          </div>
          <button
            onClick={() => { setShowChangePw(true); setCpForm({ current: "", next: "", confirm: "" }); setCpError(""); setCpSuccess(false); }}
            style={{ background: "rgba(96,165,250,0.12)", color: "#60A5FA", border: "1px solid rgba(96,165,250,0.3)", borderRadius: "8px", padding: "5px 10px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
          >
            🔑 Change Password
          </button>
          <button
            onClick={logout}
            style={{ background: "rgba(239,68,68,0.1)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "5px 10px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
          >
            Logout
          </button>
        </div>

        {/* Change Password Modal */}
        {showChangePw && (
          <div
            style={{ background: "rgba(0,0,0,0.75)", position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
            onClick={(e) => e.target === e.currentTarget && setShowChangePw(false)}
          >
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "18px", width: "100%", maxWidth: "400px", padding: "28px" }}>
              <h3 style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: "18px", marginBottom: "6px" }}>Change Password</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "20px" }}>Update your admin account password</p>

              {cpSuccess ? (
                <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "10px", padding: "14px", textAlign: "center" }}>
                  <p style={{ color: "var(--success)", fontWeight: 700 }}>✓ Password changed successfully!</p>
                </div>
              ) : (
                <form onSubmit={handleChangePw} className="space-y-3">
                  <div>
                    <label style={{ color: "var(--text-muted)", fontSize: "12px" }} className="block mb-1">Current Password</label>
                    <input style={inputStyle} type="password" placeholder="Current password" value={cpForm.current} onChange={(e) => setCpForm((p) => ({ ...p, current: e.target.value }))} required />
                  </div>
                  <div>
                    <label style={{ color: "var(--text-muted)", fontSize: "12px" }} className="block mb-1">New Password</label>
                    <input style={inputStyle} type="password" placeholder="New password (min 6 chars)" value={cpForm.next} onChange={(e) => setCpForm((p) => ({ ...p, next: e.target.value }))} required />
                  </div>
                  <div>
                    <label style={{ color: "var(--text-muted)", fontSize: "12px" }} className="block mb-1">Confirm New Password</label>
                    <input style={inputStyle} type="password" placeholder="Confirm new password" value={cpForm.confirm} onChange={(e) => setCpForm((p) => ({ ...p, confirm: e.target.value }))} required />
                  </div>
                  {cpError && (
                    <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "10px" }}>
                      <p style={{ color: "var(--danger)", fontSize: "13px" }}>{cpError}</p>
                    </div>
                  )}
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowChangePw(false)} style={{ flex: 1, background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "10px", fontSize: "14px", cursor: "pointer" }}>
                      Cancel
                    </button>
                    <button type="submit" disabled={cpLoading} style={{ flex: 1, background: "var(--accent-maroon)", color: "var(--text-primary)", border: "none", borderRadius: "10px", padding: "10px", fontSize: "14px", fontWeight: 700, cursor: cpLoading ? "not-allowed" : "pointer", opacity: cpLoading ? 0.7 : 1 }}>
                      {cpLoading ? "Saving..." : "Update Password"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  // ── Login Screen ───────────────────────────────────────────
  return (
    <div
      style={{
        background: "var(--bg-primary)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "420px" }}>
        {/* Logo */}
        <div className="text-center mb-8">
          <Image
            src="/WhatsApp Image 2026-07-14 at 9.23.32 PM.jpeg"
            alt="ZAIKAH"
            width={200}
            height={60}
            className="object-contain mx-auto mb-4"
            priority
          />
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(232,163,61,0.1)", border: "1px solid rgba(232,163,61,0.3)", borderRadius: "20px", padding: "4px 14px" }}>
            <span style={{ color: "var(--accent-gold)", fontSize: "13px", fontWeight: 700, letterSpacing: "0.08em" }}>ADMIN PANEL</span>
          </div>
        </div>

        {/* Card */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: "20px",
            padding: "32px",
          }}
        >
          <h2 style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: "22px", marginBottom: "6px" }}>Sign In</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "24px" }}>Enter your admin credentials to continue</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }} className="block mb-2">Email</label>
              <input
                style={inputStyle}
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                autoFocus
                required
              />
            </div>

            <div>
              <label style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }} className="block mb-2">Password</label>
              <div style={{ position: "relative" }}>
                <input
                  style={inputStyle}
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "13px" }}
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.35)", borderRadius: "10px", padding: "12px 14px" }}>
                <p style={{ color: "var(--danger)", fontSize: "13px", fontWeight: 500 }}>⚠ {error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                background: loading ? "rgba(122,31,43,0.6)" : "var(--accent-maroon)",
                color: "var(--text-primary)",
                border: "none",
                borderRadius: "12px",
                padding: "13px",
                fontSize: "15px",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                marginTop: "8px",
                transition: "opacity 0.15s",
              }}
            >
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </form>
        </div>

        <p style={{ color: "var(--text-muted)", fontSize: "12px", textAlign: "center", marginTop: "20px" }}>
          Admin access only · ZAIKAH POS
        </p>
      </div>
    </div>
  );
}

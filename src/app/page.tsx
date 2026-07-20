"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const MASTER_SESSION_KEY = "zaikah_master_verified";
const SESSION_KEY = "zaikah_session";

interface Portal {
  id: string;
  label: string;
  icon: string;
  description: string;
  href: string;
  color: string;
}

const portals: Portal[] = [
  { id: "dine-in", label: "Dine In", icon: "🍽️", description: "Table service & restaurant orders", href: "/dine-in", color: "var(--accent-maroon)" },
  { id: "takeaway", label: "Takeaway", icon: "🛍️", description: "Quick counter orders & pickup", href: "/takeaway", color: "var(--accent-gold)" },
  { id: "delivery", label: "Home Delivery", icon: "🛵", description: "Delivery orders & rider dispatch", href: "/delivery", color: "#3b82f6" },
  { id: "manager", label: "Manager", icon: "📊", description: "Reports, history & analytics", href: "/manager", color: "#22c55e" },
  { id: "admin", label: "Admin", icon: "⚙️", description: "Staff, settings & system config", href: "/admin", color: "#a855f7" },
];

type Step = "master" | "role" | "password";

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid var(--border-color)",
  color: "var(--text-primary)",
  borderRadius: "10px",
  outline: "none",
  padding: "12px 42px 12px 16px",
  width: "100%",
  fontSize: "15px",
};

export default function HomePage() {
  const [step, setStep] = useState<Step>("master");
  const [masterInput, setMasterInput] = useState("");
  const [masterError, setMasterError] = useState("");
  const [masterLoading, setMasterLoading] = useState(false);
  const [selectedPortal, setSelectedPortal] = useState<Portal | null>(null);
  const [rolePassword, setRolePassword] = useState("");
  const [roleError, setRoleError] = useState("");
  const [roleLoading, setRoleLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const router = useRouter();

  useEffect(() => {
    try {
      const masterVerified = sessionStorage.getItem(MASTER_SESSION_KEY);
      if (masterVerified === "true") setStep("role");
    } catch { /* SSR guard */ }
  }, []);

  const handleMasterSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterInput.trim()) return;
    setMasterError("");
    setMasterLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ masterPassword: masterInput }),
      });
      const data = await res.json();
      if (!res.ok || !data.verified) {
        setMasterError("Incorrect master password");
        return;
      }
      sessionStorage.setItem(MASTER_SESSION_KEY, "true");
      setStep("role");
      setMasterInput("");
    } catch {
      setMasterError("Network error. Please try again.");
    } finally {
      setMasterLoading(false);
    }
  }, [masterInput]);

  const handlePortalSelect = useCallback((portal: Portal) => {
    setSelectedPortal(portal);
    setRolePassword("");
    setRoleError("");
    setShowPw(false);
    setStep("password");
  }, []);

  const handleRoleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPortal || !rolePassword.trim()) return;
    setRoleError("");
    setRoleLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedPortal.id, rolePassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRoleError(data.error || "Invalid password");
        return;
      }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
      router.push(selectedPortal.href);
    } catch {
      setRoleError("Network error. Please try again.");
    } finally {
      setRoleLoading(false);
    }
  }, [selectedPortal, rolePassword, router]);

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      {/* Logo */}
      <div className="mb-8 text-center">
        <Image src="/logo.jpeg" alt="ZAIKAH" width={180} height={180} className="object-contain mx-auto mb-3 rounded-full" priority />
        <p style={{ color: "var(--text-muted)", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase" }}>Point of Sale System</p>
      </div>

      {/* STEP 1: Master Password */}
      {step === "master" && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "20px", padding: "36px 32px", width: "100%", maxWidth: "400px" }}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div style={{ fontSize: "38px", marginBottom: "10px" }}>🔐</div>
            <h2 style={{ color: "var(--text-primary)", fontSize: "20px", fontWeight: 700, margin: 0 }}>System Access</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "6px" }}>Enter master password to continue</p>
          </div>
          <form onSubmit={handleMasterSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                value={masterInput}
                onChange={(e) => { setMasterInput(e.target.value); setMasterError(""); }}
                placeholder="Master Password"
                style={inputStyle}
                autoFocus
              />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "16px" }}>
                {showPw ? "🙈" : "👁️"}
              </button>
            </div>
            {masterError && <p style={{ color: "var(--danger)", fontSize: "13px", margin: 0, textAlign: "center" }}>{masterError}</p>}
            <button
              type="submit"
              disabled={masterLoading || !masterInput.trim()}
              style={{ background: "var(--accent-maroon)", color: "white", border: "none", borderRadius: "10px", padding: "13px", fontSize: "15px", fontWeight: 700, cursor: masterLoading || !masterInput.trim() ? "not-allowed" : "pointer", opacity: masterLoading || !masterInput.trim() ? 0.6 : 1, transition: "opacity 0.15s" }}
            >
              {masterLoading ? "Verifying..." : "Access System"}
            </button>
          </form>
        </div>
      )}

      {/* STEP 2: Role Selection */}
      {step === "role" && (
        <div style={{ width: "100%", maxWidth: "780px" }}>
          <p style={{ color: "var(--text-secondary)", textAlign: "center", fontSize: "12px", marginBottom: "20px", textTransform: "uppercase", letterSpacing: "0.12em" }}>Select Your Role</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "14px" }}>
            {portals.map((portal) => (
              <button
                key={portal.id}
                onClick={() => handlePortalSelect(portal)}
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "24px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", cursor: "pointer", transition: "all 0.18s ease" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = portal.color; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.2)`; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-color)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <span style={{ fontSize: "34px" }}>{portal.icon}</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "14px" }}>{portal.label}</span>
                <span style={{ color: "var(--text-muted)", fontSize: "11px", textAlign: "center", lineHeight: "1.4" }}>{portal.description}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: Role Password */}
      {step === "password" && selectedPortal && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "20px", padding: "36px 32px", width: "100%", maxWidth: "400px" }}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div style={{ fontSize: "38px", marginBottom: "10px" }}>{selectedPortal.icon}</div>
            <h2 style={{ color: "var(--text-primary)", fontSize: "20px", fontWeight: 700, margin: 0 }}>{selectedPortal.label}</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "6px" }}>Enter password for this role</p>
          </div>
          <form onSubmit={handleRoleLogin} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                value={rolePassword}
                onChange={(e) => { setRolePassword(e.target.value); setRoleError(""); }}
                placeholder="Role Password"
                style={inputStyle}
                autoFocus
              />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "16px" }}>
                {showPw ? "🙈" : "👁️"}
              </button>
            </div>
            {roleError && <p style={{ color: "var(--danger)", fontSize: "13px", margin: 0, textAlign: "center" }}>{roleError}</p>}
            <button
              type="submit"
              disabled={roleLoading || !rolePassword.trim()}
              style={{ background: selectedPortal.color, color: "white", border: "none", borderRadius: "10px", padding: "13px", fontSize: "15px", fontWeight: 700, cursor: roleLoading || !rolePassword.trim() ? "not-allowed" : "pointer", opacity: roleLoading || !rolePassword.trim() ? 0.6 : 1 }}
            >
              {roleLoading ? "Signing In..." : `Enter ${selectedPortal.label}`}
            </button>
            <button
              type="button"
              onClick={() => setStep("role")}
              style={{ background: "none", border: "1px solid var(--border-color)", color: "var(--text-secondary)", borderRadius: "10px", padding: "10px", fontSize: "13px", cursor: "pointer" }}
            >
              ← Back to Roles
            </button>
          </form>
        </div>
      )}

      <p style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "32px" }}>
        ZAIKAH POS v2.0 · {new Date().getFullYear()}
      </p>
    </div>
  );
}

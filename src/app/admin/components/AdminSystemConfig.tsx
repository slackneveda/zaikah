"use client";

import { useState } from "react";

interface PasswordChangeFormProps {
  label: string;
  configKey: string;
  description?: string;
}

function PasswordChangeForm({ label, configKey, description }: PasswordChangeFormProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");
    if (!newPassword.trim()) { setError("New password is required"); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }

    setStatus("saving");
    try {
      // Verify current password first via login endpoint
      const verifyRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          configKey === "master_password"
            ? { masterPassword: currentPassword }
            : { role: configKey.replace("_password", ""), rolePassword: currentPassword }
        ),
      });
      if (!verifyRes.ok) {
        setError("Current password is incorrect");
        setStatus("error");
        return;
      }
      // Update via system config
      const res = await fetch("/api/system-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: configKey, value: newPassword, isPassword: true }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setStatus("success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("error");
      setError("Failed to update password");
    }
  };

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "20px", marginBottom: "16px" }}>
      <h3 style={{ color: "var(--text-primary)", fontSize: "15px", fontWeight: 700, marginBottom: "4px" }}>{label}</h3>
      {description && <p style={{ color: "var(--text-muted)", fontSize: "12px", marginBottom: "14px" }}>{description}</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "400px" }}>
        <div>
          <label style={{ color: "var(--text-secondary)", fontSize: "12px", display: "block", marginBottom: "4px" }}>Current Password</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", color: "var(--text-primary)", borderRadius: "8px", padding: "9px 12px", fontSize: "13px", outline: "none" }} />
        </div>
        <div>
          <label style={{ color: "var(--text-secondary)", fontSize: "12px", display: "block", marginBottom: "4px" }}>New Password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", color: "var(--text-primary)", borderRadius: "8px", padding: "9px 12px", fontSize: "13px", outline: "none" }} />
        </div>
        <div>
          <label style={{ color: "var(--text-secondary)", fontSize: "12px", display: "block", marginBottom: "4px" }}>Confirm New Password</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", color: "var(--text-primary)", borderRadius: "8px", padding: "9px 12px", fontSize: "13px", outline: "none" }} />
        </div>
        {error && <p style={{ color: "var(--danger)", fontSize: "12px" }}>{error}</p>}
        {status === "success" && <p style={{ color: "var(--success)", fontSize: "12px" }}>✓ Password updated successfully</p>}
        <button
          onClick={handleSave}
          disabled={status === "saving"}
          style={{ background: "var(--accent-maroon)", color: "white", border: "none", borderRadius: "8px", padding: "10px 20px", fontSize: "13px", fontWeight: 700, cursor: "pointer", width: "fit-content", opacity: status === "saving" ? 0.7 : 1 }}
        >
          {status === "saving" ? "Updating..." : "Update Password"}
        </button>
      </div>
    </div>
  );
}

export default function AdminSystemConfig() {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
      <h2 style={{ color: "var(--text-primary)", fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>System Configuration</h2>
      <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "24px" }}>Manage system passwords. Current password is required to make changes.</p>

      <PasswordChangeForm label="Master Password" configKey="master_password" description="Required to access the role selection screen on startup." />
      <PasswordChangeForm label="Admin Role Password" configKey="admin_password" description="Password for the Admin portal." />
      <PasswordChangeForm label="Manager Role Password" configKey="manager_password" description="Password for the Manager portal." />
      <PasswordChangeForm label="Dine-In Role Password" configKey="dining_password" description="Password for the Dine-In portal." />
      <PasswordChangeForm label="Takeaway Role Password" configKey="takeaway_password" description="Password for the Takeaway portal." />
      <PasswordChangeForm label="Delivery Role Password" configKey="delivery_password" description="Password for the Delivery portal." />
    </div>
  );
}

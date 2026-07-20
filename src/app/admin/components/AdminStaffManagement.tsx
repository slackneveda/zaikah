"use client";

import { useState, useEffect } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

const ROLES = ["admin", "manager", "cashier"];

const inputStyle: React.CSSProperties = {
  background: "var(--bg-secondary)",
  border: "1px solid var(--border-color)",
  color: "var(--text-primary)",
  borderRadius: "8px",
  outline: "none",
  padding: "8px 12px",
  width: "100%",
  fontSize: "14px",
};

const roleColor: Record<string, string> = {
  admin: "#E8A33D",
  manager: "#60A5FA",
  cashier: "#22c55e",
};

export default function AdminStaffManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "cashier" });

  // Reset password modal
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [resetPw, setResetPw] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSaving, setResetSaving] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const fetchUsers = async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const openAdd = () => {
    setEditingUser(null);
    setForm({ name: "", email: "", password: "", role: "cashier" });
    setShowForm(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, password: "", role: user.role });
    setShowForm(true);
  };

  const openReset = (user: User) => {
    setResetTarget(user);
    setResetPw("");
    setResetConfirm("");
    setResetError("");
    setResetSuccess(false);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) return;
    if (!editingUser && !form.password) return;
    setSaving(true);
    try {
      if (editingUser) {
        await fetch(`/api/users/${editingUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name, role: form.role }),
        });
      } else {
        await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
    } finally {
      setSaving(false);
    }
    setShowForm(false);
    setEditingUser(null);
    fetchUsers();
  };

  const handleToggleActive = async (user: User) => {
    await fetch(`/api/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !user.active }),
    });
    fetchUsers();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Permanently delete this staff member?")) return;
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    fetchUsers();
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    if (resetPw !== resetConfirm) { setResetError("Passwords do not match."); return; }
    if (resetPw.length < 6) { setResetError("Password must be at least 6 characters."); return; }
    setResetSaving(true);
    try {
      const res = await fetch(`/api/users/${resetTarget!.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: resetPw }),
      });
      if (!res.ok) { setResetError("Failed to reset password."); return; }
      setResetSuccess(true);
      setTimeout(() => setResetTarget(null), 1500);
    } catch {
      setResetError("Network error.");
    } finally {
      setResetSaving(false);
    }
  };

  const filtered = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="flex-1 h-full overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 style={{ color: "var(--text-primary)" }} className="text-xl font-bold">Staff Management</h2>
            <p style={{ color: "var(--text-muted)" }} className="text-sm mt-1">Manage users, roles, passwords, and access control</p>
          </div>
          <button
            onClick={openAdd}
            style={{ background: "var(--accent-maroon)", color: "var(--text-primary)" }}
            className="px-4 py-2.5 rounded-lg font-semibold text-sm hover:opacity-90"
          >
            + Add Staff
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
          {[
            { label: "Total Staff", value: users.length, color: "var(--accent-gold)" },
            { label: "Active", value: users.filter((u) => u.active).length, color: "var(--success)" },
            { label: "Inactive", value: users.filter((u) => !u.active).length, color: "var(--danger)" },
            { label: "Roles", value: ROLES.length, color: "#A855F7" },
          ].map((s) => (
            <div key={s.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }} className="rounded-xl p-4">
              <p style={{ color: "var(--text-muted)" }} className="text-xs mb-1">{s.label}</p>
              <p style={{ color: s.color }} className="text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            placeholder="Search staff by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, flex: 1, padding: "8px 12px" }}
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ ...inputStyle, width: "auto", minWidth: "140px" }}
          >
            <option value="all">All Roles</option>
            {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
          </select>
        </div>

        {/* Table */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }} className="rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-10 text-center">
              <p style={{ color: "var(--text-muted)" }} className="animate-pulse text-sm">Loading staff...</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)" }}>
                  {["Name", "Email", "Role", "Status", "Joined", "Actions"].map((h) => (
                    <th key={h} style={{ color: "var(--text-muted)" }} className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} style={{ borderBottom: "1px solid var(--border-color)" }} className="hover:bg-slate-800 transition-colors">
                    <td style={{ color: "var(--text-primary)" }} className="px-4 py-3 font-medium">{user.name}</td>
                    <td style={{ color: "var(--text-secondary)" }} className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">
                      <span style={{ color: roleColor[user.role] ?? "var(--text-secondary)", background: `${roleColor[user.role] ?? "#888"}20`, border: `1px solid ${roleColor[user.role] ?? "#888"}60`, borderRadius: "20px", padding: "2px 10px", fontSize: "12px", fontWeight: 600, textTransform: "capitalize" }}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleActive(user)}
                        style={{ color: user.active ? "var(--success)" : "var(--danger)", background: user.active ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${user.active ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`, borderRadius: "20px", padding: "2px 10px", fontSize: "12px", cursor: "pointer" }}
                      >
                        {user.active ? "● Active" : "○ Inactive"}
                      </button>
                    </td>
                    <td style={{ color: "var(--text-muted)" }} className="px-4 py-3 text-xs">
                      {new Date(user.createdAt).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => openEdit(user)} style={{ color: "#60A5FA", fontSize: "12px" }} className="hover:opacity-80">Edit</button>
                        <button onClick={() => openReset(user)} style={{ color: "var(--accent-gold)", fontSize: "12px" }} className="hover:opacity-80">Reset PW</button>
                        <button onClick={() => handleDelete(user.id)} style={{ color: "var(--danger)", fontSize: "12px" }} className="hover:opacity-80">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center">
                      <p style={{ color: "var(--text-muted)" }} className="text-sm">No staff members found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div style={{ background: "rgba(0,0,0,0.7)" }} className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "16px" }} className="w-full max-w-md p-6 space-y-4">
            <h3 style={{ color: "var(--text-primary)" }} className="font-bold text-lg">
              {editingUser ? "Edit Staff Member" : "Add Staff Member"}
            </h3>
            <div className="space-y-3">
              <div>
                <label style={{ color: "var(--text-muted)", fontSize: "12px" }} className="block mb-1">Full Name *</label>
                <input style={inputStyle} placeholder="Full name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              </div>
              {!editingUser && (
                <>
                  <div>
                    <label style={{ color: "var(--text-muted)", fontSize: "12px" }} className="block mb-1">Email *</label>
                    <input style={inputStyle} type="email" placeholder="Email address" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ color: "var(--text-muted)", fontSize: "12px" }} className="block mb-1">Password *</label>
                    <input style={inputStyle} type="password" placeholder="Password (min 6 chars)" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
                  </div>
                </>
              )}
              <div>
                <label style={{ color: "var(--text-muted)", fontSize: "12px" }} className="block mb-1">Role</label>
                <select style={inputStyle} value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>
                  {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} style={{ flex: 1, background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "10px", fontSize: "14px", cursor: "pointer" }}>
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name || !form.email || (!editingUser && !form.password)}
                style={{ flex: 1, background: "var(--accent-maroon)", color: "var(--text-primary)", border: "none", borderRadius: "10px", padding: "10px", fontSize: "14px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}
              >
                {saving ? "Saving..." : editingUser ? "Save Changes" : "Add Staff"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetTarget && (
        <div style={{ background: "rgba(0,0,0,0.7)" }} className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setResetTarget(null)}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "16px" }} className="w-full max-w-sm p-6 space-y-4">
            <div>
              <h3 style={{ color: "var(--text-primary)" }} className="font-bold text-lg">Reset Password</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>
                Set a new password for <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{resetTarget.name}</span>
              </p>
            </div>
            {resetSuccess ? (
              <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "10px", padding: "14px", textAlign: "center" }}>
                <p style={{ color: "var(--success)", fontWeight: 700 }}>✓ Password reset successfully!</p>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3">
                <div>
                  <label style={{ color: "var(--text-muted)", fontSize: "12px" }} className="block mb-1">New Password *</label>
                  <input style={inputStyle} type="password" placeholder="New password (min 6 chars)" value={resetPw} onChange={(e) => { setResetPw(e.target.value); setResetError(""); }} required />
                </div>
                <div>
                  <label style={{ color: "var(--text-muted)", fontSize: "12px" }} className="block mb-1">Confirm Password *</label>
                  <input style={inputStyle} type="password" placeholder="Confirm new password" value={resetConfirm} onChange={(e) => { setResetConfirm(e.target.value); setResetError(""); }} required />
                </div>
                {resetError && (
                  <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "10px" }}>
                    <p style={{ color: "var(--danger)", fontSize: "13px" }}>{resetError}</p>
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setResetTarget(null)} style={{ flex: 1, background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "10px", fontSize: "14px", cursor: "pointer" }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={resetSaving} style={{ flex: 1, background: "var(--accent-maroon)", color: "var(--text-primary)", border: "none", borderRadius: "10px", padding: "10px", fontSize: "14px", fontWeight: 700, cursor: resetSaving ? "not-allowed" : "pointer", opacity: resetSaving ? 0.7 : 1 }}>
                    {resetSaving ? "Saving..." : "Reset Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

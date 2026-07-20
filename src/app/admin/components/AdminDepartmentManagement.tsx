"use client";

import { useState, useEffect, useCallback } from "react";

interface Department {
  id: number;
  name: string;
  printerIp?: string | null;
  printerPort?: number | null;
  _count?: { categories: number; orderItems: number };
}

const emptyForm = { name: "", printerIp: "", printerPort: "" };

export default function AdminDepartmentManagement() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/departments");
    const data = await res.json();
    setDepartments(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchDepartments(); }, [fetchDepartments]);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const body: Record<string, unknown> = { name: form.name.trim() };
    if (form.printerIp.trim()) body.printerIp = form.printerIp.trim();
    if (form.printerPort) body.printerPort = parseInt(form.printerPort);

    const url = editId ? `/api/departments/${editId}` : "/api/departments";
    const method = editId ? "PATCH" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    setForm(emptyForm);
    setEditId(null);
    await fetchDepartments();
  };

  const handleEdit = (dept: Department) => {
    setEditId(dept.id);
    setForm({ name: dept.name, printerIp: dept.printerIp ?? "", printerPort: dept.printerPort ? String(dept.printerPort) : "" });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this department? This will remove department assignment from categories.")) return;
    await fetch(`/api/departments/${id}`, { method: "DELETE" });
    await fetchDepartments();
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
      <h2 style={{ color: "var(--text-primary)", fontSize: "20px", fontWeight: 700, marginBottom: "20px" }}>Department Management</h2>

      {/* Form */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "20px", marginBottom: "24px" }}>
        <h3 style={{ color: "var(--text-primary)", fontSize: "15px", fontWeight: 700, marginBottom: "14px" }}>{editId ? "Edit Department" : "Add Department"}</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px auto", gap: "10px", alignItems: "end" }}>
          <div>
            <label style={{ color: "var(--text-secondary)", fontSize: "12px", display: "block", marginBottom: "4px" }}>Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Kitchen" style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", color: "var(--text-primary)", borderRadius: "8px", padding: "9px 12px", fontSize: "13px", outline: "none" }} />
          </div>
          <div>
            <label style={{ color: "var(--text-secondary)", fontSize: "12px", display: "block", marginBottom: "4px" }}>Printer IP</label>
            <input value={form.printerIp} onChange={(e) => setForm({ ...form, printerIp: e.target.value })} placeholder="192.168.1.100" style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", color: "var(--text-primary)", borderRadius: "8px", padding: "9px 12px", fontSize: "13px", outline: "none" }} />
          </div>
          <div>
            <label style={{ color: "var(--text-secondary)", fontSize: "12px", display: "block", marginBottom: "4px" }}>Port</label>
            <input type="number" value={form.printerPort} onChange={(e) => setForm({ ...form, printerPort: e.target.value })} placeholder="9100" style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", color: "var(--text-primary)", borderRadius: "8px", padding: "9px 12px", fontSize: "13px", outline: "none" }} />
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            {editId && (
              <button onClick={() => { setEditId(null); setForm(emptyForm); }} style={{ background: "none", border: "1px solid var(--border-color)", color: "var(--text-secondary)", borderRadius: "8px", padding: "9px 14px", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
            )}
            <button onClick={handleSave} disabled={saving || !form.name.trim()} style={{ background: "var(--accent-maroon)", color: "white", border: "none", borderRadius: "8px", padding: "9px 18px", fontSize: "13px", fontWeight: 700, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving..." : editId ? "Update" : "Add"}
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px" }}>Loading...</div>
      ) : departments.length === 0 ? (
        <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px" }}>No departments yet</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {departments.map((dept) => (
            <div key={dept.id} style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <span style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "15px" }}>{dept.name}</span>
                {dept.printerIp && (
                  <span style={{ color: "var(--text-muted)", fontSize: "12px", marginLeft: "10px" }}>🖨️ {dept.printerIp}{dept.printerPort ? `:${dept.printerPort}` : ""}</span>
                )}
                {dept._count && (
                  <span style={{ color: "var(--text-muted)", fontSize: "12px", marginLeft: "10px" }}>{dept._count.categories} categories</span>
                )}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => handleEdit(dept)} style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "8px", padding: "6px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Edit</button>
                <button onClick={() => handleDelete(dept.id)} style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "6px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

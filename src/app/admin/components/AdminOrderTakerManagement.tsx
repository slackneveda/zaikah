"use client";

import { useState, useEffect, useCallback } from "react";

interface OrderTaker {
  id: number;
  name: string;
  phone?: string | null;
  active: boolean;
  _count?: { orders: number };
  createdAt?: string;
}

export default function AdminOrderTakerManagement() {
  const [orderTakers, setOrderTakers] = useState<OrderTaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  const fetchOrderTakers = useCallback(async () => {
    setLoading(true);
    const url = showInactive ? "/api/order-takers?all=true" : "/api/order-takers";
    const res = await fetch(url);
    const data = await res.json();
    setOrderTakers(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [showInactive]);

  useEffect(() => { fetchOrderTakers(); }, [fetchOrderTakers]);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const body: Record<string, unknown> = { name: form.name.trim() };
    if (form.phone.trim()) body.phone = form.phone.trim();
    const url = editId ? `/api/order-takers/${editId}` : "/api/order-takers";
    const method = editId ? "PATCH" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    setForm({ name: "", phone: "" });
    setEditId(null);
    await fetchOrderTakers();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Deactivate this order taker?")) return;
    await fetch(`/api/order-takers/${id}`, { method: "DELETE" });
    await fetchOrderTakers();
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <h2 style={{ color: "var(--text-primary)", fontSize: "20px", fontWeight: 700 }}>Order Takers</h2>
        <label style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)", fontSize: "13px", cursor: "pointer" }}>
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
          Show inactive
        </label>
      </div>

      {/* Form */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "20px", marginBottom: "24px" }}>
        <h3 style={{ color: "var(--text-primary)", fontSize: "15px", fontWeight: 700, marginBottom: "14px" }}>{editId ? "Edit" : "Add"} Order Taker</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "10px", alignItems: "end" }}>
          <div>
            <label style={{ color: "var(--text-secondary)", fontSize: "12px", display: "block", marginBottom: "4px" }}>Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", color: "var(--text-primary)", borderRadius: "8px", padding: "9px 12px", fontSize: "13px", outline: "none" }} />
          </div>
          <div>
            <label style={{ color: "var(--text-secondary)", fontSize: "12px", display: "block", marginBottom: "4px" }}>Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="03XX-XXXXXXX" style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", color: "var(--text-primary)", borderRadius: "8px", padding: "9px 12px", fontSize: "13px", outline: "none" }} />
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            {editId && <button onClick={() => { setEditId(null); setForm({ name: "", phone: "" }); }} style={{ background: "none", border: "1px solid var(--border-color)", color: "var(--text-secondary)", borderRadius: "8px", padding: "9px 14px", fontSize: "13px", cursor: "pointer" }}>Cancel</button>}
            <button onClick={handleSave} disabled={saving || !form.name.trim()} style={{ background: "var(--accent-maroon)", color: "white", border: "none", borderRadius: "8px", padding: "9px 18px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
              {saving ? "Saving..." : editId ? "Update" : "Add"}
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px" }}>Loading...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {orderTakers.map((ot) => (
            <div key={ot.id} style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", opacity: ot.active ? 1 : 0.5 }}>
              <div>
                <span style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "15px" }}>{ot.name}</span>
                {!ot.active && <span style={{ color: "var(--danger)", fontSize: "11px", marginLeft: "8px" }}>(inactive)</span>}
                {ot.phone && <span style={{ color: "var(--text-muted)", fontSize: "12px", marginLeft: "10px" }}>📞 {ot.phone}</span>}
                {ot._count && <span style={{ color: "var(--text-muted)", fontSize: "12px", marginLeft: "10px" }}>{ot._count.orders} orders taken</span>}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => { setEditId(ot.id); setForm({ name: ot.name, phone: ot.phone ?? "" }); }} style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "8px", padding: "6px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Edit</button>
                {ot.active && <button onClick={() => handleDelete(ot.id)} style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "6px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Deactivate</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

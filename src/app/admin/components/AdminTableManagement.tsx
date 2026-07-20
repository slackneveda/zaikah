"use client";

import { useEffect, useState } from "react";

interface Table {
  id: number;
  number: number;
  seats: number;
  status: string;
  createdAt: string;
}

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

export default function AdminTableManagement() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [form, setForm] = useState({ number: "", seats: "4" });
  const [saving, setSaving] = useState(false);

  const fetchTables = async () => {
    const res = await fetch("/api/tables");
    const data = await res.json();
    setTables(data);
    setLoading(false);
  };

  useEffect(() => { fetchTables(); }, []);

  const openAdd = () => {
    setEditingTable(null);
    setForm({ number: "", seats: "4" });
    setShowForm(true);
  };

  const openEdit = (table: Table) => {
    setEditingTable(table);
    setForm({ number: String(table.number), seats: String(table.seats) });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.number) return;
    setSaving(true);
    try {
      if (editingTable) {
        await fetch(`/api/tables/${editingTable.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ number: parseInt(form.number), seats: parseInt(form.seats) }),
        });
      } else {
        await fetch("/api/tables", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ number: parseInt(form.number), seats: parseInt(form.seats) }),
        });
      }
    } finally {
      setSaving(false);
    }
    setShowForm(false);
    setEditingTable(null);
    fetchTables();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this table? Any orders linked to it will lose the table reference.")) return;
    await fetch(`/api/tables/${id}`, { method: "DELETE" });
    fetchTables();
  };

  const handleToggleStatus = async (table: Table) => {
    const newStatus = table.status === "available" ? "occupied" : "available";
    await fetch(`/api/tables/${table.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchTables();
  };

  const available = tables.filter((t) => t.status === "available").length;
  const occupied = tables.filter((t) => t.status === "occupied").length;

  return (
    <div className="flex-1 h-full overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 style={{ color: "var(--text-primary)" }} className="text-xl font-bold">Table Management</h2>
            <p style={{ color: "var(--text-muted)" }} className="text-sm mt-1">Add, edit, remove tables and manage availability</p>
          </div>
          <button
            onClick={openAdd}
            style={{ background: "var(--accent-maroon)", color: "var(--text-primary)" }}
            className="px-4 py-2.5 rounded-lg font-semibold text-sm hover:opacity-90"
          >
            + Add Table
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
          {[
            { label: "Total Tables", value: tables.length, color: "var(--accent-gold)" },
            { label: "Available", value: available, color: "var(--success)" },
            { label: "Occupied", value: occupied, color: "var(--danger)" },
          ].map((s) => (
            <div key={s.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }} className="rounded-xl p-4">
              <p style={{ color: "var(--text-muted)" }} className="text-xs mb-1">{s.label}</p>
              <p style={{ color: s.color }} className="text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Table Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p style={{ color: "var(--text-muted)" }} className="animate-pulse text-sm">Loading tables...</p>
          </div>
        ) : tables.length === 0 ? (
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }} className="rounded-xl p-12 text-center">
            <p className="text-4xl mb-3">🪑</p>
            <p style={{ color: "var(--text-muted)" }} className="text-sm">No tables added yet. Click &quot;+ Add Table&quot; to get started.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
            {tables.map((table) => (
              <div
                key={table.id}
                style={{
                  background: "var(--bg-card)",
                  border: `2px solid ${table.status === "available" ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"}`,
                  borderRadius: "16px",
                  padding: "20px",
                  position: "relative",
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p style={{ color: "var(--text-primary)", fontSize: "28px", fontWeight: 800, lineHeight: 1 }}>T{table.number}</p>
                    <p style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "4px" }}>{table.seats} seats</p>
                  </div>
                  <span
                    style={{
                      background: table.status === "available" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                      color: table.status === "available" ? "var(--success)" : "var(--danger)",
                      border: `1px solid ${table.status === "available" ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"}`,
                      borderRadius: "20px",
                      padding: "2px 8px",
                      fontSize: "11px",
                      fontWeight: 600,
                      textTransform: "capitalize",
                    }}
                  >
                    {table.status}
                  </span>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleToggleStatus(table)}
                    style={{
                      flex: 1,
                      background: table.status === "available" ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
                      color: table.status === "available" ? "var(--danger)" : "var(--success)",
                      border: `1px solid ${table.status === "available" ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`,
                      borderRadius: "8px",
                      padding: "6px 8px",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {table.status === "available" ? "Mark Occupied" : "Mark Available"}
                  </button>
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => openEdit(table)}
                    style={{
                      flex: 1,
                      background: "rgba(96,165,250,0.1)",
                      color: "#60A5FA",
                      border: "1px solid rgba(96,165,250,0.3)",
                      borderRadius: "8px",
                      padding: "5px 8px",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(table.id)}
                    style={{
                      flex: 1,
                      background: "rgba(239,68,68,0.08)",
                      color: "var(--danger)",
                      border: "1px solid rgba(239,68,68,0.25)",
                      borderRadius: "8px",
                      padding: "5px 8px",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div
          style={{ background: "rgba(0,0,0,0.7)" }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
        >
          <div
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "16px" }}
            className="w-full max-w-sm p-6 space-y-4"
          >
            <h3 style={{ color: "var(--text-primary)" }} className="font-bold text-lg">
              {editingTable ? "Edit Table" : "Add New Table"}
            </h3>
            <div className="space-y-3">
              <div>
                <label style={{ color: "var(--text-muted)", fontSize: "12px" }} className="block mb-1">Table Number</label>
                <input
                  style={inputStyle}
                  type="number"
                  min="1"
                  placeholder="e.g. 5"
                  value={form.number}
                  onChange={(e) => setForm((p) => ({ ...p, number: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ color: "var(--text-muted)", fontSize: "12px" }} className="block mb-1">Seats</label>
                <input
                  style={inputStyle}
                  type="number"
                  min="1"
                  max="20"
                  placeholder="e.g. 4"
                  value={form.seats}
                  onChange={(e) => setForm((p) => ({ ...p, seats: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowForm(false)}
                style={{ flex: 1, background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "10px", fontSize: "14px", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.number}
                style={{ flex: 1, background: "var(--accent-maroon)", color: "var(--text-primary)", border: "none", borderRadius: "10px", padding: "10px", fontSize: "14px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}
              >
                {saving ? "Saving..." : editingTable ? "Save Changes" : "Add Table"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

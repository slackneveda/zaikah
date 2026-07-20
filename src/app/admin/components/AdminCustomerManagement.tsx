"use client";

import { useState, useEffect, useCallback } from "react";

interface Customer {
  id: number;
  name: string;
  phone: string;
  address?: string | null;
  createdAt: string;
  _count?: { orders: number };
  lastOrderAt?: string | null;
}

export default function AdminCustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.append("search", search.trim());
    const res = await fetch(`/api/customers?${params}`);
    const data = await res.json();
    setCustomers(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers();
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
      <h2 style={{ color: "var(--text-primary)", fontSize: "20px", fontWeight: 700, marginBottom: "20px" }}>Customer Database</h2>

      {/* Search */}
      <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone..."
          style={{ flex: 1, background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-primary)", borderRadius: "10px", padding: "10px 14px", fontSize: "14px", outline: "none" }}
        />
        <button type="submit" style={{ background: "var(--accent-maroon)", color: "white", border: "none", borderRadius: "10px", padding: "10px 20px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Search</button>
        {search && <button type="button" onClick={() => { setSearch(""); fetchCustomers(); }} style={{ background: "none", border: "1px solid var(--border-color)", color: "var(--text-secondary)", borderRadius: "10px", padding: "10px 16px", fontSize: "13px", cursor: "pointer" }}>Clear</button>}
      </form>

      {loading ? (
        <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px" }}>Loading...</div>
      ) : customers.length === 0 ? (
        <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px" }}>No customers found</div>
      ) : (
        <>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "14px" }}>{customers.length} customer{customers.length !== 1 ? "s" : ""}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {customers.map((c) => (
              <div key={c.id} style={{ background: selected?.id === c.id ? "rgba(122,31,43,0.08)" : "var(--bg-card)", border: `1px solid ${selected?.id === c.id ? "var(--accent-maroon)" : "var(--border-color)"}`, borderRadius: "12px", padding: "14px 18px", cursor: "pointer" }}
                onClick={() => setSelected(selected?.id === c.id ? null : c)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "15px" }}>👤 {c.name}</span>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "3px" }}>
                      📞 {c.phone}
                      {c.address && <span style={{ marginLeft: "12px" }}>📍 {c.address}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", fontSize: "12px", color: "var(--text-muted)" }}>
                    <div>{c._count?.orders ?? 0} orders</div>
                    {c.lastOrderAt && <div>Last: {new Date(c.lastOrderAt).toLocaleDateString("en-PK")}</div>}
                    <div>Since: {new Date(c.createdAt).toLocaleDateString("en-PK")}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

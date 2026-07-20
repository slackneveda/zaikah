"use client";

import { useEffect, useState } from "react";

interface Stats {
  todayStats: {
    totalSales: number;
    completedOrders: number;
    takeawayOrders: number;
    dineInOrders: number;
  };
  dailyRevenue: { date: string; revenue: number }[];
  topItems: { name: string; quantity: number }[];
}

interface User { id: number; name: string; role: string; active: boolean; }
interface Category { id: number; name: string; items: { id: number }[]; }
interface Table { id: number; number: number; status: string; }

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/stats").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/tables").then((r) => r.json()),
    ]).then(([s, u, c, t]) => {
      setStats(s);
      setUsers(u);
      setCategories(c);
      setTables(t);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p style={{ color: "var(--text-muted)" }} className="animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  const today = stats?.todayStats;
  const totalMenuItems = categories.reduce((s, c) => s + c.items.length, 0);
  const availableTables = tables.filter((t) => t.status === "available").length;

  const summaryCards = [
    { label: "Today's Revenue", value: `Rs. ${(today?.totalSales ?? 0).toLocaleString()}`, icon: "💰", color: "#E8A33D", sub: `${today?.completedOrders ?? 0} orders completed` },
    { label: "Takeaway Orders", value: String(today?.takeawayOrders ?? 0), icon: "🛍️", color: "#60A5FA", sub: "Today" },
    { label: "Dine-In Orders", value: String(today?.dineInOrders ?? 0), icon: "🍽️", color: "#7A1F2B", sub: "Today" },
    { label: "Total Staff", value: String(users.length), icon: "👥", color: "#A855F7", sub: `${users.filter((u) => u.active).length} active` },
    { label: "Menu Items", value: String(totalMenuItems), icon: "📋", color: "#22c55e", sub: `${categories.length} categories` },
    { label: "Tables", value: String(tables.length), icon: "🪑", color: "#F97316", sub: `${availableTables} available` },
  ];

  return (
    <div className="flex-1 h-full overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 style={{ color: "var(--text-primary)" }} className="text-xl font-bold">Admin Dashboard</h2>
          <p style={{ color: "var(--text-muted)" }} className="text-sm mt-1">Complete business overview with full control</p>
        </div>

        {/* Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "32px" }}>
          {summaryCards.map((card) => (
            <div
              key={card.label}
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderLeft: `4px solid ${card.color}` }}
              className="rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{card.icon}</span>
                <span style={{ color: card.color }} className="text-xs font-semibold uppercase tracking-wider">Admin</span>
              </div>
              <p style={{ color: "var(--text-muted)" }} className="text-xs mb-1">{card.label}</p>
              <p style={{ color: "var(--text-primary)" }} className="text-2xl font-bold">{card.value}</p>
              <p style={{ color: "var(--text-muted)" }} className="text-xs mt-1">{card.sub}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          {/* Top Items */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }} className="rounded-xl p-5">
            <h3 style={{ color: "var(--text-primary)" }} className="font-semibold mb-4 text-sm">Top Selling Items</h3>
            {stats?.topItems && stats.topItems.length > 0 ? (
              <div className="space-y-2">
                {stats.topItems.slice(0, 8).map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span style={{ color: "var(--text-muted)", fontSize: "11px", width: "18px" }}>#{i + 1}</span>
                      <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{item.name}</span>
                    </div>
                    <span style={{ color: "var(--accent-gold)", fontSize: "12px", fontWeight: 700 }}>{item.quantity} sold</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)" }} className="text-sm text-center py-8">No sales data yet</p>
            )}
          </div>

          {/* Staff by Role */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }} className="rounded-xl p-5">
            <h3 style={{ color: "var(--text-primary)" }} className="font-semibold mb-4 text-sm">Staff by Role</h3>
            {["admin", "manager", "cashier"].map((role) => {
              const count = users.filter((u) => u.role === role).length;
              const active = users.filter((u) => u.role === role && u.active).length;
              const roleColors: Record<string, string> = { admin: "#E8A33D", manager: "#60A5FA", cashier: "#22c55e" };
              return (
                <div key={role} className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      style={{ background: `${roleColors[role]}20`, color: roleColors[role], border: `1px solid ${roleColors[role]}60`, borderRadius: "20px", padding: "2px 10px", fontSize: "12px", fontWeight: 600, textTransform: "capitalize" }}
                    >
                      {role}
                    </span>
                  </div>
                  <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>
                    {count} total <span style={{ color: "var(--text-muted)" }}>({active} active)</span>
                  </span>
                </div>
              );
            })}

            <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border-color)" }}>
              <h4 style={{ color: "var(--text-muted)" }} className="text-xs font-semibold uppercase mb-3">Table Status</h4>
              <div className="flex gap-4">
                <div>
                  <span style={{ color: "var(--success)", fontSize: "20px", fontWeight: 700 }}>{availableTables}</span>
                  <p style={{ color: "var(--text-muted)" }} className="text-xs">Available</p>
                </div>
                <div>
                  <span style={{ color: "var(--danger)", fontSize: "20px", fontWeight: 700 }}>{tables.length - availableTables}</span>
                  <p style={{ color: "var(--text-muted)" }} className="text-xs">Occupied</p>
                </div>
                <div>
                  <span style={{ color: "var(--accent-gold)", fontSize: "20px", fontWeight: 700 }}>{tables.length}</span>
                  <p style={{ color: "var(--text-muted)" }} className="text-xs">Total</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

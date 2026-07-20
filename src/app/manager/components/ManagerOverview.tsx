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

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  color: string;
}) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        borderLeft: `4px solid ${color}`,
      }}
      className="rounded-xl p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span style={{ color: color }} className="text-xs font-semibold uppercase tracking-wider">
          Today
        </span>
      </div>
      <p style={{ color: "var(--text-muted)" }} className="text-xs mb-1">
        {label}
      </p>
      <p style={{ color: "var(--text-primary)" }} className="text-2xl font-bold">
        {value}
      </p>
    </div>
  );
}

export default function ManagerOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => {
        setStats(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <p style={{ color: "var(--text-muted)" }} className="animate-pulse">
          Loading stats...
        </p>
      </div>
    );
  }

  const today = stats?.todayStats;

  return (
    <div className="flex-1 overflow-y-auto p-6 h-full">
      <h2 style={{ color: "var(--text-primary)" }} className="text-xl font-bold mb-6">
        Today&apos;s Overview
      </h2>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
        <StatCard
          label="Total Sales"
          value={`Rs. ${(today?.totalSales ?? 0).toLocaleString()}`}
          icon="💰"
          color="var(--accent-gold)"
        />
        <StatCard
          label="Completed Orders"
          value={String(today?.completedOrders ?? 0)}
          icon="✅"
          color="var(--success)"
        />
        <StatCard
          label="Takeaway Orders"
          value={String(today?.takeawayOrders ?? 0)}
          icon="🛍️"
          color="#3B82F6"
        />
        <StatCard
          label="Dine-In Orders"
          value={String(today?.dineInOrders ?? 0)}
          icon="🍽️"
          color="var(--accent-maroon)"
        />
      </div>

      {/* Weekly Revenue */}
      <div
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
        className="rounded-xl p-5 mb-6"
      >
        <h3 style={{ color: "var(--text-primary)" }} className="font-semibold mb-4">
          Daily Revenue (Last 7 Days)
        </h3>
        {stats?.dailyRevenue && stats.dailyRevenue.length > 0 ? (
          <div className="space-y-2">
            {stats.dailyRevenue.map((day) => {
              const max = Math.max(...stats.dailyRevenue.map((d) => d.revenue), 1);
              const pct = (day.revenue / max) * 100;
              const d = new Date(day.date + "T00:00:00");
              const label = d.toLocaleDateString("en-PK", { weekday: "short", day: "numeric", month: "short" });
              return (
                <div key={day.date} className="flex items-center gap-3">
                  <span style={{ color: "var(--text-muted)", width: "90px" }} className="text-xs text-right flex-shrink-0">
                    {label}
                  </span>
                  <div
                    style={{ background: "var(--bg-secondary)" }}
                    className="flex-1 rounded-full h-5 overflow-hidden"
                  >
                    <div
                      style={{
                        background: "var(--accent-maroon)",
                        width: `${pct}%`,
                        transition: "width 0.5s ease",
                      }}
                      className="h-full rounded-full"
                    />
                  </div>
                  <span style={{ color: "var(--accent-gold)", width: "80px" }} className="text-xs font-semibold text-right flex-shrink-0">
                    Rs. {day.revenue.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)" }} className="text-sm">
            No data available
          </p>
        )}
      </div>

      {/* Top Items */}
      <div
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
        className="rounded-xl p-5"
      >
        <h3 style={{ color: "var(--text-primary)" }} className="font-semibold mb-4">
          Top Selling Items
        </h3>
        {stats?.topItems && stats.topItems.length > 0 ? (
          <div className="space-y-2">
            {stats.topItems.map((item, i) => (
              <div key={item.name} className="flex items-center gap-3">
                <span
                  style={{
                    background: "var(--accent-maroon)",
                    color: "var(--text-primary)",
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: "bold",
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ color: "var(--text-primary)" }} className="flex-1 text-sm">
                  {item.name}
                </span>
                <span style={{ color: "var(--accent-gold)" }} className="text-sm font-bold">
                  {item.quantity} sold
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)" }} className="text-sm">
            No orders yet
          </p>
        )}
      </div>
    </div>
  );
}

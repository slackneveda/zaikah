"use client";

import { useEffect, useState, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

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

const CHART_COLORS = ["#7A1F2B", "#E8A33D", "#3B82F6", "#22c55e", "#A855F7"];

function todayStr() { return new Date().toISOString().slice(0, 10); }
function weekAgoStr() {
  const d = new Date(); d.setDate(d.getDate() - 6);
  return d.toISOString().slice(0, 10);
}

const inputStyle: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border-color)",
  color: "var(--text-primary)",
  borderRadius: "8px",
  padding: "6px 10px",
  fontSize: "13px",
  outline: "none",
};

export default function AdminSalesReports() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState(weekAgoStr());
  const [toDate, setToDate] = useState(todayStr());
  const [confirmReset, setConfirmReset] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stats?from=${fromDate}&to=${toDate}`);
      const d = await res.json();
      setStats(d);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [fromDate, toDate]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleReset = async () => {
    if (!confirmReset) { setConfirmReset(true); return; }
    await fetch("/api/orders/reset", { method: "DELETE" });
    setConfirmReset(false);
    fetchStats();
  };

  const handleExport = () => {
    if (!stats) return;
    const wb = XLSX.utils.book_new();
    const summaryRows = [
      { Metric: "Date Range", Value: `${fromDate} to ${toDate}` },
      { Metric: "Total Revenue (Rs.)", Value: stats.todayStats.totalSales },
      { Metric: "Total Orders", Value: stats.todayStats.completedOrders },
      { Metric: "Takeaway Orders", Value: stats.todayStats.takeawayOrders },
      { Metric: "Dine-In Orders", Value: stats.todayStats.dineInOrders },
    ];
    const ws1 = XLSX.utils.json_to_sheet(summaryRows);
    ws1["!cols"] = [{ wch: 28 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws1, "Summary");
    const revenueRows = stats.dailyRevenue.map((d) => ({ "Date": d.date, "Revenue (Rs.)": d.revenue }));
    const ws2 = XLSX.utils.json_to_sheet(revenueRows);
    ws2["!cols"] = [{ wch: 14 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, ws2, "Daily Revenue");
    const itemRows = stats.topItems.map((item, i) => ({ "Rank": i + 1, "Item Name": item.name, "Qty Sold": item.quantity }));
    const ws3 = XLSX.utils.json_to_sheet(itemRows);
    ws3["!cols"] = [{ wch: 6 }, { wch: 28 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws3, "Top Items");
    XLSX.writeFile(wb, `ZAIKAH_AdminReport_${fromDate}_to_${toDate}.xlsx`);
  };

  const revenueData = stats?.dailyRevenue.map((d) => ({
    name: new Date(d.date + "T00:00:00").toLocaleDateString("en-PK", { month: "short", day: "numeric" }),
    revenue: d.revenue,
  }));

  const orderTypeData = [
    { name: "Takeaway", value: stats?.todayStats.takeawayOrders ?? 0 },
    { name: "Dine-In", value: stats?.todayStats.dineInOrders ?? 0 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Top bar */}
      <div style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)", padding: "12px 16px", display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>From</span>
          <input type="date" value={fromDate} max={toDate} onChange={(e) => setFromDate(e.target.value)} style={inputStyle} />
          <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>To</span>
          <input type="date" value={toDate} min={fromDate} max={todayStr()} onChange={(e) => setToDate(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
          {stats && (
            <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>
              {stats.todayStats.completedOrders} orders&nbsp;|&nbsp;
              <span style={{ color: "var(--accent-gold)", fontWeight: 700 }}>Rs. {stats.todayStats.totalSales.toLocaleString()}</span>
            </span>
          )}
          <button onClick={handleExport} disabled={!stats} style={{ background: "var(--accent-maroon)", color: "var(--text-primary)", border: "none", borderRadius: "8px", padding: "7px 14px", fontSize: "12px", fontWeight: 600, cursor: stats ? "pointer" : "not-allowed", opacity: stats ? 1 : 0.5 }}>
            ⬇ Export Excel
          </button>
          <button onClick={handleReset} onMouseLeave={() => setConfirmReset(false)} style={{ background: confirmReset ? "rgba(239,68,68,0.85)" : "rgba(239,68,68,0.12)", color: confirmReset ? "#fff" : "var(--danger)", border: "1px solid rgba(239,68,68,0.5)", borderRadius: "8px", padding: "7px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
            {confirmReset ? "⚠ Confirm Reset All" : "🗑 Reset All Orders"}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
          <p style={{ color: "var(--text-muted)", fontSize: "13px" }} className="animate-pulse">Loading reports...</p>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {/* Summary KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
            {[
              { label: "Total Revenue", value: `Rs. ${(stats?.todayStats.totalSales ?? 0).toLocaleString()}`, color: "var(--accent-gold)" },
              { label: "Total Orders", value: String(stats?.todayStats.completedOrders ?? 0), color: "var(--success)" },
              { label: "Takeaway", value: String(stats?.todayStats.takeawayOrders ?? 0), color: "#60A5FA" },
              { label: "Dine-In", value: String(stats?.todayStats.dineInOrders ?? 0), color: "#f87171" },
            ].map((kpi) => (
              <div key={kpi.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }} className="rounded-xl p-4">
                <p style={{ color: "var(--text-muted)" }} className="text-xs mb-1">{kpi.label}</p>
                <p style={{ color: kpi.color }} className="text-xl font-bold">{kpi.value}</p>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
            {/* Revenue Bar */}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }} className="rounded-xl p-5">
              <h3 style={{ color: "var(--text-primary)" }} className="font-semibold mb-4 text-sm">Daily Revenue</h3>
              {revenueData?.some((d) => d.revenue > 0) ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={{ stroke: "var(--border-color)" }} />
                    <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={{ stroke: "var(--border-color)" }} />
                    <Tooltip contentStyle={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "8px", color: "var(--text-primary)" }} formatter={(v) => [`Rs. ${Number(v).toLocaleString()}`, "Revenue"]} />
                    <Bar dataKey="revenue" fill="var(--accent-maroon)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-40"><p style={{ color: "var(--text-muted)" }} className="text-sm">No revenue data</p></div>
              )}
            </div>

            {/* Pie */}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }} className="rounded-xl p-5">
              <h3 style={{ color: "var(--text-primary)" }} className="font-semibold mb-4 text-sm">Order Type Breakdown</h3>
              {orderTypeData.some((d) => d.value > 0) ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={orderTypeData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {orderTypeData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "8px", color: "var(--text-primary)" }} />
                    <Legend formatter={(v) => <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-40"><p style={{ color: "var(--text-muted)" }} className="text-sm">No orders in range</p></div>
              )}
            </div>
          </div>

          {/* Top Items */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }} className="rounded-xl p-5">
            <h3 style={{ color: "var(--text-primary)" }} className="font-semibold mb-4 text-sm">Top Selling Items</h3>
            {stats?.topItems && stats.topItems.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
                {stats.topItems.slice(0, 10).map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <div className="flex items-center gap-2">
                      <span style={{ color: "var(--text-muted)", fontSize: "11px", width: "20px", textAlign: "center" }}>#{i + 1}</span>
                      <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{item.name}</span>
                    </div>
                    <span style={{ color: "var(--accent-gold)", fontSize: "12px", fontWeight: 700 }}>{item.quantity} sold</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)" }} className="text-sm text-center py-8">No items sold in this range</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

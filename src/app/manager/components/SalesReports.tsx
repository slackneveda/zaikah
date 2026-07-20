"use client";

import { useEffect, useState, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
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

export default function SalesReports() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState(weekAgoStr());
  const [toDate, setToDate] = useState(todayStr());
  const [confirmReset, setConfirmReset] = useState(false);

  const handleReset = async () => {
    if (!confirmReset) { setConfirmReset(true); return; }
    await fetch("/api/orders/reset", { method: "DELETE" });
    setConfirmReset(false);
    fetchStats();
  };

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

  const handleExport = () => {
    if (!stats) return;
    const wb = XLSX.utils.book_new();

    // Sheet 1: Summary
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

    // Sheet 2: Daily Revenue
    const revenueRows = stats.dailyRevenue.map((d) => ({
      "Date": d.date,
      "Revenue (Rs.)": d.revenue,
    }));
    const ws2 = XLSX.utils.json_to_sheet(revenueRows);
    ws2["!cols"] = [{ wch: 14 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, ws2, "Daily Revenue");

    // Sheet 3: Top Items
    const itemRows = stats.topItems.map((item, i) => ({
      "Rank": i + 1,
      "Item Name": item.name,
      "Qty Sold": item.quantity,
    }));
    const ws3 = XLSX.utils.json_to_sheet(itemRows);
    ws3["!cols"] = [{ wch: 6 }, { wch: 28 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws3, "Top Items");

    XLSX.writeFile(wb, `ZAIKAH_SalesReport_${fromDate}_to_${toDate}.xlsx`);
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
      {/* Date range + export bar */}
      <div
        style={{
          background: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border-color)",
          padding: "12px 16px",
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>From</span>
          <input
            type="date"
            value={fromDate}
            max={toDate}
            onChange={(e) => setFromDate(e.target.value)}
            style={inputStyle}
          />
          <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>To</span>
          <input
            type="date"
            value={toDate}
            min={fromDate}
            max={todayStr()}
            onChange={(e) => setToDate(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
          {stats && (
            <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>
              {stats.todayStats.completedOrders} orders &nbsp;|&nbsp;
              <span style={{ color: "var(--accent-gold)", fontWeight: 700 }}>
                Rs. {stats.todayStats.totalSales.toLocaleString()}
              </span>
            </span>
          )}
          <button
            onClick={handleExport}
            disabled={!stats}
            style={{
              background: "var(--accent-maroon)",
              color: "var(--text-primary)",
              border: "none",
              borderRadius: "8px",
              padding: "7px 14px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: stats ? "pointer" : "not-allowed",
              opacity: stats ? 1 : 0.5,
            }}
          >
            ⬇ Export Excel
          </button>
          <button
            onClick={handleReset}
            onMouseLeave={() => setConfirmReset(false)}
            style={{
              background: confirmReset ? "rgba(239,68,68,0.85)" : "rgba(239,68,68,0.12)",
              color: confirmReset ? "#fff" : "var(--danger)",
              border: "1px solid rgba(239,68,68,0.5)",
              borderRadius: "8px",
              padding: "7px 14px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {confirmReset ? "⚠ Confirm Reset All" : "🗑 Reset All Orders"}
          </button>
        </div>
      </div>

      {/* Charts */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
          <p style={{ color: "var(--text-muted)", fontSize: "13px" }} className="animate-pulse">Loading reports...</p>
        </div>
      ) : (
      <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "24px" }}>
        {/* Daily Revenue Bar Chart */}
        <div
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
          className="rounded-xl p-5"
        >
          <h3 style={{ color: "var(--text-primary)" }} className="font-semibold mb-4 text-sm">
            Daily Revenue (Last 7 Days)
          </h3>
          {(revenueData?.some((d) => d.revenue > 0)) ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                  axisLine={{ stroke: "var(--border-color)" }}
                />
                <YAxis
                  tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                  axisLine={{ stroke: "var(--border-color)" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    color: "var(--text-primary)",
                  }}
                  formatter={(value) => [`Rs. ${Number(value).toLocaleString()}`, "Revenue"]}
                />
                <Bar dataKey="revenue" fill="var(--accent-maroon)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40">
              <p style={{ color: "var(--text-muted)" }} className="text-sm">
                No revenue data yet
              </p>
            </div>
          )}
        </div>

        {/* Order Type Breakdown */}
        <div
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
          className="rounded-xl p-5"
        >
          <h3 style={{ color: "var(--text-primary)" }} className="font-semibold mb-4 text-sm">
            Today&apos;s Order Breakdown
          </h3>
          {orderTypeData.some((d) => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={orderTypeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {orderTypeData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    color: "var(--text-primary)",
                  }}
                />
                <Legend
                  formatter={(value) => (
                    <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40">
              <p style={{ color: "var(--text-muted)" }} className="text-sm">
                No orders today
              </p>
            </div>
          )}
        </div>

        {/* Top Selling Items */}
        <div
          style={{ gridColumn: "1 / -1", background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "20px" }}
        >
          <h3 style={{ color: "var(--text-primary)" }} className="font-semibold mb-4 text-sm">
            Top 5 Selling Items (All Time)
          </h3>
          {stats?.topItems && stats.topItems.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.topItems} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis
                  type="number"
                  tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                  axisLine={{ stroke: "var(--border-color)" }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={140}
                  tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                  axisLine={{ stroke: "var(--border-color)" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    color: "var(--text-primary)",
                  }}
                  formatter={(value) => [`${Number(value)} sold`, "Quantity"]}
                />
                <Bar dataKey="quantity" fill="var(--accent-gold)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40">
              <p style={{ color: "var(--text-muted)" }} className="text-sm">
                No sales data yet
              </p>
            </div>
          )}
        </div>
      </div>
      </div>
      )}
    </div>
  );
}

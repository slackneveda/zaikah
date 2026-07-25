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

interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  notes?: string | null;
  department?: { name: string } | null;
}

interface Order {
  id: number;
  orderNumber: string;
  type: string;
  status: string;
  createdAt: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  cashReceived?: number | null;
  change?: number | null;
  notes?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  table?: { name: string } | null;
  customer?: { name: string; phone: string; address?: string | null } | null;
  orderTaker?: { name: string } | null;
  rider?: { name: string } | null;
  items: OrderItem[];
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

  const handleExport = async () => {
    if (!stats) return;

    // Fetch full order details for the date range
    let orders: Order[] = [];
    try {
      const res = await fetch(`/api/orders?from=${fromDate}&to=${toDate}&status=completed&limit=5000`);
      orders = await res.json();
    } catch { /* proceed without order details */ }

    const wb = XLSX.utils.book_new();

    // Sheet 1: Summary
    const summaryRows = [
      { Metric: "Restaurant", Value: "ZAIKAH ذائقہ" },
      { Metric: "Report Generated", Value: new Date().toLocaleString("en-PK") },
      { Metric: "Date Range", Value: `${fromDate} to ${toDate}` },
      { Metric: "", Value: "" },
      { Metric: "Total Revenue (Rs.)", Value: stats.todayStats.totalSales },
      { Metric: "Total Orders", Value: stats.todayStats.completedOrders },
      { Metric: "Takeaway Orders", Value: stats.todayStats.takeawayOrders },
      { Metric: "Dine-In Orders", Value: stats.todayStats.dineInOrders },
    ];
    const ws1 = XLSX.utils.json_to_sheet(summaryRows);
    ws1["!cols"] = [{ wch: 28 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, ws1, "Summary");

    // Sheet 2: All Orders (one row per order)
    if (orders.length > 0) {
      const orderRows = orders.map((o) => ({
        "Order #": o.orderNumber,
        "Date": new Date(o.createdAt).toLocaleDateString("en-PK"),
        "Time": new Date(o.createdAt).toLocaleTimeString("en-PK"),
        "Type": o.type,
        "Status": o.status,
        "Table": o.table?.name ?? (o.type === "dine-in" ? "(no table linked)" : ""),
        "Customer Name": o.customerName ?? o.customer?.name ?? "",
        "Customer Phone": o.customerPhone ?? o.customer?.phone ?? "",
        "Customer Address": o.customerAddress ?? o.customer?.address ?? "",
        "Order Taker": o.orderTaker?.name ?? "",
        "Rider": o.rider?.name ?? "",
        "Items Count": o.items.reduce((sum, i) => sum + i.quantity, 0),
        "Subtotal (Rs.)": o.subtotal,
        "Discount (Rs.)": o.discount,
        "Tax (Rs.)": o.tax,
        "Total (Rs.)": o.total,
        "Cash Received (Rs.)": o.cashReceived ?? "",
        "Change (Rs.)": o.change ?? "",
        "Notes": o.notes ?? "",
      }));
      const ws2 = XLSX.utils.json_to_sheet(orderRows);
      ws2["!cols"] = [
        { wch: 18 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
        { wch: 10 }, { wch: 20 }, { wch: 16 }, { wch: 28 },
        { wch: 18 }, { wch: 16 }, { wch: 12 },
        { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 12 },
        { wch: 16 }, { wch: 12 }, { wch: 24 },
      ];
      XLSX.utils.book_append_sheet(wb, ws2, "All Orders");

      // Sheet 3: Order Items Detail (one row per item)
      const itemDetailRows = orders.flatMap((o) =>
        o.items.map((item) => ({
          "Order #": o.orderNumber,
          "Date": new Date(o.createdAt).toLocaleDateString("en-PK"),
          "Time": new Date(o.createdAt).toLocaleTimeString("en-PK"),
          "Order Type": o.type,
          "Table": o.table?.name ?? (o.type === "dine-in" ? "(no table linked)" : ""),
          "Customer": o.customerName ?? o.customer?.name ?? "",
          "Item Name": item.name,
          "Department": item.department?.name ?? "",
          "Unit Price (Rs.)": item.price,
          "Qty": item.quantity,
          "Item Total (Rs.)": item.subtotal,
          "Item Notes": item.notes ?? "",
          "Order Total (Rs.)": o.total,
        }))
      );
      const ws3 = XLSX.utils.json_to_sheet(itemDetailRows);
      ws3["!cols"] = [
        { wch: 18 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
        { wch: 20 }, { wch: 28 }, { wch: 16 }, { wch: 16 },
        { wch: 6 }, { wch: 16 }, { wch: 20 }, { wch: 14 },
      ];
      XLSX.utils.book_append_sheet(wb, ws3, "Order Items Detail");
    }

    // Sheet 4: Daily Revenue
    const revenueRows = stats.dailyRevenue.map((d) => ({
      "Date": d.date,
      "Revenue (Rs.)": d.revenue,
    }));
    const ws4 = XLSX.utils.json_to_sheet(revenueRows);
    ws4["!cols"] = [{ wch: 14 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, ws4, "Daily Revenue");

    // Sheet 5: Top Selling Items
    const itemRows = stats.topItems.map((item, i) => ({
      "Rank": i + 1,
      "Item Name": item.name,
      "Qty Sold": item.quantity,
    }));
    const ws5 = XLSX.utils.json_to_sheet(itemRows);
    ws5["!cols"] = [{ wch: 6 }, { wch: 28 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws5, "Top Items");

    XLSX.writeFile(wb, `ZAIKAH_Report_${fromDate}_to_${toDate}.xlsx`);
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

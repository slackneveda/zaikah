"use client";

import React, { useEffect, useState, useCallback } from "react";
import * as XLSX from "xlsx";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface Order {
  id: number;
  orderNumber: string;
  type: string;
  status: string;
  total: number;
  createdAt: string;
  table: { number: number } | null;
  items: OrderItem[];
}

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

export default function AdminOrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [fromDate, setFromDate] = useState(weekAgoStr());
  const [toDate, setToDate] = useState(todayStr());
  const [confirmReset, setConfirmReset] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders?from=${fromDate}&to=${toDate}&limit=1000`);
      const data = await res.json();
      setOrders(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [fromDate, toDate]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm("Delete this order permanently?")) return;
    await fetch(`/api/orders/${id}`, { method: "DELETE" });
    setOrders((prev) => prev.filter((o) => o.id !== id));
  };

  const handleReset = async () => {
    if (!confirmReset) { setConfirmReset(true); return; }
    await fetch("/api/orders/reset", { method: "DELETE" });
    setOrders([]);
    setConfirmReset(false);
  };

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.items.some((i) => i.name.toLowerCase().includes(search.toLowerCase()));
    const matchType = typeFilter === "all" || o.type === typeFilter;
    return matchSearch && matchType;
  });

  const totalRevenue = filtered.reduce((s, o) => s + o.total, 0);
  const takeawayCount = filtered.filter((o) => o.type === "takeaway").length;
  const dineInCount = filtered.filter((o) => o.type === "dine-in").length;

  const handleExport = () => {
    const rows: Record<string, string | number>[] = [];
    filtered.forEach((order) => {
      const d = new Date(order.createdAt);
      const dateStr = d.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
      const timeStr = d.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", hour12: true });
      order.items.forEach((item) => {
        rows.push({
          "Order #": order.orderNumber,
          "Date": dateStr,
          "Time": timeStr,
          "Type": order.type === "takeaway" ? "Takeaway" : `Dine-In (Table ${order.table?.number ?? "-"})`,
          "Item Name": item.name,
          "Qty": item.quantity,
          "Unit Price (Rs.)": item.price,
          "Subtotal (Rs.)": item.subtotal,
          "Order Total (Rs.)": order.total,
          "Status": order.status,
        });
      });
    });
    rows.push({});
    rows.push({ "Order #": "GRAND TOTAL", "Order Total (Rs.)": totalRevenue });
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 18 }, { wch: 14 }, { wch: 10 }, { wch: 22 }, { wch: 26 }, { wch: 6 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 12 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Order History");
    XLSX.writeFile(wb, `ZAIKAH_AdminOrders_${fromDate}_to_${toDate}.xlsx`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Filters bar */}
      <div style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)", padding: "12px 16px", display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>From</span>
          <input type="date" value={fromDate} max={toDate} onChange={(e) => setFromDate(e.target.value)} style={inputStyle} />
          <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>To</span>
          <input type="date" value={toDate} min={fromDate} max={todayStr()} onChange={(e) => setToDate(e.target.value)} style={inputStyle} />
        </div>

        <input
          type="text"
          placeholder="Search orders or items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: "160px" }}
        />

        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={inputStyle}>
          <option value="all">All Types</option>
          <option value="takeaway">Takeaway</option>
          <option value="dine-in">Dine-In</option>
        </select>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginLeft: "auto" }}>
          <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>
            {filtered.length} orders ({takeawayCount} TW · {dineInCount} DI)&nbsp;|&nbsp;
            <span style={{ color: "var(--accent-gold)", fontWeight: 700 }}>Rs. {totalRevenue.toLocaleString()}</span>
          </span>
          <button
            onClick={handleExport}
            style={{ background: "var(--accent-maroon)", color: "var(--text-primary)", border: "none", borderRadius: "8px", padding: "7px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
          >
            ⬇ Export Excel
          </button>
          <button
            onClick={handleReset}
            onMouseLeave={() => setConfirmReset(false)}
            style={{ background: confirmReset ? "rgba(239,68,68,0.85)" : "rgba(239,68,68,0.12)", color: confirmReset ? "#fff" : "var(--danger)", border: "1px solid rgba(239,68,68,0.5)", borderRadius: "8px", padding: "7px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
          >
            {confirmReset ? "⚠ Confirm Reset All" : "🗑 Reset All Orders"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "160px" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "13px" }} className="animate-pulse">Loading orders...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "160px" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>No orders found</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "var(--bg-secondary)", position: "sticky", top: 0, zIndex: 1 }}>
                {["Order #", "Date & Time", "Type", "Items", "Total", "Status", ""].map((h) => (
                  <th key={h} style={{ color: "var(--text-muted)", textAlign: "left", padding: "10px 16px", fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--border-color)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => {
                const isExp = expanded === order.id;
                const d = new Date(order.createdAt);
                return (
                  <React.Fragment key={order.id}>
                    <tr
                      onClick={() => setExpanded(isExp ? null : order.id)}
                      style={{ borderBottom: "1px solid var(--border-color)", background: isExp ? "var(--bg-card)" : "transparent", cursor: "pointer" }}
                      onMouseEnter={(e) => { if (!isExp) (e.currentTarget as HTMLTableRowElement).style.background = "rgba(46,54,86,0.5)"; }}
                      onMouseLeave={(e) => { if (!isExp) (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                    >
                      <td style={{ padding: "10px 16px" }}>
                        <span style={{ color: "var(--accent-gold)", fontFamily: "monospace", fontWeight: 700 }}>{order.orderNumber}</span>
                      </td>
                      <td style={{ padding: "10px 16px", color: "var(--text-secondary)", fontSize: "12px" }}>
                        {d.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })}
                        <br />
                        <span style={{ color: "var(--text-muted)" }}>{d.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", hour12: true })}</span>
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        <span style={{ background: order.type === "takeaway" ? "rgba(59,130,246,0.15)" : "rgba(122,31,43,0.15)", color: order.type === "takeaway" ? "#60A5FA" : "#f87171", border: `1px solid ${order.type === "takeaway" ? "rgba(59,130,246,0.4)" : "rgba(248,113,113,0.4)"}`, borderRadius: "20px", padding: "2px 10px", fontSize: "11px", fontWeight: 600 }}>
                          {order.type === "takeaway" ? "🛍️ Takeaway" : `🍽️ Table ${order.table?.number ?? "-"}`}
                        </span>
                      </td>
                      <td style={{ padding: "10px 16px", color: "var(--text-secondary)" }}>{order.items.length} item{order.items.length !== 1 ? "s" : ""}</td>
                      <td style={{ padding: "10px 16px", color: "var(--accent-gold)", fontWeight: 700 }}>Rs. {order.total.toLocaleString()}</td>
                      <td style={{ padding: "10px 16px" }}>
                        <span style={{ color: "var(--success)", background: "rgba(34,197,94,0.1)", borderRadius: "20px", padding: "2px 10px", fontSize: "11px" }}>✓ {order.status}</span>
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", whiteSpace: "nowrap" }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleDelete(e, order.id)}
                          style={{ background: "rgba(239,68,68,0.1)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "6px", padding: "4px 10px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                    {isExp && (
                      <tr style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border-color)" }}>
                        <td colSpan={7} style={{ padding: "0 16px 12px 40px" }}>
                          <table style={{ width: "100%", fontSize: "12px", marginTop: "8px" }}>
                            <thead>
                              <tr>
                                {["Item", "Qty", "Unit Price", "Subtotal"].map((h) => (
                                  <th key={h} style={{ color: "var(--text-muted)", textAlign: "left", padding: "4px 8px", fontWeight: 600, fontSize: "11px" }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {order.items.map((item, i) => (
                                <tr key={i}>
                                  <td style={{ color: "var(--text-secondary)", padding: "4px 8px" }}>{item.name}</td>
                                  <td style={{ color: "var(--text-muted)", padding: "4px 8px" }}>×{item.quantity}</td>
                                  <td style={{ color: "var(--text-muted)", padding: "4px 8px" }}>Rs. {item.price.toLocaleString()}</td>
                                  <td style={{ color: "var(--accent-gold)", padding: "4px 8px", fontWeight: 600 }}>Rs. {item.subtotal.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

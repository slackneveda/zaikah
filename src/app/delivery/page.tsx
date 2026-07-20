"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import MenuGrid from "@/components/MenuGrid";
import OrderPanel from "@/components/OrderPanel";
import { useOrderStore } from "@/store/orderStore";
import { useAuthGuard } from "@/lib/useAuthGuard";

interface Customer {
  id: number;
  name: string;
  phone: string;
  address?: string | null;
}

interface Rider {
  id: number;
  name: string;
  phone?: string | null;
}

interface OrderTaker {
  id: number;
  name: string;
}

interface DeliveryOrder {
  id: number;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  customerName?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  notes?: string | null;
  rider?: { id: number; name: string } | null;
  orderTaker?: { id: number; name: string } | null;
  items: { id: number; name: string; quantity: number; price: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  preparing: "#3b82f6",
  ready: "#a855f7",
  out_for_delivery: "#06b6d4",
  completed: "#22c55e",
  cancelled: "#ef4444",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  preparing: "Preparing",
  ready: "Ready",
  out_for_delivery: "Out for Delivery",
  completed: "Delivered",
  cancelled: "Cancelled",
};

const NEXT_STATUS: Record<string, string> = {
  pending: "preparing",
  preparing: "ready",
  ready: "out_for_delivery",
  out_for_delivery: "completed",
};

type View = "list" | "new-order";

export default function DeliveryPage() {
  const [view, setView] = useState<View>("list");
  useAuthGuard("delivery");
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [orderTakers, setOrderTakers] = useState<OrderTaker[]>([]);
  const [filter, setFilter] = useState<string>("active");

  // New order form
  const [phone, setPhone] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [custName, setCustName] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [selectedRider, setSelectedRider] = useState<number | null>(null);
  const [selectedOrderTaker, setSelectedOrderTaker] = useState<number | null>(null);
  const [lookingUp, setLookingUp] = useState(false);

  // Assign rider modal
  const [assignOrderId, setAssignOrderId] = useState<number | null>(null);
  const [assignRiderId, setAssignRiderId] = useState<number | null>(null);

  const { setOrderType, clearCart } = useOrderStore();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: "delivery" });
      // For "active" we fetch all and filter client-side; otherwise filter by status
      if (filter !== "active" && filter !== "all") {
        params.append("status", filter);
      }
      const res = await fetch(`/api/orders?${params}`);
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchOrders();
    fetch("/api/riders").then((r) => r.json()).then(setRiders).catch(() => {});
    fetch("/api/order-takers").then((r) => r.json()).then(setOrderTakers).catch(() => {});
    setOrderType("delivery");
  }, [fetchOrders, setOrderType]);

  const handlePhoneLookup = useCallback(async () => {
    if (!phone.trim()) return;
    setLookingUp(true);
    try {
      const res = await fetch(`/api/customers?phone=${encodeURIComponent(phone.trim())}`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setCustomer(data);
          setCustName(data.name);
          setCustAddress(data.address || "");
        } else {
          setCustomer(null);
          setCustName("");
          setCustAddress("");
        }
      }
    } finally {
      setLookingUp(false);
    }
  }, [phone]);

  const handleStartOrder = useCallback(() => {
    clearCart();
    setView("new-order");
  }, [clearCart]);

  const handleOrderComplete = useCallback(async (orderId: number) => {
    // After order created/completed, save or update customer
    if (phone.trim() && custName.trim()) {
      const body: Record<string, string> = { phone: phone.trim(), name: custName.trim() };
      if (custAddress.trim()) body.address = custAddress.trim();
      if (customer) {
        await fetch(`/api/customers/${customer.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }).catch(() => {});
      } else {
        await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }).catch(() => {});
      }
    }
    // Change order status to preparing (it was placed as completed - but delivery starts as "pending" or "preparing")
    // Actually we want it to be "pending" for tracking — the POST route handles status
    void orderId;
    clearCart();
    setView("list");
    await fetchOrders();
  }, [phone, custName, custAddress, customer, clearCart, fetchOrders]);

  const handleStatusChange = async (order: DeliveryOrder, newStatus: string) => {
    if (newStatus === "out_for_delivery" && !order.rider && !assignRiderId) {
      setAssignOrderId(order.id);
      return;
    }
    await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    await fetchOrders();
  };

  const handleAssignRider = async () => {
    if (!assignOrderId || !assignRiderId) return;
    await fetch(`/api/orders/${assignOrderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ riderId: assignRiderId, status: "out_for_delivery" }),
    });
    setAssignOrderId(null);
    setAssignRiderId(null);
    await fetchOrders();
  };

  const handleCancel = async (orderId: number) => {
    if (!confirm("Cancel this order?")) return;
    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    await fetchOrders();
  };

  if (view === "new-order") {
    return (
      <div style={{ background: "var(--bg-primary)" }} className="flex flex-col h-screen">
        <Navbar title="New Delivery Order" onBack={() => { clearCart(); setView("list"); }}>
          <span style={{ background: "rgba(6,182,212,0.1)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.3)", borderRadius: "20px", padding: "3px 10px", fontSize: "12px", fontWeight: 700 }}>🛵 Delivery</span>
        </Navbar>
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            <MenuGrid />
          </div>
          <div className="w-80 xl:w-96 shrink-0 overflow-y-auto" style={{ background: "var(--bg-card)", borderLeft: "1px solid var(--border-color)" }}>
            {/* Customer info section */}
            <div style={{ padding: "14px", borderBottom: "1px solid var(--border-color)" }}>
              <h3 style={{ color: "var(--text-primary)", fontSize: "14px", fontWeight: 700, marginBottom: "10px" }}>Customer Info</h3>
              <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePhoneLookup()}
                  placeholder="Phone number"
                  style={{ flex: 1, background: "var(--bg-secondary)", border: "1px solid var(--border-color)", color: "var(--text-primary)", borderRadius: "8px", padding: "8px 10px", fontSize: "13px", outline: "none" }}
                />
                <button onClick={handlePhoneLookup} disabled={lookingUp} style={{ background: "var(--accent-maroon)", color: "white", border: "none", borderRadius: "8px", padding: "8px 12px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                  {lookingUp ? "..." : "Lookup"}
                </button>
              </div>
              {customer && (
                <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "8px", padding: "8px 10px", marginBottom: "8px", fontSize: "12px", color: "var(--success)" }}>
                  ✓ Returning customer: {customer.name}
                </div>
              )}
              <input
                value={custName}
                onChange={(e) => setCustName(e.target.value)}
                placeholder="Customer name *"
                style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", color: "var(--text-primary)", borderRadius: "8px", padding: "8px 10px", fontSize: "13px", outline: "none", marginBottom: "8px" }}
              />
              <input
                value={custAddress}
                onChange={(e) => setCustAddress(e.target.value)}
                placeholder="Delivery address"
                style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", color: "var(--text-primary)", borderRadius: "8px", padding: "8px 10px", fontSize: "13px", outline: "none", marginBottom: "8px" }}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <select
                  value={selectedRider ?? ""}
                  onChange={(e) => setSelectedRider(e.target.value ? parseInt(e.target.value) : null)}
                  style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", color: "var(--text-secondary)", borderRadius: "8px", padding: "7px 8px", fontSize: "12px", outline: "none" }}
                >
                  <option value="">Assign Rider</option>
                  {riders.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <select
                  value={selectedOrderTaker ?? ""}
                  onChange={(e) => setSelectedOrderTaker(e.target.value ? parseInt(e.target.value) : null)}
                  style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", color: "var(--text-secondary)", borderRadius: "8px", padding: "7px 8px", fontSize: "12px", outline: "none" }}
                >
                  <option value="">Order Taker</option>
                  {orderTakers.map((ot) => <option key={ot.id} value={ot.id}>{ot.name}</option>)}
                </select>
              </div>
            </div>
            <OrderPanel
              onOrderComplete={handleOrderComplete}
              orderTakerId={selectedOrderTaker}
              riderId={selectedRider}
              customerId={customer?.id}
              customerName={custName || undefined}
              customerPhone={phone || undefined}
              customerAddress={custAddress || undefined}
            />
          </div>
        </div>
      </div>
    );
  }

  const activeStatuses = ["pending", "preparing", "ready", "out_for_delivery"];
  const displayedOrders = filter === "active"
    ? orders.filter((o) => activeStatuses.includes(o.status))
    : orders;

  return (
    <div style={{ background: "var(--bg-primary)" }} className="flex flex-col h-screen">
      <Navbar title="Home Delivery" backHref="/">
        <button
          onClick={handleStartOrder}
          style={{ background: "var(--accent-maroon)", color: "white", border: "none", borderRadius: "8px", padding: "6px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
        >
          + New Order
        </button>
      </Navbar>

      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* Filter bar */}
        <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {[["active", "Active Orders"], ["all", "All Orders"], ["completed", "Delivered"], ["cancelled", "Cancelled"]].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              style={{
                background: filter === val ? "var(--accent-maroon)" : "var(--bg-card)",
                color: filter === val ? "white" : "var(--text-secondary)",
                border: `1px solid ${filter === val ? "var(--accent-maroon)" : "var(--border-color)"}`,
                borderRadius: "20px",
                padding: "5px 14px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
          <button onClick={fetchOrders} style={{ marginLeft: "auto", background: "none", border: "1px solid var(--border-color)", color: "var(--text-muted)", borderRadius: "8px", padding: "5px 12px", fontSize: "12px", cursor: "pointer" }}>
            🔄 Refresh
          </button>
        </div>

        {/* Orders list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px", color: "var(--text-muted)" }}>Loading...</div>
          ) : displayedOrders.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "200px", gap: "10px" }}>
              <span style={{ fontSize: "40px", opacity: 0.2 }}>🛵</span>
              <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>No delivery orders</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "900px" }}>
              {displayedOrders.map((order) => {
                const statusColor = STATUS_COLORS[order.status] || "#888";
                const nextStatus = NEXT_STATUS[order.status];
                return (
                  <div key={order.id} style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "16px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "15px" }}>#{order.orderNumber}</span>
                          <span style={{ background: `${statusColor}20`, color: statusColor, border: `1px solid ${statusColor}60`, borderRadius: "20px", padding: "2px 10px", fontSize: "11px", fontWeight: 700 }}>
                            {STATUS_LABELS[order.status] || order.status}
                          </span>
                        </div>
                        <div style={{ marginTop: "4px", fontSize: "12px", color: "var(--text-muted)" }}>
                          {new Date(order.createdAt).toLocaleString("en-PK", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true })}
                        </div>
                      </div>
                      <span style={{ color: "var(--accent-gold)", fontWeight: 700, fontSize: "16px" }}>Rs. {order.total?.toFixed(0) ?? "0"}</span>
                    </div>

                    {/* Customer info */}
                    {(order.customerName || order.customerPhone) && (
                      <div style={{ background: "var(--bg-secondary)", borderRadius: "8px", padding: "8px 12px", marginBottom: "10px", fontSize: "12px" }}>
                        {order.customerName && <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>👤 {order.customerName}</div>}
                        {order.customerPhone && <div style={{ color: "var(--text-secondary)" }}>📞 {order.customerPhone}</div>}
                        {order.customerAddress && <div style={{ color: "var(--text-secondary)" }}>📍 {order.customerAddress}</div>}
                        {order.notes && <div style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Note: {order.notes}</div>}
                      </div>
                    )}

                    {/* Items */}
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "10px" }}>
                      {order.items.map((item, i) => (
                        <span key={item.id}>{item.name} x{item.quantity}{i < order.items.length - 1 ? ", " : ""}</span>
                      ))}
                    </div>

                    {/* Rider & Order Taker */}
                    <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "var(--text-muted)", marginBottom: "10px" }}>
                      {order.rider && <span>🛵 {order.rider.name}</span>}
                      {order.orderTaker && <span>👤 {order.orderTaker.name}</span>}
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {nextStatus && (
                        <button
                          onClick={() => handleStatusChange(order, nextStatus)}
                          style={{ background: `${STATUS_COLORS[nextStatus] ?? "#888"}22`, color: STATUS_COLORS[nextStatus] ?? "#888", border: `1px solid ${STATUS_COLORS[nextStatus] ?? "#888"}60`, borderRadius: "8px", padding: "6px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                        >
                          → {STATUS_LABELS[nextStatus] || nextStatus}
                        </button>
                      )}
                      {!order.rider && order.status !== "completed" && order.status !== "cancelled" && (
                        <button
                          onClick={() => setAssignOrderId(order.id)}
                          style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.4)", borderRadius: "8px", padding: "6px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                        >
                          🛵 Assign Rider
                        </button>
                      )}
                      {order.status !== "completed" && order.status !== "cancelled" && (
                        <button
                          onClick={() => handleCancel(order.id)}
                          style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "6px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                        >
                          ✕ Cancel
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Assign Rider Modal */}
      {assignOrderId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "28px", width: "360px" }}>
            <h3 style={{ color: "var(--text-primary)", fontSize: "18px", fontWeight: 700, marginBottom: "16px" }}>Assign Rider</h3>
            <select
              value={assignRiderId ?? ""}
              onChange={(e) => setAssignRiderId(e.target.value ? parseInt(e.target.value) : null)}
              style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", color: "var(--text-primary)", borderRadius: "8px", padding: "10px", fontSize: "14px", outline: "none", marginBottom: "16px" }}
            >
              <option value="">Select rider...</option>
              {riders.map((r) => <option key={r.id} value={r.id}>{r.name}{r.phone ? ` — ${r.phone}` : ""}</option>)}
            </select>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => { setAssignOrderId(null); setAssignRiderId(null); }} style={{ flex: 1, background: "none", border: "1px solid var(--border-color)", color: "var(--text-secondary)", borderRadius: "8px", padding: "10px", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleAssignRider} disabled={!assignRiderId} style={{ flex: 1, background: "var(--accent-maroon)", color: "white", border: "none", borderRadius: "8px", padding: "10px", fontWeight: 700, cursor: assignRiderId ? "pointer" : "not-allowed", opacity: assignRiderId ? 1 : 0.5 }}>Assign & Dispatch</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import MenuGrid from "@/components/MenuGrid";
import OrderPanel from "@/components/OrderPanel";
import { useOrderStore, type CartItem } from "@/store/orderStore";
import { useAuthGuard } from "@/lib/useAuthGuard";

interface TableOrder {
  id: number;
  orderNumber: string;
  status: string;
  total: number;
  items: { id: number; name: string; quantity: number; price: number; department?: { id: number; name: string } | null }[];
  orderTaker?: { id: number; name: string } | null;
}

interface TakeawaySlot {
  id: number;
  name: string;
  tableType: string;
  seats: number;
  status: string;
  activeOrderId: number | null;
  orders?: TableOrder[];
}

interface OrderTaker {
  id: number;
  name: string;
}

export default function TakeawayPage() {
  useAuthGuard("takeaway");
  const [slots, setSlots] = useState<TakeawaySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TakeawaySlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [existingOrder, setExistingOrder] = useState<TableOrder | null>(null);
  const [orderTakers, setOrderTakers] = useState<OrderTaker[]>([]);
  const [selectedOrderTaker, setSelectedOrderTaker] = useState<number | null>(null);
  const [savedCarts, setSavedCarts] = useState<Record<number, CartItem[]>>({});
  const { setOrderType, setTable, clearCart, loadOrder, items: cartItems } = useOrderStore();

  const fetchSlots = useCallback(async () => {
    try {
      const res = await fetch("/api/tables?type=takeaway");
      const data = await res.json();
      setSlots(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    fetchSlots();
    setOrderType("takeaway");
    fetch("/api/order-takers").then((r) => r.json()).then(setOrderTakers).catch(() => {});
  }, [fetchSlots, setOrderType]);

  const handleSelectSlot = async (slot: TakeawaySlot) => {
    setOrderType("takeaway");
    setTable(slot.id, slot.name);

    if (slot.status === "occupied" && slot.orders && slot.orders.length > 0) {
      const order = slot.orders[0];
      setExistingOrder(order);
      loadOrder(order.items.map((i) => ({ id: i.id, menuItemId: i.id, name: i.name, price: i.price, quantity: i.quantity, departmentId: i.department?.id, departmentName: i.department?.name })));
      setSelectedOrderTaker(order.orderTaker?.id ?? null);
    } else {
      setExistingOrder(null);
      setSelectedOrderTaker(null);
      // Restore unsaved cart items if user previously backed out of this slot
      const saved = savedCarts[slot.id];
      if (saved && saved.length > 0) {
        loadOrder(saved);
      } else {
        clearCart();
        // Re-apply slot after clearCart (clearCart resets tableName to null)
        setTable(slot.id, slot.name);
        // Mark as occupied only on first entry
        await fetch(`/api/tables/${slot.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "occupied" }),
        });
        setSlots((prev) => prev.map((s) => s.id === slot.id ? { ...s, status: "occupied" } : s));
      }
    }
    setSelectedSlot({ ...slot });
  };

  const handleOrderComplete = () => {
    if (selectedSlot) {
      setSavedCarts((prev) => { const next = { ...prev }; delete next[selectedSlot.id]; return next; });
    }
    setSelectedSlot(null);
    setExistingOrder(null);
    fetchSlots();
  };

  // Called when customer wants to add more items after an order is placed
  const handleAddMoreItems = (orderId: number, orderNumber: string) => {
    setExistingOrder({ id: orderId, orderNumber, status: "completed", total: 0, items: [] });
    // Re-apply the slot so tableName is preserved in the store after clearCart
    if (selectedSlot) {
      setTable(selectedSlot.id, selectedSlot.name);
    }
  };

  // Back: save cart state and return to slot list WITHOUT releasing the slot
  const handleBackSlot = () => {
    if (selectedSlot && cartItems.length > 0 && !existingOrder) {
      setSavedCarts((prev) => ({ ...prev, [selectedSlot.id]: [...cartItems] }));
    }
    setSelectedSlot(null);
    setExistingOrder(null);
    fetchSlots();
  };

  // Release Slot: marks slot available, clears everything, goes back to slot selector
  const handleReleaseSlot = async () => {
    if (selectedSlot) {
      setSavedCarts((prev) => { const next = { ...prev }; delete next[selectedSlot.id]; return next; });
      await fetch(`/api/tables/${selectedSlot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "available", activeOrderId: null }),
      }).catch(() => {});
    }
    clearCart();
    setSelectedSlot(null);
    setExistingOrder(null);
    fetchSlots();
  };

  // Manual reset: mark slot available and cancel active order
  const handleResetSlot = async (slot: TakeawaySlot, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Reset ${slot.name}? This will cancel the active order and free the slot.`)) return;
    if (slot.activeOrderId) {
      await fetch(`/api/orders/${slot.activeOrderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      }).catch(() => {});
    }
    await fetch(`/api/tables/${slot.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "available", activeOrderId: null }),
    });
    setSavedCarts((prev) => { const next = { ...prev }; delete next[slot.id]; return next; });
    clearCart();
    fetchSlots();
  };

  if (selectedSlot) {
    return (
      <div style={{ background: "var(--bg-primary)" }} className="flex flex-col h-screen">
        <Navbar title="Takeaway Order" onBack={handleBackSlot}>
          <span style={{ background: "rgba(122,31,43,0.15)", color: "var(--accent-maroon-light)", border: "1px solid var(--accent-maroon)", borderRadius: "20px", padding: "3px 10px", fontSize: "12px", fontWeight: 700 }}>
            🥡 {selectedSlot.name}
          </span>
          {existingOrder && (
            <span style={{ background: "rgba(232,163,61,0.1)", color: "var(--accent-gold)", border: "1px solid rgba(232,163,61,0.4)", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 600 }}>
              #{existingOrder.orderNumber}
            </span>
          )}
          <select
            value={selectedOrderTaker ?? ""}
            onChange={(e) => setSelectedOrderTaker(e.target.value ? parseInt(e.target.value) : null)}
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-secondary)", borderRadius: "8px", padding: "4px 8px", fontSize: "12px", outline: "none" }}
          >
            <option value="">No Order Taker</option>
            {orderTakers.map((ot) => (
              <option key={ot.id} value={ot.id}>{ot.name}</option>
            ))}
          </select>
          <button onClick={handleReleaseSlot} style={{ color: "var(--danger)", fontSize: "12px", background: "none", border: "none", cursor: "pointer" }}>
            Release Slot
          </button>
        </Navbar>
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            <MenuGrid />
          </div>
          <div className="w-72 xl:w-80 shrink-0">
            <OrderPanel
              onOrderComplete={handleOrderComplete}
              onAddMoreItems={handleAddMoreItems}
              orderTakerId={selectedOrderTaker}
              orderTakerName={orderTakers.find((ot) => ot.id === selectedOrderTaker)?.name ?? null}
              existingOrderId={existingOrder?.id}
            />
          </div>
        </div>
      </div>
    );
  }

  const sortedSlots = [...slots].sort((a, b) => {
    const numA = parseInt(a.name.replace(/\D/g, ""), 10);
    const numB = parseInt(b.name.replace(/\D/g, ""), 10);
    return (isNaN(numA) ? 0 : numA) - (isNaN(numB) ? 0 : numB);
  });
  const occupied = sortedSlots.filter((s) => s.status === "occupied");
  const available = sortedSlots.filter((s) => s.status !== "occupied");

  return (
    <div style={{ background: "var(--bg-primary)" }} className="flex flex-col h-screen">
      <Navbar title="Takeaway" backHref="/" />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 style={{ color: "var(--text-primary)" }} className="text-xl font-bold mb-1">Select a Takeaway Slot</h2>
            <p style={{ color: "var(--text-muted)" }} className="text-sm">
              {occupied.length} active · {available.length} available
            </p>
          </div>
        </div>

        {loadingSlots ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "14px" }}>
            {[...Array(10)].map((_, i) => (
              <div key={i} style={{ background: "var(--bg-card)", borderRadius: "12px", height: "120px", animation: "pulse 1.5s infinite" }} />
            ))}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "14px" }}>
            {sortedSlots.map((slot) => {
              const isOccupied = slot.status === "occupied";
              const activeOrder = slot.orders?.[0];
              return (
                <div
                  key={slot.id}
                  style={{
                    background: isOccupied ? "rgba(239,68,68,0.08)" : "var(--bg-card)",
                    border: isOccupied ? "2px solid rgba(239,68,68,0.5)" : "2px solid var(--border-color)",
                    borderRadius: "12px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    overflow: "hidden",
                    transition: "all 0.15s ease",
                  }}
                >
                  <button
                    onClick={() => handleSelectSlot(slot)}
                    style={{
                      width: "100%",
                      background: "none",
                      border: "none",
                      padding: "18px 12px 12px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "6px",
                      cursor: "pointer",
                      textAlign: "center",
                    }}
                  >
                    <span style={{ fontSize: "20px" }}>{isOccupied ? "🟠" : "🟢"}</span>
                    <span style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "17px" }}>{slot.name}</span>
                    <span style={{ fontSize: "11px", color: isOccupied ? "var(--danger)" : "var(--success)", fontWeight: 600 }}>
                      {isOccupied ? "Active" : "Available"}
                    </span>
                    {isOccupied && activeOrder && (
                      <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                        {activeOrder.items.length} item{activeOrder.items.length !== 1 ? "s" : ""}
                      </span>
                    )}
                    {isOccupied && (
                      <span style={{ fontSize: "10px", color: "var(--accent-gold)", fontWeight: 600, marginTop: "2px" }}>
                        Tap to reopen →
                      </span>
                    )}
                  </button>
                  {isOccupied && (
                    <button
                      onClick={(e) => handleResetSlot(slot, e)}
                      style={{
                        width: "100%",
                        background: "rgba(239,68,68,0.15)",
                        border: "none",
                        borderTop: "1px solid rgba(239,68,68,0.3)",
                        color: "var(--danger)",
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "6px",
                        cursor: "pointer",
                        letterSpacing: "0.3px",
                      }}
                    >
                      ✕ Reset Slot
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

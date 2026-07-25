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

interface Table {
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

interface TableTransferModalProps {
  table: Table;
  allTables: Table[];
  onTransfer: (toTableId: number) => void;
  onClose: () => void;
}

function TableTransferModal({ table, allTables, onTransfer, onClose }: TableTransferModalProps) {
  const available = allTables.filter((t) => t.id !== table.id && t.status === "available" && t.tableType === "dining");
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "28px", width: "400px", maxHeight: "70vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <h3 style={{ color: "var(--text-primary)", fontSize: "18px", fontWeight: 700, marginBottom: "6px" }}>Transfer Table</h3>
        <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "20px" }}>Move order from <strong style={{ color: "var(--accent-gold)" }}>{table.name}</strong> to:</p>
        <div style={{ flex: 1, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
          {available.length === 0 && (
            <p style={{ color: "var(--text-muted)", gridColumn: "1/-1", textAlign: "center", padding: "20px" }}>No available tables</p>
          )}
          {available.map((t) => (
            <button key={t.id} onClick={() => onTransfer(t.id)}
              style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.4)", borderRadius: "10px", padding: "14px 8px", color: "var(--success)", fontWeight: 700, fontSize: "15px", cursor: "pointer" }}
            >
              {t.name}
            </button>
          ))}
        </div>
        <button onClick={onClose} style={{ marginTop: "16px", background: "none", border: "1px solid var(--border-color)", color: "var(--text-secondary)", borderRadius: "8px", padding: "10px", cursor: "pointer", fontSize: "13px" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function DineInPage() {
  useAuthGuard("dine-in");
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [loadingTables, setLoadingTables] = useState(true);
  const [orderTakers, setOrderTakers] = useState<OrderTaker[]>([]);
  const [selectedOrderTaker, setSelectedOrderTaker] = useState<number | null>(null);
  const [transferTarget, setTransferTarget] = useState<Table | null>(null);
  const [transferring, setTransferring] = useState(false);
  const [existingOrder, setExistingOrder] = useState<TableOrder | null>(null);
  const [savedCarts, setSavedCarts] = useState<Record<number, CartItem[]>>({});
  const { setOrderType, setTable, clearCart, loadOrder, items: cartItems } = useOrderStore();

  const fetchTables = useCallback(async () => {
    try {
      const res = await fetch("/api/tables?type=dining");
      const data = await res.json();
      setTables(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTables(false);
    }
  }, []);

  useEffect(() => {
    fetchTables();
    setOrderType("dine-in");
    fetch("/api/order-takers").then((r) => r.json()).then((data) => { if (Array.isArray(data)) setOrderTakers(data); }).catch(() => {});
  }, [fetchTables, setOrderType]);

  const handleSelectTable = async (table: Table) => {
    setOrderType("dine-in");
    setTable(table.id, table.name);

    if (table.status === "occupied" && table.orders && table.orders.length > 0) {
      // Reopen existing saved order from DB
      const order = table.orders[0];
      setExistingOrder(order);
      loadOrder(order.items.map((i) => ({ id: i.id, menuItemId: i.id, name: i.name, price: i.price, quantity: i.quantity, departmentId: i.department?.id, departmentName: i.department?.name })));
      setSelectedOrderTaker(order.orderTaker?.id ?? null);
    } else {
      setExistingOrder(null);
      setSelectedOrderTaker(null);
      // Restore unsaved cart items if user previously backed out of this table
      const saved = savedCarts[table.id];
      if (saved && saved.length > 0) {
        loadOrder(saved);
      } else {
        clearCart();
        // Re-apply table after clearCart (clearCart resets tableName to null)
        setTable(table.id, table.name);
        // Mark as occupied only on first entry
        await fetch(`/api/tables/${table.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "occupied" }),
        });
        setTables((prev) => prev.map((t) => t.id === table.id ? { ...t, status: "occupied" } : t));
      }
    }
    setSelectedTable({ ...table });
  };

  const handleOrderComplete = () => {
    if (selectedTable) {
      setSavedCarts((prev) => { const next = { ...prev }; delete next[selectedTable.id]; return next; });
    }
    setSelectedTable(null);
    setExistingOrder(null);
    fetchTables();
  };

  // Called when customer wants to add more items after an order is placed
  const handleAddMoreItems = (orderId: number, orderNumber: string) => {
    // Set the just-placed order as the existing order so new items are appended via PATCH
    setExistingOrder({ id: orderId, orderNumber, status: "completed", total: 0, items: [] });
    // Re-apply the table so tableName is preserved in the store after clearCart
    if (selectedTable) {
      setTable(selectedTable.id, selectedTable.name);
    }
  };

  // Release Table: marks table available, clears everything, goes back to table list
  const handleReleaseTable = async () => {
    if (selectedTable) {
      setSavedCarts((prev) => { const next = { ...prev }; delete next[selectedTable.id]; return next; });
      // Mark table as available and clear active order
      await fetch(`/api/tables/${selectedTable.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "available", activeOrderId: null }),
      }).catch(() => {});
    }
    clearCart();
    setSelectedTable(null);
    setExistingOrder(null);
    fetchTables();
  };

  // Manual reset: mark table available and cancel active order
  const handleResetTable = async (table: Table, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Reset ${table.name}? This will cancel the active order and free the table.`)) return;
    if (table.activeOrderId) {
      await fetch(`/api/orders/${table.activeOrderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      }).catch(() => {});
    }
    await fetch(`/api/tables/${table.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "available", activeOrderId: null }),
    });
    setSavedCarts((prev) => { const next = { ...prev }; delete next[table.id]; return next; });
    clearCart();
    fetchTables();
  };

  const handleTransfer = async (toTableId: number) => {
    if (!transferTarget || !existingOrder) return;
    setTransferring(true);
    try {
      const res = await fetch("/api/tables/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: existingOrder.id,
          fromTableId: transferTarget.id,
          toTableId,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Transfer failed");
        return;
      }
      const toTable = tables.find((t) => t.id === toTableId);
      if (toTable) {
        setSelectedTable({ ...toTable, status: "occupied" });
        setTable(toTable.id, toTable.name);
      }
      setTransferTarget(null);
      await fetchTables();
    } catch {
      alert("Transfer failed");
    } finally {
      setTransferring(false);
    }
  };

  if (selectedTable) {
    return (
      <div style={{ background: "var(--bg-primary)" }} className="flex flex-col h-screen">
        <Navbar title="Dine In Order" onBack={handleReleaseTable}>
          <span style={{ background: "rgba(122,31,43,0.15)", color: "var(--accent-maroon-light)", border: "1px solid var(--accent-maroon)", borderRadius: "20px", padding: "3px 10px", fontSize: "12px", fontWeight: 700 }}>
            🍽️ {selectedTable.name}
          </span>
          {existingOrder && (
            <span style={{ background: "rgba(232,163,61,0.1)", color: "var(--accent-gold)", border: "1px solid rgba(232,163,61,0.4)", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 600 }}>
              #{existingOrder.orderNumber}
            </span>
          )}
          {/* Order Taker selector */}
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
          {existingOrder && (
            <button
              onClick={() => setTransferTarget(selectedTable)}
              disabled={transferring}
              style={{ background: "rgba(59,130,246,0.15)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.4)", borderRadius: "8px", padding: "4px 12px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
            >
              🔄 Transfer
            </button>
          )}
          <button onClick={handleReleaseTable} style={{ color: "var(--danger)", fontSize: "12px", background: "none", border: "none", cursor: "pointer" }}>
            Release Table
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
              existingOrderId={existingOrder?.id}
            />
          </div>
        </div>
        {transferTarget && (
          <TableTransferModal
            table={transferTarget}
            allTables={tables}
            onTransfer={handleTransfer}
            onClose={() => setTransferTarget(null)}
          />
        )}
      </div>
    );
  }

  const diningTables = tables
    .filter((t) => t.tableType === "dining")
    .sort((a, b) => {
      const numA = parseInt(a.name.replace(/\D/g, ""), 10);
      const numB = parseInt(b.name.replace(/\D/g, ""), 10);
      return (isNaN(numA) ? 0 : numA) - (isNaN(numB) ? 0 : numB);
    });
  const occupied = diningTables.filter((t) => t.status === "occupied");
  const available = diningTables.filter((t) => t.status !== "occupied");

  return (
    <div style={{ background: "var(--bg-primary)" }} className="flex flex-col h-screen">
      <Navbar title="Dine In" backHref="/" />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 style={{ color: "var(--text-primary)" }} className="text-xl font-bold mb-1">Select a Table</h2>
            <p style={{ color: "var(--text-muted)" }} className="text-sm">
              {occupied.length} occupied · {available.length} available
            </p>
          </div>
        </div>

        {loadingTables ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "14px" }}>
            {[...Array(12)].map((_, i) => (
              <div key={i} style={{ background: "var(--bg-card)", borderRadius: "12px", height: "120px", animation: "pulse 1.5s infinite" }} />
            ))}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "14px" }}>
            {diningTables.map((table) => {
              const isOccupied = table.status === "occupied";
              const activeOrder = table.orders?.[0];
              return (
                <div
                  key={table.id}
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
                    onClick={() => handleSelectTable(table)}
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
                    <span style={{ fontSize: "20px" }}>{isOccupied ? "🔴" : "🟢"}</span>
                    <span style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "17px" }}>{table.name}</span>
                    <span style={{ fontSize: "11px", color: isOccupied ? "var(--danger)" : "var(--success)", fontWeight: 600 }}>
                      {isOccupied ? "Occupied" : "Available"}
                    </span>
                    {isOccupied && activeOrder && (
                      <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                        {activeOrder.items.length} item{activeOrder.items.length !== 1 ? "s" : ""}
                      </span>
                    )}
                    <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{table.seats} seats</span>
                    {isOccupied && (
                      <span style={{ fontSize: "10px", color: "var(--accent-gold)", fontWeight: 600, marginTop: "2px" }}>
                        Tap to reopen →
                      </span>
                    )}
                  </button>
                  {isOccupied && (
                    <button
                      onClick={(e) => handleResetTable(table, e)}
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
                      ✕ Reset Table
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

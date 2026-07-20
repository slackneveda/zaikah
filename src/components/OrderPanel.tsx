"use client";

import { useOrderStore } from "@/store/orderStore";
import { useState, useRef } from "react";
import PrintReceipt from "./PrintReceipt";

interface OrderPanelProps {
  onOrderComplete?: (orderId: number, orderNumber: string) => void;
}

export default function OrderPanel({ onOrderComplete }: OrderPanelProps) {
  const {
    items,
    orderType,
    tableNumber,
    tableId,
    cashReceived,
    updateQuantity,
    removeItem,
    clearCart,
    setCashReceived,
    getSubtotal,
    getChange,
  } = useOrderStore();

  const [loading, setLoading] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<{
    id: number;
    orderNumber: string;
  } | null>(null);
  const [cashInput, setCashInput] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const subtotal = getSubtotal();
  const change = getChange();

  const handleCashInput = (val: string) => {
    setCashInput(val);
    const num = parseFloat(val);
    if (!isNaN(num)) setCashReceived(num);
    else setCashReceived(0);
  };

  const handleComplete = async () => {
    if (items.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: orderType,
          tableId: tableId,
          items: items.map((i) => ({
            menuItemId: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
          cashReceived: cashReceived || subtotal,
        }),
      });
      if (!res.ok) throw new Error("Order failed");
      const order = await res.json();
      setCompletedOrder({ id: order.id, orderNumber: order.orderNumber });
      onOrderComplete?.(order.id, order.orderNumber);
    } catch (err) {
      console.error(err);
      alert("Failed to complete order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleNewOrder = () => {
    clearCart();
    setCompletedOrder(null);
    setCashInput("");
  };

  if (completedOrder) {
    return (
      <div
        style={{ background: "var(--bg-card)", borderLeft: "1px solid var(--border-color)" }}
        className="flex flex-col h-full"
      >
        {/* Scrollable receipt + buttons */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 12px", gap: "12px" }}>

          {/* Success badge */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(34,197,94,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>✓</div>
            <p style={{ color: "var(--success)", fontWeight: 700, fontSize: "16px", margin: 0 }}>Order Complete!</p>
          </div>

          {/* Receipt preview — visible on screen AND used for print */}
          <div
            id="print-receipt"
            ref={printRef}
            style={{
              background: "#fff",
              color: "#000",
              borderRadius: "8px",
              boxShadow: "0 2px 16px rgba(0,0,0,0.25)",
              width: "100%",
              maxWidth: "300px",
            }}
          >
            <PrintReceipt
              orderNumber={completedOrder.orderNumber}
              items={items}
              subtotal={subtotal}
              cashReceived={cashReceived || subtotal}
              change={change}
              orderType={orderType}
              tableNumber={tableNumber}
            />
          </div>

          {/* Action buttons */}
          <button
            onClick={handlePrint}
            style={{ background: "var(--accent-maroon)", color: "var(--text-primary)", border: "none", borderRadius: "8px", padding: "11px 0", fontWeight: 600, fontSize: "14px", cursor: "pointer", width: "100%", maxWidth: "300px" }}
          >
            🖨️ Print Receipt
          </button>
          <button
            onClick={handleNewOrder}
            style={{ background: "var(--bg-secondary)", color: "var(--text-primary)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "11px 0", fontWeight: 600, fontSize: "14px", cursor: "pointer", width: "100%", maxWidth: "300px" }}
          >
            New Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ background: "var(--bg-card)", borderLeft: "1px solid var(--border-color)" }}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div
        style={{ borderBottom: "1px solid var(--border-color)" }}
        className="px-4 py-3"
      >
        <div className="flex items-center justify-between">
          <h2 style={{ color: "var(--text-primary)" }} className="font-bold text-lg">
            Current Order
          </h2>
          {orderType === "dine-in" && tableNumber && (
            <span
              style={{ background: "rgba(122,31,43,0.2)", color: "var(--accent-maroon-light)", border: "1px solid var(--accent-maroon)" }}
              className="text-xs px-2 py-1 rounded-full font-semibold"
            >
              Table {tableNumber}
            </span>
          )}
          {items.length > 0 && (
            <button
              onClick={clearCart}
              style={{ color: "var(--danger)" }}
              className="text-xs hover:opacity-80"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <span className="text-4xl opacity-20">🛒</span>
            <p style={{ color: "var(--text-muted)" }} className="text-sm">
              No items added
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)" }}
              className="rounded-lg p-3"
            >
              <div className="flex justify-between items-start mb-2">
                <p style={{ color: "var(--text-primary)" }} className="text-sm font-medium leading-tight">
                  {item.name}
                </p>
                <button
                  onClick={() => removeItem(item.id)}
                  style={{ color: "var(--text-muted)" }}
                  className="hover:text-red-400 transition-colors text-xs ml-2"
                >
                  ✕
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-color)",
                      color: "var(--text-primary)",
                    }}
                    className="w-7 h-7 rounded-full text-sm flex items-center justify-center hover:opacity-80"
                  >
                    −
                  </button>
                  <span style={{ color: "var(--text-primary)" }} className="text-sm font-bold w-5 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    style={{
                      background: "var(--accent-maroon)",
                      color: "var(--text-primary)",
                    }}
                    className="w-7 h-7 rounded-full text-sm flex items-center justify-center hover:opacity-80"
                  >
                    +
                  </button>
                </div>
                <span style={{ color: "var(--accent-gold)" }} className="text-sm font-bold">
                  Rs. {(item.price * item.quantity).toFixed(0)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Totals & Calculator */}
      <div
        style={{ borderTop: "1px solid var(--border-color)" }}
        className="p-4 space-y-3"
      >
        <div className="flex justify-between items-center">
          <span style={{ color: "var(--text-secondary)" }} className="text-sm">
            Subtotal
          </span>
          <span style={{ color: "var(--text-primary)" }} className="font-semibold">
            Rs. {subtotal.toFixed(0)}
          </span>
        </div>
        <div
          style={{ borderTop: "1px solid var(--border-color)" }}
          className="flex justify-between items-center pt-2"
        >
          <span style={{ color: "var(--text-primary)" }} className="font-bold text-lg">
            TOTAL
          </span>
          <span style={{ color: "var(--accent-gold)" }} className="font-bold text-xl">
            Rs. {subtotal.toFixed(0)}
          </span>
        </div>

        {/* Cash Calculator */}
        <div style={{ background: "var(--bg-secondary)", borderRadius: "8px" }} className="p-3 space-y-2">
          <label style={{ color: "var(--text-secondary)" }} className="text-xs font-medium block">
            Cash Received
          </label>
          <input
            type="number"
            value={cashInput}
            onChange={(e) => handleCashInput(e.target.value)}
            placeholder="0"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              color: "var(--text-primary)",
              borderRadius: "6px",
            }}
            className="w-full px-3 py-2 text-right text-lg font-bold outline-none focus:border-amber-400"
          />
          {cashReceived > 0 && (
            <div className="flex justify-between">
              <span style={{ color: "var(--text-secondary)" }} className="text-xs">
                Change
              </span>
              <span
                style={{ color: change >= 0 ? "var(--success)" : "var(--danger)" }}
                className="text-sm font-bold"
              >
                Rs. {change.toFixed(0)}
              </span>
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <button
            onClick={() => {
              clearCart();
              setCashInput("");
            }}
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              color: "var(--text-secondary)",
            }}
            className="py-2.5 rounded-lg text-sm font-semibold hover:opacity-80 transition-opacity"
          >
            Clear
          </button>
          <button
            onClick={handleComplete}
            disabled={items.length === 0 || loading}
            style={{
              background: items.length === 0 ? "var(--bg-secondary)" : "var(--accent-maroon)",
              color: items.length === 0 ? "var(--text-muted)" : "var(--text-primary)",
            }}
            className="py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : "✓ Complete Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

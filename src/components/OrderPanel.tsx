"use client";

import { useOrderStore } from "@/store/orderStore";
import { useState, useCallback } from "react";
import PrintReceipt from "./PrintReceipt";
import StationTicket from "./StationTicket";

interface OrderPanelProps {
  onOrderComplete?: (orderId: number, orderNumber: string) => void;
  onOrderPlaced?: () => void;
  onAddMoreItems?: (orderId: number, orderNumber: string) => void;
  orderTakerId?: number | null;
  existingOrderId?: number;
  customerId?: number | null;
  riderId?: number | null;
  customerPhone?: string;
  customerName?: string;
  customerAddress?: string;
  deliveryNotes?: string;
}

export default function OrderPanel({
  onOrderComplete,
  onOrderPlaced,
  onAddMoreItems,
  orderTakerId,
  existingOrderId,
  customerId,
  riderId,
  customerPhone,
  customerName,
  customerAddress,
  deliveryNotes,
}: OrderPanelProps) {
  const {
    items,
    orderType,
    tableName,
    tableId,
    cashReceived,
    discount,
    notes,
    updateQuantity,
    removeItem,
    clearCart,
    setCashReceived,
    setDiscount,
    setNotes,
    getSubtotal,
    getTotal,
    getChange,
  } = useOrderStore();

  const [loading, setLoading] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<{
    id: number;
    orderNumber: string;
    snapshotTableName: string | null;
    snapshotItems: typeof items;       // only the newly added items (for kitchen/drinks tickets)
    allItems: { name: string; price: number; quantity: number; notes?: string }[]; // full order (for main receipt)
    snapshotOrderType: string;
    snapshotSubtotal: number;
    snapshotTotal: number;
    snapshotChange: number;
    snapshotCashReceived: number;
    snapshotDiscount: number;
    allSubtotal: number;
    allTotal: number;
    allDiscount: number;
  } | null>(null);
  const [cashInput, setCashInput] = useState("");
  const [discountInput, setDiscountInput] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  const subtotal = getSubtotal();
  const total = getTotal();
  const change = getChange();

  const handleCashInput = useCallback((val: string) => {
    setCashInput(val);
    const num = parseFloat(val);
    setCashReceived(isNaN(num) ? 0 : num);
  }, [setCashReceived]);

  const handleDiscountInput = useCallback((val: string) => {
    setDiscountInput(val);
    const num = parseFloat(val);
    setDiscount(isNaN(num) ? 0 : Math.min(100, Math.max(0, num)));
  }, [setDiscount]);

  const handleComplete = useCallback(async () => {
    if (items.length === 0 || loading) return;
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        type: orderType,
        tableId,
        items: items.map((i) => ({
          menuItemId: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          notes: i.notes,
          departmentId: i.departmentId,
        })),
        cashReceived: cashReceived || total,
        discount,
        orderTakerId: orderTakerId || null,
        customerId: customerId || null,
        riderId: riderId || null,
        customerPhone: customerPhone || null,
        customerName: customerName || null,
        customerAddress: customerAddress || null,
        notes: notes || deliveryNotes || null,
        // Delivery orders start as pending for tracking; others complete immediately
        status: orderType === "delivery" ? "pending" : "completed",
      };

      let res: Response;
      if (existingOrderId) {
        // Append new items to existing order
        res = await fetch(`/api/orders/${existingOrderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appendItems: payload.items,
            cashReceived: payload.cashReceived,
            discount: payload.discount,
            orderTakerId: payload.orderTakerId,
            tableId: payload.tableId,
            status: payload.status,
          }),
        });
      } else {
        res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Order failed");
      }
      const order = await res.json();
      // For append flow: use the full order items from DB response for the main receipt
      const isAppend = !!existingOrderId;
      const fullItems: { name: string; price: number; quantity: number; notes?: string }[] = isAppend && Array.isArray(order.items)
        ? order.items.map((i: { name: string; price: number; quantity: number; notes?: string | null }) => ({ name: i.name, price: i.price, quantity: i.quantity, notes: i.notes ?? undefined }))
        : [...items];
      const fullSubtotal: number = isAppend ? (order.subtotal ?? subtotal) : subtotal;
      const fullTotal: number = isAppend ? (order.total ?? total) : total;
      const fullDiscount: number = isAppend ? (order.discount ?? discount) : discount;
      setCompletedOrder({
        id: order.id,
        orderNumber: order.orderNumber,
        snapshotTableName: useOrderStore.getState().tableName,
        snapshotItems: [...items],
        allItems: fullItems,
        snapshotOrderType: orderType,
        snapshotSubtotal: subtotal,
        snapshotTotal: total,
        snapshotChange: change,
        snapshotCashReceived: cashReceived || total,
        snapshotDiscount: discount,
        allSubtotal: fullSubtotal,
        allTotal: fullTotal,
        allDiscount: fullDiscount,
      });
      onOrderPlaced?.();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to complete order");
    } finally {
      setLoading(false);
    }
  }, [items, loading, orderType, tableId, cashReceived, total, discount, orderTakerId, customerId, riderId, customerPhone, customerName, customerAddress, notes, deliveryNotes, existingOrderId]);

  const handleNewOrder = useCallback(() => {
    const finished = completedOrder;
    clearCart();
    setCompletedOrder(null);
    setCashInput("");
    setDiscountInput("");
    if (finished) onOrderComplete?.(finished.id, finished.orderNumber);
  }, [clearCart, completedOrder, onOrderComplete]);

  const handleAddMoreItems = useCallback(() => {
    const finished = completedOrder;
    clearCart();
    setCompletedOrder(null);
    setCashInput("");
    setDiscountInput("");
    if (finished) onAddMoreItems?.(finished.id, finished.orderNumber);
  }, [clearCart, completedOrder, onAddMoreItems]);

  const printSection = useCallback((elementId: string) => {
    const el = document.getElementById(elementId);
    if (!el) return;
    const html = el.innerHTML;
    const win = window.open("", "_blank", "width=400,height=600");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Print</title><style>body{margin:0;padding:0;background:#fff;} @media print{body{margin:0;}}</style></head><body>${html}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  }, []);

  const kitchenItems = items.filter((i) => i.departmentName === "Kitchen");
  const drinksItems = items.filter((i) => i.departmentName === "Drinks");

  if (completedOrder) {
    const snapKitchen = completedOrder.snapshotItems.filter((i) => i.departmentName === "Kitchen");
    const snapDrinks = completedOrder.snapshotItems.filter((i) => i.departmentName === "Drinks");
    const snapTableName = completedOrder.snapshotTableName;
    const snapOrderType = completedOrder.snapshotOrderType;

    return (
      <div style={{ background: "var(--bg-card)", borderLeft: "1px solid var(--border-color)" }} className="flex flex-col h-full">
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 12px", gap: "12px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(34,197,94,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>✓</div>
            <p style={{ color: "var(--success)", fontWeight: 700, fontSize: "16px", margin: 0 }}>Order Complete!</p>
          </div>

          {/* Hidden print containers */}
          <div style={{ position: "absolute", left: "-9999px", top: 0, pointerEvents: "none" }}>
            {snapKitchen.length > 0 && (
              <div id="print-kitchen">
                <StationTicket
                  station="Kitchen"
                  orderNumber={completedOrder.orderNumber}
                  orderType={snapOrderType}
                  tableName={snapTableName}
                  customerName={customerName}
                  customerPhone={customerPhone}
                  items={snapKitchen.map((i) => ({ name: i.name, quantity: i.quantity, notes: i.notes }))}
                />
              </div>
            )}
            {snapDrinks.length > 0 && (
              <div id="print-drinks">
                <StationTicket
                  station="Drinks"
                  orderNumber={completedOrder.orderNumber}
                  orderType={snapOrderType}
                  tableName={snapTableName}
                  customerName={customerName}
                  customerPhone={customerPhone}
                  items={snapDrinks.map((i) => ({ name: i.name, quantity: i.quantity, notes: i.notes }))}
                />
              </div>
            )}
            <div id="print-receipt">
              <PrintReceipt
                orderNumber={completedOrder.orderNumber}
                items={completedOrder.allItems}
                subtotal={completedOrder.allSubtotal}
                discount={completedOrder.allDiscount}
                total={completedOrder.allTotal}
                cashReceived={completedOrder.snapshotCashReceived}
                change={completedOrder.allTotal - completedOrder.snapshotCashReceived}
                orderType={snapOrderType}
                tableName={snapTableName}
                customerName={customerName}
                customerPhone={customerPhone}
                customerAddress={customerAddress}
              />
            </div>
          </div>

          {/* Print Buttons */}
          {snapKitchen.length > 0 && (
            <button
              onClick={() => printSection("print-kitchen")}
              style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: "8px", padding: "11px 0", fontWeight: 600, fontSize: "14px", cursor: "pointer", width: "100%", maxWidth: "300px" }}
            >
              🍽️ Print Kitchen Ticket
            </button>
          )}
          {snapDrinks.length > 0 && (
            <button
              onClick={() => printSection("print-drinks")}
              style={{ background: "#22c55e", color: "#fff", border: "none", borderRadius: "8px", padding: "11px 0", fontWeight: 600, fontSize: "14px", cursor: "pointer", width: "100%", maxWidth: "300px" }}
            >
              🥤 Print Drinks Ticket
            </button>
          )}
          <button
            onClick={() => printSection("print-receipt")}
            style={{ background: "var(--accent-maroon)", color: "var(--text-primary)", border: "none", borderRadius: "8px", padding: "11px 0", fontWeight: 600, fontSize: "14px", cursor: "pointer", width: "100%", maxWidth: "300px" }}
          >
            🖨️ Print Main Receipt
          </button>
          {onAddMoreItems ? (
            <button onClick={handleAddMoreItems} style={{ background: "var(--accent-maroon)", color: "var(--text-primary)", border: "none", borderRadius: "8px", padding: "11px 0", fontWeight: 600, fontSize: "14px", cursor: "pointer", width: "100%", maxWidth: "300px" }}>
              + Add More Items
            </button>
          ) : (
            <button onClick={handleNewOrder} style={{ background: "var(--bg-secondary)", color: "var(--text-primary)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "11px 0", fontWeight: 600, fontSize: "14px", cursor: "pointer", width: "100%", maxWidth: "300px" }}>
              New Order
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--bg-card)", borderLeft: "1px solid var(--border-color)" }} className="flex flex-col h-full">
      {/* Header */}
      <div style={{ borderBottom: "1px solid var(--border-color)", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "16px", margin: 0 }}>
          {existingOrderId ? "Update Order" : "Current Order"}
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {orderType === "dine-in" && tableName && (
            <span style={{ background: "rgba(122,31,43,0.2)", color: "var(--accent-maroon-light)", border: "1px solid var(--accent-maroon)", borderRadius: "20px", padding: "2px 8px", fontSize: "11px", fontWeight: 700 }}>
              {tableName}
            </span>
          )}
          {items.length > 0 && (
            <button onClick={clearCart} style={{ color: "var(--danger)", fontSize: "11px", background: "none", border: "none", cursor: "pointer" }}>
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Items list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
        {items.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "8px" }}>
            <span style={{ fontSize: "36px", opacity: 0.2 }}>🛒</span>
            <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: 0 }}>No items added</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {items.map((item) => (
              <div key={item.id} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "10px 12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <p style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 500, margin: 0, flex: 1, lineHeight: "1.4" }}>{item.name}</p>
                  <button onClick={() => removeItem(item.id)} style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", fontSize: "14px", marginLeft: "8px", lineHeight: 1 }}>✕</button>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button onClick={() => updateQuantity(item.id, -1)} style={{ width: "26px", height: "26px", borderRadius: "50%", background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-primary)", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                    <span style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 700, minWidth: "20px", textAlign: "center" }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} style={{ width: "26px", height: "26px", borderRadius: "50%", background: "var(--accent-maroon)", border: "none", color: "white", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                  </div>
                  <span style={{ color: "var(--accent-gold)", fontSize: "13px", fontWeight: 700 }}>Rs. {(item.price * item.quantity).toFixed(0)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes toggle */}
      <div style={{ padding: "0 12px" }}>
        <button
          onClick={() => setShowNotes(!showNotes)}
          style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "12px", cursor: "pointer", padding: "6px 0", display: "flex", alignItems: "center", gap: "4px" }}
        >
          📝 {showNotes ? "Hide" : "Add"} Notes
        </button>
        {showNotes && (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Order notes..."
            rows={2}
            style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", color: "var(--text-primary)", borderRadius: "8px", padding: "8px", fontSize: "12px", outline: "none", resize: "none", marginBottom: "6px" }}
          />
        )}
      </div>

      {/* Totals & Checkout */}
      <div style={{ borderTop: "1px solid var(--border-color)", padding: "14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
          <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Subtotal</span>
          <span style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 600 }}>Rs. {subtotal.toFixed(0)}</span>
        </div>

        {/* Discount */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: discount > 0 ? "2px" : "6px" }}>
          <span style={{ color: "var(--text-secondary)", fontSize: "12px", flex: 1 }}>Discount</span>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <input
              type="number"
              value={discountInput}
              onChange={(e) => handleDiscountInput(e.target.value)}
              placeholder="0"
              min={0}
              max={100}
              style={{ width: "60px", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", color: "var(--text-primary)", borderRadius: "6px", padding: "4px 8px", fontSize: "12px", textAlign: "right", outline: "none" }}
            />
            <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>%</span>
          </div>
        </div>
        {discount > 0 && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "6px" }}>
            <span style={{ color: "var(--danger)", fontSize: "11px" }}>- Rs. {(subtotal * discount / 100).toFixed(0)}</span>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px solid var(--border-color)", marginBottom: "10px" }}>
          <span style={{ color: "var(--text-primary)", fontSize: "16px", fontWeight: 700 }}>TOTAL</span>
          <span style={{ color: "var(--accent-gold)", fontSize: "18px", fontWeight: 700 }}>Rs. {total.toFixed(0)}</span>
        </div>

        {/* Cash calculator */}
        <div style={{ background: "var(--bg-secondary)", borderRadius: "8px", padding: "10px", marginBottom: "10px" }}>
          <label style={{ color: "var(--text-secondary)", fontSize: "11px", display: "block", marginBottom: "6px" }}>Cash Received</label>
          <input
            type="number"
            value={cashInput}
            onChange={(e) => handleCashInput(e.target.value)}
            placeholder="0"
            style={{ width: "100%", background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-primary)", borderRadius: "6px", padding: "8px 10px", fontSize: "16px", fontWeight: 700, textAlign: "right", outline: "none" }}
          />
          {cashReceived > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>Change</span>
              <span style={{ color: change >= 0 ? "var(--success)" : "var(--danger)", fontSize: "13px", fontWeight: 700 }}>Rs. {change.toFixed(0)}</span>
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "8px" }}>
          <button
            onClick={() => { clearCart(); setCashInput(""); setDiscountInput(""); }}
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", color: "var(--text-secondary)", borderRadius: "8px", padding: "11px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
          >
            Clear
          </button>
          <button
            onClick={handleComplete}
            disabled={items.length === 0 || loading}
            style={{ background: items.length === 0 ? "var(--bg-secondary)" : "var(--accent-maroon)", color: items.length === 0 ? "var(--text-muted)" : "white", border: "none", borderRadius: "8px", padding: "11px", fontSize: "13px", fontWeight: 700, cursor: items.length === 0 || loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Processing..." : existingOrderId ? "Save & Complete" : orderType === "delivery" ? "Place Order" : "Complete Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

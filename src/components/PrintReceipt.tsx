interface PrintReceiptProps {
  orderNumber: string;
  items: { name: string; price: number; quantity: number }[];
  subtotal: number;
  cashReceived: number;
  change: number;
  orderType: "takeaway" | "dine-in";
  tableNumber: number | null;
}

export default function PrintReceipt({
  orderNumber,
  items,
  subtotal,
  cashReceived,
  change,
  orderType,
  tableNumber,
}: PrintReceiptProps) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-PK", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div
      style={{
        fontFamily: "monospace",
        fontSize: "12px",
        width: "80mm",
        padding: "8mm",
        background: "#fff",
        color: "#000",
        lineHeight: "1.5",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "8px" }}>
        <div style={{ fontSize: "18px", fontWeight: "bold", letterSpacing: "2px" }}>
          ZAIKAH
        </div>
        <div style={{ fontSize: "11px" }}>ذائقہ</div>
        <div style={{ fontSize: "10px", marginTop: "2px" }}>
          Flavour That Feels Like Home
        </div>
        <div style={{ fontSize: "10px" }}>─────────────────────</div>
      </div>

      {/* Order Info */}
      <div style={{ marginBottom: "6px" }}>
        <div>Order #: {orderNumber}</div>
        <div>Date: {dateStr}</div>
        <div>Time: {timeStr}</div>
        <div>Type: {orderType === "dine-in" ? `Dine-In${tableNumber ? ` (Table ${tableNumber})` : ""}` : "Takeaway"}</div>
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

      {/* Items */}
      <div style={{ marginBottom: "6px" }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ maxWidth: "55%" }}>
              {item.name} x{item.quantity}
            </span>
            <span>Rs. {(item.price * item.quantity).toFixed(0)}</span>
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

      {/* Totals */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
          <span>TOTAL</span>
          <span>Rs. {subtotal.toFixed(0)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Cash Received</span>
          <span>Rs. {cashReceived.toFixed(0)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Change</span>
          <span>Rs. {change.toFixed(0)}</span>
        </div>
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

      {/* Footer */}
      <div style={{ textAlign: "center", fontSize: "10px", marginTop: "8px" }}>
        <div>Thank you for dining with us!</div>
        <div>شکریہ</div>
      </div>
    </div>
  );
}

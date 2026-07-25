interface PrintReceiptProps {
  orderNumber: string;
  items: { name: string; price: number; quantity: number; notes?: string }[];
  subtotal: number;
  discount?: number;
  total?: number;
  cashReceived: number;
  change: number;
  orderType: string;
  tableName?: string | null;
  // Legacy compat
  tableNumber?: string | number | null;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  orderTakerName?: string;
  riderName?: string;
}

export default function PrintReceipt({
  orderNumber,
  items,
  subtotal,
  discount = 0,
  total,
  cashReceived,
  change,
  orderType,
  tableName,
  tableNumber,
  customerName,
  customerPhone,
  customerAddress,
  orderTakerName,
  riderName,
}: PrintReceiptProps) {
  const displayTotal = total ?? subtotal - discount;
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", hour12: true });

  const tableDisplay = tableName ?? (tableNumber ? String(tableNumber) : null);

  const typeLabel =
    orderType === "dine-in" ? `Dine-In${tableDisplay ? ` (${tableDisplay})` : ""}`
    : orderType === "takeaway" ? `Takeaway${tableDisplay ? ` (${tableDisplay})` : ""}`
    : orderType === "delivery" ? "Home Delivery"
    : orderType;

  return (
    <div
      style={{
        fontFamily: "monospace",
        fontSize: "12px",
        width: "76mm",
        padding: "4mm 5mm",
        background: "#fff",
        color: "#000",
        lineHeight: "1.6",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "8px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.jpeg" alt="ZAIKAH" style={{ width: "80px", height: "80px", objectFit: "contain", borderRadius: "50%", margin: "0 auto 6px" }} />
        <div style={{ fontSize: "20px", fontWeight: "bold", letterSpacing: "2px" }}>ZAIKAH</div>
        <div style={{ fontSize: "12px" }}>ذائقہ</div>
        <div style={{ fontSize: "10px", marginTop: "2px" }}>Flavour That Feels Like Home</div>
        <div style={{ fontSize: "10px" }}>─────────────────────</div>
      </div>

      {/* Order Info */}
      <div style={{ marginBottom: "6px", fontSize: "11px" }}>
        <div><strong>Order #:</strong> {orderNumber}</div>
        <div><strong>Date:</strong> {dateStr}</div>
        <div><strong>Time:</strong> {timeStr}</div>
        <div><strong>Type:</strong> {typeLabel}</div>
        {orderTakerName && <div><strong>Order Taker:</strong> {orderTakerName}</div>}
        {riderName && <div><strong>Rider:</strong> {riderName}</div>}
      </div>

      {/* Customer Info */}
      {(customerName || customerPhone || customerAddress) && (
        <>
          <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />
          <div style={{ fontSize: "11px", marginBottom: "6px" }}>
            <div style={{ fontWeight: "bold", marginBottom: "2px" }}>Customer:</div>
            {customerName && <div>{customerName}</div>}
            {customerPhone && <div>📞 {customerPhone}</div>}
            {customerAddress && <div>📍 {customerAddress}</div>}
          </div>
        </>
      )}

      <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

      {/* Items */}
      <div style={{ marginBottom: "6px" }}>
        <div style={{ fontWeight: "bold", fontSize: "11px", marginBottom: "4px" }}>Items:</div>
        {items.map((item, i) => (
          <div key={i}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ maxWidth: "60%" }}>{item.name} x{item.quantity}</span>
              <span>Rs. {(item.price * item.quantity).toFixed(0)}</span>
            </div>
            {item.notes && (
              <div style={{ fontSize: "10px", color: "#555", paddingLeft: "8px" }}>Note: {item.notes}</div>
            )}
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

      {/* Totals */}
      <div style={{ fontSize: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Subtotal</span>
          <span>Rs. {subtotal.toFixed(0)}</span>
        </div>
        {discount > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Discount</span>
            <span>- Rs. {discount.toFixed(0)}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", marginTop: "2px", fontSize: "13px" }}>
          <span>TOTAL</span>
          <span>Rs. {displayTotal.toFixed(0)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
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
        <div>Please visit again 🌟</div>
      </div>
    </div>
  );
}

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
    orderType === "dine-in" ? "Dine-In"
    : orderType === "takeaway" ? "Takeaway"
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
        <img src="/logo light.jpeg" alt="ZAIKAH" style={{ width: "100px", height: "100px", objectFit: "contain", display: "block", margin: "0 auto 4px" }} />
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
        {tableDisplay && <div><strong>Table:</strong> {tableDisplay}</div>}
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

      {/* Items Table */}
      <div style={{ marginBottom: "6px" }}>
        {/* Column Headers */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 28px 60px",
          gap: "0 4px",
          fontWeight: "bold",
          fontSize: "10px",
          borderBottom: "1px dashed #000",
          paddingBottom: "3px",
          marginBottom: "3px",
        }}>
          <span>ITEM</span>
          <span style={{ textAlign: "center" }}>QTY</span>
          <span style={{ textAlign: "right" }}>PRICE</span>
        </div>
        {/* Rows */}
        {items.map((item, i) => (
          <div key={i} style={{ marginBottom: "2px" }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 28px 60px",
              gap: "0 4px",
              fontSize: "11px",
            }}>
              <span style={{ wordBreak: "break-word" }}>{item.name}</span>
              <span style={{ textAlign: "center" }}>{item.quantity}</span>
              <span style={{ textAlign: "right" }}>{(item.price * item.quantity).toFixed(0)}</span>
            </div>
            {item.notes && (
              <div style={{ fontSize: "10px", color: "#555", paddingLeft: "4px" }}>↳ {item.notes}</div>
            )}
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

      {/* Totals */}
      <div style={{ fontSize: "11px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
          <span>Subtotal</span>
          <span>{subtotal.toFixed(0)}</span>
        </div>
        {discount > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
            <span>Discount ({discount.toFixed(0)}%)</span>
            <span style={{ fontWeight: "bold" }}>- {(subtotal * discount / 100).toFixed(0)}</span>
          </div>
        )}
        <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "13px", marginBottom: "4px" }}>
          <span>TOTAL</span>
          <span>Rs. {displayTotal.toFixed(0)}</span>
        </div>
        <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
          <span>Cash Received</span>
          <span>Rs. {cashReceived.toFixed(0)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Change</span>
          <span style={{ fontWeight: "bold" }}>Rs. {change.toFixed(0)}</span>
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

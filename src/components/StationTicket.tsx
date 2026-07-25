interface TicketItem {
  name: string;
  quantity: number;
  notes?: string;
}

interface StationTicketProps {
  station: "Kitchen" | "Drinks";
  orderNumber: string;
  orderType: string;
  tableName?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  orderTakerName?: string | null;
  items: TicketItem[];
}

export default function StationTicket({
  station,
  orderNumber,
  orderType,
  tableName,
  customerName,
  customerPhone,
  orderTakerName,
  items,
}: StationTicketProps) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", hour12: true });
  const dateStr = now.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });

  const typeLabel =
    orderType === "dine-in" ? "Dine-In"
    : orderType === "takeaway" ? "Takeaway"
    : orderType === "delivery" ? "Home Delivery"
    : orderType;

  const stationIcon = station === "Kitchen" ? "🍽️" : "🥤";

  return (
    <div
      style={{
        fontFamily: "monospace",
        fontSize: "13px",
        width: "76mm",
        padding: "4mm 5mm",
        background: "#fff",
        color: "#000",
        lineHeight: "1.6",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "8px" }}>
        <div style={{ fontSize: "22px", fontWeight: "bold", letterSpacing: "2px" }}>
          {stationIcon} {station.toUpperCase()} TICKET
        </div>
        <div style={{ fontSize: "10px", marginTop: "2px" }}>─────────────────────</div>
      </div>

      {/* Order Info */}
      <div style={{ marginBottom: "8px", fontSize: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <strong>Order #:</strong>
          <span style={{ fontWeight: "bold", fontSize: "14px" }}>{orderNumber}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <strong>Type:</strong>
          <span>{typeLabel}</span>
        </div>
        {orderType === "dine-in" && tableName && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>Table:</strong>
            <span style={{ fontWeight: "bold", fontSize: "14px" }}>{tableName}</span>
          </div>
        )}
        {orderType === "takeaway" && tableName && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>Slot:</strong>
            <span style={{ fontWeight: "bold", fontSize: "14px" }}>{tableName}</span>
          </div>
        )}
        {orderType === "delivery" && customerName && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>Customer:</strong>
            <span style={{ fontWeight: "bold" }}>{customerName}</span>
          </div>
        )}
        {orderType === "delivery" && customerPhone && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>Phone:</strong>
            <span>{customerPhone}</span>
          </div>
        )}
        {orderTakerName && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>Order Taker:</strong>
            <span>{orderTakerName}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <strong>Time:</strong>
          <span>{timeStr}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <strong>Date:</strong>
          <span>{dateStr}</span>
        </div>
      </div>

      <div style={{ borderTop: "2px solid #000", margin: "6px 0" }} />

      {/* Items */}
      <div style={{ marginBottom: "6px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "30px 1fr",
            gap: "0 6px",
            fontWeight: "bold",
            fontSize: "11px",
            borderBottom: "1px dashed #000",
            paddingBottom: "3px",
            marginBottom: "4px",
          }}
        >
          <span>QTY</span>
          <span>ITEM</span>
        </div>
        {items.map((item, i) => (
          <div key={i} style={{ marginBottom: "4px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "30px 1fr",
                gap: "0 6px",
                fontSize: "13px",
              }}
            >
              <span style={{ fontWeight: "bold", fontSize: "15px" }}>x{item.quantity}</span>
              <span style={{ wordBreak: "break-word" }}>{item.name}</span>
            </div>
            {item.notes && (
              <div style={{ fontSize: "10px", color: "#444", paddingLeft: "36px" }}>↳ {item.notes}</div>
            )}
          </div>
        ))}
      </div>

      <div style={{ borderTop: "2px solid #000", margin: "6px 0" }} />

      <div style={{ textAlign: "center", fontSize: "10px", marginTop: "4px" }}>
        <div style={{ fontWeight: "bold" }}>{station} Copy</div>
      </div>
    </div>
  );
}

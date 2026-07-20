"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import MenuGrid from "@/components/MenuGrid";
import OrderPanel from "@/components/OrderPanel";
import { useOrderStore } from "@/store/orderStore";

interface Table {
  id: number;
  number: number;
  seats: number;
  status: string;
}

export default function DineInPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [loadingTables, setLoadingTables] = useState(true);
  const { setOrderType, setTable, clearCart } = useOrderStore();

  const fetchTables = useCallback(async () => {
    try {
      const res = await fetch("/api/tables");
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
  }, [fetchTables, setOrderType]);

  const handleToggleStatus = async (e: React.MouseEvent, table: Table) => {
    e.stopPropagation();
    const newStatus = table.status === "occupied" ? "available" : "occupied";
    await fetch(`/api/tables/${table.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setTables((prev) =>
      prev.map((t) => (t.id === table.id ? { ...t, status: newStatus } : t))
    );
  };

  const handleSelectTable = async (table: Table) => {
    if (table.status === "occupied") return;
    // Mark table as occupied
    await fetch(`/api/tables/${table.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "occupied" }),
    });
    clearCart();
    setTable(table.id, table.number);
    setSelectedTable(table);
    setTables((prev) =>
      prev.map((t) => (t.id === table.id ? { ...t, status: "occupied" } : t))
    );
  };

  const handleOrderComplete = () => {
    setSelectedTable(null);
    fetchTables();
  };

  const handleReleaseTable = () => {
    clearCart();
    fetch(`/api/tables/${selectedTable!.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "available" }),
    });
    setSelectedTable(null);
    fetchTables();
  };

  if (selectedTable) {
    return (
      <div style={{ background: "var(--bg-primary)" }} className="flex flex-col h-screen">
        <Navbar title="Dine In Order" onBack={handleReleaseTable}>
          <span
            style={{
              background: "rgba(122,31,43,0.15)",
              color: "var(--accent-maroon-light)",
              border: "1px solid var(--accent-maroon)",
            }}
            className="text-xs px-3 py-1 rounded-full font-semibold"
          >
            🍽️ Table {selectedTable.number}
          </span>
          <button
            onClick={handleReleaseTable}
            style={{ color: "var(--danger)", fontSize: "12px" }}
            className="hover:opacity-80"
          >
            Release Table
          </button>
        </Navbar>
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            <MenuGrid />
          </div>
          <div className="w-72 xl:w-80 flex-shrink-0">
            <OrderPanel onOrderComplete={handleOrderComplete} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--bg-primary)" }} className="flex flex-col h-screen">
      <Navbar title="Dine In" backHref="/" />

      <div className="flex-1 overflow-y-auto p-6">
        <h2 style={{ color: "var(--text-primary)" }} className="text-xl font-bold mb-2">
          Select a Table
        </h2>
        <p style={{ color: "var(--text-secondary)" }} className="text-sm mb-6">
          Click an available table to start an order
        </p>

        {loadingTables ? (
          <div style={{ color: "var(--text-muted)" }} className="text-center py-20 animate-pulse">
            Loading tables...
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
            {tables.map((table) => {
              const isOccupied = table.status === "occupied";
              return (
                <div
                  key={table.id}
                  style={{
                    background: isOccupied ? "rgba(239,68,68,0.08)" : "var(--bg-card)",
                    border: isOccupied ? "2px solid rgba(239,68,68,0.5)" : "2px solid var(--border-color)",
                    borderRadius: "12px",
                    padding: "20px 16px 12px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                    position: "relative",
                  }}
                >
                  {/* Main clickable area */}
                  <button
                    onClick={() => handleSelectTable(table)}
                    disabled={isOccupied}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: isOccupied ? "var(--danger)" : "var(--text-primary)",
                      cursor: isOccupied ? "not-allowed" : "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "8px",
                      width: "100%",
                    }}
                  >
                    <span style={{ fontSize: "24px" }}>{isOccupied ? "🔴" : "🟢"}</span>
                    <span style={{ fontWeight: 700, fontSize: "18px" }}>Table {table.number}</span>
                    <span style={{ fontSize: "12px", opacity: 0.7 }}>
                      {isOccupied ? "Occupied" : "Available"}
                    </span>
                    <span style={{ fontSize: "12px", opacity: 0.5 }}>{table.seats} seats</span>
                  </button>

                  {/* Manual status toggle */}
                  <button
                    onClick={(e) => handleToggleStatus(e, table)}
                    style={{
                      marginTop: "4px",
                      width: "100%",
                      padding: "5px 0",
                      fontSize: "11px",
                      fontWeight: 600,
                      borderRadius: "6px",
                      cursor: "pointer",
                      border: "1px solid",
                      background: isOccupied ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                      color: isOccupied ? "var(--success)" : "var(--danger)",
                      borderColor: isOccupied ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)",
                    }}
                  >
                    {isOccupied ? "✓ Set Available" : "✕ Set Occupied"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex gap-6 mt-8">
          <div className="flex items-center gap-2">
            <span className="text-sm">🟢</span>
            <span style={{ color: "var(--success)" }} className="text-sm">
              Available
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">🔴</span>
            <span style={{ color: "var(--danger)" }} className="text-sm">
              Occupied
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

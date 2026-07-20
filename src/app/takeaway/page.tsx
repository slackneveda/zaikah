"use client";

import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import MenuGrid from "@/components/MenuGrid";
import OrderPanel from "@/components/OrderPanel";
import { useOrderStore } from "@/store/orderStore";

export default function TakeawayPage() {
  const setOrderType = useOrderStore((s) => s.setOrderType);

  useEffect(() => {
    setOrderType("takeaway");
  }, [setOrderType]);

  return (
    <div style={{ background: "var(--bg-primary)" }} className="flex flex-col h-screen">
      <Navbar title="Takeaway Order" backHref="/">
        <span
          style={{
            background: "rgba(232,163,61,0.15)",
            color: "var(--accent-gold)",
            border: "1px solid var(--accent-gold)",
          }}
          className="text-xs px-3 py-1 rounded-full font-semibold"
        >
          🛍️ Takeaway
        </span>
      </Navbar>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Menu */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <MenuGrid />
        </div>

        {/* Right: Order Panel */}
        <div className="w-72 xl:w-80 flex-shrink-0">
          <OrderPanel />
        </div>
      </div>
    </div>
  );
}

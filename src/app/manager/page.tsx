"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import ManagerOverview from "./components/ManagerOverview";
import OrderHistory from "./components/OrderHistory";
import SalesReports from "./components/SalesReports";
import MenuManagement from "./components/MenuManagement";

type Tab = "overview" | "history" | "reports" | "menu";

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "history", label: "Order History", icon: "📋" },
  { id: "reports", label: "Sales Reports", icon: "📈" },
  { id: "menu", label: "Menu Management", icon: "🍽️" },
];

export default function ManagerPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  return (
    <div style={{ background: "var(--bg-primary)" }} className="flex flex-col h-screen">
      <Navbar title="Manager Panel" backHref="/" />

      {/* Tab Bar */}
      <div
        style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)" }}
        className="flex gap-1 px-4 py-2"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? "var(--accent-maroon)" : "transparent",
              color: activeTab === tab.id ? "var(--text-primary)" : "var(--text-secondary)",
              border: "none",
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "overview" && <ManagerOverview />}
        {activeTab === "history" && <OrderHistory />}
        {activeTab === "reports" && <SalesReports />}
        {activeTab === "menu" && <MenuManagement />}
      </div>
    </div>
  );
}

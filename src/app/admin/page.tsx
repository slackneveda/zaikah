"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import AdminOverview from "./components/AdminOverview";
import AdminStaffManagement from "./components/AdminStaffManagement";
import AdminTableManagement from "./components/AdminTableManagement";
import AdminOrderManagement from "./components/AdminOrderManagement";
import AdminSalesReports from "./components/AdminSalesReports";
import AdminDepartmentManagement from "./components/AdminDepartmentManagement";
import AdminOrderTakerManagement from "./components/AdminOrderTakerManagement";
import AdminRiderManagement from "./components/AdminRiderManagement";
import AdminCustomerManagement from "./components/AdminCustomerManagement";
import AdminSystemConfig from "./components/AdminSystemConfig";
import MenuManagement from "../manager/components/MenuManagement";
import AdminLoginGate from "./components/AdminLoginGate";

type Tab = "overview" | "staff" | "menu" | "tables" | "orders" | "reports" | "departments" | "order-takers" | "riders" | "customers" | "system";

const tabs: { id: Tab; label: string; icon: string; description: string }[] = [
  { id: "overview", label: "Dashboard", icon: "📊", description: "Full business overview" },
  { id: "staff", label: "Staff", icon: "👥", description: "Manage users & roles" },
  { id: "menu", label: "Menu", icon: "🍽️", description: "Categories & items" },
  { id: "tables", label: "Tables", icon: "🪑", description: "Table layout & status" },
  { id: "departments", label: "Departments", icon: "🏢", description: "Kitchen departments & printers" },
  { id: "order-takers", label: "Order Takers", icon: "📝", description: "Manage order takers" },
  { id: "riders", label: "Riders", icon: "🛵", description: "Manage delivery riders" },
  { id: "customers", label: "Customers", icon: "👤", description: "Customer database" },
  { id: "orders", label: "Orders", icon: "📋", description: "View & manage all orders" },
  { id: "reports", label: "Reports", icon: "📈", description: "Sales analytics & export" },
  { id: "system", label: "System", icon: "⚙️", description: "Passwords & system config" },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  return (
    <AdminLoginGate>
      {() => (
        <div style={{ background: "var(--bg-primary)" }} className="flex flex-col h-screen">
          <Navbar title="Admin Panel" backHref="/">
            <span
              style={{
                background: "rgba(232,163,61,0.15)",
                color: "var(--accent-gold)",
                border: "1px solid rgba(232,163,61,0.4)",
                borderRadius: "20px",
                padding: "3px 12px",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.05em",
              }}
            >
              ADMIN
            </span>
          </Navbar>

          {/* Tab Bar */}
          <div
            style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)" }}
            className="flex gap-1 px-4 py-2 overflow-x-auto"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                title={tab.description}
                style={{
                  background: activeTab === tab.id ? "var(--accent-maroon)" : "transparent",
                  color: activeTab === tab.id ? "var(--text-primary)" : "var(--text-secondary)",
                  border: "none",
                  borderRadius: "10px",
                  padding: "7px 16px",
                  fontSize: "13px",
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {activeTab === "overview" && <AdminOverview />}
            {activeTab === "staff" && <AdminStaffManagement />}
            {activeTab === "menu" && <MenuManagement />}
            {activeTab === "tables" && <AdminTableManagement />}
            {activeTab === "departments" && <AdminDepartmentManagement />}
            {activeTab === "order-takers" && <AdminOrderTakerManagement />}
            {activeTab === "riders" && <AdminRiderManagement />}
            {activeTab === "customers" && <AdminCustomerManagement />}
            {activeTab === "orders" && <AdminOrderManagement />}
            {activeTab === "reports" && <AdminSalesReports />}
            {activeTab === "system" && <AdminSystemConfig />}
          </div>
        </div>
      )}
    </AdminLoginGate>
  );
}

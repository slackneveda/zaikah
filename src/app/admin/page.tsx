"use client";

import { useState, useEffect } from "react";
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

type StaticTab = "overview" | "staff" | "menu" | "tables" | "orders" | "reports" | "departments" | "order-takers" | "riders" | "customers" | "system";
type ActiveTab = StaticTab | `dept-${number}`;

interface Department {
  id: number;
  name: string;
}

const staticTabs: { id: StaticTab; label: string; icon: string; description: string }[] = [
  { id: "overview", label: "Dashboard", icon: "📊", description: "Full business overview" },
  { id: "staff", label: "Staff", icon: "👥", description: "Manage users & roles" },
  { id: "menu", label: "Menu", icon: "🍽️", description: "Categories & items" },
  { id: "tables", label: "Tables", icon: "🪑", description: "Table layout & status" },
  { id: "departments", label: "Departments", icon: "🏢", description: "Manage departments & employees" },
  { id: "order-takers", label: "Employees", icon: "📝", description: "All employees" },
  { id: "riders", label: "Riders", icon: "🛵", description: "Manage delivery riders" },
  { id: "customers", label: "Customers", icon: "👤", description: "Customer database" },
  { id: "orders", label: "Orders", icon: "📋", description: "View & manage all orders" },
  { id: "reports", label: "Reports", icon: "📈", description: "Sales analytics & export" },
  { id: "system", label: "System", icon: "⚙️", description: "Passwords & system config" },
];

function DeptEmployeePanel({ deptId, deptName }: { deptId: number; deptName: string }) {
  const [employees, setEmployees] = useState<{ id: number; name: string; designation?: string | null; phone?: string | null; active: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", designation: "", phone: "" });
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const inputStyle: React.CSSProperties = { width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", color: "var(--text-primary)", borderRadius: "8px", padding: "9px 12px", fontSize: "13px", outline: "none" };

  const fetchEmps = async () => {
    setLoading(true);
    const res = await fetch(`/api/order-takers?departmentId=${deptId}&all=true`);
    const data = await res.json();
    setEmployees(Array.isArray(data) ? data.filter((e: { active: boolean }) => e.active) : []);
    setLoading(false);
  };

  useEffect(() => { fetchEmps(); }, [deptId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const body = { name: form.name.trim(), designation: form.designation.trim() || null, phone: form.phone.trim() || null, departmentId: deptId };
    const url = editId ? `/api/order-takers/${editId}` : "/api/order-takers";
    await fetch(url, { method: editId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    setForm({ name: "", designation: "", phone: "" });
    setEditId(null);
    fetchEmps();
  };

  const handleRemove = async (id: number) => {
    if (!confirm("Remove this employee?")) return;
    await fetch(`/api/order-takers/${id}`, { method: "DELETE" });
    fetchEmps();
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
      <h2 style={{ color: "var(--text-primary)", fontSize: "20px", fontWeight: 700, marginBottom: "20px" }}>{deptName} – Employees</h2>
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "20px", marginBottom: "24px" }}>
        <h3 style={{ color: "var(--text-primary)", fontSize: "15px", fontWeight: 700, marginBottom: "14px" }}>{editId ? "Edit" : "Add"} Employee</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "10px", alignItems: "end" }}>
          <div>
            <label style={{ color: "var(--text-secondary)", fontSize: "12px", display: "block", marginBottom: "4px" }}>Name *</label>
            <input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
          </div>
          <div>
            <label style={{ color: "var(--text-secondary)", fontSize: "12px", display: "block", marginBottom: "4px" }}>Designation</label>
            <input style={inputStyle} value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="e.g. Order Taker" />
          </div>
          <div>
            <label style={{ color: "var(--text-secondary)", fontSize: "12px", display: "block", marginBottom: "4px" }}>Contact Number</label>
            <input style={inputStyle} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="03XX-XXXXXXX" />
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            {editId && <button onClick={() => { setEditId(null); setForm({ name: "", designation: "", phone: "" }); }} style={{ background: "none", border: "1px solid var(--border-color)", color: "var(--text-secondary)", borderRadius: "8px", padding: "9px 14px", fontSize: "13px", cursor: "pointer" }}>Cancel</button>}
            <button onClick={handleSave} disabled={saving || !form.name.trim()} style={{ background: "var(--accent-maroon)", color: "white", border: "none", borderRadius: "8px", padding: "9px 18px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
              {saving ? "Saving..." : editId ? "Update" : "Add Employee"}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px" }}>Loading...</div>
      ) : employees.length === 0 ? (
        <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px" }}>No employees in this department yet.</div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1.5fr auto", gap: "12px", padding: "8px 16px", marginBottom: "4px" }}>
            {["Name", "Designation", "Contact", ""].map((h, i) => (
              <span key={i} style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</span>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {employees.map((emp) => (
              <div key={emp.id} style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "12px 16px", display: "grid", gridTemplateColumns: "2fr 1.5fr 1.5fr auto", gap: "12px", alignItems: "center" }}>
                <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{emp.name}</span>
                <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{emp.designation || "—"}</span>
                <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{emp.phone || "—"}</span>
                <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                  <button onClick={() => { setEditId(emp.id); setForm({ name: emp.name, designation: emp.designation ?? "", phone: emp.phone ?? "" }); }} style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "7px", padding: "5px 12px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Edit</button>
                  <button onClick={() => handleRemove(emp.id)} style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "7px", padding: "5px 12px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    const loadDepts = () =>
      fetch("/api/departments")
        .then((r) => r.json())
        .then((d) => setDepartments(Array.isArray(d) ? d : []));
    loadDepts();
    // Refresh departments every 30s so newly-added ones appear
    const interval = setInterval(loadDepts, 30000);
    return () => clearInterval(interval);
  }, []);

  const activeDeptId = activeTab.startsWith("dept-") ? parseInt(activeTab.replace("dept-", "")) : null;
  const activeDept = activeDeptId ? departments.find((d) => d.id === activeDeptId) : null;

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
            {staticTabs.map((tab) => (
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

            {/* Dynamic department tabs */}
            {departments.length > 0 && (
              <>
                <div style={{ width: "1px", background: "var(--border-color)", margin: "4px 6px" }} />
                {departments.map((dept) => {
                  const tabId: ActiveTab = `dept-${dept.id}`;
                  return (
                    <button
                      key={tabId}
                      onClick={() => setActiveTab(tabId)}
                      title={`${dept.name} employees`}
                      style={{
                        background: activeTab === tabId ? "rgba(34,197,94,0.2)" : "transparent",
                        color: activeTab === tabId ? "#22c55e" : "var(--text-secondary)",
                        border: activeTab === tabId ? "1px solid rgba(34,197,94,0.4)" : "none",
                        borderRadius: "10px",
                        padding: "7px 16px",
                        fontSize: "13px",
                        fontWeight: activeTab === tabId ? 700 : 500,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        transition: "all 0.15s",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      🏬 {dept.name}
                    </button>
                  );
                })}
              </>
            )}
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
            {activeDept && <DeptEmployeePanel deptId={activeDept.id} deptName={activeDept.name} />}
          </div>
        </div>
      )}
    </AdminLoginGate>
  );
}

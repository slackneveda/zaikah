"use client";

import { useState, useEffect, useCallback } from "react";

interface Department {
  id: number;
  name: string;
  printerName?: string | null;
  printerAddress?: string | null;
  color?: string;
  active?: boolean;
  _count?: { categories: number; orderItems: number; orderTakers: number };
}

interface Employee {
  id: number;
  name: string;
  designation?: string | null;
  phone?: string | null;
  active: boolean;
  departmentId?: number | null;
  department?: { id: number; name: string } | null;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--bg-secondary)",
  border: "1px solid var(--border-color)",
  color: "var(--text-primary)",
  borderRadius: "8px",
  padding: "9px 12px",
  fontSize: "13px",
  outline: "none",
};

const emptyDeptForm = { name: "", printerName: "", printerAddress: "" };
const emptyEmpForm = { name: "", designation: "", phone: "" };
type View = "departments" | "employees-dept" | "employees-all";

export default function AdminDepartmentManagement() {
  const [view, setView] = useState<View>("departments");
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);

  // Department state
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptLoading, setDeptLoading] = useState(true);
  const [deptForm, setDeptForm] = useState(emptyDeptForm);
  const [deptEditId, setDeptEditId] = useState<number | null>(null);
  const [deptSaving, setDeptSaving] = useState(false);

  // Employee state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [empForm, setEmpForm] = useState(emptyEmpForm);
  const [empEditId, setEmpEditId] = useState<number | null>(null);
  const [empSaving, setEmpSaving] = useState(false);

  const fetchDepartments = useCallback(async () => {
    setDeptLoading(true);
    const res = await fetch("/api/departments");
    const data = await res.json();
    setDepartments(Array.isArray(data) ? data : []);
    setDeptLoading(false);
  }, []);

  useEffect(() => { fetchDepartments(); }, [fetchDepartments]);

  const fetchEmployees = useCallback(async (deptId?: number) => {
    setEmpLoading(true);
    const url = deptId
      ? `/api/order-takers?departmentId=${deptId}&all=true`
      : "/api/order-takers?all=true";
    const res = await fetch(url);
    const data = await res.json();
    setEmployees(Array.isArray(data) ? data.filter((e: Employee) => e.active) : []);
    setEmpLoading(false);
  }, []);

  // Department CRUD
  const handleDeptSave = async () => {
    if (!deptForm.name.trim()) return;
    setDeptSaving(true);
    const body: Record<string, unknown> = { name: deptForm.name.trim() };
    if (deptForm.printerName.trim()) body.printerName = deptForm.printerName.trim();
    if (deptForm.printerAddress.trim()) body.printerAddress = deptForm.printerAddress.trim();
    const url = deptEditId ? `/api/departments/${deptEditId}` : "/api/departments";
    const method = deptEditId ? "PATCH" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setDeptSaving(false);
    setDeptForm(emptyDeptForm);
    setDeptEditId(null);
    await fetchDepartments();
  };

  const handleDeptEdit = (dept: Department) => {
    setDeptEditId(dept.id);
    setDeptForm({ name: dept.name, printerName: dept.printerName ?? "", printerAddress: dept.printerAddress ?? "" });
  };

  const handleDeptDelete = async (id: number) => {
    if (!confirm("Delete this department? Employees assigned to it will be unassigned.")) return;
    await fetch(`/api/departments/${id}`, { method: "DELETE" });
    await fetchDepartments();
  };

  // Employee CRUD
  const handleEmpSave = async () => {
    if (!empForm.name.trim()) return;
    setEmpSaving(true);
    const body: Record<string, unknown> = {
      name: empForm.name.trim(),
      designation: empForm.designation.trim() || null,
      phone: empForm.phone.trim() || null,
      departmentId: selectedDept?.id ?? null,
    };
    const url = empEditId ? `/api/order-takers/${empEditId}` : "/api/order-takers";
    const method = empEditId ? "PATCH" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setEmpSaving(false);
    setEmpForm(emptyEmpForm);
    setEmpEditId(null);
    await fetchEmployees(selectedDept?.id);
  };

  const handleEmpEdit = (emp: Employee) => {
    setEmpEditId(emp.id);
    setEmpForm({ name: emp.name, designation: emp.designation ?? "", phone: emp.phone ?? "" });
  };

  const handleEmpDelete = async (id: number) => {
    if (!confirm("Remove this employee?")) return;
    await fetch(`/api/order-takers/${id}`, { method: "DELETE" });
    await fetchEmployees(view === "employees-all" ? undefined : selectedDept?.id);
  };

  const openDeptEmployees = (dept: Department) => {
    setSelectedDept(dept);
    setEmpForm(emptyEmpForm);
    setEmpEditId(null);
    setView("employees-dept");
    fetchEmployees(dept.id);
  };

  const openAllEmployees = () => {
    setSelectedDept(null);
    setEmpForm(emptyEmpForm);
    setEmpEditId(null);
    setView("employees-all");
    fetchEmployees();
  };

  // ── Departments view ──────────────────────────────────────
  if (view === "departments") {
    return (
      <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h2 style={{ color: "var(--text-primary)", fontSize: "20px", fontWeight: 700 }}>Department Management</h2>
          <button
            onClick={openAllEmployees}
            style={{ background: "rgba(96,165,250,0.12)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.3)", borderRadius: "10px", padding: "8px 18px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
          >
            👥 View All Employees
          </button>
        </div>

        {/* Add/Edit Department Form */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "20px", marginBottom: "24px" }}>
          <h3 style={{ color: "var(--text-primary)", fontSize: "15px", fontWeight: 700, marginBottom: "14px" }}>
            {deptEditId ? "Edit Department" : "Add New Department"}
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "10px", alignItems: "end" }}>
            <div>
              <label style={{ color: "var(--text-secondary)", fontSize: "12px", display: "block", marginBottom: "4px" }}>Department Name *</label>
              <input style={inputStyle} value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} placeholder="e.g. Kitchen, Takeaway, Dine-in" />
            </div>
            <div>
              <label style={{ color: "var(--text-secondary)", fontSize: "12px", display: "block", marginBottom: "4px" }}>Printer Name</label>
              <input style={inputStyle} value={deptForm.printerName} onChange={(e) => setDeptForm({ ...deptForm, printerName: e.target.value })} placeholder="e.g. Kitchen Printer" />
            </div>
            <div>
              <label style={{ color: "var(--text-secondary)", fontSize: "12px", display: "block", marginBottom: "4px" }}>Printer IP / Address</label>
              <input style={inputStyle} value={deptForm.printerAddress} onChange={(e) => setDeptForm({ ...deptForm, printerAddress: e.target.value })} placeholder="192.168.1.100" />
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              {deptEditId && (
                <button onClick={() => { setDeptEditId(null); setDeptForm(emptyDeptForm); }} style={{ background: "none", border: "1px solid var(--border-color)", color: "var(--text-secondary)", borderRadius: "8px", padding: "9px 14px", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
              )}
              <button onClick={handleDeptSave} disabled={deptSaving || !deptForm.name.trim()} style={{ background: "var(--accent-maroon)", color: "white", border: "none", borderRadius: "8px", padding: "9px 18px", fontSize: "13px", fontWeight: 700, cursor: deptSaving ? "not-allowed" : "pointer", opacity: deptSaving ? 0.7 : 1 }}>
                {deptSaving ? "Saving..." : deptEditId ? "Update" : "Add Department"}
              </button>
            </div>
          </div>
        </div>

        {/* Department List */}
        {deptLoading ? (
          <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px" }}>Loading...</div>
        ) : departments.length === 0 ? (
          <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px" }}>No departments yet. Add one above.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {departments.map((dept) => (
              <div key={dept.id} style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <span style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "15px" }}>{dept.name}</span>
                  {dept.printerName && (
                    <span style={{ color: "var(--text-muted)", fontSize: "12px", marginLeft: "10px" }}>🖨️ {dept.printerName}</span>
                  )}
                  {dept.printerAddress && (
                    <span style={{ color: "var(--text-muted)", fontSize: "12px", marginLeft: "6px" }}>({dept.printerAddress})</span>
                  )}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => openDeptEmployees(dept)} style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "8px", padding: "6px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>👤 Employees</button>
                  <button onClick={() => handleDeptEdit(dept)} style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "8px", padding: "6px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Edit</button>
                  <button onClick={() => handleDeptDelete(dept.id)} style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "6px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Employees view (per-dept or all) ─────────────────────
  const isAllView = view === "employees-all";

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
      {/* Back nav */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <button
          onClick={() => { setView("departments"); setEmpEditId(null); setEmpForm(emptyEmpForm); }}
          style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-secondary)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "6px 14px", fontSize: "13px", cursor: "pointer" }}
        >
          ← Departments
        </button>
        <h2 style={{ color: "var(--text-primary)", fontSize: "20px", fontWeight: 700, margin: 0 }}>
          {isAllView ? "All Employees" : `${selectedDept?.name} – Employees`}
        </h2>
        {!isAllView && (
          <button
            onClick={openAllEmployees}
            style={{ marginLeft: "auto", background: "rgba(96,165,250,0.12)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.3)", borderRadius: "10px", padding: "6px 16px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
          >
            View All Employees
          </button>
        )}
      </div>

      {/* Add Employee form – only for per-dept view */}
      {!isAllView && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "20px", marginBottom: "24px" }}>
          <h3 style={{ color: "var(--text-primary)", fontSize: "15px", fontWeight: 700, marginBottom: "14px" }}>
            {empEditId ? "Edit Employee" : `Add Employee to ${selectedDept?.name}`}
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "10px", alignItems: "end" }}>
            <div>
              <label style={{ color: "var(--text-secondary)", fontSize: "12px", display: "block", marginBottom: "4px" }}>Employee Name *</label>
              <input style={inputStyle} value={empForm.name} onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })} placeholder="Full name" />
            </div>
            <div>
              <label style={{ color: "var(--text-secondary)", fontSize: "12px", display: "block", marginBottom: "4px" }}>Designation</label>
              <input style={inputStyle} value={empForm.designation} onChange={(e) => setEmpForm({ ...empForm, designation: e.target.value })} placeholder="e.g. Order Taker, Cashier" />
            </div>
            <div>
              <label style={{ color: "var(--text-secondary)", fontSize: "12px", display: "block", marginBottom: "4px" }}>Contact Number</label>
              <input style={inputStyle} value={empForm.phone} onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })} placeholder="03XX-XXXXXXX" />
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              {empEditId && (
                <button onClick={() => { setEmpEditId(null); setEmpForm(emptyEmpForm); }} style={{ background: "none", border: "1px solid var(--border-color)", color: "var(--text-secondary)", borderRadius: "8px", padding: "9px 14px", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
              )}
              <button onClick={handleEmpSave} disabled={empSaving || !empForm.name.trim()} style={{ background: "var(--accent-maroon)", color: "white", border: "none", borderRadius: "8px", padding: "9px 18px", fontSize: "13px", fontWeight: 700, cursor: empSaving ? "not-allowed" : "pointer", opacity: empSaving ? 0.7 : 1 }}>
                {empSaving ? "Saving..." : empEditId ? "Update" : "Add Employee"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee list */}
      {empLoading ? (
        <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px" }}>Loading...</div>
      ) : employees.length === 0 ? (
        <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px" }}>
          {isAllView ? "No employees found." : "No employees in this department yet. Add one above."}
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: isAllView ? "2fr 1.5fr 1.5fr 1.5fr auto" : "2fr 1.5fr 1.5fr auto", gap: "12px", padding: "8px 16px", marginBottom: "4px" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Name</span>
            <span style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Designation</span>
            <span style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Contact</span>
            {isAllView && <span style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Department</span>}
            <span />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {employees.map((emp) => (
              <div key={emp.id} style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "12px 16px", display: "grid", gridTemplateColumns: isAllView ? "2fr 1.5fr 1.5fr 1.5fr auto" : "2fr 1.5fr 1.5fr auto", gap: "12px", alignItems: "center" }}>
                <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "14px" }}>{emp.name}</span>
                <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{emp.designation ?? <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>—</span>}</span>
                <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{emp.phone ?? <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>—</span>}</span>
                {isAllView && (
                  <span style={{ color: "var(--accent-gold)", fontSize: "13px", fontWeight: 600 }}>
                    {emp.department?.name ?? <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Unassigned</span>}
                  </span>
                )}
                <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                  {!isAllView && (
                    <button onClick={() => handleEmpEdit(emp)} style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "7px", padding: "5px 12px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Edit</button>
                  )}
                  <button onClick={() => handleEmpDelete(emp.id)} style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "7px", padding: "5px 12px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

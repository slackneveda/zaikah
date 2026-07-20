"use client";

import { useEffect, useState } from "react";

interface MenuItem {
  id: number;
  name: string;
  price: number;
  available: boolean;
  image: string | null;
}

interface Category {
  id: number;
  name: string;
  icon: string | null;
  items: MenuItem[];
}

export default function MenuManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showItemForm, setShowItemForm] = useState(false);
  const [showCatForm, setShowCatForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const [itemForm, setItemForm] = useState({
    name: "",
    price: "",
    categoryId: "",
    available: true,
  });
  const [catForm, setCatForm] = useState({ name: "", icon: "" });

  const fetchCategories = async () => {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data);
    if (data.length > 0 && !activeCategory) setActiveCategory(data[0].id);
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeItems =
    categories.find((c) => c.id === activeCategory)?.items ?? [];

  const handleSaveItem = async () => {
    if (!itemForm.name || !itemForm.price || !itemForm.categoryId) return;
    if (editingItem) {
      await fetch(`/api/menu-items/${editingItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: itemForm.name,
          price: parseFloat(itemForm.price),
          categoryId: parseInt(itemForm.categoryId),
          available: itemForm.available,
        }),
      });
    } else {
      await fetch("/api/menu-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: itemForm.name,
          price: parseFloat(itemForm.price),
          categoryId: parseInt(itemForm.categoryId),
          available: itemForm.available,
        }),
      });
    }
    setShowItemForm(false);
    setEditingItem(null);
    setItemForm({ name: "", price: "", categoryId: String(activeCategory ?? ""), available: true });
    fetchCategories();
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm("Delete this menu item?")) return;
    await fetch(`/api/menu-items/${id}`, { method: "DELETE" });
    fetchCategories();
  };

  const handleToggleAvailable = async (item: MenuItem) => {
    await fetch(`/api/menu-items/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available: !item.available }),
    });
    fetchCategories();
  };

  const handleSaveCategory = async () => {
    if (!catForm.name) return;
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: catForm.name, icon: catForm.icon }),
    });
    setShowCatForm(false);
    setCatForm({ name: "", icon: "" });
    fetchCategories();
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("Delete this category and all its items?")) return;
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    setActiveCategory(null);
    fetchCategories();
  };

  const openEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      price: String(item.price),
      categoryId: String(activeCategory ?? ""),
      available: item.available,
    });
    setShowItemForm(true);
  };

  const inputStyle: React.CSSProperties = {
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-color)",
    color: "var(--text-primary)",
    borderRadius: "8px",
    outline: "none",
    padding: "8px 12px",
    width: "100%",
    fontSize: "14px",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p style={{ color: "var(--text-muted)" }} className="animate-pulse text-sm">
          Loading menu...
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: Categories sidebar */}
      <div
        style={{ background: "var(--bg-secondary)", borderRight: "1px solid var(--border-color)", width: "220px", flexShrink: 0 }}
        className="flex flex-col"
      >
        <div
          style={{ borderBottom: "1px solid var(--border-color)" }}
          className="p-3 flex items-center justify-between"
        >
          <span style={{ color: "var(--text-secondary)" }} className="text-xs font-semibold uppercase tracking-wider">
            Categories
          </span>
          <button
            onClick={() => setShowCatForm(true)}
            style={{ color: "var(--accent-gold)", fontSize: "18px", lineHeight: 1 }}
            className="hover:opacity-80"
            title="Add category"
          >
            +
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                background: activeCategory === cat.id ? "var(--accent-maroon)" : "transparent",
                color: activeCategory === cat.id ? "var(--text-primary)" : "var(--text-secondary)",
                borderRadius: "8px",
                cursor: "pointer",
                padding: "8px 10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
              className="hover:opacity-90 transition-all"
            >
              <span className="text-sm flex items-center gap-1.5">
                {cat.icon && <span>{cat.icon}</span>}
                {cat.name}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteCategory(cat.id);
                }}
                style={{ color: "rgba(239,68,68,0.7)", fontSize: "11px" }}
                className="hover:text-red-400"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Items */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div
          style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)" }}
          className="p-3 flex items-center justify-between"
        >
          <span style={{ color: "var(--text-primary)" }} className="font-semibold text-sm">
            {categories.find((c) => c.id === activeCategory)?.name ?? "Select a category"}
            <span style={{ color: "var(--text-muted)" }} className="font-normal ml-2">
              ({activeItems.length} items)
            </span>
          </span>
          {activeCategory && (
            <button
              onClick={() => {
                setEditingItem(null);
                setItemForm({ name: "", price: "", categoryId: String(activeCategory), available: true });
                setShowItemForm(true);
              }}
              style={{
                background: "var(--accent-maroon)",
                color: "var(--text-primary)",
                borderRadius: "8px",
                padding: "6px 14px",
                fontSize: "13px",
                fontWeight: 600,
              }}
              className="hover:opacity-90"
            >
              + Add Item
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)" }}>
                {["Name", "Price", "Available", "Actions"].map((h) => (
                  <th
                    key={h}
                    style={{ color: "var(--text-muted)" }}
                    className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeItems.map((item) => (
                <tr
                  key={item.id}
                  style={{ borderBottom: "1px solid var(--border-color)" }}
                  className="hover:bg-slate-800 transition-colors"
                >
                  <td style={{ color: "var(--text-primary)" }} className="px-4 py-3">
                    {item.name}
                  </td>
                  <td style={{ color: "var(--accent-gold)" }} className="px-4 py-3 font-semibold">
                    Rs. {item.price.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleAvailable(item)}
                      style={{
                        background: item.available
                          ? "rgba(34,197,94,0.15)"
                          : "rgba(239,68,68,0.15)",
                        color: item.available ? "var(--success)" : "var(--danger)",
                        border: `1px solid ${item.available ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"}`,
                        borderRadius: "20px",
                        padding: "2px 10px",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      {item.available ? "✓ Available" : "✗ Unavailable"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditItem(item)}
                        style={{ color: "#60A5FA", fontSize: "12px" }}
                        className="hover:opacity-80"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        style={{ color: "var(--danger)", fontSize: "12px" }}
                        className="hover:opacity-80"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {activeItems.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center">
                    <p style={{ color: "var(--text-muted)" }} className="text-sm">
                      No items in this category
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Item Form Modal */}
      {showItemForm && (
        <div
          style={{ background: "rgba(0,0,0,0.7)" }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowItemForm(false)}
        >
          <div
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "16px" }}
            className="w-full max-w-md p-6 space-y-4"
          >
            <h3 style={{ color: "var(--text-primary)" }} className="font-bold text-lg">
              {editingItem ? "Edit Menu Item" : "Add Menu Item"}
            </h3>
            <div className="space-y-3">
              <input
                style={inputStyle}
                placeholder="Item name"
                value={itemForm.name}
                onChange={(e) => setItemForm((p) => ({ ...p, name: e.target.value }))}
              />
              <input
                style={inputStyle}
                placeholder="Price (Rs.)"
                type="number"
                value={itemForm.price}
                onChange={(e) => setItemForm((p) => ({ ...p, price: e.target.value }))}
              />
              <select
                style={inputStyle}
                value={itemForm.categoryId}
                onChange={(e) => setItemForm((p) => ({ ...p, categoryId: e.target.value }))}
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={itemForm.available}
                  onChange={(e) => setItemForm((p) => ({ ...p, available: e.target.checked }))}
                  className="w-4 h-4"
                />
                <span style={{ color: "var(--text-secondary)" }} className="text-sm">
                  Available
                </span>
              </label>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSaveItem}
                style={{ background: "var(--accent-maroon)", color: "var(--text-primary)" }}
                className="flex-1 py-2.5 rounded-lg font-semibold hover:opacity-90 text-sm"
              >
                {editingItem ? "Save Changes" : "Add Item"}
              </button>
              <button
                onClick={() => {
                  setShowItemForm(false);
                  setEditingItem(null);
                }}
                style={{
                  background: "var(--bg-secondary)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-color)",
                }}
                className="px-4 rounded-lg font-semibold hover:opacity-90 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Form Modal */}
      {showCatForm && (
        <div
          style={{ background: "rgba(0,0,0,0.7)" }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowCatForm(false)}
        >
          <div
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "16px" }}
            className="w-full max-w-sm p-6 space-y-4"
          >
            <h3 style={{ color: "var(--text-primary)" }} className="font-bold text-lg">
              Add Category
            </h3>
            <div className="space-y-3">
              <input
                style={inputStyle}
                placeholder="Category name"
                value={catForm.name}
                onChange={(e) => setCatForm((p) => ({ ...p, name: e.target.value }))}
              />
              <input
                style={inputStyle}
                placeholder="Icon (emoji) — optional"
                value={catForm.icon}
                onChange={(e) => setCatForm((p) => ({ ...p, icon: e.target.value }))}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSaveCategory}
                style={{ background: "var(--accent-maroon)", color: "var(--text-primary)" }}
                className="flex-1 py-2.5 rounded-lg font-semibold hover:opacity-90 text-sm"
              >
                Add Category
              </button>
              <button
                onClick={() => setShowCatForm(false)}
                style={{
                  background: "var(--bg-secondary)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-color)",
                }}
                className="px-4 rounded-lg font-semibold hover:opacity-90 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useOrderStore } from "@/store/orderStore";

interface MenuItem {
  id: number;
  name: string;
  price: number;
  available: boolean;
}

interface Category {
  id: number;
  name: string;
  icon: string | null;
  items: MenuItem[];
  department: { id: number; name: string } | null;
}

type SectionType = "kitchen" | "drinks";

const SECTION_CONFIG: Record<SectionType, { label: string; icon: string; deptName: string; itemIcon: string }> = {
  kitchen: { label: "Kitchen", icon: "🍽️", deptName: "Kitchen", itemIcon: "🍽️" },
  drinks: { label: "Drinks", icon: "🥤", deptName: "Drinks", itemIcon: "🥤" },
};

export default function MenuGrid() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeSection, setActiveSection] = useState<SectionType>("kitchen");
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const addItem = useOrderStore((s) => s.addItem);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data: Category[]) => {
        setCategories(data);
        const first = data.find((c) => c.department?.name === "Kitchen");
        if (first) setActiveCategory(first.id);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const sectionCategories = categories.filter(
    (c) => c.department?.name === SECTION_CONFIG[activeSection].deptName
  );

  const activeItems =
    sectionCategories.find((c) => c.id === activeCategory)?.items ?? [];

  const handleSectionChange = (section: SectionType) => {
    setActiveSection(section);
    const first = categories.find(
      (c) => c.department?.name === SECTION_CONFIG[section].deptName
    );
    setActiveCategory(first?.id ?? null);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div style={{ color: "var(--text-muted)" }} className="text-sm animate-pulse">
          Loading menu...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Section Switcher: Kitchen / Drinks */}
      <div
        style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border-color)" }}
        className="flex"
      >
        {(Object.keys(SECTION_CONFIG) as SectionType[]).map((section) => {
          const cfg = SECTION_CONFIG[section];
          const isActive = activeSection === section;
          return (
            <button
              key={section}
              onClick={() => handleSectionChange(section)}
              style={{
                flex: 1,
                padding: "10px 0",
                background: isActive ? "var(--accent-maroon)" : "transparent",
                color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                border: "none",
                borderBottom: isActive ? "2px solid var(--accent-gold)" : "2px solid transparent",
                fontWeight: isActive ? 700 : 500,
                fontSize: "14px",
                cursor: "pointer",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <span>{cfg.icon}</span>
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Category Tabs */}
      <div
        style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)" }}
        className="flex gap-1 p-2 overflow-x-auto"
      >
        {sectionCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              background:
                activeCategory === cat.id
                  ? "var(--accent-maroon)"
                  : "var(--bg-card)",
              color:
                activeCategory === cat.id
                  ? "var(--text-primary)"
                  : "var(--text-secondary)",
              border:
                activeCategory === cat.id
                  ? "1px solid var(--accent-maroon)"
                  : "1px solid var(--border-color)",
              whiteSpace: "nowrap",
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5"
          >
            {cat.icon && <span>{cat.icon}</span>}
            {cat.name}
          </button>
        ))}
        {sectionCategories.length === 0 && (
          <span style={{ color: "var(--text-muted)", fontSize: "13px", padding: "8px" }}>
            No categories yet
          </span>
        )}
      </div>

      {/* Items Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
          {activeItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                const cat = sectionCategories.find((c) => c.id === activeCategory);
                addItem({
                  id: item.id,
                  name: item.name,
                  price: item.price,
                  departmentId: cat?.department?.id,
                  departmentName: cat?.department?.name,
                });
              }}
              disabled={!item.available}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
                borderRadius: "12px",
                padding: "16px",
                textAlign: "left",
                cursor: item.available ? "pointer" : "not-allowed",
                opacity: item.available ? 1 : 0.4,
                transition: "border-color 0.15s, transform 0.1s",
              }}
              onMouseEnter={(e) => {
                if (item.available) (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent-gold)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-color)";
              }}
            >
              <div className="text-2xl mb-2">
                {activeSection === "drinks" ? "🥤" : "🍽️"}
              </div>
              <p className="text-sm font-medium leading-tight mb-1">{item.name}</p>
              <p style={{ color: "var(--accent-gold)" }} className="text-sm font-bold">
                Rs. {item.price.toFixed(0)}
              </p>
            </button>
          ))}
          {activeItems.length === 0 && (
            <div
              className="col-span-full text-center py-10"
              style={{ color: "var(--text-muted)" }}
            >
              No items in this category
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const portals = [
  {
    id: "takeaway",
    label: "Takeaway",
    icon: "🛍️",
    description: "Quick counter orders & pickup",
    href: "/takeaway",
  },
  {
    id: "dine-in",
    label: "Dine In",
    icon: "🍽️",
    description: "Table service & restaurant orders",
    href: "/dine-in",
  },
  {
    id: "manager",
    label: "Manager",
    icon: "📊",
    description: "Reports, history & menu management",
    href: "/manager",
  },
  {
    id: "admin",
    label: "Admin",
    icon: "⚙️",
    description: "Staff, settings & system config",
    href: "/admin",
  },
];

export default function HomePage() {
  const [selected, setSelected] = useState<string | null>(null);
  const router = useRouter();

  const handleSelect = (id: string, href: string) => {
    setSelected(id);
    setTimeout(() => router.push(href), 200);
  };

  return (
    <div
      style={{
        background: "var(--bg-primary)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div className="mb-10 text-center">
        <Image
          src="/WhatsApp Image 2026-07-14 at 9.23.32 PM.jpeg"
          alt="ZAIKAH"
          width={400}
          height={110}
          className="object-contain mx-auto mb-4"
          priority
        />
        <p style={{ color: "var(--text-muted)" }} className="text-sm uppercase tracking-widest">
          Point of Sale System
        </p>
      </div>

      <div className="mb-8 w-full max-w-3xl">
        <p style={{ color: "var(--text-secondary)" }} className="text-center text-sm mb-6 uppercase tracking-wider">
          Select a portal to begin
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          {portals.map((portal) => (
            <button
              key={portal.id}
              onClick={() => handleSelect(portal.id, portal.href)}
              style={{
                background: "var(--bg-card)",
                border: selected === portal.id
                  ? "2px solid var(--accent-gold)"
                  : "1px solid var(--border-color)",
                boxShadow:
                  selected === portal.id
                    ? "0 0 20px rgba(232,163,61,0.3)"
                    : "none",
                transition: "all 0.2s ease",
              }}
              className="rounded-2xl p-6 flex flex-col items-center gap-3 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span className="text-4xl">{portal.icon}</span>
              <span style={{ color: "var(--text-primary)" }} className="font-bold text-lg">
                {portal.label}
              </span>
              <span style={{ color: "var(--text-muted)" }} className="text-xs text-center leading-tight">
                {portal.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      <p style={{ color: "var(--text-muted)" }} className="text-xs">
        ZAIKAH POS v1.0 — Flavour That Feels Like Home
      </p>
    </div>
  );
}

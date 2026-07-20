"use client";

import Image from "next/image";
import Link from "next/link";

interface NavbarProps {
  title?: string;
  backHref?: string;
  onBack?: () => void;
  children?: React.ReactNode;
}

export default function Navbar({ title, backHref, onBack, children }: NavbarProps) {
  return (
    <nav
      style={{
        background: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border-color)",
      }}
      className="flex items-center justify-between px-4 py-2 h-14 sticky top-0 z-50"
    >
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            style={{ color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer", fontSize: "14px" }}
            className="hover:opacity-80 transition-opacity flex items-center gap-1"
          >
            ← Back
          </button>
        )}
        {backHref && !onBack && (
          <Link
            href={backHref}
            style={{ color: "var(--text-secondary)" }}
            className="hover:opacity-80 transition-opacity text-sm flex items-center gap-1"
          >
            ← Back
          </Link>
        )}
        <Image
          src="/WhatsApp Image 2026-07-14 at 9.23.32 PM.jpeg"
          alt="ZAIKAH Logo"
          width={120}
          height={36}
          className="object-contain h-9 w-auto"
          priority
        />
        {title && (
          <>
            <span style={{ color: "var(--border-color)" }} className="text-lg">
              |
            </span>
            <span
              style={{ color: "var(--text-primary)" }}
              className="font-semibold text-sm uppercase tracking-wider"
            >
              {title}
            </span>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </nav>
  );
}

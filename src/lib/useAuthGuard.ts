"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useAuthGuard(requiredRole?: string) {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = sessionStorage.getItem("zaikah_session");
    if (!raw) {
      router.replace("/");
      return;
    }
    if (requiredRole) {
      try {
        const session = JSON.parse(raw);
        // Allow both portal id ("dine-in") and DB role name ("dining") to match
        const roleAliases: Record<string, string[]> = {
          "dine-in": ["dine-in", "dining"],
          "takeaway": ["takeaway"],
          "delivery": ["delivery", "home-delivery"],
          "manager": ["manager"],
          "admin": ["admin"],
        };
        const allowed = roleAliases[requiredRole] ?? [requiredRole];
        if (!allowed.includes(session.role)) {
          router.replace("/");
        }
      } catch {
        router.replace("/");
      }
    }
  }, [router, requiredRole]);
}

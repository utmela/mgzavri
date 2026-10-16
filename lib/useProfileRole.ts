"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { api } from "./api";
import { supabase } from "./supabase";

export type MarketplaceRole = "passenger" | "driver" | "verified_driver" | "admin";

function normalizeRole(value: unknown): MarketplaceRole {
  return value === "driver" || value === "verified_driver" || value === "admin"
    ? value
    : "passenger";
}

export function useProfileRole() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<MarketplaceRole>("passenger");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let revision = 0;

    async function applyUser(nextUser: User | null) {
      if (!active) return;
      const ticket = ++revision;
      setRole("passenger");
      setUser(nextUser);
      if (!nextUser) {
        setRole("passenger");
        setLoading(false);
        return;
      }

      const { data } = await api<{ role: string }>("/profile");

      if (!active || ticket !== revision) return;
      setRole(normalizeRole(data?.role));
      setLoading(false);
    }

    supabase.auth.getUser().then(({ data }) => { if (revision === 0) void applyUser(data.user); });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && window.location.pathname !== "/auth/reset-password") { router.replace("/auth/reset-password"); return; }
      setLoading(true);
      void applyUser(session?.user ?? null);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [router]);

  return {
    user,
    role,
    loading,
    canDrive: role === "driver" || role === "verified_driver" || role === "admin",
    isAdmin: role === "admin",
  };
}

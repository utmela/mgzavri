import { useEffect, useState } from "react";
import { api } from "./api";
import { supabase } from "./supabase";

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [ready,   setReady]   = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { setReady(true); return; }

      const { data: profile } = await api<{ role: string }>("/profile");

      setIsAdmin(profile?.role === "admin");
      setReady(true);
    });
  }, []);

  return { isAdmin, ready };
}
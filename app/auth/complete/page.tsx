"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { api } from "../../../lib/api";
import { safeReturnTo } from "../../../lib/auth-redirect";

export default function AuthCompletePage() {
  const router = useRouter();
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!active) return;
      if (error || !data.user) { setError("This sign-in link is invalid or has expired. Request a new link or sign in again."); return; }
      const [profile, assurance] = await Promise.all([api<{ role: string }>("/profile"), supabase.auth.mfa.getAuthenticatorAssuranceLevel()]);
      if (!active) return;
      const next = safeReturnTo(new URLSearchParams(window.location.search).get("next"));
      router.replace(profile.data?.role === "admin" || assurance.data?.nextLevel === "aal2" ? `/security?next=${encodeURIComponent(profile.data?.role === "admin" ? "/admin" : next)}` : next);
      router.refresh();
    })();
    return () => { active = false; };
  }, [router]);
  return <section className="mx-auto max-w-lg px-4 py-16"><h1 className="text-2xl font-black">Completing sign-in</h1>{error ? <><p role="alert" className="mt-5 text-red-700">{error}</p><Link href="/auth" className="mt-5 inline-flex font-bold text-violet-700">Back to sign in</Link></> : <p role="status" className="mt-4 text-slate-600">Please wait...</p>}</section>;
}

"use client";

import { useEffect, useState } from "react";
import { IconPhone } from "@tabler/icons-react";
import { getDriverPhone } from "../lib/rides";
import { supabase } from "../lib/supabase";
import type { Lang } from "../lib/cities";

export default function DriverContact({ rideId, lang }: { rideId: string; lang: Lang }) {
  const [phone, setPhone] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    getDriverPhone(rideId).then((value) => {
      if (active) { setPhone(value); setFailed(false); }
    }).catch(() => { if (active) setFailed(true); });
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") { active = false; setPhone(null); }
    });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, [rideId, attempt]);

  if (failed) return <button type="button" onClick={() => setAttempt((value) => value + 1)} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700">{lang === "ka" ? "ნომრის ჩატვირთვის გამეორება" : "Retry driver contact"}</button>;
  if (!phone) return null;
  return <a href={`tel:${phone}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-black text-white"><IconPhone size={16} />{lang === "ka" ? "მძღოლთან დარეკვა" : "Call driver"}</a>;
}

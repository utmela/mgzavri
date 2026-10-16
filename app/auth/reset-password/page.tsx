"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { useLanguage } from "../../../components/LanguageProvider";

export default function ResetPasswordPage() {
  const { lang } = useLanguage();
  const ka = lang === "ka";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => { if (active) { setSignedIn(Boolean(data.user)); setReady(true); } });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => { if (active) { setSignedIn(Boolean(session?.user)); setReady(true); } });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError("");
    if (password.length < 12 || password !== confirmation) { setError(ka ? "პაროლი უნდა შეიცავდეს მინიმუმ 12 სიმბოლოს და ორივე ველი უნდა ემთხვეოდეს." : "Use at least 12 characters and make both passwords match."); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      // Revoke existing refresh sessions, including this recovery session.
      const signedOut = await supabase.auth.signOut({ scope: "global" });
      if (signedOut.error) throw signedOut.error;
      setPassword(""); setConfirmation(""); setDone(true);
    } catch (error) { setError(error instanceof Error ? error.message : "Password update failed."); }
    finally { setBusy(false); }
  }

  return <section className="mx-auto max-w-lg px-4 py-14"><h1 className="text-3xl font-black">{ka ? "პაროლის განახლება" : "Set a new password"}</h1>
    {!ready ? <p role="status" className="mt-6">{ka ? "იტვირთება..." : "Loading..."}</p> : done ? <p role="status" className="mt-6 rounded-xl bg-green-50 p-4 font-semibold text-green-800">{ka ? "პაროლი განახლდა. შედით ახალი პაროლით." : "Password updated. Sign in with your new password."}</p> : !signedIn ? <p className="mt-6 text-slate-600">{ka ? "ბმული ვადაგასულია. შესვლის გვერდიდან მოითხოვეთ ახალი აღდგენის ბმული." : "This recovery link is missing or has expired. Request a new one from the sign-in page."}</p> : <form onSubmit={submit} className="mt-7 space-y-5">
      <label className="block font-bold">{ka ? "ახალი პაროლი" : "New password"}<input type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-300 px-4" /></label>
      <label className="block font-bold">{ka ? "გაიმეორეთ პაროლი" : "Confirm password"}<input type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-300 px-4" /></label>
      <button disabled={busy} className="w-full rounded-xl bg-violet-700 px-5 py-3 font-bold text-white disabled:opacity-50">{ka ? "პაროლის შენახვა" : "Save password"}</button>
    </form>}
    {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    <Link href="/auth" className="mt-6 inline-flex font-bold text-violet-700">{ka ? "შესვლის გვერდი" : "Back to sign in"}</Link>
  </section>;
}

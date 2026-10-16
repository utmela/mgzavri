"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { safeReturnTo } from "../../lib/auth-redirect";
import { useLanguage } from "../../components/LanguageProvider";

type Factor = { id: string; friendly_name?: string };
export default function SecurityPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const ka = lang === "ka";
  const [factors, setFactors] = useState<Factor[]>([]);
  const [factorId, setFactorId] = useState("");
  const [qr, setQr] = useState("");
  const [code, setCode] = useState("");
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      setSignedIn(Boolean(data.user));
      if (data.user) {
        const [list, assurance] = await Promise.all([supabase.auth.mfa.listFactors(), supabase.auth.mfa.getAuthenticatorAssuranceLevel()]);
        if (!active) return;
        if (list.error || assurance.error) setError(list.error?.message || assurance.error?.message || "Security settings could not be loaded.");
        const enrolled = list.data?.totp ?? [];
        setFactors(enrolled);
        setFactorId(enrolled[0]?.id ?? "");
        setVerified(assurance.data?.currentLevel === "aal2");
      }
      setReady(true);
    })();
    return () => { active = false; };
  }, []);

  async function enroll() {
    setBusy(true); setError("");
    try {
      // Remove only unfinished enrollments, never a verified device.
      const existing = await supabase.auth.mfa.listFactors();
      if (existing.error) throw existing.error;
      for (const factor of existing.data.all.filter((item) => item.factor_type === "totp" && item.status === "unverified")) {
        const removed = await supabase.auth.mfa.unenroll({ factorId: factor.id });
        if (removed.error) throw removed.error;
      }
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Mgzavri authenticator" });
      if (error) throw error;
      setFactorId(data.id); setQr(data.totp.qr_code);
    } catch (error) { setError(error instanceof Error ? error.message : "Enrollment failed."); }
    finally { setBusy(false); }
  }

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) { setError(ka ? "შეიყვანეთ 6-ციფრიანი კოდი." : "Enter the six-digit authenticator code."); return; }
    setBusy(true); setError("");
    try {
      const result = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
      if (result.error) throw result.error;
      setQr(""); setCode(""); setVerified(true);
      const next = safeReturnTo(new URLSearchParams(window.location.search).get("next"));
      router.replace(next); router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : "Verification failed."); }
    finally { setBusy(false); }
  }

  const inputClass = "mt-2 h-12 w-full rounded-xl border border-slate-300 px-4 font-semibold focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-100";
  return <section className="mx-auto max-w-lg px-4 py-12">
    <h1 className="text-3xl font-black text-slate-950">{ka ? "ანგარიშის უსაფრთხოება" : "Account security"}</h1>
    <p className="mt-3 text-sm leading-6 text-slate-600">{ka ? "ადმინის ხელსაწყოებისთვის საჭიროა ავთენტიფიკატორის აპით დადასტურება." : "Admin tools require verification with an authenticator app."}</p>
    {!ready ? <p role="status" className="mt-6">{ka ? "იტვირთება..." : "Loading..."}</p> : !signedIn ? <Link href="/auth?next=%2Fsecurity" className="mt-6 inline-flex rounded-xl bg-violet-700 px-5 py-3 font-bold text-white">{ka ? "შესვლა" : "Sign in"}</Link> : verified ? <div className="mt-6 rounded-xl bg-green-50 p-5"><p className="font-bold text-green-800">{ka ? "სესია დაცულია მეორე ფაქტორით." : "This session is verified with a second factor."}</p><Link href="/" className="mt-4 inline-flex font-bold text-violet-700">{ka ? "მთავარზე დაბრუნება" : "Return to the site"}</Link></div> : <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {!factorId ? <button type="button" disabled={busy} onClick={() => void enroll()} className="w-full rounded-xl bg-violet-700 px-5 py-3 font-bold text-white disabled:opacity-50">{ka ? "ავთენტიფიკატორის დამატება" : "Set up authenticator"}</button> : <form onSubmit={verify}>
        {qr && <><p className="text-sm text-slate-600">{ka ? "დაასკანერეთ QR კოდი თქვენს ავთენტიფიკატორის აპში და შეიყვანეთ კოდი. QR კოდი პირადია." : "Scan this QR code in your authenticator app, then enter its code. Keep the QR code private."}</p><Image src={qr} alt={ka ? "პირადი ავთენტიფიკატორის QR კოდი" : "Private authenticator enrollment QR code"} width={220} height={220} unoptimized className="mx-auto my-5" /></>}
        {!qr && factors.length > 1 && <label className="block text-sm font-bold">{ka ? "მოწყობილობა" : "Authenticator"}<select className={inputClass} value={factorId} onChange={(event) => setFactorId(event.target.value)}>{factors.map((factor) => <option key={factor.id} value={factor.id}>{factor.friendly_name || "Authenticator"}</option>)}</select></label>}
        <label className="mt-4 block text-sm font-bold">{ka ? "6-ციფრიანი კოდი" : "Six-digit code"}<input className={inputClass} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} required /></label>
        <button disabled={busy} className="mt-5 w-full rounded-xl bg-violet-700 px-5 py-3 font-bold text-white disabled:opacity-50">{ka ? "დადასტურება" : "Verify and continue"}</button>
      </form>}
    </div>}
    {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}
    <p className="mt-6 text-xs leading-5 text-slate-500">{ka ? "მოწყობილობის დაკარგვისას მიმართეთ საიტის ოპერატორს. მხარდაჭერამ უნდა გადაამოწმოს ვინაობა წვდომის აღდგენამდე." : "If you lose your authenticator, contact the site operator. Recovery requires identity verification before a factor is reset."}</p>
  </section>;
}

"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "../../components/LanguageProvider";
import {
  IconArrowLeft, IconBus, IconMail, IconLock, IconUser,
  IconPhone, IconCircleCheck, IconAlertCircle, IconLoader2,
} from "@tabler/icons-react";

const T = {
  en: {
    back: "Back to home", welcome: "Welcome back", create: "Create account",
    email: "Email", password: "Password", name: "Full name", phone: "Phone number",
    signIn: "Sign in", signUp: "Create account", loading: "Loading…",
    noAccount: "Don't have an account? Sign up",
    haveAccount: "Already have an account? Sign in",
    created: "Account created! You can now sign in.",
    or: "or", continueGoogle: "Continue with Google",
  },
  ka: {
    back: "მთავარ გვერდზე დაბრუნება", welcome: "კეთილი დაბრუნება", create: "ანგარიშის შექმნა",
    email: "ელფოსტა", password: "პაროლი", name: "სახელი", phone: "ტელეფონი",
    signIn: "შესვლა", signUp: "რეგისტრაცია", loading: "იტვირთება…",
    noAccount: "ანგარიში არ გაქვთ? დარეგისტრირდით",
    haveAccount: "უკვე გაქვთ ანგარიში? შედით",
    created: "ანგარიში შეიქმნა! ახლა შეგიძლიათ შესვლა.",
    or: "ან", continueGoogle: "Google-ით შესვლა",
  },
};

export default function AuthPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const t = T[lang as "en" | "ka"];

  const [email,         setEmail]         = useState("");
  const [password,      setPassword]      = useState("");
  const [name,          setName]          = useState("");
  const [phone,         setPhone]         = useState("");
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isLogin,       setIsLogin]       = useState(true);
  const [message,       setMessage]       = useState("");
  const [msgType,       setMsgType]       = useState<"ok" | "err">("err");

  async function handleGoogle() {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) { setMessage(error.message); setMsgType("err"); setGoogleLoading(false); }
  }

  async function handleAuth() {
    setLoading(true); setMessage("");
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setMessage(error.message); setMsgType("err"); }
      else { router.push("/"); router.refresh(); }
    } else {
      if (!name || !phone || !email || !password) {
        setMessage("Please fill all fields"); setMsgType("err"); setLoading(false); return;
      }
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) { setMessage(error.message); setMsgType("err"); setLoading(false); return; }
      if (data.user) {
        await supabase.from("profiles").update({ name, phone }).eq("id", data.user.id);
      }
      setMessage(t.created); setMsgType("ok"); setIsLogin(true);
    }
    setLoading(false);
  }

  const inp = "h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm font-extrabold text-gray-800 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition placeholder-gray-400";

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Back link */}
        <div className="mb-6">
          <Link href="/"
            className="inline-flex items-center gap-1.5 rounded-2xl border-2 border-gray-200 bg-white px-4 py-2 text-sm font-black text-gray-700 shadow-sm hover:bg-gray-50 hover:text-violet-600 hover:border-violet-200 transition">
            <IconArrowLeft size={16} stroke={2.5} /> {t.back}
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          {/* Header */}
          <div className="bg-gradient-to-br from-[#1a1035] via-[#2d1f6e] to-[#1a1035] px-6 py-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 border border-white/20">
              <IconBus size={28} stroke={1.5} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-white">{isLogin ? t.welcome : t.create}</h1>
            <p className="mt-1 text-sm font-bold text-white/50">mgzavri.ge</p>
          </div>

          <div className="p-6 space-y-4">

            {/* Google */}
            <button onClick={handleGoogle} disabled={googleLoading}
              className="w-full h-12 rounded-xl border border-gray-200 bg-white text-gray-700 font-black text-sm flex items-center justify-center gap-3 hover:bg-gray-50 transition shadow-sm disabled:opacity-60">
              {googleLoading ? (
                <><IconLoader2 size={16} className="animate-spin" /> {t.loading}</>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  {t.continueGoogle}
                </>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{t.or}</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Sign-up fields */}
            {!isLogin && (
              <>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-gray-400">
                    <IconUser size={11} stroke={2.5} /> {t.name}
                  </label>
                  <input value={name} onChange={e => setName(e.target.value)} className={inp} />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-gray-400">
                    <IconPhone size={11} stroke={2.5} /> {t.phone}
                  </label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="599 123 456" className={inp} />
                </div>
              </>
            )}

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-gray-400">
                <IconMail size={11} stroke={2.5} /> {t.email}
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inp} />
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-gray-400">
                <IconLock size={11} stroke={2.5} /> {t.password}
              </label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className={inp} />
            </div>

            {/* Message */}
            {message && (
              <div className={`rounded-xl px-4 py-3 text-sm font-black flex items-center gap-2 ${
                msgType === "ok"
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-red-600"
              }`}>
                {msgType === "ok"
                  ? <IconCircleCheck size={16} stroke={2.5} />
                  : <IconAlertCircle size={16} stroke={2.5} />}
                {message}
              </div>
            )}

            {/* Submit */}
            <button onClick={handleAuth} disabled={loading}
              className="w-full h-12 rounded-xl bg-violet-600 font-black text-white text-sm hover:bg-violet-700 disabled:opacity-50 transition shadow-md shadow-violet-200 flex items-center justify-center gap-2">
              {loading
                ? <><IconLoader2 size={16} className="animate-spin" /> {t.loading}</>
                : isLogin ? t.signIn : t.signUp
              }
            </button>

            {/* Toggle */}
            <button onClick={() => { setIsLogin(!isLogin); setMessage(""); }}
              className="w-full text-sm font-black text-violet-600 hover:text-violet-700 transition">
              {isLogin ? t.noAccount : t.haveAccount}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}
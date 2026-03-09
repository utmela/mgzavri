"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState<"ok" | "err">("err");

  async function handleAuth() {
    setLoading(true);
    setMessage("");

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setMessage(error.message); setMsgType("err"); }
      else { router.push("/"); router.refresh(); }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) { setMessage(error.message); setMsgType("err"); }
      else { setMessage("Account created! You can now sign in."); setMsgType("ok"); setIsLogin(true); }
    }

    setLoading(false);
  }

  const inp = "w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition placeholder-gray-400";

  return (
    <div className="min-h-screen font-sans flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg,#f5f3ff 0%,#ede9fe 30%,#faf5ff 60%,#f0fdf4 100%)" }}>

      <div className="w-full max-w-md">

        {/* Back link */}
        <Link href="/" className="mb-6 flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-violet-600 transition">
          ← Back to home
        </Link>

        <div className="overflow-hidden rounded-3xl bg-white shadow-[0_8px_40px_rgba(109,40,217,0.12)] border border-violet-100">

          {/* Header */}
          <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 px-6 py-10 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
            <div className="relative">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-3xl bg-white/20 text-3xl">🚐</div>
              <h1 className="text-2xl font-black">{isLogin ? "Welcome back" : "Create account"}</h1>
              <p className="text-violet-200 text-sm mt-1">mgzavri.ge</p>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-400">Email</label>
              <input type="email" placeholder="you@example.com" value={email}
                onChange={(e) => setEmail(e.target.value)} className={inp} />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-400">Password</label>
              <input type="password" placeholder="••••••••" value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAuth()}
                className={inp} />
            </div>

            {message && (
              <div className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                msgType === "ok" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-600"
              }`}>
                {message}
              </div>
            )}

            <button onClick={handleAuth} disabled={loading}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 font-bold text-white hover:opacity-90 disabled:opacity-50 transition shadow-md">
              {loading ? "Loading…" : isLogin ? "Sign in" : "Create account"}
            </button>

            <button onClick={() => { setIsLogin((l) => !l); setMessage(""); }}
              className="w-full text-sm text-center text-violet-600 hover:text-violet-800 font-semibold transition py-1">
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          By continuing you agree to our terms of service
        </p>
      </div>
    </div>
  );
}
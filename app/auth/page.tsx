"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "../../components/LanguageProvider";

const T = {
  en: {
    back: "Back to home",
    welcome: "Welcome back",
    create: "Create account",
    email: "Email",
    password: "Password",
    name: "Full name",
    phone: "Phone number",
    signIn: "Sign in",
    signUp: "Create account",
    loading: "Loading…",
    noAccount: "Don't have an account? Sign up",
    haveAccount: "Already have an account? Sign in",
    created: "Account created! You can now sign in.",
  },
  ka: {
    back: "მთავარ გვერდზე დაბრუნება",
    welcome: "კეთილი დაბრუნება",
    create: "ანგარიშის შექმნა",
    email: "ელფოსტა",
    password: "პაროლი",
    name: "სახელი",
    phone: "ტელეფონი",
    signIn: "შესვლა",
    signUp: "რეგისტრაცია",
    loading: "იტვირთება…",
    noAccount: "ანგარიში არ გაქვთ? დარეგისტრირდით",
    haveAccount: "უკვე გაქვთ ანგარიში? შედით",
    created: "ანგარიში შეიქმნა! ახლა შეგიძლიათ შესვლა.",
  },
};

export default function AuthPage() {

  const router = useRouter();
  const { lang } = useLanguage();
  const t = T[lang as "en" | "ka"];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState<"ok" | "err">("err");

  async function handleAuth() {

  setLoading(true);
  setMessage("");

  if (isLogin) {

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setMsgType("err");
    } else {
      router.push("/");
      router.refresh();
    }

  } else {

    // basic validation
    if (!name || !phone || !email || !password) {
      setMessage("Please fill all fields");
      setMsgType("err");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setMsgType("err");
      setLoading(false);
      return;
    }

    // insert profile data
    if (data.user) {

      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: data.user.id,
          name: name,
          phone: phone,
          role: "user",
          created_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error("Profile insert error:", profileError);
        setMessage("User created but profile failed.");
        setMsgType("err");
        setLoading(false);
        return;
      }

    }

    setMessage(t.created);
    setMsgType("ok");
    setIsLogin(true);

  }

  setLoading(false);
  }

  const inp =
    "w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-violet-50 to-green-50">

      <div className="w-full max-w-md">

        <Link href="/" className="mb-6 block text-sm text-gray-500 hover:text-violet-600">
          ← {t.back}
        </Link>

        <div className="rounded-3xl bg-white shadow-xl border border-gray-100">

          <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-8 text-white text-center rounded-t-3xl">
            <h1 className="text-2xl font-black">
              {isLogin ? t.welcome : t.create}
            </h1>
          </div>

          <div className="p-6 space-y-4">

            {!isLogin && (
              <>
                <div>
                  <label className="text-xs font-bold text-gray-400">
                    {t.name}
                  </label>
                  <input
                    className={inp}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400">
                    {t.phone}
                  </label>
                  <input
                    className={inp}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-bold text-gray-400">
                {t.email}
              </label>
              <input
                className={inp}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400">
                {t.password}
              </label>
              <input
                type="password"
                className={inp}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {message && (
              <div className={`text-sm font-semibold ${
                msgType === "ok" ? "text-green-600" : "text-red-600"
              }`}>
                {message}
              </div>
            )}

            <button
              onClick={handleAuth}
              disabled={loading}
              className="w-full h-12 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-700 transition"
            >
              {loading ? t.loading : isLogin ? t.signIn : t.signUp}
            </button>

            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setMessage("");
              }}
              className="text-sm text-violet-600 hover:underline w-full"
            >
              {isLogin ? t.noAccount : t.haveAccount}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}
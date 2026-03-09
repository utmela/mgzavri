"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState("");

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
      } else {
        router.push("/");
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage("Account created. You can now login.");
      }
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-black p-6">
      <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-xl">

        <h1 className="text-2xl font-bold mb-6 text-center">
          {isLogin ? "Login" : "Create Account"}
        </h1>

        <form onSubmit={handleAuth} className="space-y-4">

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-xl p-3"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-xl p-3"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 text-white p-3 rounded-xl font-bold"
          >
            {loading ? "Loading..." : isLogin ? "Login" : "Register"}
          </button>

        </form>

        {message && (
          <p className="mt-4 text-center text-red-500 text-sm">{message}</p>
        )}

        <button
          onClick={() => setIsLogin(!isLogin)}
          className="mt-4 w-full text-sm text-violet-600"
        >
          {isLogin
            ? "Don't have an account? Register"
            : "Already have an account? Login"}
        </button>

      </div>
    </main>
  );
}
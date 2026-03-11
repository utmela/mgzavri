"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { useLanguage } from "./LanguageProvider";

const T = {
  en: {
    signIn: "Sign in",
    signUp: "Sign up",
    logout: "Logout",
    myBookings: "My bookings",
    myRides: "My rides",
    admin: "Admin panel"
  },
  ka: {
    signIn: "შესვლა",
    signUp: "რეგისტრაცია",
    logout: "გასვლა",
    myBookings: "ჩემი ჯავშნები",
    myRides: "ჩემი მგზავრობები",
    admin: "ადმინის პანელი"
  }
};

export default function Navbar() {

  const { lang, changeLang } = useLanguage();   // ⭐ global language
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const t = T[lang as "en" | "ka"];

  const ADMIN_IDS = [
    "5d249be0-a9a5-43da-a4fd-b43f75fe09b0",
    "110e686c-d3b4-4060-b72e-ffd0c6cc9727",
  ];

  const isAdmin = user && ADMIN_IDS.includes(user.id);

  async function logout() {
    await supabase.auth.signOut();
    location.reload();
  }

  useEffect(() => {

  async function getUser() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
  }

  getUser();

  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null);
  });

  return () => {
    listener.subscription.unsubscribe();
  };

}, []);

  useEffect(() => {

  async function getUser() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
  }

  getUser();

  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null);
  });

  return () => {
    listener.subscription.unsubscribe();
  };

}, []);
  useEffect(() => {

  async function getUser() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
  }

  getUser();

  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null);
  });

  return () => {
    listener.subscription.unsubscribe();
  };

}, []);
  useEffect(() => {

  async function getUser() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
  }

  getUser();

  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null);
  });

  return () => {
    listener.subscription.unsubscribe();
  };

}, []);
  useEffect(() => {

  async function getUser() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
  }

  getUser();

  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null);
  });

  return () => {
    listener.subscription.unsubscribe();
  };

}, []);

  useEffect(() => {

  async function getUser() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
  }

  getUser();

  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null);
  });

  return () => {
    listener.subscription.unsubscribe();
  };

}, []);
  useEffect(() => {

  async function getUser() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
  }

  getUser();

  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null);
  });

  return () => {
    listener.subscription.unsubscribe();
  };

}, []);

  useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setMenuOpen(false);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);

  return (
    <nav className="sticky top-0 z-50 border-b-2 border-violet-100 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">

        {/* LOGO */}
        <Link href="/">
          <img
            src="/logo.png"
            alt="mgzavri.ge"
            className="h-10 w-auto object-contain"
          />
        </Link>

        <div className="flex items-center gap-2">

          {/* ADMIN */}
          {isAdmin && (
            <Link
              href="/admin"
              className="inline-flex items-center h-9 rounded-xl border-2 border-amber-400 bg-amber-50 px-3 text-xs font-black text-amber-700 hover:bg-amber-100 transition"
            >
              🛡 {t.admin}
            </Link>
          )}

          {/* LANGUAGE */}
          <button
            onClick={() => changeLang(lang === "en" ? "ka" : "en")}
            className="inline-flex items-center h-9 gap-1.5 rounded-xl border-2 border-violet-200 bg-white px-3 text-xs font-black text-violet-700 hover:bg-violet-50 transition"
          >
            {lang === "en" ? (
              <>
                <img src="https://flagcdn.com/w20/ge.png" className="h-4 rounded-sm"/>
                <span>KA</span>
              </>
            ) : (
              <>
                <img src="https://flagcdn.com/w20/gb.png" className="h-4 rounded-sm"/>
                <span>EN</span>
              </>
            )}
          </button>

          {/* NOT LOGGED IN */}
          {!user ? (
            <>
              <Link
                href="/auth"
                className="inline-flex items-center h-9 rounded-xl border-2 border-gray-200 bg-white px-4 text-sm font-black text-gray-700 hover:bg-gray-50 transition"
              >
                {t.signIn}
              </Link>

              <Link
                href="/auth?mode=signup"
                className="inline-flex items-center h-9 rounded-xl bg-violet-600 px-4 text-sm font-black text-white hover:bg-violet-700 transition shadow-md shadow-violet-200"
              >
                {t.signUp}
              </Link>
            </>
          ) : (

            
            <div ref={dropdownRef} className="relative">

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                className="inline-flex items-center h-9 gap-2 rounded-xl border-2 border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-white text-xs font-black">
                  {user?.email?.[0]?.toUpperCase()}
                </div>

                <span className="text-gray-400 text-xs">▾</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border-2 border-gray-100 bg-white shadow-xl overflow-hidden z-50">

                  <Link
                    href="/my-bookings"
                    className="flex items-center gap-2 px-4 py-3 text-sm font-black text-gray-700 hover:bg-gray-50"
                  >
                    📖 {t.myBookings}
                  </Link>

                  <Link
                    href="/my-rides"
                    className="flex items-center gap-2 px-4 py-3 text-sm font-black text-gray-700 hover:bg-gray-50"
                  >
                    🚐 {t.myRides}
                  </Link>

                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 px-4 py-3 text-sm font-black text-amber-700 hover:bg-amber-50"
                    >
                      🛡 {t.admin}
                    </Link>
                  )}

                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm font-black text-red-600 hover:bg-red-50"
                  >
                    🚪 {t.logout}
                  </button>

                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </nav>
  );
}
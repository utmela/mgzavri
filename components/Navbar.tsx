"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { useLanguage } from "./LanguageProvider";
import {
  IconShield, IconBookmark, IconBus, IconLogout,
  IconChevronDown, IconUser, IconLogin,
} from "@tabler/icons-react";

const T = {
  en: {
    myBookings: "My bookings", myRides: "My rides",
    admin: "Admin panel", logout: "Logout", signIn: "Sign in",
  },
  ka: {
    myBookings: "ჩემი ჯავშნები", myRides: "ჩემი მოგზაურობები",
    admin: "ადმინ პანელი", logout: "გასვლა", signIn: "შესვლა",
  },
};

// Tiny Georgia flag SVG inline
function Flag({ code }: { code: "ge" | "gb" }) {
  return (
    <img
      src={`https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.2.3/flags/4x3/${code}.svg`}
      alt={code}
      width={22}
      height={15}
      className="shrink-0 rounded-[2px]"
      style={{ border: "0.5px solid #e5e7eb", display: "block" }}
    />
  );
}

const ADMIN_IDS = [
  "5d249be0-a9a5-43da-a4fd-b43f75fe09b0",
  "110e686c-d3b4-4060-b72e-ffd0c6cc9727",
];

export default function Navbar() {
  const router = useRouter();
  const { lang, setLang } = useLanguage() as { lang: "en" | "ka"; setLang: (l: "en" | "ka") => void };
  const t = T[lang];

  const [user,    setUser]    = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [open,    setOpen]    = useState(false);
  const dropRef               = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setIsAdmin(!!data.user && ADMIN_IDS.includes(data.user.id));
    });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    setOpen(false);
    router.push("/");
  }

  // User initials avatar
  const initials = user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">

        {/* Logo */}
        <Link href="/" className="shrink-0">
          <img src="/logo.png" alt="mgzavri.ge" className="h-12 w-auto" />
        </Link>

        {/* Centre nav links — only when logged in */}
        {user && (
          <nav className="hidden sm:flex items-center gap-1">
            <Link href="/my-bookings"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-black text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition">
              <IconBookmark size={15} stroke={2.5} />
              {t.myBookings}
            </Link>
            <Link href="/my-rides"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-black text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition">
              <IconBus size={15} stroke={2.5} />
              {t.myRides}
            </Link>
            {isAdmin && (
              <Link href="/admin"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-black text-amber-600 hover:bg-amber-50 transition">
                <IconShield size={15} stroke={2.5} />
                {t.admin}
              </Link>
            )}
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2">

          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === "en" ? "ka" : "en")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-black text-gray-700 hover:bg-gray-50 transition shrink-0">
            {lang === "en" ? <Flag code="gb" /> : <Flag code="ge" />}
            {lang.toUpperCase()}
          </button>

          {/* Auth */}
          {!user ? (
            <Link href="/auth"
              className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-black text-white hover:bg-violet-700 transition">
              <IconLogin size={15} stroke={2.5} />
              {t.signIn}
            </Link>
          ) : (
            <div className="relative" ref={dropRef}>
              <button
                onClick={() => setOpen(o => !o)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm font-black text-gray-700 hover:bg-gray-50 transition">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-xs font-black text-white">
                  {initials}
                </div>
                <IconChevronDown size={14} stroke={2.5} className={`transition-transform ${open ? "rotate-180" : ""}`} />
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden z-50">
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <p className="text-xs font-black text-gray-900 truncate">{user.email}</p>
                  </div>

                  {/* Mobile-only nav links */}
                  <div className="sm:hidden border-b border-gray-100">
                    <Link href="/my-bookings" onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-3 text-sm font-black text-gray-700 hover:bg-gray-50 transition">
                      <IconBookmark size={16} stroke={2.5} className="text-violet-500" />
                      {t.myBookings}
                    </Link>
                    <Link href="/my-rides" onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-3 text-sm font-black text-gray-700 hover:bg-gray-50 transition">
                      <IconBus size={16} stroke={2.5} className="text-violet-500" />
                      {t.myRides}
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" onClick={() => setOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-3 text-sm font-black text-amber-600 hover:bg-amber-50 transition">
                        <IconShield size={16} stroke={2.5} />
                        {t.admin}
                      </Link>
                    )}
                  </div>

                  {/* Desktop-only admin link in dropdown */}
                  {isAdmin && (
                    <div className="hidden sm:block border-b border-gray-100">
                      <Link href="/admin" onClick={() => setOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-3 text-sm font-black text-amber-600 hover:bg-amber-50 transition">
                        <IconShield size={16} stroke={2.5} />
                        {t.admin}
                      </Link>
                    </div>
                  )}

                  {/* Logout */}
                  <button onClick={logout}
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-black text-red-600 hover:bg-red-50 transition">
                    <IconLogout size={16} stroke={2.5} />
                    {t.logout}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
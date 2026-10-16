"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconArmchair, IconBus, IconChevronDown, IconLogin, IconLogout, IconPlus, IconRoute, IconShield, IconUser } from "@tabler/icons-react";
import { supabase } from "../lib/supabase";
import { useProfileRole } from "../lib/useProfileRole";
import { useLanguage } from "./LanguageProvider";

const COPY = {
  en: { requestRide: "Post passenger request", postDriverTrip: "Post driver trip", bookings: "My passenger bookings", myRequests: "My passenger requests", find: "Find a trip", dashboard: "Driver dashboard", requests: "Passenger requests", passenger: "Passenger", driver: "Driver", verifiedDriver: "Verified driver", admin: "Admin", signIn: "Sign in", signOut: "Sign out" },
  ka: { requestRide: "მგზავრის მოთხოვნა", postDriverTrip: "მძღოლის რეისის დამატება", bookings: "ჩემი ჯავშნები", myRequests: "ჩემი მოთხოვნები", find: "რეისის ძებნა", dashboard: "მძღოლის პანელი", requests: "მგზავრების მოთხოვნები", passenger: "მგზავრი", driver: "მძღოლი", verifiedDriver: "დადასტურებული მძღოლი", admin: "ადმინი", signIn: "შესვლა", signOut: "გასვლა" },
} as const;

export default function Navbar() {
  const router = useRouter();
  const { lang, setLang } = useLanguage();
  const text = COPY[lang];
  const { user, role, canDrive, isAdmin } = useProfileRole();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const roleLabel = role === "admin" ? text.admin : role === "verified_driver" ? text.verifiedDriver : role === "driver" ? text.driver : text.passenger;

  useEffect(() => {
    function closeMenu(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-violet-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 lg:gap-4">
          <Link href="/" aria-label="Mgzavri home" className="shrink-0">
            <Image src="/logo.png" alt="Mgzavri" width={230} height={70} priority className="h-10 w-auto sm:h-11" />
          </Link>
        </div>

        <nav aria-label={lang === "ka" ? "მთავარი ნავიგაცია" : "Main navigation"} className="flex shrink-0 items-center gap-2">
          <Link href="/" aria-label={text.find} className="hidden h-9 items-center rounded-lg px-3 text-sm font-black text-slate-700 hover:bg-violet-50 lg:inline-flex">{text.find}</Link>
          <Link href="/post-request" aria-label={text.requestRide} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-violet-200 bg-white px-2.5 text-sm font-black text-violet-800 transition hover:bg-violet-50 sm:px-3"><IconUser size={16} /><span className="hidden sm:inline">{text.requestRide}</span></Link>
          {canDrive && <Link href="/post" aria-label={text.postDriverTrip} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-violet-600 px-2.5 text-sm font-black text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700 sm:px-3"><IconPlus size={16} /><span className="hidden sm:inline">{text.postDriverTrip}</span></Link>}
          <button
            type="button"
            onClick={() => setLang(lang === "ka" ? "en" : "ka")}
            aria-label={lang === "ka" ? "Switch to English" : "ქართულ ენაზე გადართვა"}
            className="h-9 rounded-lg border border-violet-200 bg-white px-3 text-xs font-black text-violet-800 transition hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-100"
          >
            {lang === "ka" ? "EN" : "KA"}
          </button>

          {!user ? (
            <Link href="/auth" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-violet-900 px-3 text-sm font-black text-white transition hover:bg-violet-950"><IconLogin size={15} /><span className="hidden sm:inline">{text.signIn}</span></Link>
          ) : (
            <div className="relative" ref={menuRef}>
              <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="inline-flex h-9 items-center gap-2 rounded-lg border border-violet-200 bg-white px-2 text-sm font-bold text-violet-900 hover:bg-violet-50">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-900 text-xs font-black uppercase text-white">{user.email?.[0] || "?"}</span>
                <span className="hidden text-xs font-black sm:inline">{roleLabel}</span>
                <IconChevronDown size={14} className={open ? "rotate-180" : ""} />
              </button>
              {open && (
                <div className="absolute right-0 mt-2 w-60 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                  <div className="px-3 py-2"><p className="truncate text-xs font-bold text-slate-500">{user.email}</p><p className="mt-1 text-xs font-black text-violet-700">{roleLabel}</p></div>
                  <div className="border-t border-violet-100 pt-1">
                    <Link href="/my-bookings" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"><IconArmchair size={15} /> {text.bookings}</Link>
                    <Link href="/my-requests" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"><IconRoute size={15} /> {text.myRequests}</Link>
                    <Link href="/post-request" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 hover:bg-violet-50"><IconUser size={15} /> {text.requestRide}</Link>
                    {canDrive && <Link href="/post" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-violet-800 hover:bg-violet-50"><IconPlus size={15} /> {text.postDriverTrip}</Link>}
                    {canDrive && <Link href="/my-rides" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"><IconBus size={15} /> {text.dashboard}</Link>}
                    {canDrive && <Link href="/driver-requests" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 hover:bg-violet-50"><IconRoute size={15} /> {text.requests}</Link>}
                  </div>
                  <Link href="/security" onClick={() => setOpen(false)} className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"><IconShield size={15} /> {lang === "ka" ? "ანგარიშის უსაფრთხოება" : "Account security"}</Link>
                  {isAdmin && <Link href="/admin" onClick={() => setOpen(false)} className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-violet-800 hover:bg-violet-50"><IconShield size={15} /> {text.admin}</Link>}
                  <button type="button" onClick={signOut} className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50"><IconLogout size={15} /> {text.signOut}</button>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

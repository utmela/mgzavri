"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IconArrowRight, IconCalendarEvent, IconLoader2, IconRoute, IconUsers } from "@tabler/icons-react";
import DriverContact from "../../components/DriverContact";
import { cancelBooking } from "../../lib/bookings";
import { useLanguage } from "../../components/LanguageProvider";
import RoutePhotoBanner from "../../components/RoutePhotoBanner";
import ScenicPageHero from "../../components/ScenicPageHero";
import { api } from "../../lib/api";
import { supabase } from "../../lib/supabase";
import { formatDateTime, formatPrice } from "../../lib/format";
import type { RideBooking } from "../../lib/types";

const COPY = {
  en: {
    eyebrow: "PASSENGER DASHBOARD", title: "My bookings", subtitle: "Everything you have reserved, in one place.",
    upcoming: "Upcoming", past: "Past", cancelled: "Cancelled", empty: "No bookings here yet.",
    browse: "Find a trip", seats: "passengers", wholeVan: "Entire van", total: "Total", contact: "Call driver",
    cancel: "Cancel booking", cancelling: "Cancelling...", confirm: "Cancel this booking and return the seats?",
    signedOut: "Sign in to see and manage your bookings.", signIn: "Sign in", status: "Confirmed",
  },
  ka: {
    eyebrow: "მგზავრის გვერდი", title: "ჩემი ჯავშნები", subtitle: "ყველა თქვენი დაჯავშნილი მგზავრობა ერთ სივრცეში.",
    upcoming: "მომავალი", past: "წარსული", cancelled: "გაუქმებული", empty: "აქ ჯერ ჯავშანი არ არის.",
    browse: "მგზავრობის პოვნა", seats: "მგზავრი", wholeVan: "მთლიანი მინივენი", total: "სულ", contact: "მძღოლთან დარეკვა",
    cancel: "ჯავშნის გაუქმება", cancelling: "უქმდება...", confirm: "გავაუქმოთ ჯავშანი და დავაბრუნოთ ადგილები?",
    signedOut: "ჯავშნების სანახავად და სამართავად შედით ანგარიშში.", signIn: "შესვლა", status: "დადასტურებული",
  },
} as const;

type Group = "upcoming" | "past" | "cancelled";

function groupFor(booking: RideBooking): Group {
  if (booking.status === "cancelled") return "cancelled";
  return new Date(booking.ride.departure_time).getTime() >= Date.now() ? "upcoming" : "past";
}

export default function MyBookingsPage() {
  const { lang } = useLanguage();
  const text = COPY[lang];
  const [bookings, setBookings] = useState<RideBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(true);
  const [active, setActive] = useState<Group>("upcoming");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function loadBookings() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setSignedIn(false);
      setLoading(false);
      return;
    }
    const { data, error: queryError } = await api<RideBooking[]>("/bookings");
    if (queryError) setError(queryError.message);
    setBookings((data ?? []) as RideBooking[]);
    setLoading(false);
  }

  useEffect(() => {
    queueMicrotask(() => void loadBookings());
  }, []);

  async function cancel(id: string) {
    if (!window.confirm(text.confirm)) return;
    setBusyId(id);
    setError("");
    try {
      await cancelBooking(id);
      await loadBookings();
      setActive("cancelled");
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : "Cancellation failed.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <div className="grid min-h-[60vh] place-items-center"><IconLoader2 className="animate-spin text-violet-700" /></div>;

  if (!signedIn) {
    return <section className="mx-auto max-w-xl px-4 py-20 text-center"><IconCalendarEvent className="mx-auto text-violet-700" size={36} /><h1 className="mt-4 text-3xl font-black text-slate-950">{text.title}</h1><p className="mt-3 font-semibold text-slate-600">{text.signedOut}</p><Link href="/auth" className="mt-6 inline-flex rounded-xl bg-violet-600 px-5 py-3 font-black text-white">{text.signIn}</Link></section>;
  }

  const visible = bookings.filter((booking) => groupFor(booking) === active);
  const upcomingCount = bookings.filter((booking) => groupFor(booking) === "upcoming").length;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#ede9fe_0,_#f8fafc_34%,_#f8fafc_100%)]">
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <ScenicPageHero
        eyebrow={text.eyebrow}
        title={text.title}
        subtitle={text.subtitle}
        lang={lang}
        showRoute={false}
        meta={<span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-black backdrop-blur">{upcomingCount} {text.upcoming.toLowerCase()}</span>}
        action={<Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-violet-900 shadow-lg transition hover:bg-violet-50">{text.browse}<IconArrowRight size={16} /></Link>}
      />

      <div className="relative z-10 mx-3 -mt-5 grid grid-cols-3 gap-2 rounded-2xl border border-white/80 bg-white/95 p-1.5 shadow-xl shadow-violet-950/10 backdrop-blur sm:mx-8">
        {(["upcoming", "past", "cancelled"] as Group[]).map((group) => (
          <button key={group} onClick={() => setActive(group)} className={`rounded-xl px-2 py-3 text-sm font-black transition ${active === group ? "bg-violet-600 text-white" : "text-slate-600 hover:bg-violet-50 hover:text-violet-800"}`}>
            {text[group]} <span className="ml-1 opacity-70">{bookings.filter((booking) => groupFor(booking) === group).length}</span>
          </button>
        ))}
      </div>

      {error && <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}

      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        {visible.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-violet-200 bg-white/80 px-5 py-16 text-center shadow-sm lg:col-span-2">
            <p className="font-black text-slate-700">{text.empty}</p>
            <Link href="/" className="mt-4 inline-flex items-center gap-2 text-sm font-black text-violet-800">{text.browse}<IconArrowRight size={16} /></Link>
          </section>
        ) : visible.map((booking) => {
          const ride = booking.ride;
          const isUpcoming = active === "upcoming";
          return (
            <article key={booking.id} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-950/10">
              <RoutePhotoBanner from={ride.from_city} to={ride.to_city} lang={lang} compact />
              <div className="p-5 sm:p-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-violet-700"><IconRoute size={16} /> {active === "upcoming" ? text.upcoming : text[active]}</div>
                  <p className="mt-2 text-xl font-black text-slate-950">{formatDateTime(ride.departure_time, lang, { dateStyle: "medium", timeStyle: "short" })}</p>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-slate-600">
                    <span className="inline-flex items-center gap-1.5"><IconUsers size={16} />{booking.booking_type === "full_van" ? text.wholeVan : `${booking.seats_booked} ${text.seats}`}</span>
                    <span>{ride.vehicle_type}</span>
                    <span>{text.total}: <strong className="text-slate-900">{formatPrice(booking.total_price ?? 0, lang)}</strong></span>
                  </div>
                </div>
                <span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${active === "cancelled" ? "bg-slate-100 text-slate-500" : "bg-violet-50 text-violet-700"}`}>{active === "cancelled" ? text.cancelled : text.status}</span>
              </div>
              {isUpcoming && <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row">
                <DriverContact rideId={ride.id} lang={lang} />
                <button onClick={() => void cancel(booking.id)} disabled={busyId === booking.id} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-black text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50">{busyId === booking.id ? text.cancelling : text.cancel}</button>
              </div>}
              </div>
            </article>
          );
        })}
      </div>
    </section>
    </div>
  );
}

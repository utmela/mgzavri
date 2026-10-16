"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { IconArmchair, IconArrowLeft, IconBus, IconCalendar, IconClock, IconId, IconLoader2, IconMapPin, IconUser } from "@tabler/icons-react";
import BookingPanel from "../../../components/BookingPanel";
import GeorgianPlate from "../../../components/GeorgianPlate";
import RoutePhotoBanner from "../../../components/RoutePhotoBanner";
import { useLanguage } from "../../../components/LanguageProvider";
import AccessoriesBadges from "../../../components/accessoriesBadges";
import { cityLabel, routeSlug, type Lang } from "../../../lib/cities";
import { formatPrice, formatTime } from "../../../lib/format";
import { api } from "../../../lib/api";
import type { Ride } from "../../../lib/types";

const COPY = {
  en: {
    back: "Back to trips",
    loading: "Loading trip...",
    unavailable: "This trip could not be found.",
    driver: "Driver",
    registered: "Registered driver",
    vehicle: "Vehicle",
    pickup: "Pickup",
    arrival: "Arrival",
    available: "Available",
    seats: "seats",
    departure: "Departure",
    plate: "Licence plate",
    details: "Trip details",
    notes: "Driver notes",
    contactNote: "Driver contact details are shown after a confirmed booking.",
  },
  ka: {
    back: "რეისებზე დაბრუნება",
    loading: "რეისი იტვირთება...",
    unavailable: "რეისი ვერ მოიძებნა.",
    driver: "მძღოლი",
    registered: "რეგისტრირებული მძღოლი",
    vehicle: "ავტომობილი",
    pickup: "აყვანის ადგილი",
    arrival: "ჩასვლის ადგილი",
    available: "ხელმისაწვდომია",
    seats: "ადგილი",
    departure: "გამგზავრება",
    plate: "სახელმწიფო ნომერი",
    details: "რეისის დეტალები",
    notes: "მძღოლის შენიშვნა",
    contactNote: "მძღოლის საკონტაქტო ინფორმაცია გამოჩნდება ჯავშნის დადასტურების შემდეგ.",
  },
} as const;

export default function RidePage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { lang } = useLanguage() as { lang: Lang };
  const text = COPY[lang];
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const initialPassengers = Math.max(1, Number(searchParams.get("passengers")) || 1);

  const loadRide = useCallback(async () => {
    const { data, error: queryError } = await api<Ride>(`/rides/${id}`, { public: true });
    setError(queryError?.message ?? "");
    setRide(data as Ride | null);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    // The initial remote load intentionally owns this page's loading state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadRide();
  }, [loadRide]);

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 text-sm font-bold text-slate-500"><IconLoader2 size={18} className="mr-2 animate-spin text-violet-600" /> {text.loading}</div>;
  }

  if (!ride || error) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center"><h1 className="text-2xl font-black text-slate-900">{error || text.unavailable}</h1><Link href="/" className="mt-5 inline-flex text-sm font-black text-violet-700">{text.back}</Link></div>;
  }

  const date = new Date(ride.departure_time);
  const routeHref = `/routes/${routeSlug(ride.from_city, ride.to_city)}`;
  const occupancy = ride.seats_total - ride.seats_available;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Link href={routeHref} className="inline-flex items-center gap-1.5 text-sm font-black text-slate-600 hover:text-violet-700"><IconArrowLeft size={15} /> {text.back}</Link>

        <header className="group mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-violet-950/10">
          <RoutePhotoBanner from={ride.from_city} to={ride.to_city} lang={lang} />
          <div className="p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                {cityLabel(ride.from_city, lang)} <span className="text-violet-500">→</span> {cityLabel(ride.to_city, lang)}
              </h1>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-slate-600">
                <span className="flex items-center gap-1.5"><IconCalendar size={16} className="text-violet-600" /> {date.toLocaleDateString(lang === "ka" ? "ka-GE" : "en-GB", { weekday: "short", day: "numeric", month: "long" })}</span>
                <span className="flex items-center gap-1.5"><IconClock size={16} className="text-violet-600" /> {formatTime(date, lang)}</span>
              </div>
            </div>
            <div className="rounded-xl bg-violet-50 px-4 py-3 text-right">
              <p className="text-2xl font-black text-violet-900">{formatPrice(ride.price_per_seat, lang)}</p>
              <p className="text-xs font-bold text-violet-700">{lang === "ka" ? "ერთ მგზავრზე" : "per passenger"}</p>
            </div>
          </div>
          </div>
        </header>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.9fr] lg:items-start">
          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-black text-slate-950">{text.details}</h2>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><IconUser size={19} /></div>
                  <div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{text.driver}</p><p className="mt-1 font-black text-slate-900">{ride.driver_name || text.driver}</p><p className="mt-1 text-xs font-semibold text-violet-700">{text.registered}</p></div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><IconBus size={19} /></div>
                  <div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{text.vehicle}</p><p className="mt-1 font-black text-slate-900">{ride.vehicle_type || "Minivan"}</p>{ride.plate_number && <div className="mt-2"><GeorgianPlate plate={ride.plate_number} size="sm" /></div>}</div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><IconMapPin size={19} /></div>
                  <div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{text.pickup}</p><p className="mt-1 font-black text-slate-900">{ride.pickup_point || cityLabel(ride.from_city, lang)}</p></div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><IconMapPin size={19} /></div>
                  <div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{text.arrival}</p><p className="mt-1 font-black text-slate-900">{ride.dropoff_point || cityLabel(ride.to_city, lang)}</p></div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><IconArmchair size={19} /></div>
                  <div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{text.available}</p><p className="mt-1 font-black text-slate-900">{ride.seats_available} / {ride.seats_total} {text.seats}</p><p className="mt-1 text-xs font-semibold text-slate-500">{occupancy} {lang === "ka" ? "დაკავებულია" : "occupied"}</p></div>
                </div>
                {ride.plate_number && <div className="flex gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><IconId size={19} /></div><div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{text.plate}</p><p className="mt-1 font-black text-slate-900">{ride.plate_number}</p></div></div>}
              </div>

              {ride.accessories?.length ? <div className="mt-6 border-t border-slate-200 pt-5"><AccessoriesBadges accessories={ride.accessories} lang={lang} /></div> : null}
              {ride.notes && <div className="mt-5 rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{text.notes}</p><p className="mt-2 text-sm font-medium leading-6 text-slate-700">{ride.notes}</p></div>}
              <p className="mt-5 text-xs font-semibold text-slate-500">{text.contactNote}</p>
            </section>
          </div>

          <div className="lg:sticky lg:top-24">
            <BookingPanel ride={ride} lang={lang} initialPassengers={initialPassengers} onBooked={loadRide} />
          </div>
        </div>
      </div>
    </div>
  );
}

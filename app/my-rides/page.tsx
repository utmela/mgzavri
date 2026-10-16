"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconArmchair, IconBus, IconCalendar, IconCheck, IconClock, IconExternalLink, IconLoader2, IconPencil, IconPlus, IconTrash, IconUser, IconUsers } from "@tabler/icons-react";
import SeatStepper from "../../components/SeatStepper";
import { useLanguage } from "../../components/LanguageProvider";
import RoutePhotoBanner from "../../components/RoutePhotoBanner";
import ScenicPageHero from "../../components/ScenicPageHero";
import { adjustRideSeats, createExternalBooking } from "../../lib/bookings";
import { cityLabel, type Lang } from "../../lib/cities";
import { formatDateTime } from "../../lib/format";
import { api } from "../../lib/api";
import { supabase } from "../../lib/supabase";
import type { Booking, PassengerRequest, Ride } from "../../lib/types";

type DriverRide = Ride & { bookings: Booking[] };

const COPY = {
  en: {
    eyebrow: "DRIVER CONTROL",
    title: "Driver dashboard",
    subtitle: "Manage today’s trips and seat availability from one screen.",
    addTrip: "Post a driver trip",
    today: "Today",
    upcoming: "Upcoming",
    past: "Past trips",
    available: "Available seats",
    occupied: "occupied",
    viewTrip: "View trip",
    edit: "Edit",
    delete: "Delete",
    passengers: "Passengers",
    noPassengers: "No bookings yet.",
    external: "Add external booking",
    externalTitle: "Seats booked outside Mgzavri",
    passengerName: "Passenger name (optional)",
    seats: "Seats",
    save: "Save booking",
    cancel: "Cancel",
    saved: "Availability updated",
    noRides: "No trips listed yet.",
    noRidesText: "Create your first intercity trip to start accepting passengers.",
    requests: "Open passenger requests",
    requestsText: "Existing route requests are kept here so you can spot demand.",
    viewRequests: "View all requests",
    loading: "Loading dashboard...",
    signIn: "Sign in to manage your trips.",
    driverOnly: "Driver access required",
    driverOnlyText: "You are signed in as a passenger. Driver tools appear only on approved driver accounts.",
    postRequest: "Post a passenger request",
    fullVan: "Entire van booked",
  },
  ka: {
    eyebrow: "მძღოლის მართვა",
    title: "მძღოლის პანელი",
    subtitle: "მართეთ დღევანდელი რეისები და თავისუფალი ადგილები ერთ ეკრანზე.",
    addTrip: "მძღოლის რეისის დამატება",
    today: "დღეს",
    upcoming: "მომავალი",
    past: "გასული რეისები",
    available: "თავისუფალი ადგილები",
    occupied: "დაკავებულია",
    viewTrip: "რეისის ნახვა",
    edit: "რედაქტირება",
    delete: "წაშლა",
    passengers: "მგზავრები",
    noPassengers: "ჯავშნები ჯერ არ არის.",
    external: "გარე ჯავშნის დამატება",
    externalTitle: "Mgzavri-ს გარეთ დაჯავშნილი ადგილები",
    passengerName: "მგზავრის სახელი (არასავალდებულო)",
    seats: "ადგილები",
    save: "ჯავშნის შენახვა",
    cancel: "გაუქმება",
    saved: "ხელმისაწვდომობა განახლდა",
    noRides: "რეისები ჯერ არ დაგიმატებიათ.",
    noRidesText: "დაამატეთ პირველი საქალაქთაშორისო რეისი მგზავრების მისაღებად.",
    requests: "მგზავრების ღია მოთხოვნები",
    requestsText: "არსებული მოთხოვნები აქ რჩება, რათა მოთხოვნა სწრაფად დაინახოთ.",
    viewRequests: "ყველა მოთხოვნის ნახვა",
    loading: "პანელი იტვირთება...",
    signIn: "რეისების სამართავად შედით ანგარიშში.",
    driverOnly: "საჭიროა მძღოლის წვდომა",
    driverOnlyText: "თქვენ შესული ხართ როგორც მგზავრი. მძღოლის ხელსაწყოები მხოლოდ დადასტურებულ მძღოლებს აქვთ.",
    postRequest: "მგზავრის მოთხოვნის დამატება",
    fullVan: "მთლიანი მინივენი დაჯავშნილია",
  },
} as const;

function dayKey(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function DriverTripCard({ ride, lang, onRefresh, onDelete }: { ride: DriverRide; lang: Lang; onRefresh: () => Promise<void>; onDelete: (id: string) => Promise<void> }) {
  const text = COPY[lang];
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [externalOpen, setExternalOpen] = useState(false);
  const [externalSeats, setExternalSeats] = useState(1);
  const [externalName, setExternalName] = useState("");
  const activeBookings = (ride.bookings ?? []).filter((booking) => booking.status !== "cancelled");
  const occupied = ride.seats_total - ride.seats_available;
  const departure = new Date(ride.departure_time);

  async function changeSeats(delta: number) {
    setBusy(true);
    setError("");
    try {
      await adjustRideSeats(ride.id, delta);
      setFeedback(text.saved);
      await onRefresh();
      window.setTimeout(() => setFeedback(""), 1600);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Update failed.");
    } finally {
      setBusy(false);
    }
  }

  async function saveExternal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await createExternalBooking(ride.id, externalSeats, externalName);
      setExternalOpen(false);
      setExternalSeats(1);
      setExternalName("");
      setFeedback(text.saved);
      await onRefresh();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Booking failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:border-violet-200 hover:shadow-xl hover:shadow-violet-950/10">
      <RoutePhotoBanner from={ride.from_city} to={ride.to_city} lang={lang} compact />
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-950">{cityLabel(ride.from_city, lang)} <span className="text-violet-500">→</span> {cityLabel(ride.to_city, lang)}</h3>
            <p className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-600"><IconClock size={15} className="text-violet-600" /> {formatDateTime(departure, lang, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/ride/${ride.id}`} aria-label={text.viewTrip} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"><IconExternalLink size={16} /></Link>
            <Link href={`/edit-ride/${ride.id}`} aria-label={text.edit} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"><IconPencil size={16} /></Link>
            <button type="button" onClick={() => void onDelete(ride.id)} aria-label={text.delete} className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"><IconTrash size={16} /></button>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">{text.available}</p>
              <p className="mt-1 text-sm font-bold text-slate-600">{occupied} / {ride.seats_total} {text.occupied}</p>
            </div>
            {ride.full_van_booked ? (
              <span className="rounded-xl bg-violet-100 px-4 py-3 text-sm font-black text-violet-800">{text.fullVan}</span>
            ) : (
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => void changeSeats(-1)} disabled={busy || ride.seats_available <= 0} aria-label="Decrease available seats" className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-2xl font-black text-white disabled:opacity-35">−</button>
                <div className="min-w-24 text-center"><span className="block text-3xl font-black text-slate-950">{ride.seats_available}</span><span className="text-xs font-bold text-slate-500">/ {ride.seats_total}</span></div>
                <button type="button" onClick={() => void changeSeats(1)} disabled={busy || ride.seats_available >= ride.seats_total} aria-label="Increase available seats" className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-2xl font-black text-white disabled:opacity-35">+</button>
              </div>
            )}
          </div>
          {feedback && <p aria-live="polite" className="mt-3 flex items-center gap-1.5 text-xs font-black text-violet-700"><IconCheck size={14} /> {feedback}</p>}
          {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{error}</p>}
        </div>

        {!ride.full_van_booked && ride.seats_available > 0 && (
          <button type="button" onClick={() => setExternalOpen((value) => !value)} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-black text-violet-800 hover:bg-violet-100"><IconPlus size={16} /> {text.external}</button>
        )}

        {externalOpen && (
          <form onSubmit={saveExternal} className="mt-4 rounded-2xl border border-violet-200 bg-violet-50 p-4">
            <h4 className="font-black text-slate-900">{text.externalTitle}</h4>
            <div className="mt-4 flex flex-wrap items-end gap-4">
              <SeatStepper value={externalSeats} max={ride.seats_available} onChange={setExternalSeats} label={text.seats} />
              <label className="min-w-56 flex-1 text-xs font-black uppercase tracking-wide text-slate-600">{text.passengerName}<input value={externalName} onChange={(event) => setExternalName(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold normal-case tracking-normal outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100" /></label>
            </div>
            <div className="mt-4 flex gap-3"><button type="submit" disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-black text-white disabled:opacity-50">{busy && <IconLoader2 size={15} className="animate-spin" />} {text.save}</button><button type="button" onClick={() => setExternalOpen(false)} className="h-10 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-700">{text.cancel}</button></div>
          </form>
        )}

        <details className="mt-5 border-t border-slate-200 pt-4">
          <summary className="cursor-pointer list-none text-sm font-black text-slate-800"><span className="inline-flex items-center gap-2"><IconUsers size={16} className="text-violet-600" /> {text.passengers} ({activeBookings.length})</span></summary>
          {activeBookings.length === 0 ? <p className="mt-3 text-sm font-semibold text-slate-500">{text.noPassengers}</p> : <div className="mt-3 space-y-2">{activeBookings.map((booking) => <div key={booking.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5"><div><p className="text-sm font-black text-slate-900">{booking.passenger_name || text.passengers}</p><p className="text-xs font-semibold text-slate-500">{booking.source === "external" ? text.external : booking.passenger_phone}</p></div><span className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-black text-slate-700"><IconArmchair size={13} /> {booking.seats_booked}</span></div>)}</div>}
        </details>
      </div>
    </article>
  );
}

export default function MyRidesPage() {
  const { lang } = useLanguage() as { lang: Lang };
  const text = COPY[lang];
  const [rides, setRides] = useState<DriverRide[]>([]);
  const [requests, setRequests] = useState<PassengerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(true);
  const [driverAccess, setDriverAccess] = useState(false);
  const [error, setError] = useState("");

  async function loadAll() {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      setSignedIn(false);
      setLoading(false);
      return;
    }

    const { data: profile } = await api<{ role: string }>("/profile");
    const role = profile?.role;
    if (role !== "driver" && role !== "verified_driver" && role !== "admin") {
      setDriverAccess(false);
      setLoading(false);
      return;
    }
    setDriverAccess(true);

    const [ridesResult, requestsResult] = await Promise.all([
      api<DriverRide[]>("/rides?scope=mine"),
      api<PassengerRequest[]>("/requests?limit=8"),
    ]);
    if (ridesResult.error) setError(ridesResult.error.message);
    setRides((ridesResult.data ?? []) as DriverRide[]);
    setRequests((requestsResult.data ?? []) as PassengerRequest[]);
    setLoading(false);
  }

  useEffect(() => {
    void loadAll();
  }, []);

  async function deleteRide(id: string) {
    if (!window.confirm("Delete this trip?")) return;
    const { error: deleteError } = await api(`/rides/${id}`, { method: "DELETE" });
    if (deleteError) setError(deleteError.message);
    else await loadAll();
  }

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center text-sm font-bold text-slate-500"><IconLoader2 size={18} className="mr-2 animate-spin text-violet-600" /> {text.loading}</div>;
  if (!signedIn) return <div className="mx-auto max-w-lg px-4 py-20 text-center"><IconUser size={32} className="mx-auto text-slate-400" /><h1 className="mt-4 text-2xl font-black text-slate-900">{text.signIn}</h1><Link href="/auth" className="mt-5 inline-flex rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white">{text.signIn}</Link></div>;
  if (!driverAccess) return <div className="mx-auto max-w-lg px-4 py-20 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-100 text-violet-800"><IconUser size={28} /></span><p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-violet-700">{lang === "ka" ? "მგზავრის ანგარიში" : "Passenger account"}</p><h1 className="mt-2 text-2xl font-black text-slate-950">{text.driverOnly}</h1><p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{text.driverOnlyText}</p><Link href="/post-request" className="mt-6 inline-flex rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white">{text.postRequest}</Link></div>;

  const now = new Date();
  const today = dayKey(now.toISOString());
  const todayRides = rides.filter((ride) => dayKey(ride.departure_time) === today && new Date(ride.departure_time) >= now);
  const upcomingRides = rides.filter((ride) => dayKey(ride.departure_time) !== today && new Date(ride.departure_time) >= now);
  const pastRides = rides.filter((ride) => new Date(ride.departure_time) < now);
  const section = (title: string, items: DriverRide[]) => items.length ? <section className="mt-8"><h2 className="mb-4 text-xs font-black uppercase tracking-[0.16em] text-slate-500">{title}</h2><div className="space-y-4">{items.map((ride) => <DriverTripCard key={ride.id} ride={ride} lang={lang} onRefresh={loadAll} onDelete={deleteRide} />)}</div></section> : null;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#ede9fe_0,_#faf8ff_34%,_#faf8ff_100%)]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <ScenicPageHero tone="driver" showRoute={false} eyebrow={text.eyebrow} title={text.title} subtitle={text.subtitle} lang={lang} action={<><Link href="/post" className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-black text-violet-950 shadow-lg hover:bg-violet-50"><IconPlus size={16} /> {text.addTrip}</Link><Link href="/driver-requests" className="inline-flex h-11 items-center rounded-xl border border-white/25 bg-white/10 px-4 text-sm font-black text-white backdrop-blur hover:bg-white/20">{text.viewRequests}</Link></>} meta={<span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-black backdrop-blur">{todayRides.length + upcomingRides.length} {text.upcoming.toLowerCase()}</span>} />
        {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}

        {rides.length === 0 ? <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><IconBus size={34} className="mx-auto text-slate-400" /><h2 className="mt-4 text-xl font-black text-slate-900">{text.noRides}</h2><p className="mt-2 text-sm font-medium text-slate-600">{text.noRidesText}</p></div> : <>{section(text.today, todayRides)}{section(text.upcoming, upcomingRides)}{section(text.past, pastRides)}</>}

        <section className="mt-10 border-t border-slate-200 pt-8">
          <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-xl font-black text-slate-950">{text.requests}</h2><p className="mt-2 text-sm font-medium text-slate-600">{text.requestsText}</p></div><Link href="/driver-requests" className="rounded-xl bg-violet-950 px-4 py-2.5 text-sm font-black text-white hover:bg-violet-900">{text.viewRequests}</Link></div>
          <div className="mt-4 space-y-2">{requests.map((request) => <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"><div><p className="font-black text-slate-900">{cityLabel(request.from_city, lang)} → {cityLabel(request.to_city, lang)}</p><p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500"><IconCalendar size={13} /> {new Date(request.departure_date).toLocaleDateString(lang === "ka" ? "ka-GE" : "en-GB")} · {request.passengers} {text.passengers.toLowerCase()}</p></div><a href={`tel:${request.phone}`} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-black text-slate-700">{request.phone}</a></div>)}</div>
        </section>
      </div>
    </div>
  );
}

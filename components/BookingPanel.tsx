"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { IconArmchair, IconBus, IconCheck, IconLoader2, IconPhone, IconUser } from "@tabler/icons-react";
import { createBooking } from "../lib/bookings";
import { api } from "../lib/api";
import { supabase } from "../lib/supabase";
import type { BookingType, Ride } from "../lib/types";
import type { Lang } from "../lib/cities";
import { formatPrice } from "../lib/format";
import SeatStepper from "./SeatStepper";
import DriverContact from "./DriverContact";

type Props = {
  ride: Ride;
  lang: Lang;
  initialPassengers?: number;
  onBooked: () => Promise<void> | void;
};

const COPY = {
  en: {
    title: "Choose how to book",
    seatsMode: "Book seats",
    vanMode: "Book entire van",
    perPassenger: "per passenger",
    privateTrip: "Private trip for your group",
    unavailable: "Unavailable because seats have already been booked.",
    disabled: "The driver has not enabled entire-van booking.",
    name: "Full name",
    phone: "Phone number",
    passengers: "Passengers",
    bookSeats: "Book seats",
    bookVan: "Book entire van",
    total: "Total",
    pending: "Your seats are confirmed when booked. No online payment is collected.",
    confirmation: "Booking confirmed",
    confirmationText: "Your seats are reserved. Driver contact is now available below.",
    myBookings: "View my bookings",
    newBooking: "Book another trip",
    signInHint: "Sign in to book and manage your trip.",
    required: "Enter your name and phone number.",
  },
  ka: {
    title: "აირჩიეთ დაჯავშნის ტიპი",
    seatsMode: "ადგილების დაჯავშნა",
    vanMode: "მთლიანი მინივენის დაჯავშნა",
    perPassenger: "ერთ მგზავრზე",
    privateTrip: "პირადი მგზავრობა თქვენი ჯგუფისთვის",
    unavailable: "მიუწვდომელია, რადგან ადგილები უკვე დაჯავშნილია.",
    disabled: "მძღოლს მთლიანი მინივენის დაჯავშნა არ ჩაურთავს.",
    name: "სახელი და გვარი",
    phone: "ტელეფონის ნომერი",
    passengers: "მგზავრები",
    bookSeats: "ადგილების დაჯავშნა",
    bookVan: "მთლიანი მინივენის დაჯავშნა",
    total: "სულ",
    pending: "დაჯავშნისას ადგილები დადასტურდება. ონლაინ გადახდა არ ხდება.",
    confirmation: "ჯავშანი დადასტურებულია",
    confirmationText: "თქვენი ადგილები დაჯავშნილია. მძღოლის ნომერი ახლა ხელმისაწვდომია.",
    myBookings: "ჩემი ჯავშნები",
    newBooking: "სხვა მგზავრობის ძებნა",
    signInHint: "მგზავრობის დასაჯავშნად და სამართავად შედით ანგარიშში.",
    required: "შეიყვანეთ სახელი და ტელეფონის ნომერი.",
  },
} as const;

export default function BookingPanel({ ride, lang, initialPassengers = 1, onBooked }: Props) {
  const text = COPY[lang];
  const [mode, setMode] = useState<BookingType>("seat");
  const [passengers, setPassengers] = useState(Math.min(Math.max(1, initialPassengers), Math.max(1, ride.seats_available)));
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookingId, setBookingId] = useState<string | null>(null);

  const fullVanEnabled = Boolean(ride.allow_entire_van_booking && ride.entire_van_price);
  const fullVanAvailable = fullVanEnabled && ride.seats_available === ride.seats_total && !ride.full_van_booked;
  const total = mode === "full_van" ? ride.entire_van_price ?? 0 : ride.price_per_seat * passengers;

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      if (!data.user) return;
      const { data: profile } = await api<{ name: string; phone: string }>("/profile");
      if (profile?.name) setName(profile.name);
      if (profile?.phone) setPhone(profile.phone);
    });
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!user) { setError(text.signInHint); return; }
    if (!name.trim() || !phone.trim()) {
      setError(text.required);
      return;
    }

    setLoading(true);
    try {
      const id = await createBooking({
        rideId: ride.id,
        passengerName: name,
        passengerPhone: phone,
        seats: passengers,
        bookingType: mode,
      });
      setBookingId(id);
      await onBooked();
    } catch (bookingError) {
      setError(bookingError instanceof Error ? bookingError.message : "Booking failed.");
    } finally {
      setLoading(false);
    }
  }

  if (bookingId) {
    return (
      <section className="rounded-2xl border border-violet-200 bg-violet-50 p-5 sm:p-6" aria-live="polite">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-600 text-white"><IconCheck size={22} /></div>
        <h2 className="mt-4 text-2xl font-black text-slate-950">{text.confirmation}</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{text.confirmationText}</p>
        <div className="mt-5 rounded-xl border border-violet-200 bg-white p-4">
          <p className="font-black text-slate-900">{ride.from_city} → {ride.to_city}</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">{mode === "full_van" ? text.vanMode : `${passengers} ${text.passengers.toLowerCase()}`} · {formatPrice(total, lang)}</p>
          <div className="mt-3"><DriverContact rideId={ride.id} lang={lang} /></div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          {user && <Link href="/my-bookings" className="rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-black text-white">{text.myBookings}</Link>}
          <Link href="/" className="rounded-xl border border-violet-300 bg-white px-4 py-2.5 text-sm font-black text-violet-800">{text.newBooking}</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-xl font-black text-slate-950">{text.title}</h2>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setMode("seat")}
          className={`rounded-xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-100 ${mode === "seat" ? "border-violet-600 bg-violet-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
        >
          <IconArmchair size={20} className="text-violet-600" />
          <span className="mt-3 block font-black text-slate-900">{text.seatsMode}</span>
          <span className="mt-1 block text-sm font-semibold text-slate-600">{formatPrice(ride.price_per_seat, lang)} {text.perPassenger}</span>
        </button>

        <button
          type="button"
          onClick={() => fullVanAvailable && setMode("full_van")}
          disabled={!fullVanAvailable}
          className={`rounded-xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-100 ${mode === "full_van" ? "border-violet-600 bg-violet-50" : "border-slate-200 bg-white"} disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-65`}
        >
          <IconBus size={20} className="text-violet-600" />
          <span className="mt-3 block font-black text-slate-900">{text.vanMode}</span>
          <span className="mt-1 block text-sm font-semibold text-slate-600">{fullVanEnabled ? `${formatPrice(ride.entire_van_price ?? 0, lang)} · ${text.privateTrip}` : text.disabled}</span>
          {fullVanEnabled && !fullVanAvailable && <span className="mt-2 block text-xs font-bold text-red-600">{text.unavailable}</span>}
        </button>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        {mode === "seat" && (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-50 p-4">
            <SeatStepper value={passengers} max={Math.max(1, ride.seats_available)} onChange={setPassengers} label={text.passengers} />
            <p className="text-right text-sm font-semibold text-slate-600">{passengers} × {formatPrice(ride.price_per_seat, lang)}</p>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-bold text-slate-700">
            {text.name}
            <span className="relative mt-2 block"><IconUser size={16} className="absolute left-3 top-3.5 text-slate-400" /><input value={name} onChange={(event) => setName(event.target.value)} className="h-11 w-full rounded-xl border border-slate-300 pl-10 pr-3 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100" autoComplete="name" /></span>
          </label>
          <label className="text-sm font-bold text-slate-700">
            {text.phone}
            <span className="relative mt-2 block"><IconPhone size={16} className="absolute left-3 top-3.5 text-slate-400" /><input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="h-11 w-full rounded-xl border border-slate-300 pl-10 pr-3 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100" autoComplete="tel" /></span>
          </label>
        </div>

        {!user && <Link href="/auth" className="block text-sm font-bold text-violet-700 underline">{text.signInHint}</Link>}
        <p className="text-xs font-semibold text-slate-500">{text.pending}</p>
        {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}

        <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-5">
          <div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{text.total}</p><p className="text-2xl font-black text-slate-950">{formatPrice(total, lang)}</p></div>
          <button type="submit" disabled={!user || loading || ride.seats_available < 1} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-black text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? <IconLoader2 size={18} className="animate-spin" /> : mode === "full_van" ? <IconBus size={18} /> : <IconArmchair size={18} />}
            {mode === "full_van" ? text.bookVan : text.bookSeats}
          </button>
        </div>
      </form>
    </section>
  );
}

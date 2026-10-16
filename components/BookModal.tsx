"use client";

import { useState } from "react";
import { IconCheck, IconX } from "@tabler/icons-react";
import { createBooking } from "../lib/bookings";
import { formatPrice } from "../lib/format";
import SeatStepper from "./SeatStepper";
import DriverContact from "./DriverContact";

type Props = {
  ride: {
    id: string;
    from_city: string;
    to_city: string;
    price_per_seat: number;
    seats_available: number;
    phone?: string;
    departure_time: string;
  };
  lang: "en" | "ka";
  onClose: () => void;
};

const COPY = {
  en: { title: "Book seats", name: "Full name", phone: "Phone number", seats: "Passengers", total: "Total", confirm: "Confirm booking", done: "Booking confirmed", required: "Enter your name and phone number." },
  ka: { title: "ადგილების დაჯავშნა", name: "სახელი და გვარი", phone: "ტელეფონის ნომერი", seats: "მგზავრები", total: "სულ", confirm: "ჯავშნის დადასტურება", done: "ჯავშანი დადასტურებულია", required: "შეიყვანეთ სახელი და ტელეფონის ნომერი." },
} as const;

export default function BookModal({ ride, lang, onClose }: Props) {
  const text = COPY[lang];
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [seats, setSeats] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError(text.required);
      return;
    }
    setLoading(true);
    setError("");
    try {
      await createBooking({ rideId: ride.id, passengerName: name, passengerPhone: phone, seats, bookingType: "seat" });
      setDone(true);
    } catch (bookingError) {
      setError(bookingError instanceof Error ? bookingError.message : "Booking failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/55 p-3 sm:place-items-center" onMouseDown={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:p-6" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div><h2 className="text-xl font-black text-slate-950">{text.title}</h2><p className="mt-1 text-sm font-semibold text-slate-600">{ride.from_city} to {ride.to_city}</p></div>
          <button onClick={onClose} aria-label="Close" className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-600"><IconX size={18} /></button>
        </div>

        {done ? <div className="py-10 text-center"><IconCheck className="mx-auto text-violet-700" size={38} /><p className="mt-3 text-lg font-black text-slate-950">{text.done}</p><DriverContact rideId={ride.id} lang={lang} /></div> : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder={text.name} className="min-h-12 w-full rounded-xl border border-slate-200 px-4 font-semibold outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-100" />
            <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder={text.phone} className="min-h-12 w-full rounded-xl border border-slate-200 px-4 font-semibold outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-100" />
            <div className="flex items-end justify-between gap-4"><SeatStepper value={seats} min={1} max={ride.seats_available} onChange={setSeats} label={text.seats} /><p className="text-right text-sm font-bold text-slate-500">{text.total}<strong className="block text-2xl text-slate-950">{formatPrice(ride.price_per_seat * seats, lang)}</strong></p></div>
            {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
            <button disabled={loading} className="min-h-12 w-full rounded-xl bg-violet-600 px-4 font-black text-white hover:bg-violet-700 disabled:opacity-50">{loading ? "..." : text.confirm}</button>
          </form>
        )}
      </div>
    </div>
  );
}

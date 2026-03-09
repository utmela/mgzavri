"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

type Props = {
  ride: {
    id: string; from_city: string; to_city: string;
    price_per_seat: number; seats_available: number;
    phone: string; departure_time: string;
  };
  lang: "en" | "ka";
  onClose: () => void;
};

const T = {
  en: {
    title: "Book a seat", name: "Full name", phone: "Phone number",
    seats: "Number of seats", confirm: "Confirm booking",
    cancel: "Cancel", success: "Booking confirmed! 🎉",
    error: "Please fill in all fields.", fail: "Booking failed. Try again.",
    perSeat: "/ seat", total: "Total",
  },
  ka: {
    title: "ადგილის დაჯავშნა", name: "სახელი და გვარი", phone: "ტელეფონი",
    seats: "ადგილების რაოდენობა", confirm: "დაჯავშნა",
    cancel: "გაუქმება", success: "დაჯავშნა წარმატებულია! 🎉",
    error: "შეავსეთ ყველა ველი.", fail: "შეცდომა. სცადეთ თავიდან.",
    perSeat: "/ ადგილი", total: "სულ",
  },
};

export default function BookModal({ ride, lang, onClose }: Props) {
  const t = T[lang];
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [seats, setSeats] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  async function confirm() {
    if (!name.trim() || !phone.trim()) { setErr(t.error); return; }
    setLoading(true);

    const { error: bookErr } = await supabase.from("bookings").insert({
      ride_id: ride.id,
      passenger_name: name,
      phone,
      seats,
    });

    if (bookErr) { setErr(t.fail); setLoading(false); return; }

    const { error: seatErr } = await supabase
      .from("rides")
      .update({ seats_available: ride.seats_available - seats })
      .eq("id", ride.id);

    if (seatErr) { setErr(t.fail); setLoading(false); return; }

    setLoading(false);
    setDone(true);
    setTimeout(onClose, 2200);
  }

  const inp = "w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition placeholder-gray-400";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-4 sm:pb-0"
      onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-5 text-white">
          <h2 className="text-lg font-black">{t.title}</h2>
          <p className="text-violet-200 text-sm mt-0.5">
            {ride.from_city} → {ride.to_city} · {new Date(ride.departure_time).toLocaleString()}
          </p>
        </div>

        {done ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="text-6xl animate-bounce">🎉</div>
            <p className="text-lg font-black text-gray-800">{t.success}</p>
          </div>
        ) : (
          <div className="p-6 space-y-3">
            <input value={name} onChange={(e) => setName(e.target.value)}
              placeholder={t.name} className={inp} />
            <input value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder={t.phone} className={inp} />

            {/* Seat stepper */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-400">{t.seats}</label>
              <div className="flex items-center gap-4">
                <button onClick={() => setSeats((s) => Math.max(1, s - 1))}
                  className="h-10 w-10 rounded-xl border border-gray-200 text-xl font-bold text-gray-600 hover:bg-gray-50 transition">−</button>
                <span className="text-2xl font-black text-violet-700 w-6 text-center">{seats}</span>
                <button onClick={() => setSeats((s) => Math.min(ride.seats_available, s + 1))}
                  className="h-10 w-10 rounded-xl border border-gray-200 text-xl font-bold text-gray-600 hover:bg-gray-50 transition">+</button>
                <div className="ml-auto rounded-2xl bg-violet-50 border border-violet-100 px-4 py-2 text-center">
                  <p className="text-xs text-violet-400 font-semibold">{t.total}</p>
                  <p className="text-xl font-black text-violet-700">{ride.price_per_seat * seats}₾</p>
                </div>
              </div>
            </div>

            {err && <p className="rounded-xl bg-red-50 px-4 py-2 text-xs font-semibold text-red-600">{err}</p>}

            <div className="flex gap-3 pt-1">
              <button onClick={confirm} disabled={loading}
                className="flex-1 h-12 rounded-2xl bg-violet-600 font-bold text-white hover:bg-violet-700 disabled:opacity-50 transition">
                {loading ? "…" : t.confirm}
              </button>
              <button onClick={onClose}
                className="flex-1 h-12 rounded-2xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition">
                {t.cancel}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
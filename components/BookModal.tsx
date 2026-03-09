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
    noSeats: "Not enough seats available.", perSeat: "/ seat", total: "Total",
  },
  ka: {
    title: "ადგილის დაჯავშნა", name: "სახელი და გვარი", phone: "ტელეფონი",
    seats: "ადგილების რაოდენობა", confirm: "დაჯავშნა",
    cancel: "გაუქმება", success: "დაჯავშნა წარმატებულია! 🎉",
    error: "შეავსეთ ყველა ველი.", fail: "შეცდომა. სცადეთ თავიდან.",
    noSeats: "საკმარისი ადგილი არ არის.", perSeat: "/ ადგილი", total: "სულ",
  },
};

export default function BookModal({ ride, lang, onClose }: Props) {
  const t = T[lang];
  const [name,    setName]    = useState("");
  const [phone,   setPhone]   = useState("");
  const [seats,   setSeats]   = useState(1);
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [err,     setErr]     = useState("");

  async function confirm() {
    setErr("");
    if (!name.trim() || !phone.trim()) { setErr(t.error); return; }
    setLoading(true);

    // 1. Re-fetch current seats
    const { data: fresh, error: fetchErr } = await supabase
      .from("rides")
      .select("seats_available")
      .eq("id", ride.id)
      .single();

    if (fetchErr || !fresh) {
      console.error("FETCH ERR:", fetchErr);
      setErr(t.fail); setLoading(false); return;
    }
    if (fresh.seats_available < seats) {
      setErr(t.noSeats); setLoading(false); return;
    }

    // 2. Insert booking
    const { error: bookErr } = await supabase.from("bookings").insert({
      ride_id: ride.id,
      passenger_name: name.trim(),
      phone: phone.trim(),
      seats_booked: seats,
    });
    if (bookErr) {
      console.error("BOOKING ERR:", bookErr.code, bookErr.message, bookErr.details);
      setErr(`${t.fail} (${bookErr.message})`);
      setLoading(false); return;
    }

    // 3. Decrement seats
    const { error: seatErr } = await supabase
      .from("rides")
      .update({ seats_available: fresh.seats_available - seats })
      .eq("id", ride.id);

    if (seatErr) {
      console.error("SEAT UPDATE ERR:", seatErr.code, seatErr.message, seatErr.details);
      setErr(`${t.fail} (${seatErr.message})`);
      setLoading(false); return;
    }

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
            <input
              value={name} onChange={(e) => { setName(e.target.value); setErr(""); }}
              placeholder={t.name} className={inp}
            />
            <input
              value={phone} onChange={(e) => { setPhone(e.target.value); setErr(""); }}
              placeholder={t.phone} className={inp}
            />

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-400">{t.seats}</label>
              <div className="flex items-center gap-4">
                <button type="button" onClick={() => setSeats(s => Math.max(1, s - 1))}
                  className="h-10 w-10 rounded-xl border border-gray-200 text-xl font-bold text-gray-600 hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700 active:scale-95 transition">−</button>
                <span className="text-2xl font-black text-violet-700 w-6 text-center">{seats}</span>
                <button type="button" onClick={() => setSeats(s => Math.min(ride.seats_available, s + 1))}
                  className="h-10 w-10 rounded-xl border border-gray-200 text-xl font-bold text-gray-600 hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700 active:scale-95 transition">+</button>
                <div className="ml-auto rounded-2xl bg-violet-50 border border-violet-100 px-4 py-2 text-center">
                  <p className="text-xs text-violet-400 font-semibold">{t.total}</p>
                  <p className="text-xl font-black text-violet-700">{ride.price_per_seat * seats}₾</p>
                </div>
              </div>
            </div>

            {err && (
              <p className="rounded-xl bg-red-50 border border-red-100 px-4 py-2.5 text-xs font-semibold text-red-600 break-all">
                ⚠️ {err}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button onClick={confirm} disabled={loading}
                className="flex-1 h-12 rounded-2xl bg-violet-600 font-bold text-white hover:bg-violet-700 disabled:opacity-50 transition shadow-md shadow-violet-200">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    …
                  </span>
                ) : t.confirm}
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
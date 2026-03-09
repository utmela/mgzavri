"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import BookModal from "../../../components/BookModal";
import GeorgianPlate from "../../../components/GeorgianPlate";

type Lang = "en" | "ka";

const CITIES = [
  { en: "Tbilisi",   ka: "თბილისი",   img: "https://images.unsplash.com/photo-1565008576549-57569a49371d?w=800&q=80" },
  { en: "Kutaisi",   ka: "ქუთაისი",   img: "https://images.unsplash.com/photo-1589656966895-2f33e7653819?w=800&q=80" },
  { en: "Batumi",    ka: "ბათუმი",    img: "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=800&q=80" },
  { en: "Zugdidi",   ka: "ზუგდიდი",   img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80" },
  { en: "Gori",      ka: "გორი",      img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80" },
  { en: "Rustavi",   ka: "რუსთავი",   img: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80" },
  { en: "Telavi",    ka: "თელავი",    img: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&q=80" },
  { en: "Borjomi",   ka: "ბორჯომი",   img: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80" },
  { en: "Bakuriani", ka: "ბაკურიანი", img: "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=800&q=80" },
  { en: "Gudauri",   ka: "გუდაური",   img: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80" },
  { en: "Poti",      ka: "ფოთი",      img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80" },
  { en: "Senaki",    ka: "სენაკი",    img: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80" },
  { en: "Samtredia", ka: "სამტრედია", img: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80" },
  { en: "Kobuleti",  ka: "ქობულეთი",  img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80" },
  { en: "Ozurgeti",  ka: "ოზურგეთი",  img: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80" },
  { en: "Mestia",    ka: "მესტია",    img: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80" },
];

const VEHICLE_COLORS: Record<string, { hex: string; ka: string; border: string }> = {
  White:  { hex: "#FFFFFF", ka: "თეთრი",      border: "#d1d5db" },
  Black:  { hex: "#1a1a1a", ka: "შავი",       border: "#374151" },
  Silver: { hex: "#C0C0C0", ka: "ვერცხლი",    border: "#9ca3af" },
  Gray:   { hex: "#6B7280", ka: "რუხი",      border: "#6B7280" },
  Red:    { hex: "#DC2626", ka: "წითელი",     border: "#DC2626" },
  Blue:   { hex: "#2563EB", ka: "ლურჯი",      border: "#2563EB" },
  Green:  { hex: "#16A34A", ka: "მწვანე",     border: "#16A34A" },
  Yellow: { hex: "#EAB308", ka: "ყვითელი",    border: "#CA8A04" },
  Orange: { hex: "#EA580C", ka: "ნარინჯი",    border: "#EA580C" },
  Brown:  { hex: "#92400E", ka: "ყავისფერი",  border: "#92400E" },
  Beige:  { hex: "#D4C5A9", ka: "კრემისფერი", border: "#9ca3af" },
  Gold:   { hex: "#B8860B", ka: "ოქროსფერი",  border: "#B8860B" },
};

const T = {
  en: {
    back: "← Back", book: "Book a seat", call: "Call", whatsapp: "WhatsApp",
    seatsLeft: "seats left", full: "No seats available",
    passengers: "Passengers", noPassengers: "No bookings yet.",
    price: "Price / seat", vehicle: "Vehicle", departure: "Departure",
    phone: "Phone", plate: "Licence plate", color: "Color",
    today: "Today", tomorrow: "Tomorrow", soon: "Departing soon",
    upcoming: "Upcoming", departed: "Departed", booked: "% booked",
  },
  ka: {
    back: "← უკან", book: "ადგილის დაჯავშნა", call: "ზარი", whatsapp: "WhatsApp",
    seatsLeft: "ადგილი", full: "ადგილი აღარ არის",
    passengers: "მგზავრები", noPassengers: "ჯერ დაჯავშნა არ არის.",
    price: "ფასი / ადგილი", vehicle: "მანქანა", departure: "გასვლა",
    phone: "ტელეფონი", plate: "სახ. ნომერი", color: "ფერი",
    today: "დღეს", tomorrow: "ხვალ", soon: "მალე მიდის",
    upcoming: "მომავალში", departed: "გავიდა", booked: "% დაჯავშნული",
  },
};

function getCityData(city: string) {
  return CITIES.find((c) => c.en === city) ?? CITIES[0];
}
function getCityLabel(city: string, lang: Lang) {
  const found = CITIES.find((c) => c.en === city);
  return found ? (lang === "ka" ? found.ka : found.en) : city;
}
function getBadge(ts: string, t: (typeof T)[Lang]) {
  const h = (new Date(ts).getTime() - Date.now()) / 36e5;
  if (isNaN(h) || h < -1) return { label: t.departed, cls: "bg-gray-100 text-gray-600" };
  if (h <= 1)  return { label: t.soon,     cls: "bg-rose-100 text-rose-700" };
  if (h < 24)  return { label: t.today,    cls: "bg-violet-100 text-violet-700" };
  if (h < 48)  return { label: t.tomorrow, cls: "bg-indigo-100 text-indigo-700" };
  return         { label: t.upcoming,  cls: "bg-slate-100 text-slate-600" };
}
function waLink(phone: string) {
  const d = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${d.startsWith("995") ? d : `995${d}`}`;
}

export default function RidePage() {
  const { id } = useParams();
  const router  = useRouter();
  const [ride,     setRide]     = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [lang,     setLang]     = useState<Lang>("ka");
  const [showBook, setShowBook] = useState(false);
  const t = T[lang];

  async function load() {
    const { data: r } = await supabase.from("rides").select("*").eq("id", id).single();
    setRide(r);
    const { data: b } = await supabase.from("bookings").select("*").eq("ride_id", id).order("created_at", { ascending: false });
    setBookings(b ?? []);
  }

  useEffect(() => { load(); }, []);

  if (!ride) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>Loading…
      </div>
    </div>
  );

  const badge     = getBadge(ride.departure_time, t);
  const booked    = ride.seats_total - ride.seats_available;
  const pct       = Math.round((booked / ride.seats_total) * 100);
  const fromData  = getCityData(ride.from_city);
  const toData    = getCityData(ride.to_city);
  const colorInfo = ride.vehicle_color ? VEHICLE_COLORS[ride.vehicle_color] : null;

  return (
    <div className="min-h-screen font-sans bg-gray-50">

      {/* NAV */}
      <nav style={{ background: "rgba(255,255,255,0.96)", backdropFilter: "blur(20px)" }}
        className="sticky top-0 z-50 border-b border-gray-200 shadow-sm">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <a href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-600 text-xl shadow-lg shadow-violet-200">🚐</div>
            <span className="text-xl font-black text-gray-900 tracking-tight">mgzavri</span>
          </a>
          <button onClick={() => setLang((l) => l === "en" ? "ka" : "en")}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 transition">
            <span>{lang === "en" ? "🇬🇪" : "🇬🇧"}</span>
            <span>{lang === "en" ? "KA" : "EN"}</span>
          </button>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 space-y-4">

        <button onClick={() => router.back()}
          className="flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-violet-600 transition">
          {t.back}
        </button>

        {/* ── HERO: split city photos ── */}
        <div className="relative h-52 sm:h-64 overflow-hidden rounded-3xl shadow-lg">
          <div className="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
            <img src={fromData.img} alt={ride.from_city} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-black/10" />
            <div className="absolute bottom-4 left-5">
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/60 mb-0.5">From</p>
              <p className="text-2xl font-black text-white drop-shadow">{getCityLabel(ride.from_city, lang)}</p>
            </div>
          </div>
          <div className="absolute inset-y-0 right-0 w-1/2 overflow-hidden">
            <img src={toData.img} alt={ride.to_city} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-l from-black/50 to-black/10" />
            <div className="absolute bottom-4 right-5 text-right">
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/60 mb-0.5">To</p>
              <p className="text-2xl font-black text-white drop-shadow">{getCityLabel(ride.to_city, lang)}</p>
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-1.5 rounded-full bg-white/95 px-4 py-2 shadow-xl border border-white/80">
              <span className="text-xl">🚐</span>
              <span className="text-violet-600 font-black text-xl">→</span>
            </div>
          </div>
          <div className="absolute top-4 left-4">
            <span className={`rounded-full px-3 py-1 text-[11px] font-bold backdrop-blur-sm ${badge.cls}`}>{badge.label}</span>
          </div>
          <div className="absolute top-4 right-4">
            <div className="rounded-2xl bg-white/95 backdrop-blur-sm px-4 py-2 text-center shadow-lg">
              <p className="text-2xl font-black text-violet-700">{ride.price_per_seat}₾</p>
              <p className="text-[10px] font-semibold text-gray-400 leading-none">{t.price}</p>
            </div>
          </div>
        </div>

        {/* ── Info grid ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: "🕐", label: t.departure, val: new Date(ride.departure_time).toLocaleString() },
            { icon: "📞", label: t.phone,     val: ride.phone },
            { icon: "💺", label: t.seatsLeft, val: `${ride.seats_available} / ${ride.seats_total}` },
            { icon: "💰", label: t.price,     val: `${ride.price_per_seat}₾` },
          ].map(({ icon, label, val }) => (
            <div key={label} className="rounded-2xl bg-white border border-gray-200 p-4 shadow-sm">
              <div className="text-xl mb-1">{icon}</div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-0.5">{label}</div>
              <div className="font-black text-gray-800 text-sm break-all">{val}</div>
            </div>
          ))}
        </div>

        {/* ── Vehicle card ── */}
        <div className="rounded-3xl bg-white border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
            <span className="text-lg">🚐</span>
            <span className="font-black text-gray-800">{t.vehicle}</span>
          </div>
          <div className="p-5 flex flex-wrap items-start gap-6">

            {/* Left: icon + color */}
            <div className="flex flex-col items-center gap-3">
              <div className="text-6xl"
                style={{ filter: colorInfo ? `drop-shadow(0 4px 10px ${colorInfo.hex}77)` : undefined }}>
                🚐
              </div>
              {colorInfo && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div className="h-4 w-4 rounded-full shrink-0"
                      style={{ background: colorInfo.hex, border: `1.5px solid ${colorInfo.border}` }} />
                    {/* Bold bilingual color name */}
                    <span className="text-sm font-black text-gray-800">{ride.vehicle_color}</span>
                  </div>
                  <span className="text-xs font-bold text-gray-400">{colorInfo.ka}</span>
                </div>
              )}
            </div>

            {/* Right: model + plate */}
            <div className="flex flex-col gap-4 justify-center flex-1">
              {ride.vehicle_type && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">
                    {lang === "ka" ? "მოდელი" : "Model"}
                  </p>
                  <p className="text-xl font-black text-gray-900">{ride.vehicle_type}</p>
                </div>
              )}
              {ride.plate_number && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">
                    {t.plate}
                  </p>
                  <GeorgianPlate plate={ride.plate_number} size="lg" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Seat occupancy ── */}
        <div className="rounded-3xl bg-white border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="font-black text-gray-800">💺 {ride.seats_available} {t.seatsLeft}</span>
            <span className="text-sm font-bold text-violet-600">{pct}{t.booked}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {Array.from({ length: Math.min(ride.seats_total, 20) }).map((_, i) => (
              <div key={i}
                className={`h-5 w-5 rounded-lg transition-colors ${
                  i < ride.seats_available ? "bg-violet-500 shadow-sm shadow-violet-200" : "bg-gray-200"
                }`} />
            ))}
            {ride.seats_total > 20 && <span className="text-xs text-gray-400 self-center ml-1">+{ride.seats_total - 20}</span>}
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="grid grid-cols-2 gap-3">
          <a href={`tel:${ride.phone}`}
            className="flex items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 py-3.5 text-sm font-bold text-violet-700 hover:bg-violet-100 transition">
            📞 {t.call}
          </a>
          <a href={waLink(ride.phone)} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-sm font-bold text-white hover:bg-emerald-600 transition">
            💬 {t.whatsapp}
          </a>
        </div>

        {ride.seats_available > 0 ? (
          <button onClick={() => setShowBook(true)}
            className="w-full h-14 rounded-2xl bg-violet-600 text-base font-black text-white hover:bg-violet-700 transition shadow-lg shadow-violet-200">
            ✓ {t.book}
          </button>
        ) : (
          <div className="w-full h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-400">
            {t.full}
          </div>
        )}

        {/* ── Passengers ── */}
        <div className="rounded-3xl bg-white border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <span className="font-black text-gray-800">👥 {t.passengers}</span>
            {bookings.length > 0 && (
              <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-bold text-violet-700">{bookings.length}</span>
            )}
          </div>
          {bookings.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">{t.noPassengers}</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {bookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-sm font-black text-violet-700">
                      {b.passenger_name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{b.passenger_name}</p>
                      <p className="text-xs text-gray-400">{b.phone} · {b.seats_booked} {t.seatsLeft}</p>
                    </div>
                  </div>
                  <a href={`tel:${b.phone}`}
                    className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700 hover:bg-violet-100 transition">
                    📞
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {showBook && <BookModal ride={ride} lang={lang} onClose={() => { setShowBook(false); load(); }} />}
    </div>
  );
}
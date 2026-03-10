"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import BookModal from "../components/BookModal";
import GeorgianPlate from "../components/GeorgianPlate";
import CustomSelect from "../components/CustomSelect";
import { useIsAdmin } from "../lib/uselsAdmin";

const CITIES = [
  { en: "Tbilisi",   ka: "თბილისი",   img: "/cities/tbilisi.jpg" },
  { en: "Kutaisi",   ka: "ქუთაისი",   img: "/cities/kutaisi.jpg" },
  { en: "Batumi",    ka: "ბათუმი",    img: "/cities/batumi.jpg" },
  { en: "Zugdidi",   ka: "ზუგდიდი",   img: "/cities/zugdidi.jpg" },
  { en: "Gori",      ka: "გორი",      img: "/cities/gori.jpg" },
  { en: "Rustavi",   ka: "რუსთავი",   img: "/cities/rustavi.jpg" },
  { en: "Telavi",    ka: "თელავი",    img: "/cities/telavi.jpg" },
  { en: "Borjomi",   ka: "ბორჯომი",   img: "/cities/borjomi.jpg" },
  { en: "Bakuriani", ka: "ბაკურიანი", img: "/cities/bakuriani.jpg" },
  { en: "Gudauri",   ka: "გუდაური",   img: "/cities/gudauri.jpg" },
  { en: "Poti",      ka: "ფოთი",      img: "/cities/poti.jpg" },
  { en: "Senaki",    ka: "სენაკი",    img: "/cities/senaki.jpg" },
  { en: "Samtredia", ka: "სამტრედია", img: "/cities/samtredia.jpg" },
  { en: "Kobuleti",  ka: "ქობულეთი",  img: "/cities/kobuleti.jpg" },
  { en: "Ozurgeti",  ka: "ოზურგეთი",  img: "/cities/ozurgeti.jpg" },
  { en: "Mestia",    ka: "მესტია",    img: "/cities/mestia.jpg" },
] as const;

const VEHICLE_COLORS: Record<string, { hex: string; ka: string; border: string }> = {
  White:  { hex: "#FFFFFF", ka: "თეთრი",      border: "#d1d5db" },
  Black:  { hex: "#1a1a1a", ka: "შავი",       border: "#374151" },
  Silver: { hex: "#C0C0C0", ka: "ვერცხლი",    border: "#9ca3af" },
  Gray:   { hex: "#6B7280", ka: "რუხი",       border: "#6B7280" },
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
    tagline: "Your ride across Georgia",
    sub: "Find a minivan seat, book instantly, travel comfortably.",
    from: "From", to: "To", allCities: "Anywhere", search: "Search", clear: "Clear",
    seatsLeft: "seats left", perSeat: "/ seat", full: "Full", book: "Book",
    whatsapp: "WhatsApp",
    noRides: "No rides found", noRidesSub: "Try different cities or post your own ride.",
    noRequests: "No passenger requests", noRequestsSub: "Passengers haven't posted travel requests yet.",
    postRide: "Post a ride", postRequest: "Post a request",
    rides: "rides", seats: "seats", cities: "destinations", requests: "requests",
    loading: "Loading…", today: "Today", tomorrow: "Tomorrow",
    soon: "Departing soon", upcoming: "Upcoming", departed: "Departed",
    ad: "Advertisement", advertise: "Advertise with us",
    myRides: "My rides", signIn: "Sign in", signUp: "Sign up", logout: "Logout",
    sort: "Sort", sortTime: "By time", sortPrice: "Price ↑", sortPriceDesc: "Price ↓",
    myBookings: "My bookings",
    deleteConfirm: "Delete this ride?", deleteFail: "Failed to delete ride.",
    admin: "Admin panel",
    vehicle: "Vehicle", plate: "Plate", phone: "Phone", departure: "Departure",
    whereTo: "Where do you want to go?", whoNeeds: "Who needs a ride?",
    iAm: "I am a",
    rolePassenger: "Passenger", roleDriver: "Driver",
    passengerCount: "Passengers", contactDriver: "Contact",
    budget: "Budget", flexible: "Flexible",
  },
  ka: {
    tagline: "შენი მგზავრობა საქართველოში",
    sub: "იპოვე მინივენში ადგილი, დაჯავშნე სწრაფად, იმგზავრე კომფორტულად.",
    from: "საიდან", to: "სადამდე", allCities: "ნებისმიერი", search: "ძებნა", clear: "გასუფთავება",
    seatsLeft: "ადგილი", perSeat: "/ ადგილი", full: "სავსეა", book: "დაჯავშნა",
    whatsapp: "WhatsApp",
    noRides: "მოგზაურობა ვერ მოიძებნა", noRidesSub: "სცადეთ სხვა ქალაქები ან დაამატეთ თქვენი.",
    noRequests: "მოთხოვნები არ არის", noRequestsSub: "მგზავრებს ჯერ არ დაუმატებიათ მოთხოვნები.",
    postRide: "მოგზაურობის დამატება", postRequest: "მოთხოვნის დამატება",
    rides: "მოგზაურობა", seats: "ადგილი", cities: "მიმართულება", requests: "მოთხოვნა",
    loading: "იტვირთება…", today: "დღეს", tomorrow: "ხვალ",
    soon: "მალე მიდის", upcoming: "მომავალში", departed: "გავიდა",
    ad: "რეკლამა", advertise: "განათავსეთ რეკლამა აქ",
    myRides: "ჩემი მოგზაურობები", signIn: "შესვლა", signUp: "რეგისტრაცია", logout: "გასვლა",
    sort: "სორტირება", sortTime: "დროით", sortPrice: "ფასი ↑", sortPriceDesc: "ფასი ↓",
    myBookings: "ჩემი ჯავშნები",
    deleteConfirm: "წაშალოთ ეს მოგზაურობა?", deleteFail: "წაშლა ვერ მოხერხდა.",
    admin: "ადმინ პანელი",
    vehicle: "მანქანა", plate: "ნომერი", phone: "ტელეფონი", departure: "გამგზავრება",
    whereTo: "სად გინდა წასვლა?", whoNeeds: "ვის სჭირდება მგზავრობა?",
    iAm: "მე ვარ",
    rolePassenger: "მგზავრი", roleDriver: "მძღოლი",
    passengerCount: "მგზავრი", contactDriver: "დაკავშირება",
    budget: "ბიუჯეტი", flexible: "მოქნილი",
  },
} as const;

type Lang = keyof typeof T;
type Role = "passenger" | "driver";
type Ride = {
  user_id: any; id: string; from_city: string; to_city: string;
  price_per_seat: number; seats_total: number; seats_available: number;
  phone: string; vehicle_type: string; departure_time: string;
  plate_number?: string; vehicle_color?: string;
};
// Passenger requests — pulled from a "requests" table
// Expected columns: id, from_city, to_city, departure_date, passengers, budget, phone, note, created_at, user_id
type Request = {
  id: string; user_id: any; from_city: string; to_city: string;
  departure_date: string; passengers: number; budget?: number;
  phone: string; note?: string; created_at: string;
};

function getCityImg(city: string) {
  return CITIES.find(c => c.en === city)?.img ??
    "https://images.unsplash.com/photo-1565008576549-57569a49371d?w=400&q=80";
}
function getCityLabel(city: string, lang: Lang) {
  const f = CITIES.find(c => c.en === city);
  return f ? (lang === "ka" ? f.ka : f.en) : city;
}
function getBadge(ts: string, t: (typeof T)[Lang]) {
  const h = (new Date(ts).getTime() - Date.now()) / 36e5;
  if (isNaN(h) || h < -1) return { label: t.departed, cls: "bg-gray-800/80 text-gray-100" };
  if (h <= 1)  return { label: t.soon,     cls: "bg-rose-600 text-white" };
  if (h < 24)  return { label: t.today,    cls: "bg-violet-600 text-white" };
  if (h < 48)  return { label: t.tomorrow, cls: "bg-indigo-600 text-white" };
  return         { label: t.upcoming,  cls: "bg-slate-700 text-white" };
}
function waLink(phone: string) {
  const d = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${d.startsWith("995") ? d : `995${d}`}`;
}

/* ─── Role Toggle ── */
function RoleToggle({ role, setRole, t }: { role: Role; setRole: (r: Role) => void; t: (typeof T)[Lang] }) {
  return (
    <div className="inline-flex rounded-2xl border-2 border-gray-200 bg-white p-1 shadow-sm">
      <button
        onClick={() => setRole("passenger")}
        className={`relative flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-200 ${
          role === "passenger"
            ? "bg-violet-600 text-white shadow-lg shadow-violet-200 scale-[1.02]"
            : "text-gray-400 hover:text-gray-700"
        }`}
      >
        <span className="text-base">💺</span>
        <span>{t.rolePassenger}</span>
        {role === "passenger" && (
          <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"/>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500"/>
          </span>
        )}
      </button>
      <button
        onClick={() => setRole("driver")}
        className={`relative flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-200 ${
          role === "driver"
            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-[1.02]"
            : "text-gray-400 hover:text-gray-700"
        }`}
      >
        <span className="text-base">🚐</span>
        <span>{t.roleDriver}</span>
        {role === "driver" && (
          <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"/>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"/>
          </span>
        )}
      </button>
    </div>
  );
}

/* ─── Direction Arrow ── */
function DirectionArrow() {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white/95 px-4 py-2.5 shadow-2xl border border-white/80 backdrop-blur-sm">
      <span className="text-lg">🚐</span>
      <svg width="28" height="14" viewBox="0 0 28 14" fill="none" className="text-violet-600">
        <path d="M0 7H24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M18 1L25.5 7L18 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

/* ─── Vehicle Strip ── */
function VehicleStrip({ ride, lang, t }: { ride: Ride; lang: Lang; t: (typeof T)[Lang] }) {
  const colorInfo = ride.vehicle_color ? VEHICLE_COLORS[ride.vehicle_color] : null;
  return (
    <div className="rounded-2xl border-2 border-gray-100 bg-gray-50/80 overflow-hidden">
      <div className="flex items-stretch divide-x-2 divide-gray-100">
        <div className="flex items-center gap-3 px-4 py-3 flex-1 min-w-0">
          {colorInfo ? (
            <div className="h-11 w-11 rounded-xl shrink-0 shadow-md"
              style={{ background: colorInfo.hex, border: `2.5px solid ${colorInfo.border}`, boxShadow: `0 4px 10px ${colorInfo.hex}60` }} />
          ) : (
            <div className="h-11 w-11 rounded-xl border-2 border-dashed border-gray-200 bg-white shrink-0 flex items-center justify-center text-lg">🚐</div>
          )}
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-violet-400 leading-none mb-1">{t.vehicle}</p>
            <p className="text-sm font-black text-gray-900 truncate">{ride.vehicle_type || "—"}</p>
            {colorInfo && <p className="text-[11px] font-bold mt-0.5 text-gray-600">{ride.vehicle_color} · {colorInfo.ka}</p>}
          </div>
        </div>
        <div className="flex flex-col justify-center px-4 py-3 shrink-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-violet-400 leading-none mb-2">{t.plate}</p>
          {ride.plate_number ? <GeorgianPlate plate={ride.plate_number} size="sm" /> : <span className="text-xs font-bold text-gray-400 italic">—</span>}
        </div>
        <div className="flex flex-col justify-center px-4 py-3 shrink-0 gap-1.5">
          <p className="text-[10px] font-black uppercase tracking-widest text-violet-400 leading-none">{t.phone}</p>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-gray-900 whitespace-nowrap">{ride.phone}</span>
            <a href={`tel:${ride.phone}`} onClick={e => e.stopPropagation()}
              className="flex items-center justify-center h-7 w-7 rounded-xl bg-violet-100 hover:bg-violet-200 text-violet-700 transition shrink-0">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.47 11.47 0 003.58.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.47 11.47 0 00.57 3.58 1 1 0 01-.25 1.01l-2.2 2.2z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
      {colorInfo && (
        <div className="flex items-center gap-2 px-4 py-1.5 border-t-2 border-gray-100" style={{ background: `${colorInfo.hex}20` }}>
          <div className="h-3 w-3 rounded-full shrink-0" style={{ background: colorInfo.hex, border: `1.5px solid ${colorInfo.border}` }} />
          <span className="text-[11px] font-black text-gray-700 tracking-wide uppercase">{ride.vehicle_color}</span>
          <span className="text-[11px] text-gray-300 font-bold">·</span>
          <span className="text-[11px] font-black text-gray-600">{colorInfo.ka}</span>
        </div>
      )}
    </div>
  );
}

/* ─── Passenger Request Card ── */
function RequestCard({ req, lang, t, user, isAdmin, onDelete }: {
  req: Request; lang: Lang; t: (typeof T)[Lang];
  user: any; isAdmin: boolean; onDelete: (id: string) => void;
}) {
  const fromImg = getCityImg(req.from_city);
  const toImg   = getCityImg(req.to_city);
  const dateStr = new Date(req.departure_date).toLocaleDateString(lang === "ka" ? "ka-GE" : "en-GB", { weekday: "short", day: "numeric", month: "short" });
  const canDel  = user && (isAdmin || req.user_id === user.id);

  return (
    <div className="overflow-hidden rounded-3xl border-2 border-emerald-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:border-emerald-300 cursor-default">
      {/* Banner */}
      <div className="relative h-36 sm:h-44 overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
          <img src={fromImg} alt={req.from_city} className="h-full w-full object-cover scale-110"/>
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"/>
          <div className="absolute bottom-5 left-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-1">FROM</p>
            <p className="text-3xl font-black text-white drop-shadow-lg leading-tight">{getCityLabel(req.from_city, lang)}</p>
          </div>
        </div>
        <div className="absolute inset-y-0 right-0 w-1/2 overflow-hidden">
          <img src={toImg} alt={req.to_city} className="h-full w-full object-cover scale-110"/>
          <div className="absolute inset-0 bg-gradient-to-l from-black/70 via-black/40 to-transparent"/>
          <div className="absolute bottom-5 right-5 text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-1">TO</p>
            <p className="text-3xl font-black text-white drop-shadow-lg leading-tight">{getCityLabel(req.to_city, lang)}</p>
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Passenger arrow — reversed style */}
          <div className="flex items-center gap-2 rounded-2xl bg-white/95 px-4 py-2.5 shadow-2xl border border-white/80 backdrop-blur-sm">
            <span className="text-lg">🙋</span>
            <svg width="28" height="14" viewBox="0 0 28 14" fill="none" className="text-emerald-600">
              <path d="M0 7H24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M18 1L25.5 7L18 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        {/* Request badge */}
        <div className="absolute top-3 left-3">
          <span className="rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-black text-white shadow-sm">
            🙋 {lang === "ka" ? "მოთხოვნა" : "Request"}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-3">

            {/* Date */}
            <p className="text-sm font-black text-gray-700 flex items-center gap-1.5">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-sm">📅</span>
              {dateStr}
            </p>

            {/* Info strip */}
            <div className="rounded-2xl border-2 border-gray-100 bg-gray-50/80 overflow-hidden">
              <div className="flex items-stretch divide-x-2 divide-gray-100">
                {/* Passengers */}
                <div className="flex flex-col justify-center px-4 py-3 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 leading-none mb-1">{t.passengerCount}</p>
                  <p className="text-lg font-black text-gray-900">👥 {req.passengers}</p>
                </div>
                {/* Budget */}
                <div className="flex flex-col justify-center px-4 py-3 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 leading-none mb-1">{t.budget}</p>
                  <p className="text-lg font-black text-gray-900">
                    {req.budget ? `${req.budget}₾` : <span className="text-sm text-gray-400 italic">{t.flexible}</span>}
                  </p>
                </div>
                {/* Phone */}
                <div className="flex flex-col justify-center px-4 py-3 shrink-0 gap-1.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 leading-none">{t.phone}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-gray-900 whitespace-nowrap">{req.phone}</span>
                    <a href={`tel:${req.phone}`}
                      className="flex items-center justify-center h-7 w-7 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-700 transition shrink-0">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                        <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.47 11.47 0 003.58.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.47 11.47 0 00.57 3.58 1 1 0 01-.25 1.01l-2.2 2.2z"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
              {/* Note */}
              {req.note && (
                <div className="px-4 py-2.5 border-t-2 border-gray-100 bg-white">
                  <p className="text-xs font-bold text-gray-600 italic">💬 {req.note}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <a href={waLink(req.phone)} target="_blank" rel="noopener noreferrer"
                className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black text-white hover:bg-emerald-600 transition shadow-sm">
                💬 WhatsApp
              </a>
              <a href={`tel:${req.phone}`}
                className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-black text-white hover:bg-emerald-800 transition shadow-sm">
                📞 {t.contactDriver}
              </a>
              {canDel && (
                <button onClick={() => onDelete(req.id)}
                  className="rounded-xl bg-red-500 px-3 py-2 text-xs font-black text-white hover:bg-red-600 transition shadow-sm">
                  🗑 Delete
                </button>
              )}
            </div>
          </div>

          {/* Pax count badge */}
          <div className="shrink-0 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 px-6 py-5 text-white shadow-xl shadow-emerald-200 min-w-[90px]">
            <p className="text-3xl font-black tracking-tight">{req.passengers}</p>
            <p className="text-xs font-bold text-emerald-100 mt-1 text-center">{t.passengerCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main ── */
export default function Home() {
  const router = useRouter();
  const { isAdmin } = useIsAdmin();
  const [lang, setLang]           = useState<Lang>("ka");
  const [role, setRole]           = useState<Role>("passenger");
  const [user, setUser]           = useState<any>(null);
  const [rides, setRides]         = useState<Ride[]>([]);
  const [requests, setRequests]   = useState<Request[]>([]);
  const [loading, setLoading]     = useState(true);
  const [fromCity, setFromCity]   = useState("");
  const [toCity, setToCity]       = useState("");
  const [sortMode, setSortMode]   = useState("time");
  const [bookRide, setBookRide]   = useState<Ride | null>(null);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const t = T[lang];

  async function loadRides(from = fromCity, to = toCity, sort = sortMode) {
    setLoading(true);
    const cutoff = new Date(Date.now() - 36e5).toISOString();
    let q = supabase.from("rides").select("*").gte("departure_time", cutoff);
    if (from) q = q.ilike("from_city", `%${from}%`);
    if (to)   q = q.ilike("to_city",   `%${to}%`);
    if (sort === "price")       q = q.order("price_per_seat", { ascending: true });
    else if (sort === "priceD") q = q.order("price_per_seat", { ascending: false });
    else                        q = q.order("departure_time", { ascending: true });
    const { data, error } = await q;
    if (error) console.error(error);
    setRides(data ?? []);
    setLoading(false);
  }

  async function loadRequests(from = fromCity, to = toCity) {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];
    let q = supabase.from("requests").select("*").gte("departure_date", today);
    if (from) q = q.ilike("from_city", `%${from}%`);
    if (to)   q = q.ilike("to_city",   `%${to}%`);
    q = q.order("departure_date", { ascending: true });
    const { data, error } = await q;
    if (error) console.error(error);
    setRequests(data ?? []);
    setLoading(false);
  }

  function load(from = fromCity, to = toCity, sort = sortMode) {
    if (role === "driver") loadRequests(from, to);
    else loadRides(from, to, sort);
  }

  function reset() { setFromCity(""); setToCity(""); load("", ""); }
  async function logout() { await supabase.auth.signOut(); window.location.reload(); }

  async function handleDeleteRide(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(t.deleteConfirm)) return;
    setDeletingId(id);
    const { error } = await supabase.from("rides").delete().eq("id", id);
    if (error) { alert(t.deleteFail); }
    else await loadRides();
    setDeletingId(null);
  }

  async function handleDeleteRequest(id: string) {
    if (!confirm(t.deleteConfirm)) return;
    await supabase.from("requests").delete().eq("id", id);
    await loadRequests();
  }

  function canDelete(r: Ride) { return user && (isAdmin || r.user_id === user.id); }

  useEffect(() => {
    load();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  // Reload when role changes
  useEffect(() => { load(); }, [role]);

  useEffect(() => {
    const close = () => setMenuOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const totalSeats    = rides.reduce((s, r) => s + r.seats_available, 0);
  const coveredCities = new Set(rides.map(r => r.to_city)).size;
  const cityOptions   = CITIES.map(c => ({ value: c.en, label: lang === "ka" ? c.ka : c.en }));

  const isDriver    = role === "driver";
  const accentFrom  = isDriver ? "from-emerald-600" : "from-violet-600";
  const accentTo    = isDriver ? "to-teal-600"      : "to-purple-600";

  return (
    <div className="min-h-screen font-sans bg-gray-50">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 border-b-2 border-violet-100 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/">
            <img src="/logo.png" alt="mgzavri.ge" className="h-20 w-auto" />
          </Link>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link href="/admin" className="inline-flex items-center h-9 rounded-xl border-2 border-amber-400 bg-amber-50 px-3 text-xs font-black text-amber-700 hover:bg-amber-100 transition">
                🛡 {t.admin}
              </Link>
            )}
            <button onClick={() => setLang(l => l === "en" ? "ka" : "en")}
              className="inline-flex items-center h-9 gap-1.5 rounded-xl border-2 border-violet-200 bg-white px-3 text-xs font-black text-violet-700 hover:bg-violet-50 transition">
              {lang === "en" ? (
                <><img src="https://flagcdn.com/w20/ge.png" alt="GE" className="h-4 w-auto rounded-sm" /><span>KA</span></>
              ) : (
                <><img src="https://flagcdn.com/w20/gb.png" alt="GB" className="h-4 w-auto rounded-sm" /><span>EN</span></>
              )}
            </button>
            {!user ? (
              <>
                <Link href="/auth" className="inline-flex items-center h-9 rounded-xl border-2 border-gray-200 bg-white px-4 text-sm font-black text-gray-700 hover:bg-gray-50 transition">{t.signIn}</Link>
                <Link href="/auth?mode=signup" className="inline-flex items-center h-9 rounded-xl bg-violet-600 px-4 text-sm font-black text-white hover:bg-violet-700 transition shadow-md shadow-violet-200">{t.signUp}</Link>
              </>
            ) : (
              <div className="relative">
                <button onClick={e => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                  className="inline-flex items-center h-9 gap-2 rounded-xl border-2 border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-white text-xs font-black">
                    {user.email?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-gray-400 text-xs">▾</span>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border-2 border-gray-100 bg-white shadow-xl overflow-hidden z-50">
                    <Link href="/my-bookings" className="flex items-center gap-2 px-4 py-3 text-sm font-black text-gray-700 hover:bg-gray-50">📖 {t.myBookings}</Link>
                    <Link href="/my-rides"    className="flex items-center gap-2 px-4 py-3 text-sm font-black text-gray-700 hover:bg-gray-50">🚐 {t.myRides}</Link>
                    {isAdmin && <Link href="/admin" className="flex items-center gap-2 px-4 py-3 text-sm font-black text-amber-700 hover:bg-amber-50">🛡 {t.admin}</Link>}
                    <button onClick={logout} className="w-full flex items-center gap-2 px-4 py-3 text-sm font-black text-red-600 hover:bg-red-50">🚪 {t.logout}</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">

        {/* ── HERO ── */}
        <div className="mb-8 overflow-hidden rounded-3xl relative">
          {/* Background — road scene */}
          <div className={`relative px-6 pt-10 pb-8 sm:px-12 sm:pt-14 text-center transition-colors duration-500 ${isDriver ? "bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900" : "bg-gradient-to-br from-violet-900 via-purple-900 to-slate-900"}`}>

            {/* Animated road lines */}
            <div className="absolute bottom-0 left-0 right-0 h-16 overflow-hidden opacity-30">
              <div className="absolute bottom-4 left-0 right-0 h-1 bg-white/20"/>
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-8">
                {Array.from({length: 12}).map((_, i) => (
                  <div key={i} className="h-1 w-12 bg-white rounded-full animate-pulse" style={{animationDelay: `${i * 0.15}s`}}/>
                ))}
              </div>
            </div>

            {/* Floating city pills */}
            <div className="absolute top-4 left-4 hidden sm:flex flex-col gap-2 opacity-60">
              {["თბილისი", "ბათუმი", "ქუთაისი"].map((c, i) => (
                <span key={c} className="rounded-full bg-white/10 border border-white/20 px-3 py-1 text-[11px] font-black text-white backdrop-blur-sm"
                  style={{animationDelay: `${i * 0.3}s`}}>📍 {c}</span>
              ))}
            </div>
            <div className="absolute top-4 right-4 hidden sm:flex flex-col gap-2 opacity-60 items-end">
              {["გუდაური", "მესტია", "ბორჯომი"].map((c, i) => (
                <span key={c} className="rounded-full bg-white/10 border border-white/20 px-3 py-1 text-[11px] font-black text-white backdrop-blur-sm">📍 {c}</span>
              ))}
            </div>

            {/* Main content */}
            <h1 className="relative text-4xl font-black tracking-tight text-white sm:text-5xl drop-shadow-lg">
              {t.tagline}
            </h1>
            <p className="mt-3 text-base font-bold text-white/70">{t.sub}</p>

            {/* Role toggle */}
            <div className="mt-6 flex flex-col items-center gap-2">
              <p className="text-xs font-black uppercase tracking-widest text-white/40">{t.iAm}</p>
              <RoleToggle role={role} setRole={setRole} t={t} />
            </div>

            {/* Stats */}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {isDriver ? (
                <div className="flex items-center gap-2.5 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm px-5 py-3">
                  <span className="text-xl">🙋</span>
                  <span className="text-2xl font-black text-white">{requests.length}</span>
                  <span className="text-sm font-black text-white/70">{t.requests}</span>
                </div>
              ) : (
                [{ icon: "🚐", val: rides.length, label: t.rides },
                 { icon: "💺", val: totalSeats,    label: t.seats },
                 { icon: "📍", val: coveredCities, label: t.cities }].map(({ icon, val, label }) => (
                  <div key={label} className="flex items-center gap-2.5 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm px-5 py-3">
                    <span className="text-xl">{icon}</span>
                    <span className="text-2xl font-black text-white">{val}</span>
                    <span className="text-sm font-black text-white/70">{label}</span>
                  </div>
                ))
              )}
            </div>

            {/* CTAs */}
            <div className="mt-6 flex flex-wrap justify-center gap-3" style={{position: "relative", zIndex: 10}}>
              {!isDriver ? (
                <button onClick={() => router.push("/post-request")}
                  className="inline-flex items-center gap-2 rounded-2xl bg-violet-500 hover:bg-violet-400 px-6 py-3 text-sm font-black text-white shadow-lg shadow-violet-900/40 transition cursor-pointer">
                  🙋 {t.postRequest}
                </button>
              ) : (
                <button onClick={() => router.push("/post")}
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 px-6 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/40 transition cursor-pointer">
                  🚐 {t.postRide}
                </button>
              )}
            </div>

            {/* Bottom wave */}
            <div className="absolute bottom-0 left-0 right-0 h-6 overflow-hidden">
              <svg viewBox="0 0 1200 24" preserveAspectRatio="none" className="w-full h-full fill-gray-50">
                <path d="M0,24 C300,0 900,0 1200,24 L1200,24 L0,24 Z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* ── SEARCH BAR ── */}
        <div className="mb-6 overflow-hidden rounded-3xl border-2 border-gray-200 bg-white shadow-md">
          <div className={`bg-gradient-to-r ${accentFrom} ${accentTo} px-6 py-4`}>
            <p className="text-sm font-black text-white tracking-wide">
              {isDriver ? t.whoNeeds : t.whereTo}
            </p>
          </div>
          <div className="p-5 sm:p-6">
            <div className={`grid gap-4 ${isDriver ? "sm:grid-cols-[1fr_1fr_auto_auto]" : "sm:grid-cols-[1fr_1fr_1fr_auto_auto]"}`}>
              {[{ val: fromCity, set: setFromCity, label: t.from },
                { val: toCity,   set: setToCity,   label: t.to }].map(({ val, set, label }) => (
                <div key={label}>
                  <label className={`mb-1.5 block text-xs font-black uppercase tracking-widest ${isDriver ? "text-emerald-500" : "text-violet-500"}`}>{label}</label>
                  <CustomSelect value={val} onChange={set} placeholder={t.allCities} options={cityOptions} />
                </div>
              ))}
              {!isDriver && (
                <div>
                  <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-violet-500">{t.sort}</label>
                  <CustomSelect value={sortMode} onChange={v => { setSortMode(v); loadRides(fromCity, toCity, v); }}
                    placeholder={t.sortTime}
                    options={[
                      { value: "time",   label: t.sortTime },
                      { value: "price",  label: t.sortPrice },
                      { value: "priceD", label: t.sortPriceDesc },
                    ]} />
                </div>
              )}
              <div className="flex items-end">
                <button onClick={() => load()} disabled={loading}
                  className={`h-12 w-full rounded-2xl px-6 text-sm font-black text-white disabled:opacity-50 transition shadow-md ${isDriver ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200" : "bg-violet-600 hover:bg-violet-700 shadow-violet-200"}`}>
                  {loading ? "…" : t.search}
                </button>
              </div>
              <div className="flex items-end">
                <button onClick={reset}
                  className="h-12 w-full rounded-2xl border-2 border-gray-200 bg-gray-50 px-5 text-sm font-black text-gray-600 hover:bg-gray-100 transition">
                  {t.clear}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── AD ── */}
        <a href="mailto:mgzavri@gmail.com?subject=Advertising"
          className="group mb-6 flex items-center justify-between gap-4 rounded-3xl border-2 border-dashed border-violet-300 bg-violet-50 px-6 py-4 transition hover:bg-violet-100">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-lg text-white shadow-md">📣</div>
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-violet-500">{t.ad}</div>
              <div className="text-sm font-black text-gray-900">{t.advertise}</div>
              <div className="text-xs font-bold text-gray-500">mgzavri@gmail.com</div>
            </div>
          </div>
          <div className="shrink-0 rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-black text-white group-hover:bg-violet-700 transition">
            {lang === "ka" ? "დაგვიკავშირდით →" : "Get in touch →"}
          </div>
        </a>

        {/* ── LISTINGS ── */}
        <div className="grid gap-5">
          {loading ? (
            <div className="flex items-center justify-center rounded-3xl border-2 border-gray-200 bg-white py-20 text-sm font-black text-gray-500">
              <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              {t.loading}
            </div>

          ) : isDriver ? (
            /* ── REQUEST CARDS (driver sees these) ── */
            requests.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white py-20 text-center">
                <div className="mb-3 text-5xl">🙋</div>
                <div className="text-lg font-black text-gray-800">{t.noRequests}</div>
                <p className="mt-1 text-sm font-bold text-gray-500">{t.noRequestsSub}</p>
              </div>
            ) : requests.map(req => (
              <RequestCard key={req.id} req={req} lang={lang} t={t}
                user={user} isAdmin={isAdmin} onDelete={handleDeleteRequest} />
            ))

          ) : (
            /* ── RIDE CARDS (passenger sees these) ── */
            rides.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white py-20 text-center">
                <div className="mb-3 text-5xl">🚐</div>
                <div className="text-lg font-black text-gray-800">{t.noRides}</div>
                <p className="mt-1 text-sm font-bold text-gray-500">{t.noRidesSub}</p>
                <Link href="/post" className="mt-5 inline-flex rounded-2xl bg-violet-600 px-6 py-3 text-sm font-black text-white hover:bg-violet-700 transition shadow-md shadow-violet-200">
                  + {t.postRide}
                </Link>
              </div>
            ) : rides.map(r => {
              const badge   = getBadge(r.departure_time, t);
              const expired = badge.label === t.departed;
              const fromImg = getCityImg(r.from_city);
              const toImg   = getCityImg(r.to_city);
              const booked  = r.seats_total - r.seats_available;
              const pct     = Math.round((booked / r.seats_total) * 100);

              return (
                <div key={r.id}
                  onClick={() => router.push(`/ride/${r.id}`)}
                  className={`overflow-hidden rounded-3xl border-2 border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:border-violet-200 cursor-pointer ${expired ? "opacity-50" : ""}`}>

                  <div className="relative h-44 sm:h-52 overflow-hidden">
                    <div className="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
                      <img src={fromImg} alt={r.from_city} className="h-full w-full object-cover scale-110"/>
                      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"/>
                      <div className="absolute bottom-5 left-5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-1">FROM</p>
                        <p className="text-3xl font-black text-white drop-shadow-lg leading-tight">{getCityLabel(r.from_city, lang)}</p>
                      </div>
                    </div>
                    <div className="absolute inset-y-0 right-0 w-1/2 overflow-hidden">
                      <img src={toImg} alt={r.to_city} className="h-full w-full object-cover scale-110"/>
                      <div className="absolute inset-0 bg-gradient-to-l from-black/70 via-black/40 to-transparent"/>
                      <div className="absolute bottom-5 right-5 text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-1">TO</p>
                        <p className="text-3xl font-black text-white drop-shadow-lg leading-tight">{getCityLabel(r.to_city, lang)}</p>
                      </div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <DirectionArrow />
                    </div>
                    <div className="absolute top-3 left-3">
                      <span className={`rounded-full px-3 py-1 text-[11px] font-black shadow-sm ${badge.cls}`}>{badge.label}</span>
                    </div>
                    {r.seats_available === 0 && (
                      <div className="absolute top-3 right-3">
                        <span className="rounded-full bg-red-600 px-3 py-1 text-[11px] font-black text-white shadow-sm">{t.full}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-3">
                        <p className="text-sm font-black text-gray-700 flex items-center gap-1.5">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-violet-100 text-sm">🕐</span>
                          {new Date(r.departure_time).toLocaleString()}
                        </p>
                        <VehicleStrip ride={r} lang={lang} t={t} />
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-black text-gray-700 uppercase tracking-widest">
                              💺 {r.seats_available} {t.seatsLeft} / {r.seats_total}
                            </span>
                            <span className="text-xs font-black text-violet-600">{pct}% full</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {Array.from({ length: Math.min(r.seats_total, 16) }).map((_, i) => (
                              <div key={i} className={`h-4 w-4 rounded-md ${i < r.seats_available ? "bg-violet-500 shadow-sm shadow-violet-200" : "bg-gray-200"}`} />
                            ))}
                            {r.seats_total > 16 && <span className="text-xs font-bold text-gray-500 self-center ml-1">+{r.seats_total - 16}</span>}
                          </div>
                          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all" style={{ width: `${pct}%` }}/>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2" onClick={e => e.stopPropagation()}>
                          <a href={waLink(r.phone)} target="_blank" rel="noopener noreferrer"
                            className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black text-white hover:bg-emerald-600 transition shadow-sm">
                            💬 {t.whatsapp}
                          </a>
                          {r.seats_available > 0 && (
                            <button onClick={e => { e.stopPropagation(); setBookRide(r); }}
                              className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-black text-white hover:bg-violet-700 transition shadow-md shadow-violet-200">
                              ✓ {t.book}
                            </button>
                          )}
                          {canDelete(r) && (
                            <button onClick={e => handleDeleteRide(r.id, e)} disabled={deletingId === r.id}
                              className="rounded-xl bg-red-500 px-3 py-2 text-xs font-black text-white hover:bg-red-600 transition disabled:opacity-50 shadow-sm">
                              {deletingId === r.id ? "…" : isAdmin && r.user_id !== user?.id ? "🛡 Delete" : "🗑 Delete"}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 px-6 py-5 text-white shadow-xl shadow-violet-200 min-w-[100px]">
                        <p className="text-3xl font-black tracking-tight">{r.price_per_seat}₾</p>
                        <p className="text-xs font-bold text-violet-200 mt-1">{t.perSeat}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="mt-12 border-t-2 border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row sm:px-6">
          <img src="/logo.png" alt="mgzavri.ge" className="h-8 w-auto" />
          <a href="mailto:mgzavri@gmail.com" className="text-sm font-bold text-gray-600 hover:text-violet-600 transition">mgzavri@gmail.com</a>
          <span className="text-xs font-bold text-gray-500">© {new Date().getFullYear()} mgzavri</span>
        </div>
      </footer>

      {/* Mobile FAB */}
      <Link href={isDriver ? "/post" : "/post-request"}
        className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-white shadow-2xl transition sm:hidden ${isDriver ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-300" : "bg-violet-600 hover:bg-violet-700 shadow-violet-300"}`}>
        + {isDriver ? t.postRide : t.postRequest}
      </Link>

      {bookRide && <BookModal ride={bookRide} lang={lang} onClose={() => { setBookRide(null); loadRides(); }} />}
    </div>
  );
}
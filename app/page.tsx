"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import BookModal from "../components/BookModal";
import GeorgianPlate from "../components/GeorgianPlate";
import CustomSelect from "../components/CustomSelect";

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
    tagline: "Your ride across Georgia",
    sub: "Find a minivan seat, book instantly, travel comfortably.",
    from: "From", to: "To", allCities: "Anywhere", search: "Find rides", clear: "Clear",
    seatsLeft: "seats left", perSeat: "/ seat", full: "Full", book: "Book",
    details: "Details", whatsapp: "WhatsApp", call: "Call",
    noRides: "No rides found", noRidesSub: "Try different cities or post your own ride.",
    postRide: "Post a ride", rides: "rides", seats: "seats", cities: "destinations",
    loading: "Finding rides…", today: "Today", tomorrow: "Tomorrow",
    soon: "Departing soon", upcoming: "Upcoming", departed: "Departed",
    ad: "Advertisement", advertise: "Advertise with us", whereTo: "Where do you want to go?",
    myRides: "My rides", signIn: "Sign in", signUp: "Sign up", logout: "Logout",
    sort: "Sort", sortTime: "By time", sortPrice: "Price ↑", sortPriceDesc: "Price ↓",
    vehicle: "Vehicle", plate: "Plate", color: "Color", myBookings: "My bookings", 
  },
  ka: {
    tagline: "შენი მგზავრობა საქართველოში",
    sub: "იპოვე მინივენში ადგილი, დაჯავშნე სწრაფად, იმგზავრე კომფორტულად.",
    from: "საიდან", to: "სადამდე", allCities: "ნებისმიერი", search: "მოძებნა", clear: "გასუფთავება",
    seatsLeft: "ადგილი", perSeat: "/ ადგილი", full: "სავსეა", book: "დაჯავშნა",
    details: "დეტალები", whatsapp: "WhatsApp", call: "ზარი",
    noRides: "მოგზაურობა ვერ მოიძებნა", noRidesSub: "სცადეთ სხვა ქალაქები ან დაამატეთ თქვენი.",
    postRide: "მოგზაურობის დამატება", rides: "მოგზაურობა", seats: "ადგილი", cities: "მიმართულება",
    loading: "იტვირთება…", today: "დღეს", tomorrow: "ხვალ",
    soon: "მალე მიდის", upcoming: "მომავალში", departed: "გავიდა",
    ad: "რეკლამა", advertise: "განათავსეთ რეკლამა აქ", whereTo: "სად გინდა წასვლა?",
    myRides: "ჩემი მოგზაურობები", signIn: "შესვლა", signUp: "რეგისტრაცია", logout: "გასვლა",
    sort: "სორტირება", sortTime: "დროით", sortPrice: "ფასი ↑", sortPriceDesc: "ფასი ↓",
    vehicle: "მანქანა", plate: "ნომერი", color: "ფერი", myBookings: "ჩემი ჯავშნები",
  },
} as const;

type Lang = keyof typeof T;
type Ride = {
  user_id: any;
  id: string; from_city: string; to_city: string;
  price_per_seat: number; seats_total: number; seats_available: number;
  phone: string; vehicle_type: string; departure_time: string;
  plate_number?: string; vehicle_color?: string;
};

function getCityImg(city: string) {
  return CITIES.find((c) => c.en === city)?.img ?? "https://images.unsplash.com/photo-1565008576549-57569a49371d?w=400&q=80";
}
function getCityLabel(city: string, lang: Lang) {
  const found = CITIES.find((c) => c.en === city);
  return found ? (lang === "ka" ? found.ka : found.en) : city;
}
function getBadge(ts: string, t: (typeof T)[Lang]) {
  const h = (new Date(ts).getTime() - Date.now()) / 36e5;
  if (isNaN(h) || h < -1) return { label: t.departed, cls: "bg-gray-800/70 text-gray-200" };
  if (h <= 1)  return { label: t.soon,     cls: "bg-rose-500/80 text-white" };
  if (h < 24)  return { label: t.today,    cls: "bg-violet-600/80 text-white" };
  if (h < 48)  return { label: t.tomorrow, cls: "bg-indigo-500/80 text-white" };
  return         { label: t.upcoming,  cls: "bg-slate-600/70 text-white" };
}
function waLink(phone: string) {
  const d = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${d.startsWith("995") ? d : `995${d}`}`;
}

// ── Vehicle Info Strip ────────────────────────────────────────────
function VehicleStrip({ ride, lang }: { ride: Ride; lang: Lang }) {
  const colorInfo = ride.vehicle_color ? VEHICLE_COLORS[ride.vehicle_color] : null;
  const colorNameEn = ride.vehicle_color ?? "";
  const colorNameKa = colorInfo?.ka ?? "";

  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 overflow-hidden">
      {/* Header row */}
      <div className="flex items-stretch divide-x divide-gray-100">

        {/* Vehicle model + color block */}
        <div className="flex items-center gap-3 px-4 py-3 flex-1 min-w-0">
          {/* Color swatch */}
          {colorInfo ? (
            <div
              className="h-10 w-10 rounded-xl shrink-0 shadow-inner"
              style={{
                background: colorInfo.hex,
                border: `2px solid ${colorInfo.border}`,
                boxShadow: `0 2px 6px ${colorInfo.hex}55`,
              }}
            />
          ) : (
            <div className="h-10 w-10 rounded-xl border-2 border-dashed border-gray-200 bg-white shrink-0 flex items-center justify-center text-gray-300">
              🚐
            </div>
          )}
          <div className="min-w-0">
            {/* Vehicle model */}
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400 leading-none mb-1">
              {lang === "ka" ? "მანქანა" : "Vehicle"}
            </p>
            <p className="text-sm font-black text-gray-900 truncate leading-tight">
              {ride.vehicle_type || "—"}
            </p>
            {/* Color in both languages */}
            {colorInfo && (
              <p className="text-xs font-bold leading-tight mt-0.5">
                <span className="text-gray-700">{colorNameEn}</span>
                <span className="text-gray-300 mx-1">·</span>
                <span className="text-gray-500">{colorNameKa}</span>
              </p>
            )}
          </div>
        </div>

        {/* Plate block */}
        <div className="flex flex-col justify-center px-4 py-3 shrink-0">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400 leading-none mb-2">
            {lang === "ka" ? "სახ. ნომერი" : "Licence plate"}
          </p>
          {ride.plate_number ? (
            <GeorgianPlate plate={ride.plate_number} size="sm" />
          ) : (
            <span className="text-xs font-bold text-gray-300 italic">—</span>
          )}
        </div>

        {/* Phone block */}
        <div className="flex flex-col justify-center px-4 py-3 shrink-0">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400 leading-none mb-1">
            {lang === "ka" ? "ტელეფონი" : "Phone"}
          </p>
          <a href={`tel:${ride.phone}`} className="text-sm font-black text-violet-700 hover:underline whitespace-nowrap">
            {ride.phone}
          </a>
        </div>
      </div>

      {/* Color label bar — full width, colored accent */}
      {colorInfo && (
        <div
          className="flex items-center gap-2 px-4 py-1.5 border-t border-gray-100"
          style={{ background: `${colorInfo.hex}18` }}
        >
          <div
            className="h-3 w-3 rounded-full shrink-0"
            style={{ background: colorInfo.hex, border: `1.5px solid ${colorInfo.border}` }}
          />
          <span className="text-[11px] font-black text-gray-700 tracking-wide">
            {colorNameEn.toUpperCase()}
          </span>
          <span className="text-[11px] text-gray-400 font-bold">—</span>
          <span className="text-[11px] font-black text-gray-500">
            {colorNameKa}
          </span>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [lang, setLang] = useState<Lang>("ka");
  const [user, setUser] = useState<any>(null);
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [sortMode, setSortMode] = useState("time");
  const [bookRide, setBookRide] = useState<Ride | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const t = T[lang];

  async function load(from = fromCity, to = toCity, sort = sortMode) {
    setLoading(true);
    const cutoff = new Date(Date.now() - 36e5).toISOString();
    let q = supabase.from("rides").select("*").gte("departure_time", cutoff);
    if (from) q = q.ilike("from_city", `%${from}%`);
    if (to)   q = q.ilike("to_city",   `%${to}%`);
    if (sort === "price")     q = q.order("price_per_seat", { ascending: true });
    else if (sort === "priceD") q = q.order("price_per_seat", { ascending: false });
    else q = q.order("departure_time", { ascending: true });
    const { data, error } = await q;
    if (error) console.error(error);
    setRides(data ?? []);
    setLoading(false);
  }

  function reset() { setFromCity(""); setToCity(""); load("", "", sortMode); }
  async function logout() { await supabase.auth.signOut(); window.location.reload(); }

  useEffect(() => {
  load();

  async function getUser() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
  }

  getUser();
}, []);

useEffect(() => {
  function closeMenu() {
    setMenuOpen(false);
  }

  

  window.addEventListener("click", closeMenu);
  return () => window.removeEventListener("click", closeMenu);
}, []);

  const totalSeats    = rides.reduce((s, r) => s + r.seats_available, 0);
  const coveredCities = new Set(rides.map((r) => r.to_city)).size;

  return (
    <div className="min-h-screen font-sans bg-gray-50">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 border-b border-violet-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">

          {/* LEFT — LOGO */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-600 text-lg text-white shadow-sm">
              🚐
            </div>
            <span className="text-xl font-black text-violet-700">
              mgzavri
            </span>
          </Link>


        {/* RIGHT — USER / LANGUAGE */}
        <div className="flex items-center gap-2">
          
          {/* Language */}
          <button
            onClick={() => setLang((l) => (l === "en" ? "ka" : "en"))}
            className="rounded-xl border border-violet-200 bg-white px-3 py-1.5 text-xs font-bold text-violet-600 hover:bg-violet-50 transition"
          >
            {lang === "en" ? "🇬🇪 KA" : "🇬🇧 EN"}
          </button>
          
          {!user ? (
            <>
              <Link
                href="/auth"
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
              >
                {t.signIn}
              </Link>
          
              <Link
                href="/auth?mode=signup"
                className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-700 transition"
              >
                {t.signUp}
              </Link>
            </>
          ) : (
           <div className="relative">

            <button
              onClick={(e) => { 
                e.stopPropagation();
                setMenuOpen(!menuOpen)
              }}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-white text-xs font-bold">
                {user.email?.[0]?.toUpperCase()}
              </div>

              <span className="text-gray-400 text-xs">▾</span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden">
              
                <Link
                  href="/my-bookings"
                  className="block px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  📖 {t.myBookings}
                </Link>
            
                <Link
                  href="/my-rides"
                  className="block px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  🚐 {t.myRides}
                </Link>
            
                <Link
                  href="/post"
                  className="block px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  ➕ {t.postRide}
                </Link>
            
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  🚪 {t.logout}
                </button>
            
              </div>
            )}

          </div>
          )}
        
        </div>
            
        </div>
      </nav>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">

        {/* ── HERO ── */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-xs font-bold text-violet-600">
            🇬🇪 Georgia minivan network
          </div>
          <h1 className="text-4xl font-black tracking-tight text-gray-900 sm:text-5xl">{t.tagline}</h1>
          <p className="mt-3 text-base text-gray-500">{t.sub}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {[{ icon: "🚐", val: rides.length, label: t.rides },
              { icon: "💺", val: totalSeats,    label: t.seats },
              { icon: "📍", val: coveredCities, label: t.cities }].map(({ icon, val, label }) => (
              <div key={label} className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 shadow-sm">
                <span className="text-xl">{icon}</span>
                <span className="text-2xl font-black text-violet-700">{val}</span>
                <span className="text-sm text-gray-500">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── SEARCH ── */}
        <div className="mb-6 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4">
            <p className="text-sm font-bold text-white">{t.whereTo}</p>
          </div>
          <div className="p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-[1fr_1fr_1fr_auto_auto]">
              {[{ val: fromCity, set: setFromCity, label: t.from },
                { val: toCity,   set: setToCity,   label: t.to }].map(({ val, set, label }) => (
                <div key={label}>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-400">{label}</label>
                  <CustomSelect
                    value={val} onChange={set}
                    placeholder={t.allCities}
                    options={CITIES.map(c => ({ value: c.en, label: lang === "ka" ? c.ka : c.en }))}
                  />
                </div>
              ))}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-400">{t.sort}</label>
                <CustomSelect
                  value={sortMode} onChange={v => { setSortMode(v); load(fromCity, toCity, v); }}
                  placeholder={t.sortTime}
                  options={[
                    { value: "time",   label: t.sortTime },
                    { value: "price",  label: t.sortPrice },
                    { value: "priceD", label: t.sortPriceDesc },
                  ]}
                />
              </div>
              <div className="flex items-end">
                <button onClick={() => load()} disabled={loading}
                  className="h-12 w-full rounded-2xl bg-violet-600 px-6 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-50 transition">{loading ? "…" : t.search}</button>
              </div>
              <div className="flex items-end">
                <button onClick={reset}
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 text-sm font-bold text-gray-600 hover:bg-gray-100 transition">{t.clear}</button>
              </div>
            </div>
          </div>
        </div>

        {/* ── AD ── */}
        <a href="mailto:mgzavri@gmail.com?subject=Advertising"
          className="group mb-6 flex items-center justify-between gap-4 rounded-3xl border border-dashed border-violet-300 bg-violet-50 px-6 py-4 transition hover:bg-violet-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-600 text-lg text-white">📣</div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-violet-500">{t.ad}</div>
              <div className="text-sm font-black text-gray-800">{t.advertise}</div>
              <div className="text-xs text-gray-400">mgzavri@gmail.com</div>
            </div>
          </div>
          <div className="shrink-0 rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-bold text-white group-hover:bg-violet-700 transition">
            {lang === "ka" ? "დაგვიკავშირდით →" : "Get in touch →"}
          </div>
        </a>

        {/* ── RIDE CARDS ── */}
        <div className="grid gap-5">
          {loading ? (
            <div className="flex items-center justify-center rounded-3xl border border-gray-200 bg-white py-20 text-sm text-gray-400">
              <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>{t.loading}
            </div>
          ) : rides.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-white py-20 text-center">
              <div className="mb-3 text-5xl">🚐</div>
              <div className="text-lg font-black text-gray-700">{t.noRides}</div>
              <p className="mt-1 text-sm text-gray-400">{t.noRidesSub}</p>
              <Link href="/post" className="mt-5 inline-flex rounded-2xl bg-violet-600 px-6 py-3 text-sm font-bold text-white hover:bg-violet-700 transition">+ {t.postRide}</Link>
            </div>
          ) : rides.map((r) => {
            const badge   = getBadge(r.departure_time, t);
            const expired = badge.label === t.departed;
            const fromImg = getCityImg(r.from_city);
            const toImg   = getCityImg(r.to_city);
            const booked  = r.seats_total - r.seats_available;
            const pct     = Math.round((booked / r.seats_total) * 100);

            return (
              <div key={r.id}
                className={`overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${expired ? "opacity-50" : ""}`}>

                {/* ── City photo banner ── */}
                <div className="relative h-36 sm:h-44 overflow-hidden">
                  <div className="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
                    <img src={fromImg} alt={r.from_city} className="h-full w-full object-cover scale-110 transition-transform duration-700 hover:scale-100" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
                    <div className="absolute bottom-3 left-4">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-white/70 mb-0.5">From</p>
                      <p className="text-lg font-black text-white drop-shadow">{getCityLabel(r.from_city, lang)}</p>
                    </div>
                  </div>
                  <div className="absolute inset-y-0 right-0 w-1/2 overflow-hidden">
                    <img src={toImg} alt={r.to_city} className="h-full w-full object-cover scale-110 transition-transform duration-700 hover:scale-100" />
                    <div className="absolute inset-0 bg-gradient-to-l from-black/40 to-transparent" />
                    <div className="absolute bottom-3 right-4 text-right">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-white/70 mb-0.5">To</p>
                      <p className="text-lg font-black text-white drop-shadow">{getCityLabel(r.to_city, lang)}</p>
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="flex items-center gap-1 rounded-full bg-white/95 px-3 py-1.5 shadow-lg border border-white">
                      <span className="text-base">🚐</span>
                      <span className="text-violet-600 font-black text-lg">→</span>
                    </div>
                  </div>
                  <div className="absolute top-3 left-3">
                    <span className={`rounded-full px-3 py-1 text-[11px] font-bold backdrop-blur-sm ${badge.cls}`}>{badge.label}</span>
                  </div>
                  {r.seats_available === 0 && (
                    <div className="absolute top-3 right-3">
                      <span className="rounded-full bg-red-500/90 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-sm">{t.full}</span>
                    </div>
                  )}
                </div>

                {/* ── Card body ── */}
                <div className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-3">

                      {/* Departure time */}
                      <p className="text-sm text-gray-500 flex items-center gap-1.5">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-gray-100 text-sm">🕐</span>
                        {new Date(r.departure_time).toLocaleString()}
                      </p>

                      {/* ── Vehicle strip ── */}
                      <VehicleStrip ride={r} lang={lang} />

                      {/* Seats progress */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                            💺 {r.seats_available} {t.seatsLeft} / {r.seats_total}
                          </span>
                          <span className="text-xs font-bold text-violet-600">{pct}% full</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-1.5">
                          {Array.from({ length: Math.min(r.seats_total, 16) }).map((_, i) => (
                            <div key={i} className={`h-4 w-4 rounded-md transition-colors ${i < r.seats_available ? "bg-violet-500 shadow-sm shadow-violet-200" : "bg-gray-200"}`} />
                          ))}
                          {r.seats_total > 16 && <span className="text-xs text-gray-400 self-center ml-1">+{r.seats_total - 16}</span>}
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/ride/${r.id}`} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 transition">{t.details}</Link>
                        <a href={`tel:${r.phone}`} className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 hover:bg-violet-100 transition">📞 {t.call}</a>
                        <a href={waLink(r.phone)} target="_blank" rel="noopener noreferrer"
                          className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-600 transition">💬 {t.whatsapp}</a>
                        {r.seats_available > 0 && (
                          <button onClick={() => setBookRide(r)}
                            className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-700 transition shadow-sm shadow-violet-200">
                            ✓ {t.book}
                          </button>
                        )}
                        {user && r.user_id === user.id && (
                          <button
                            onClick={async () => {
                              if (!confirm("Delete this ride?")) return;
                            
                              const { error } = await supabase
                                .from("rides")
                                .delete()
                                .eq("id", r.id);
                            
                              if (error) {
                                console.error(error);
                                alert("Failed to delete ride");
                              } else {
                                load(); // reload rides
                              }
                            }}
                            className="rounded-xl bg-red-500 px-3 py-2 text-xs font-bold text-white hover:bg-red-600 transition"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Price box */}
                    <div className="shrink-0 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 px-6 py-4 text-white shadow-lg shadow-violet-200 min-w-[90px]">
                      <p className="text-3xl font-black">{r.price_per_seat}₾</p>
                      <p className="text-xs font-semibold text-violet-200 mt-0.5">{t.perSeat}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="mt-12 border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-violet-600 text-sm">🚐</div>
            <span className="font-black text-gray-900">mgzavri</span>
          </div>
          <a href="mailto:mgzavri@gmail.com" className="text-sm font-semibold text-gray-500 hover:text-violet-600 transition">mgzavri@gmail.com</a>
          <span className="text-xs text-gray-400">© {new Date().getFullYear()} mgzavri</span>
        </div>
      </footer>

      <Link href="/post"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-xl hover:bg-violet-700 transition sm:hidden">
        + {t.postRide}
      </Link>

      {bookRide && <BookModal ride={bookRide} lang={lang} onClose={() => { setBookRide(null); load(); }} />}
    </div>
  );
}
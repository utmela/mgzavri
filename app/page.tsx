"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

const CITIES = [
  { en: "Tbilisi", ka: "თბილისი" },
  { en: "Kutaisi", ka: "ქუთაისი" },
  { en: "Batumi", ka: "ბათუმი" },
  { en: "Zugdidi", ka: "ზუგდიდი" },
  { en: "Gori", ka: "გორი" },
  { en: "Rustavi", ka: "რუსთავი" },
  { en: "Telavi", ka: "თელავი" },
  { en: "Borjomi", ka: "ბორჯომი" },
  { en: "Bakuriani", ka: "ბაკურიანი" },
  { en: "Gudauri", ka: "გუდაური" },
  { en: "Poti", ka: "ფოთი" },
  { en: "Senaki", ka: "სენაკი" },
  { en: "Samtredia", ka: "სამტრედია" },
  { en: "Kobuleti", ka: "ქობულეთი" },
  { en: "Ozurgeti", ka: "ოზურგეთი" },
] as const;

const T = {
  en: {
    tagline: "Your ride across Georgia",
    sub: "Find a minivan seat, book instantly, travel comfortably.",
    from: "From",
    to: "To",
    allCities: "Anywhere",
    search: "Find rides",
    clear: "Clear",
    seatsLeft: "seats left",
    perSeat: "/ seat",
    full: "Full",
    book: "Book seat",
    details: "Details",
    whatsapp: "WhatsApp",
    call: "Call",
    noRides: "No rides found",
    noRidesSub: "Try different cities or post your own ride.",
    postRide: "Post a ride",
    rides: "rides today",
    seats: "seats available",
    cities: "destinations",
    loading: "Finding rides…",
    today: "Today",
    tomorrow: "Tomorrow",
    soon: "Departing soon",
    upcoming: "Upcoming",
    departed: "Departed",
    ad: "Advertisement",
    advertise: "Advertise with us",
    whereTo: "Where do you want to go?",
  },
  ka: {
    tagline: "შენი მგზავრობა საქართველოში",
    sub: "იპოვე მინივენში ადგილი, დაჯავშნე სწრაფად, იმგზავრე კომფორტულად.",
    from: "საიდან",
    to: "სადამდე",
    allCities: "ნებისმიერი",
    search: "მოძებნა",
    clear: "გასუფთავება",
    seatsLeft: "ადგილი",
    perSeat: "/ ადგილი",
    full: "სავსეა",
    book: "ადგილის დაჯავშნა",
    details: "დეტალები",
    whatsapp: "WhatsApp",
    call: "ზარი",
    noRides: "მოგზაურობა ვერ მოიძებნა",
    noRidesSub: "სცადეთ სხვა ქალაქები ან დაამატეთ თქვენი.",
    postRide: "მოგზაურობის დამატება",
    rides: "მოგზაურობა დღეს",
    seats: "თავისუფალი ადგილი",
    cities: "მიმართულება",
    loading: "იტვირთება…",
    today: "დღეს",
    tomorrow: "ხვალ",
    soon: "მალე მიდის",
    upcoming: "მომავალში",
    departed: "გავიდა",
    ad: "რეკლამა",
    advertise: "განათავსეთ რეკლამა აქ",
    whereTo: "სად გინდა წასვლა?",
  },
} as const;

type Lang = keyof typeof T;

type Ride = {
  id: string;
  from_city: string;
  to_city: string;
  price_per_seat: number;
  seats_total: number;
  seats_available: number;
  phone: string;
  vehicle_type: string;
  departure_time: string;
};

function getCityLabel(city: string, lang: Lang) {
  const found = CITIES.find((c) => c.en === city);
  if (!found) return city;
  return lang === "ka" ? found.ka : found.en;
}

function getBadge(ts: string, t: (typeof T)[Lang]) {
  const diffH = (new Date(ts).getTime() - Date.now()) / 36e5;

  if (isNaN(diffH) || diffH < -1) {
    return { label: t.departed, color: "bg-gray-100 text-gray-500" };
  }
  if (diffH <= 1) {
    return { label: t.soon, color: "bg-rose-100 text-rose-600" };
  }
  if (diffH < 24) {
    return { label: t.today, color: "bg-violet-100 text-violet-700" };
  }
  if (diffH < 48) {
    return { label: t.tomorrow, color: "bg-indigo-100 text-indigo-700" };
  }
  return { label: t.upcoming, color: "bg-slate-100 text-slate-600" };
}

function waLink(phone: string) {
  const d = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${d.startsWith("995") ? d : `995${d}`}`;
}

function SeatDots({ available, total }: { available: number; total: number }) {
  return (
    <div className="flex flex-wrap gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2.5 w-2.5 rounded-full ${
            i < available ? "bg-violet-400" : "bg-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

export default function Home() {
  const [lang, setLang] = useState<Lang>("ka");
  const t = T[lang];
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");

  async function load(from = fromCity, to = toCity) {
    setLoading(true);

    const cutoff = new Date(Date.now() - 36e5).toISOString();

    let q = supabase
      .from("rides")
      .select("*")
      .gte("departure_time", cutoff)
      .order("departure_time", { ascending: true });

    if (from) q = q.ilike("from_city", `%${from}%`);
    if (to) q = q.ilike("to_city", `%${to}%`);

    const { data, error } = await q;

    if (error) {
      console.error(error);
      setRides([]);
    } else {
      setRides(data ?? []);
    }

    setLoading(false);
  }

  function reset() {
    setFromCity("");
    setToCity("");
    load("", "");
  }

  useEffect(() => {
    load();
  }, []);

  const totalSeats = rides.reduce((s, r) => s + r.seats_available, 0);
  const coveredCities = new Set(rides.map((r) => r.to_city)).size;

  return (
    <div
      className="min-h-screen font-sans"
      style={{
        background:
          "linear-gradient(135deg,#f5f3ff 0%,#ede9fe 30%,#faf5ff 60%,#f0fdf4 100%)",
      }}
    >
      <nav
        style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)" }}
        className="sticky top-0 z-50 border-b border-violet-100"
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-600 text-lg shadow-sm">
              🚐
            </div>
            <span className="text-xl font-black text-violet-700">mgzavri</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang((l) => (l === "en" ? "ka" : "en"))}
              className="rounded-xl border border-violet-200 bg-white px-3 py-1.5 text-xs font-bold text-violet-600 transition hover:bg-violet-50"
            >
              {lang === "en" ? "🇬🇪 KA" : "🇬🇧 EN"}
            </button>

            <Link
              href="/post"
              className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700"
            >
              + {t.postRide}
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-4 py-1.5 text-xs font-bold text-violet-600 shadow-sm">
            🇬🇪 Georgia minivan network
          </div>
          <h1 className="text-4xl font-black tracking-tight text-gray-900 sm:text-5xl">
            {t.tagline}
          </h1>
          <p className="mt-3 text-base text-gray-500">{t.sub}</p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {[
              { icon: "🚐", val: rides.length, label: t.rides },
              { icon: "💺", val: totalSeats, label: t.seats },
              { icon: "📍", val: coveredCities, label: t.cities },
            ].map(({ icon, val, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-2xl border border-violet-100 bg-white px-5 py-3 shadow-sm"
              >
                <span className="text-xl">{icon}</span>
                <span className="text-2xl font-black text-violet-700">{val}</span>
                <span className="text-sm text-gray-500">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6 overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-[0_4px_30px_rgba(109,40,217,0.08)]">
          <div className="bg-violet-600 px-6 py-4">
            <p className="text-sm font-bold text-violet-100">{t.whereTo}</p>
          </div>

          <div className="p-5 sm:p-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                load();
              }}
              className="grid gap-4 sm:grid-cols-[1fr_1fr_auto_auto]"
            >
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  {t.from}
                </label>
                <select
                  value={fromCity}
                  onChange={(e) => setFromCity(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm font-medium outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                >
                  <option value="">{t.allCities}</option>
                  {CITIES.map((c) => (
                    <option key={c.en} value={c.en}>
                      {lang === "ka" ? c.ka : c.en}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  {t.to}
                </label>
                <select
                  value={toCity}
                  onChange={(e) => setToCity(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm font-medium outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                >
                  <option value="">{t.allCities}</option>
                  {CITIES.map((c) => (
                    <option key={c.en} value={c.en}>
                      {lang === "ka" ? c.ka : c.en}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full rounded-2xl bg-violet-600 px-6 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-50"
                >
                  {loading ? "…" : t.search}
                </button>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={reset}
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 text-sm font-bold text-gray-600 transition hover:bg-gray-100"
                >
                  {t.clear}
                </button>
              </div>
            </form>
          </div>
        </div>

        <a
          href="mailto:mgzavri@gmail.com?subject=Advertising"
          className="group mb-6 flex items-center justify-between gap-4 rounded-3xl border border-dashed border-violet-300 bg-violet-50 px-6 py-4 transition hover:bg-violet-100"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-600 text-lg text-white">
              📣
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-violet-500">
                {t.ad}
              </div>
              <div className="text-sm font-black text-gray-800">{t.advertise}</div>
              <div className="text-xs text-gray-400">mgzavri@gmail.com</div>
            </div>
          </div>

          <div className="shrink-0 rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-bold text-white transition group-hover:bg-violet-700">
            {lang === "ka" ? "დაგვიკავშირდით →" : "Get in touch →"}
          </div>
        </a>

        <div className="grid gap-4">
          {loading ? (
            <div className="flex items-center justify-center rounded-3xl border border-violet-100 bg-white py-20 text-sm text-gray-400">
              <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              {t.loading}
            </div>
          ) : rides.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-violet-200 bg-white py-20 text-center">
              <div className="mb-3 text-5xl">🚐</div>
              <div className="text-lg font-black text-gray-700">{t.noRides}</div>
              <p className="mt-1 text-sm text-gray-400">{t.noRidesSub}</p>
              <Link
                href="/post"
                className="mt-5 inline-flex rounded-2xl bg-violet-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-violet-700"
              >
                + {t.postRide}
              </Link>
            </div>
          ) : (
            rides.map((r) => {
              const badge = getBadge(r.departure_time, t);
              const expired = badge.label === t.departed;

              return (
                <div
                  key={r.id}
                  className={`overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-[0_4px_20px_rgba(109,40,217,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(109,40,217,0.12)] ${
                    expired ? "opacity-50" : ""
                  }`}
                >
                  <div className="grid sm:grid-cols-[1fr_auto]">
                    <div className="p-5 sm:p-6">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                        {r.seats_available === 0 && (
                          <span className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-600">
                            {t.full}
                          </span>
                        )}
                      </div>

                      <h2 className="text-2xl font-black text-gray-900">
                        {getCityLabel(r.from_city, lang)}
                        <span className="mx-2 text-violet-400">→</span>
                        {getCityLabel(r.to_city, lang)}
                      </h2>

                      <p className="mb-4 mt-1 text-sm text-gray-400">
                        🚐 {r.vehicle_type} · 🕐 {new Date(r.departure_time).toLocaleString()}
                      </p>

                      <div className="mb-4">
                        <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-gray-400">
                          {r.seats_available} {t.seatsLeft}
                        </div>
                        <SeatDots available={r.seats_available} total={r.seats_total} />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/ride/${r.id}`}
                          className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600 transition hover:bg-gray-50"
                        >
                          {t.details}
                        </Link>

                        <a
                          href={`tel:${r.phone}`}
                          className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 transition hover:bg-violet-100"
                        >
                          📞 {t.call}
                        </a>

                        <a
                          href={waLink(r.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-600"
                        >
                          {t.whatsapp}
                        </a>

                        {r.seats_available > 0 && (
                          <Link
                            href={`/ride/${r.id}?book=1`}
                            className="rounded-xl bg-violet-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-violet-700"
                          >
                            {t.book}
                          </Link>
                        )}
                      </div>
                    </div>

                    <div className="flex min-w-[110px] flex-col items-center justify-center border-l border-violet-50 bg-gradient-to-b from-violet-50 to-purple-50 px-6 py-5">
                      <div className="text-3xl font-black text-violet-700">
                        {r.price_per_seat}₾
                      </div>
                      <div className="text-xs font-semibold text-violet-400">{t.perSeat}</div>

                      {r.seats_available > 0 && (
                        <div className="mt-3 text-center">
                          <div className="text-2xl font-black text-gray-800">
                            {r.seats_available}
                          </div>
                          <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                            {t.seatsLeft}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <footer className="mt-12 border-t border-violet-100 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-violet-600 text-sm">
              🚐
            </div>
            <span className="font-black text-violet-700">mgzavri</span>
          </div>

          <a
            href="mailto:mgzavri@gmail.com"
            className="text-sm font-semibold text-gray-500 transition hover:text-violet-600"
          >
            mgzavri@gmail.com
          </a>

          <span className="text-xs text-gray-400">
            © {new Date().getFullYear()} mgzavri
          </span>
        </div>
      </footer>

      <Link
        href="/post"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-xl transition hover:bg-violet-700 sm:hidden"
      >
        + {t.postRide}
      </Link>
    </div>
  );
}
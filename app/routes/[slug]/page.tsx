"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { IconArrowLeft, IconClock, IconLoader2, IconRoute } from "@tabler/icons-react";
import TripCard from "../../../components/TripCard";
import TripSearchForm from "../../../components/TripSearchForm";
import ScenicPageHero from "../../../components/ScenicPageHero";
import { useLanguage } from "../../../components/LanguageProvider";
import { POPULAR_ROUTES, cityLabel, parseRouteSlug, type Lang } from "../../../lib/cities";
import { formatDuration, formatPrice } from "../../../lib/format";
import { api } from "../../../lib/api";
import type { Ride } from "../../../lib/types";

const COPY = {
  en: {
    back: "All routes",
    titleSuffix: "minivan trips",
    subtitle: "Compare available departures and choose the van that fits your group.",
    available: "Available trips",
    allDates: "All upcoming dates",
    loading: "Searching trips...",
    empty: "No trips available for this date.",
    emptyText: "Try another date or request this route so drivers can see the demand.",
    emptyAny: "No upcoming trips on this route.",
    emptyAnyText: "Choose a date or request this route so drivers can see the demand.",
    request: "Post a passenger request",
    invalid: "This route could not be found.",
    duration: "Approx. travel time",
    starting: "Starting price",
    noPrice: "No live price",
  },
  ka: {
    back: "ყველა მარშრუტი",
    titleSuffix: "მინივენის რეისები",
    subtitle: "შეადარეთ ხელმისაწვდომი გამგზავრებები და აირჩიეთ თქვენი ჯგუფისთვის შესაფერისი მინივენი.",
    available: "ხელმისაწვდომი რეისები",
    allDates: "ყველა მომავალი თარიღი",
    loading: "რეისები იძებნება...",
    empty: "ამ თარიღისთვის რეისი არ არის.",
    emptyText: "სცადეთ სხვა თარიღი ან მოითხოვეთ მარშრუტი, რათა მძღოლებმა მოთხოვნა დაინახონ.",
    emptyAny: "ამ მარშრუტზე მომავალი რეისი არ არის.",
    emptyAnyText: "აირჩიეთ თარიღი ან მოითხოვეთ მარშრუტი.",
    request: "მგზავრის მოთხოვნის დამატება",
    invalid: "მარშრუტი ვერ მოიძებნა.",
    duration: "მგზავრობის დრო",
    starting: "საწყისი ფასი",
    noPrice: "ფასი ჯერ არ არის",
  },
} as const;

export default function RoutePage() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const { lang } = useLanguage() as { lang: Lang };
  const text = COPY[lang];
  const route = parseRouteSlug(slug);
  const fromName = route?.from.name;
  const toName = route?.to.name;
  const date = searchParams.get("date") || "";
  const passengers = Math.max(1, Number(searchParams.get("passengers")) || 1);
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!fromName || !toName) return;

    // A changed search should replace the current result set with a loading state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");

    let active = true;
    const params = new URLSearchParams({ from: fromName, to: toName });
    if (date) params.set("date", date);
    api<Ride[]>(`/rides?${params}`, { public: true }).then(({ data, error: queryError }) => {
      if (!active) return;
      if (queryError) setError(queryError.message);
      setRides(data ?? []);
      setLoading(false);
    });
    return () => { active = false; };
  }, [date, fromName, toName]);

  if (!route) {
    return <div className="mx-auto max-w-4xl px-4 py-20 text-center"><h1 className="text-2xl font-black text-slate-900">{text.invalid}</h1><Link href="/" className="mt-5 inline-flex text-sm font-black text-violet-700">{text.back}</Link></div>;
  }

  const routeMeta = POPULAR_ROUTES.find((item) => item.from === route.from.name && item.to === route.to.name);
  const compatibleRides = rides.filter((ride) => !ride.full_van_booked);
  const startingPrice = compatibleRides.length ? Math.min(...compatibleRides.map((ride) => ride.price_per_seat)) : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="border-b border-violet-100 bg-[radial-gradient(circle_at_top_right,_#ede9fe_0,_#fff_48%)]">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-black text-slate-600 hover:text-violet-700"><IconArrowLeft size={15} /> {text.back}</Link>
          <div className="mt-5"><ScenicPageHero eyebrow={text.titleSuffix} title={`${cityLabel(route.from.name, lang)} → ${cityLabel(route.to.name, lang)}`} subtitle={text.subtitle} lang={lang} from={route.from.name} to={route.to.name} meta={<>{routeMeta && <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-black backdrop-blur"><IconClock size={14} /> {formatDuration(routeMeta.duration, lang)}</span>}<span className="rounded-full bg-white px-3 py-2 text-xs font-black text-violet-900 shadow-lg">{startingPrice ? `${text.starting}: ${formatPrice(startingPrice, lang)}` : text.noPrice}</span></>} /></div>

          <div className="relative z-10 mx-2 -mt-5 rounded-2xl border border-white/80 bg-white/95 p-4 shadow-xl shadow-violet-950/10 backdrop-blur sm:mx-8 sm:p-5">
            <TripSearchForm lang={lang} initialFrom={route.from.name} initialTo={route.to.name} initialDate={date} initialPassengers={passengers} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-9 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-black text-slate-950">{text.available}</h2>
          {!loading && <div className="flex items-center gap-2"><span className="rounded-full bg-violet-100 px-3 py-1.5 text-xs font-black text-violet-700">{date || text.allDates}</span><span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-600 shadow-sm">{rides.length}</span></div>}
        </div>

        {loading ? (
          <div className="mt-5 flex min-h-40 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-500"><IconLoader2 size={18} className="mr-2 animate-spin text-violet-600" /> {text.loading}</div>
        ) : error ? (
          <p role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">{error}</p>
        ) : rides.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <IconRoute size={30} className="mx-auto text-slate-400" />
            <h3 className="mt-4 text-xl font-black text-slate-900">{date ? text.empty : text.emptyAny}</h3>
            <p className="mx-auto mt-2 max-w-lg text-sm font-medium leading-6 text-slate-600">{date ? text.emptyText : text.emptyAnyText}</p>
            <Link href={`/post-request?from=${encodeURIComponent(route.from.name)}&to=${encodeURIComponent(route.to.name)}${date ? `&date=${date}` : ""}&passengers=${passengers}`} className="mt-5 inline-flex rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white hover:bg-violet-700">{text.request}</Link>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {rides.map((ride) => <TripCard key={ride.id} ride={ride} lang={lang} passengers={passengers} />)}
          </div>
        )}
      </section>
    </div>
  );
}

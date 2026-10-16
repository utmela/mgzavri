"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconArrowRight, IconArmchair, IconBus, IconCheck, IconMapSearch, IconRoute } from "@tabler/icons-react";
import TripSearchForm from "../components/TripSearchForm";
import RoutePhotoBanner from "../components/RoutePhotoBanner";
import { useLanguage } from "../components/LanguageProvider";
import { POPULAR_ROUTES, routeSlug, type Lang } from "../lib/cities";
import { formatDuration, formatPrice } from "../lib/format";
import { api } from "../lib/api";
import type { Ride } from "../lib/types";
import { useProfileRole } from "../lib/useProfileRole";

const COPY = {
  en: {
    eyebrow: "Intercity minivans across Georgia",
    title: "Where are you going?",
    subtitle: "Choose your route and group size. Add a date only when you want a specific day.",
    popular: "Popular routes",
    popularSub: "Common intercity connections with live starting prices when trips are available.",
    from: "From",
    checkTrips: "View trips",
    duration: "Approx.",
    noPrice: "Check departures",
    how: "How it works",
    howSub: "Book shared seats or reserve the entire van in a few steps.",
    step1: "Find a trip",
    step1Text: "Search by route, date and passenger count.",
    step2: "Choose your booking",
    step2Text: "Reserve individual seats or an eligible private van.",
    step3: "Travel",
    step3Text: "Your confirmed booking includes the driver contact details.",
    driverTitle: "Driving between cities?",
    driverText: "Publish a trip, fill empty seats, and update availability from your phone.",
    postDriverTrip: "Post a driver trip",
    dashboard: "Driver dashboard",
    passengerTitle: "Need a ride that is not listed?",
    passengerText: "Post a passenger request so approved drivers can see where you need to travel.",
    postPassengerRequest: "Post a passenger request",
    request: "Can’t find a trip? Post a passenger request",
  },
  ka: {
    eyebrow: "საქალაქთაშორისო მინივენები საქართველოში",
    title: "სად მიდიხართ?",
    subtitle: "აირჩიეთ მარშრუტი, თარიღი და მგზავრების რაოდენობა. შეადარეთ ხელმისაწვდომი მინივენები ერთ მარტივ სიაში.",
    popular: "პოპულარული მარშრუტები",
    popularSub: "ხშირი საქალაქთაშორისო მიმართულებები ცოცხალი საწყისი ფასებით, როცა რეისები ხელმისაწვდომია.",
    from: "დან",
    checkTrips: "რეისების ნახვა",
    duration: "დაახლ.",
    noPrice: "რეისების შემოწმება",
    how: "როგორ მუშაობს",
    howSub: "დაჯავშნეთ ადგილი ან მთლიანი მინივენი რამდენიმე ნაბიჯში.",
    step1: "იპოვეთ მგზავრობა",
    step1Text: "მოძებნეთ მარშრუტით, თარიღით და მგზავრების რაოდენობით.",
    step2: "აირჩიეთ ჯავშანი",
    step2Text: "დაჯავშნეთ ცალკეული ადგილები ან მთლიანი მინივენი.",
    step3: "იმგზავრეთ",
    step3Text: "დადასტურებული ჯავშანი გაჩვენებთ მძღოლის საკონტაქტო ინფორმაციას.",
    driverTitle: "ქალაქებს შორის მოძრაობთ?",
    driverText: "დაამატეთ რეისი, შეავსეთ თავისუფალი ადგილები და მართეთ ხელმისაწვდომობა ტელეფონიდან.",
    postDriverTrip: "მძღოლის რეისის დამატება",
    dashboard: "მძღოლის პანელი",
    passengerTitle: "სასურველი რეისი ვერ იპოვეთ?",
    passengerText: "დაამატეთ მგზავრის მოთხოვნა, რათა ავტორიზებულმა მძღოლებმა დაინახონ თქვენი მარშრუტი.",
    postPassengerRequest: "მგზავრის მოთხოვნის დამატება",
    request: "რეისი ვერ იპოვეთ? დაამატეთ მგზავრის მოთხოვნა",
  },
} as const;

export default function Home() {
  const { lang } = useLanguage() as { lang: Lang };
  const text = COPY[lang];
  const [rides, setRides] = useState<Ride[]>([]);
  const { canDrive } = useProfileRole();
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    api<Ride[]>("/rides", { public: true }).then(({ data, error }) => {
      if (!active) return;
      setRides(data ?? []);
      setLoadError(error?.message ?? "");
    });
    return () => { active = false; };
  }, []);

  function startingPrice(from: string, to: string) {
    const prices = rides
      .filter((ride) => ride.from_city === from && ride.to_city === to)
      .map((ride) => ride.price_per_seat);
    return prices.length ? Math.min(...prices) : null;
  }

  return (
    <div className="min-h-screen bg-violet-50/40 text-slate-950">
      <section className="border-b border-violet-100 bg-gradient-to-b from-violet-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-10 text-center sm:px-6 sm:py-14">
          <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-violet-700"><IconRoute size={15} />{text.eyebrow}</p>
          <h1 className="mx-auto mt-4 max-w-4xl text-3xl font-black tracking-tight sm:text-5xl">{text.title}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-base font-medium leading-7 text-slate-600">{text.subtitle}</p>

          <div className="mt-7 rounded-2xl border border-violet-200 bg-white p-4 shadow-[0_18px_50px_rgba(91,33,182,0.10)] sm:p-6">
            <TripSearchForm lang={lang} />
          </div>

          <Link href="/post-request" className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-violet-700 hover:text-violet-900">
            {text.request} <IconArrowRight size={15} />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-950">{text.popular}</h2>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-600">{text.popularSub}</p>
          </div>
        </div>

        {loadError && <p role="alert" className="mt-4 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-900">{loadError}</p>}
        <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {POPULAR_ROUTES.map((route) => {
            const price = startingPrice(route.from, route.to);
            return (
              <Link
                key={`${route.from}-${route.to}`}
                href={`/routes/${routeSlug(route.from, route.to)}`}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-100"
              >
                <RoutePhotoBanner from={route.from} to={route.to} lang={lang} />
                <div className="flex items-end justify-between gap-3 p-4">
                  <div>
                    <p className="text-sm font-black text-violet-700">{price ? `${text.from} ${formatPrice(price, lang)}` : text.noPrice}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{text.duration} {formatDuration(route.duration, lang)}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-black text-slate-700">{text.checkTrips}<IconArrowRight size={14} className="text-violet-600" /></span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="text-2xl font-black text-slate-950">{text.how}</h2>
          <p className="mt-2 text-sm font-medium text-slate-600">{text.howSub}</p>
          <div className="mt-7 grid gap-6 md:grid-cols-3">
            {[
              { icon: IconMapSearch, title: text.step1, body: text.step1Text },
              { icon: IconArmchair, title: text.step2, body: text.step2Text },
              { icon: IconCheck, title: text.step3, body: text.step3Text },
            ].map(({ icon: Icon, title, body }, index) => (
              <div key={title} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><Icon size={19} /></div>
                <div><p className="text-xs font-black text-violet-700">0{index + 1}</p><h3 className="mt-1 font-black text-slate-900">{title}</h3><p className="mt-2 text-sm font-medium leading-6 text-slate-600">{body}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-6 rounded-2xl bg-gradient-to-r from-violet-950 to-purple-900 p-6 text-white shadow-xl shadow-violet-900/10 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <div className="flex items-center gap-2">{canDrive ? <IconBus size={20} className="text-violet-300" /> : <IconArmchair size={20} className="text-violet-300" />}<h2 className="text-2xl font-black">{canDrive ? text.driverTitle : text.passengerTitle}</h2></div>
            <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-slate-300">{canDrive ? text.driverText : text.passengerText}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {canDrive ? <><Link href="/post" className="rounded-xl bg-white px-5 py-3 text-sm font-black text-violet-950 transition hover:bg-violet-50">{text.postDriverTrip}</Link><Link href="/my-rides" className="rounded-xl border border-white/25 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10">{text.dashboard}</Link></> : <Link href="/post-request" className="rounded-xl bg-white px-5 py-3 text-sm font-black text-violet-950 transition hover:bg-violet-50">{text.postPassengerRequest}</Link>}
          </div>
        </div>
      </section>
    </div>
  );
}

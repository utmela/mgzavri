import Link from "next/link";
import { IconArmchair, IconArrowRight, IconBus, IconClock, IconUser } from "@tabler/icons-react";
import { cityLabel, type Lang } from "../lib/cities";
import { formatPrice, formatTime } from "../lib/format";
import type { Ride } from "../lib/types";
import RoutePhotoBanner from "./RoutePhotoBanner";

type Props = {
  ride: Ride;
  lang: Lang;
  passengers: number;
};

const COPY = {
  en: { driver: "Driver", seats: "seats left", perPassenger: "per passenger", select: "Select", fullVan: "Entire van available", unavailable: "Not enough seats" },
  ka: { driver: "მძღოლი", seats: "ადგილი დარჩა", perPassenger: "ერთ მგზავრზე", select: "არჩევა", fullVan: "მთლიანი მინივენი ხელმისაწვდომია", unavailable: "საკმარისი ადგილი არ არის" },
} as const;

export default function TripCard({ ride, lang, passengers }: Props) {
  const text = COPY[lang];
  const canFit = ride.seats_available >= passengers && !ride.full_van_booked;
  const time = formatTime(ride.departure_time, lang);

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-violet-200 hover:shadow-md">
      <RoutePhotoBanner from={ride.from_city} to={ride.to_city} lang={lang} compact />
      <div className="grid gap-5 p-4 sm:p-5 md:grid-cols-[90px_1.25fr_1fr_150px] md:items-center">
        <div>
          <p className="text-2xl font-black text-slate-950">{time}</p>
          <p className="mt-1 flex items-center gap-1 text-xs font-bold text-slate-500">
            <IconClock size={13} /> {new Date(ride.departure_time).toLocaleDateString(lang === "ka" ? "ka-GE" : "en-GB", { day: "numeric", month: "short" })}
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 text-base font-black text-slate-900">
            <span>{cityLabel(ride.from_city, lang)}</span>
            <IconArrowRight size={17} className="text-violet-600" />
            <span>{cityLabel(ride.to_city, lang)}</span>
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-slate-600">
            <IconBus size={15} className="text-slate-400" /> {ride.vehicle_type || "Minivan"}
          </p>
        </div>

        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
            <IconUser size={15} className="text-slate-400" /> {ride.driver_name || text.driver}
          </p>
          <p className={`flex items-center gap-1.5 text-sm font-bold ${canFit ? "text-violet-700" : "text-red-600"}`}>
            <IconArmchair size={15} /> {canFit ? `${ride.seats_available} ${text.seats}` : text.unavailable}
          </p>
          {ride.allow_entire_van_booking && ride.seats_available === ride.seats_total && (
            <p className="text-xs font-bold text-violet-700">{text.fullVan}</p>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 md:block md:text-right">
          <div>
            <p className="text-xl font-black text-slate-950">{formatPrice(ride.price_per_seat, lang)}</p>
            <p className="text-xs font-semibold text-slate-500">{text.perPassenger}</p>
          </div>
          {canFit ? (
            <Link
              href={`/ride/${ride.id}?passengers=${passengers}`}
              className="mt-3 inline-flex h-10 items-center justify-center rounded-xl bg-violet-600 px-5 text-sm font-black text-white transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200"
            >
              {text.select}
            </Link>
          ) : (
            <button disabled className="mt-3 h-10 rounded-xl bg-slate-100 px-5 text-sm font-black text-slate-400">{text.select}</button>
          )}
        </div>
      </div>
    </article>
  );
}

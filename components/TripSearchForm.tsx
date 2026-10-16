"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconCalendar, IconMapPin, IconSearch, IconUsers } from "@tabler/icons-react";
import { cityOptions, routeSlug, type Lang } from "../lib/cities";
import CustomDateTimePicker from "./CustomDateTimePicker";
import CustomSelect from "./CustomSelect";
import SeatStepper from "./SeatStepper";

type Props = {
  lang: Lang;
  initialFrom?: string;
  initialTo?: string;
  initialDate?: string;
  initialPassengers?: number;
  compact?: boolean;
};

function localDateValue(date = new Date()) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().split("T")[0];
}

const COPY = {
  en: {
    from: "From",
    to: "To",
    date: "Date (optional)",
    anyDate: "Any date",
    passengers: "Passengers",
    choose: "Choose city",
    search: "Search trips",
    sameCity: "Choose two different cities.",
  },
  ka: {
    from: "საიდან",
    to: "სადამდე",
    date: "თარიღი (არასავალდებულო)",
    anyDate: "ნებისმიერი თარიღი",
    passengers: "მგზავრები",
    choose: "აირჩიე ქალაქი",
    search: "მგზავრობის ძებნა",
    sameCity: "აირჩიეთ ორი განსხვავებული ქალაქი.",
  },
} as const;

export default function TripSearchForm({
  lang,
  initialFrom = "",
  initialTo = "",
  initialDate,
  initialPassengers = 1,
  compact = false,
}: Props) {
  const router = useRouter();
  const text = COPY[lang];
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [date, setDate] = useState(initialDate ?? "");
  const [passengers, setPassengers] = useState(Math.max(1, initialPassengers));
  const [error, setError] = useState("");
  const options = cityOptions(lang);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!from || !to) return;
    if (from === to) {
      setError(text.sameCity);
      return;
    }

    const query = new URLSearchParams({ passengers: String(passengers) });
    if (date) query.set("date", date);
    router.push(`/routes/${routeSlug(from, to)}?${query.toString()}`);
  }

  return (
    <form onSubmit={submit} className={compact ? "space-y-4" : "space-y-5"}>
      <div className={`grid gap-3 ${compact ? "md:grid-cols-[1fr_1fr_0.8fr_auto]" : "md:grid-cols-[1fr_1fr_0.8fr_0.9fr_auto]"}`}>
        <label className="block">
          <span className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-slate-600">
            <IconMapPin size={14} /> {text.from}
          </span>
          <CustomSelect value={from} onChange={(value) => { setFrom(value); setError(""); }} options={options} placeholder={text.choose} />
        </label>

        <label className="block">
          <span className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-slate-600">
            <IconMapPin size={14} /> {text.to}
          </span>
          <CustomSelect value={to} onChange={(value) => { setTo(value); setError(""); }} options={options} placeholder={text.choose} />
        </label>

        <label className="block">
          <span className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-slate-600">
            <IconCalendar size={14} /> {text.date}
          </span>
          <CustomDateTimePicker mode="date" lang={lang} min={localDateValue()} value={date} onChange={setDate} placeholder={text.anyDate} />
        </label>

        {!compact && (
          <div>
            <span className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-slate-600">
              <IconUsers size={14} /> {text.passengers}
            </span>
            <SeatStepper value={passengers} max={20} onChange={setPassengers} label={text.passengers} />
          </div>
        )}

        <div className="flex items-end">
          <button
            type="submit"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-black text-white transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200 md:w-auto"
          >
            <IconSearch size={17} stroke={2.5} /> {text.search}
          </button>
        </div>
      </div>

      {compact && (
        <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-bold text-slate-700"><IconUsers size={16} /> {text.passengers}</span>
          <SeatStepper value={passengers} max={20} onChange={setPassengers} label={text.passengers} />
        </div>
      )}

      {error && <p role="alert" className="text-sm font-bold text-red-600">{error}</p>}
    </form>
  );
}

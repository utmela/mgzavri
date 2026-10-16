"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconCalendar, IconCheck, IconChevronLeft, IconChevronRight, IconClock, IconX } from "@tabler/icons-react";
import type { Lang } from "../lib/cities";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  mode?: "date" | "datetime";
  min?: string;
  lang?: Lang;
};

const MONTHS = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  ka: ["იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი", "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"],
};

const DAYS = {
  en: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
  ka: ["კვ", "ორ", "სა", "ოთ", "ხუ", "პა", "შა"],
};

const COPY = {
  en: { today: "Today", done: "Done", time: "Departure time", clear: "Clear date" },
  ka: { today: "დღეს", done: "არჩევა", time: "გასვლის დრო", clear: "თარიღის გასუფთავება" },
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function parseValue(value: string) {
  if (!value) return null;
  const parsed = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export default function CustomDateTimePicker({ value, onChange, placeholder = "Select date", mode = "datetime", min, lang = "en" }: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const initial = parseValue(value);
  const now = new Date();
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [viewYear, setViewYear] = useState(initial?.getFullYear() ?? now.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial?.getMonth() ?? now.getMonth());
  const [selected, setSelected] = useState<Date | null>(initial);
  const [hour, setHour] = useState(initial?.getHours() ?? 9);
  const [minute, setMinute] = useState(initial?.getMinutes() ?? 0);
  const text = COPY[lang];
  const compactDateTime = mode === "datetime";

  const updateRect = useCallback(() => {
    if (buttonRef.current) setRect(buttonRef.current.getBoundingClientRect());
  }, []);

  useEffect(() => {
    if (open) updateRect();
  }, [open, updateRect]);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (popupRef.current?.contains(event.target as Node) || buttonRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", close);
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [updateRect]);

  function emit(date: Date, nextHour = hour, nextMinute = minute) {
    const base = dateKey(date);
    onChange(mode === "date" ? base : `${base}T${pad(nextHour)}:${pad(nextMinute)}`);
  }

  function selectDay(day: number) {
    const next = new Date(viewYear, viewMonth, day);
    if (min && dateKey(next) < min.slice(0, 10)) return;
    setSelected(next);
    emit(next);
    if (mode === "date") setOpen(false);
  }

  function moveMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  function chooseToday() {
    const today = new Date();
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelected(today);
    emit(today);
    if (mode === "date") setOpen(false);
  }

  function updateTime(nextHour: number, nextMinute: number) {
    setHour(nextHour);
    setMinute(nextMinute);
    if (selected) emit(selected, nextHour, nextMinute);
  }

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [...Array<null>(firstDay).fill(null), ...Array.from({ length: totalDays }, (_, index) => index + 1)];
  while (cells.length % 7) cells.push(null);

  const display = selected
    ? `${selected.getDate()} ${MONTHS[lang][selected.getMonth()]} ${selected.getFullYear()}` + (mode === "datetime" ? `, ${pad(hour)}:${pad(minute)}` : "")
    : "";

  const popupWidth = Math.min(compactDateTime ? 320 : 340, typeof window === "undefined" ? 320 : window.innerWidth - 24);
  const popupLeft = rect ? Math.max(12, Math.min(rect.left, window.innerWidth - popupWidth - 12)) : 12;
  const popupTop = rect ? (compactDateTime && window.innerWidth < 640 ? 12 : Math.min(rect.bottom + 8, window.innerHeight - (compactDateTime ? 420 : 490))) : 80;
  const popupMaxHeight = typeof window === "undefined" ? 760 : window.innerHeight - 24;

  const popup = open && rect ? createPortal(
    <div ref={popupRef} style={{ position: "fixed", top: Math.max(12, popupTop), left: popupLeft, width: popupWidth, maxHeight: popupMaxHeight, zIndex: 9999 }} className={`${compactDateTime ? "rounded-2xl" : "rounded-3xl"} overflow-y-auto border border-violet-200 bg-white shadow-[0_24px_70px_rgba(76,29,149,0.24)]`}>
      <div className={`sticky top-0 z-10 bg-gradient-to-r from-violet-700 to-purple-600 text-white ${compactDateTime ? "px-4 py-3" : "px-5 py-4"}`}>
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={() => moveMonth(-1)} aria-label="Previous month" className={`grid place-items-center bg-white/10 hover:bg-white/20 ${compactDateTime ? "h-8 w-8 rounded-lg" : "h-9 w-9 rounded-xl"}`}><IconChevronLeft size={compactDateTime ? 16 : 18} /></button>
          <p className={`font-black ${compactDateTime ? "text-sm" : ""}`}>{MONTHS[lang][viewMonth]} {viewYear}</p>
          <button type="button" onClick={() => moveMonth(1)} aria-label="Next month" className={`grid place-items-center bg-white/10 hover:bg-white/20 ${compactDateTime ? "h-8 w-8 rounded-lg" : "h-9 w-9 rounded-xl"}`}><IconChevronRight size={compactDateTime ? 16 : 18} /></button>
        </div>
      </div>

      <div className={compactDateTime ? "p-3" : "p-4 sm:p-5"}>
        <div className="grid grid-cols-7">
          {DAYS[lang].map((day) => <span key={day} className="py-1 text-center text-[10px] font-black uppercase tracking-wide text-slate-400">{day}</span>)}
        </div>
        <div className={`mt-1 grid grid-cols-7 ${compactDateTime ? "gap-0.5" : "gap-1"}`}>
          {cells.map((day, index) => {
            if (!day) return <span key={`empty-${index}`} />;
            const candidate = new Date(viewYear, viewMonth, day);
            const disabled = Boolean(min && dateKey(candidate) < min.slice(0, 10));
            const isSelected = selected && dateKey(candidate) === dateKey(selected);
            const isToday = dateKey(candidate) === dateKey(now);
            return <button key={day} type="button" disabled={disabled} onClick={() => selectDay(day)} className={`${compactDateTime ? "h-8 rounded-lg text-xs" : "aspect-square rounded-xl text-sm"} font-black transition ${isSelected ? "bg-violet-600 text-white shadow-md shadow-violet-200" : isToday ? "bg-violet-100 text-violet-800" : "text-slate-700 hover:bg-violet-50 hover:text-violet-700"} disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent`}>{day}</button>;
          })}
        </div>

        {mode === "datetime" && (
          <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50 p-2.5">
            <p className="mb-1.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-wide text-violet-700"><IconClock size={14} />{text.time}</p>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <select aria-label="Hour" value={hour} onChange={(event) => updateTime(Number(event.target.value), minute)} className="h-9 rounded-lg border border-violet-200 bg-white px-2 text-center text-sm font-black text-slate-900 outline-none focus:border-violet-500">{Array.from({ length: 24 }, (_, item) => <option key={item} value={item}>{pad(item)}</option>)}</select>
              <span className="font-black text-violet-400">:</span>
              <select aria-label="Minute" value={minute} onChange={(event) => updateTime(hour, Number(event.target.value))} className="h-9 rounded-lg border border-violet-200 bg-white px-2 text-center text-sm font-black text-slate-900 outline-none focus:border-violet-500">{[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((item) => <option key={item} value={item}>{pad(item)}</option>)}</select>
            </div>
          </div>
        )}

        <div className={`${compactDateTime ? "mt-2.5" : "mt-4"} flex items-center justify-between gap-2`}>
          <button type="button" onClick={chooseToday} className={`${compactDateTime ? "rounded-lg px-2.5 py-1.5 text-xs" : "rounded-xl px-3 py-2 text-sm"} font-black text-violet-700 hover:bg-violet-50`}>{text.today}</button>
          {mode === "datetime" && <button type="button" onClick={() => setOpen(false)} className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-black text-white hover:bg-violet-700"><IconCheck size={14} />{text.done}</button>}
        </div>
      </div>
    </div>,
    document.body,
  ) : null;

  return (
    <div className="relative">
      <button ref={buttonRef} type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} className={`flex h-12 w-full items-center gap-3 rounded-xl border bg-white px-3.5 text-left text-sm font-bold outline-none transition ${open ? "border-violet-500 ring-4 ring-violet-100" : "border-slate-300 hover:border-violet-300"}`}>
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${open ? "bg-violet-600 text-white" : "bg-violet-50 text-violet-600"}`}><IconCalendar size={17} /></span>
        <span className={`min-w-0 flex-1 truncate ${display ? "text-slate-900" : "text-slate-400"}`}>{display || placeholder}</span>
        {value && <span role="button" aria-label={text.clear} onClick={(event) => { event.stopPropagation(); setSelected(null); onChange(""); }} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><IconX size={15} /></span>}
      </button>
      {popup}
    </div>
  );
}

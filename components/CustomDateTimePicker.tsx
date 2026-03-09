"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];
const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function pad(n: number) { return String(n).padStart(2, "0"); }

export default function CustomDateTimePicker({ value, onChange, placeholder = "Select date & time" }: Props) {
  const btnRef  = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const parsed = value ? new Date(value) : null;
  const now    = new Date();

  const [viewYear,  setViewYear]  = useState(parsed?.getFullYear()  ?? now.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth()     ?? now.getMonth());
  const [selDate,   setSelDate]   = useState<Date | null>(parsed);
  const [hour,      setHour]      = useState(parsed ? parsed.getHours()   : now.getHours());
  const [minute,    setMinute]    = useState(parsed ? parsed.getMinutes() : 0);

  const updateRect = useCallback(() => {
    if (btnRef.current) setRect(btnRef.current.getBoundingClientRect());
  }, []);

  useEffect(() => { if (open) updateRect(); }, [open, updateRect]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropRef.current && !dropRef.current.contains(e.target as Node) &&
        btnRef.current  && !btnRef.current.contains(e.target as Node)
      ) setOpen(false);
    }
    function handleScroll() { if (open) updateRect(); }
    document.addEventListener("mousedown", handleClick);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open, updateRect]);

  function emit(date: Date, h: number, m: number) {
    const d = new Date(date);
    d.setHours(h, m, 0, 0);
    onChange(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(h)}:${pad(m)}`);
  }

  function selectDay(day: number) {
    const d = new Date(viewYear, viewMonth, day);
    setSelDate(d);
    emit(d, hour, minute);
  }

  function changeHour(h: number) {
    const c = ((h % 24) + 24) % 24;
    setHour(c);
    if (selDate) emit(selDate, c, minute);
  }

  function changeMinute(m: number) {
    const c = ((m % 60) + 60) % 60;
    setMinute(c);
    if (selDate) emit(selDate, hour, c);
  }

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const isToday = (d: number) => {
    const t = new Date();
    return d === t.getDate() && viewMonth === t.getMonth() && viewYear === t.getFullYear();
  };
  const isSel = (d: number) =>
    selDate !== null &&
    d === selDate.getDate() &&
    viewMonth === selDate.getMonth() &&
    viewYear === selDate.getFullYear();

  const displayLabel = selDate
    ? `${selDate.toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" })}  ${pad(hour)}:${pad(minute)}`
    : "";

  const dropdown = rect && open ? createPortal(
    <div
      ref={dropRef}
      style={{
        position: "fixed",
        top: rect.bottom + 8,
        left: rect.left,
        zIndex: 9999,
        minWidth: 340,
      }}
      className="rounded-3xl border border-gray-200 bg-white shadow-2xl overflow-hidden"
    >
      <div className="flex">
        {/* ── Calendar ── */}
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={() => {
              if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
              else setViewMonth(m => m - 1);
            }} className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-violet-50 hover:text-violet-700 transition text-gray-500">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span className="text-sm font-black text-gray-800">{MONTHS[viewMonth]} {viewYear}</span>
            <button type="button" onClick={() => {
              if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
              else setViewMonth(m => m + 1);
            }} className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-violet-50 hover:text-violet-700 transition text-gray-500">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => (
              <div key={d} className="flex items-center justify-center text-[10px] font-bold text-gray-400 uppercase py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-1">
            {cells.map((d, i) => (
              <div key={i} className="flex items-center justify-center">
                {d === null ? null : (
                  <button type="button" onClick={() => selectDay(d)}
                    className={`h-8 w-8 rounded-xl text-sm font-bold transition
                      ${isSel(d)   ? "bg-violet-600 text-white shadow-md shadow-violet-200" :
                        isToday(d) ? "bg-violet-100 text-violet-700" :
                                     "text-gray-700 hover:bg-violet-50 hover:text-violet-700"}
                    `}>
                    {d}
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-3 flex justify-end">
            <button type="button" onClick={() => {
              const t = new Date();
              setViewYear(t.getFullYear()); setViewMonth(t.getMonth());
              selectDay(t.getDate());
            }} className="text-xs font-bold text-violet-600 hover:text-violet-800 transition">Today</button>
          </div>
        </div>

        {/* ── Time ── */}
        <div className="w-28 border-l border-gray-100 p-4 flex flex-col gap-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 text-center">Time</p>

          <div className="flex flex-col items-center gap-1">
            <button type="button" onClick={() => changeHour(hour + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-violet-50 hover:text-violet-700 transition text-gray-400">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
            </button>
            <input type="number" min="0" max="23" value={pad(hour)}
              onChange={e => changeHour(Number(e.target.value))}
              className="w-14 h-10 rounded-xl border border-gray-200 bg-gray-50 text-center text-lg font-black text-gray-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button type="button" onClick={() => changeHour(hour - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-violet-50 hover:text-violet-700 transition text-gray-400">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <span className="text-[10px] font-bold text-gray-400">HH</span>
          </div>

          <div className="text-center text-lg font-black text-gray-300">:</div>

          <div className="flex flex-col items-center gap-1">
            <button type="button" onClick={() => changeMinute(minute + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-violet-50 hover:text-violet-700 transition text-gray-400">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
            </button>
            <input type="number" min="0" max="59" value={pad(minute)}
              onChange={e => changeMinute(Number(e.target.value))}
              className="w-14 h-10 rounded-xl border border-gray-200 bg-gray-50 text-center text-lg font-black text-gray-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button type="button" onClick={() => changeMinute(minute - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-violet-50 hover:text-violet-700 transition text-gray-400">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <span className="text-[10px] font-bold text-gray-400">MM</span>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 p-3">
        <button type="button" onClick={() => setOpen(false)}
          className="w-full h-10 rounded-2xl bg-violet-600 text-sm font-black text-white hover:bg-violet-700 transition">
          Done ✓
        </button>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`h-12 w-full rounded-2xl border px-4 text-sm font-medium text-left flex items-center gap-3 transition outline-none
          ${open ? "border-violet-400 ring-4 ring-violet-100 bg-white" : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white"}
          ${displayLabel ? "text-gray-800" : "text-gray-400"}
        `}
      >
        <span className="text-gray-400 text-base shrink-0">🕐</span>
        <span className="flex-1">{displayLabel || placeholder}</span>
        <span className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>
      {dropdown}
    </div>
  );
}
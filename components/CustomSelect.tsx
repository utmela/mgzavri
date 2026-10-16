"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconCheck, IconChevronDown, IconSearch, IconX } from "@tabler/icons-react";

type Option = { value: string; label: string };

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
};

export default function CustomSelect({ value, onChange, options, placeholder = "Choose an option", className = "", searchable = true, searchPlaceholder = "Search..." }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [rect, setRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = options.find((option) => option.value === value);
  const filtered = query.trim() ? options.filter((option) => option.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())) : options;

  const updateRect = useCallback(() => {
    if (buttonRef.current) setRect(buttonRef.current.getBoundingClientRect());
  }, []);

  useEffect(() => {
    if (!open) return;
    updateRect();
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(timer);
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

  function choose(next: string) {
    onChange(next);
    setOpen(false);
    setQuery("");
  }

  const popupWidth = rect ? Math.min(Math.max(rect.width, 240), window.innerWidth - 24) : 240;
  const popupLeft = rect ? Math.max(12, Math.min(rect.left, window.innerWidth - popupWidth - 12)) : 12;
  const availableBelow = rect ? window.innerHeight - rect.bottom - 20 : 300;
  const popupTop = rect && availableBelow < 300 ? Math.max(12, rect.top - 308) : (rect?.bottom ?? 0) + 8;

  const popup = open && rect ? createPortal(
    <div ref={popupRef} role="listbox" style={{ position: "fixed", top: popupTop, left: popupLeft, width: popupWidth, zIndex: 9999 }} className="overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-[0_22px_60px_rgba(76,29,149,0.22)]">
      {searchable && <div className="border-b border-violet-100 bg-violet-50/70 p-3"><div className="flex h-11 items-center gap-2 rounded-xl border border-violet-200 bg-white px-3 focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-100"><IconSearch size={16} className="text-violet-500" /><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={searchPlaceholder} className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400" />{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="text-slate-400 hover:text-violet-700"><IconX size={15} /></button>}</div></div>}
      <div className="max-h-64 overflow-y-auto p-2">
        {placeholder && !query && <button type="button" onClick={() => choose("")} className={`flex min-h-10 w-full items-center rounded-xl px-3 text-left text-sm font-bold transition ${!value ? "bg-violet-50 text-violet-700" : "text-slate-400 hover:bg-slate-50"}`}>{placeholder}</button>}
        {filtered.length === 0 ? <p className="px-3 py-8 text-center text-sm font-bold text-slate-400">No results</p> : filtered.map((option) => {
          const active = option.value === value;
          return <button key={option.value} type="button" role="option" aria-selected={active} onClick={() => choose(option.value)} className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-sm font-bold transition ${active ? "bg-violet-600 text-white" : "text-slate-700 hover:bg-violet-50 hover:text-violet-800"}`}><span className="truncate">{option.label}</span>{active && <IconCheck size={16} />}</button>;
        })}
      </div>
    </div>,
    document.body,
  ) : null;

  return (
    <div className={`relative ${className}`}>
      <button ref={buttonRef} type="button" onClick={() => setOpen((current) => !current)} aria-haspopup="listbox" aria-expanded={open} className={`flex h-12 w-full items-center gap-3 rounded-xl border bg-white px-3.5 text-left text-sm font-bold outline-none transition ${open ? "border-violet-500 ring-4 ring-violet-100" : "border-slate-300 hover:border-violet-300"}`}>
        <span className={`min-w-0 flex-1 truncate ${selected ? "text-slate-900" : "text-slate-400"}`}>{selected?.label ?? placeholder}</span>
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-violet-50 text-violet-600 transition ${open ? "rotate-180 bg-violet-600 text-white" : ""}`}><IconChevronDown size={16} /></span>
      </button>
      {popup}
    </div>
  );
}

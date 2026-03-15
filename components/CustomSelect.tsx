"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

interface Option {
  value: string;
  label: string;
}

interface Props {
  value: string;
  onChange: (val: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  searchable?: boolean; // default true
}

export default function CustomSelect({
  value, onChange, options,
  placeholder = "Choose…", className = "", searchable = true,
}: Props) {
  const [open, setOpen]       = useState(false);
  const [query, setQuery]     = useState("");
  const [rect, setRect]       = useState<DOMRect | null>(null);
  const btnRef  = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const selected = options.find(o => o.value === value);

  const filtered = query.trim()
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  const updateRect = useCallback(() => {
    if (btnRef.current) setRect(btnRef.current.getBoundingClientRect());
  }, []);

  useEffect(() => {
    if (open) {
      updateRect();
      // focus search input after portal renders
      setTimeout(() => inputRef.current?.focus(), 30);
    } else {
      setQuery("");
    }
  }, [open, updateRect]);

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

  const dropdown = rect && open ? createPortal(
    <div
      ref={dropRef}
      style={{
        position: "fixed",
        top: rect.bottom + 8,
        left: rect.left,
        width: Math.max(rect.width, 200),
        zIndex: 9999,
      }}
      className="rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden"
    >
      {/* Search input */}
      {searchable && (
        <div className="px-3 pt-3 pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2 rounded-xl bg-gray-50 border border-gray-200 px-3 py-2 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100 transition">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search…"
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none min-w-0"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} className="text-gray-400 hover:text-gray-600 transition leading-none">
                ×
              </button>
            )}
          </div>
        </div>
      )}

      <div className="overflow-y-auto" style={{ maxHeight: 240 }}>
        {/* Clear / placeholder option */}
        {placeholder && !query && (
          <button type="button" onClick={() => { onChange(""); setOpen(false); }}
            className={`w-full px-4 py-2.5 text-left text-sm transition
              ${!value ? "bg-violet-50 text-violet-700 font-bold" : "text-gray-400 hover:bg-gray-50"}`}>
            {placeholder}
          </button>
        )}

        {filtered.length === 0 ? (
          <p className="px-4 py-3 text-sm text-gray-400 text-center">No results</p>
        ) : filtered.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => { onChange(opt.value); setOpen(false); }}
            className={`w-full px-4 py-2.5 text-left text-sm font-medium transition flex items-center gap-3
              ${value === opt.value
                ? "bg-violet-600 text-white font-bold"
                : "text-gray-700 hover:bg-violet-50 hover:text-violet-700"
              }`}
          >
            {value === opt.value
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              : <span style={{ width: 14 }} />
            }
            {opt.label}
          </button>
        ))}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className={`relative ${className}`}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`h-12 w-full rounded-2xl border px-4 pr-10 text-sm font-medium text-left flex items-center transition outline-none
          ${open
            ? "border-violet-400 ring-4 ring-violet-100 bg-white"
            : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white"
          }
          ${selected ? "text-gray-800" : "text-gray-400"}
        `}
      >
        <span className="flex-1 truncate">{selected ? selected.label : placeholder}</span>
        <span className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>
      {dropdown}
    </div>
  );
}
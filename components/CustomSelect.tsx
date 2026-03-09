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
}

export default function CustomSelect({ value, onChange, options, placeholder = "Choose…", className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const selected = options.find(o => o.value === value);

  const updateRect = useCallback(() => {
    if (btnRef.current) setRect(btnRef.current.getBoundingClientRect());
  }, []);

  useEffect(() => {
    if (open) updateRect();
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
        width: rect.width,
        zIndex: 9999,
        maxHeight: 280,
      }}
      className="rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden"
    >
      <div className="overflow-y-auto" style={{ maxHeight: 280 }}>
        {placeholder && (
          <button type="button" onClick={() => { onChange(""); setOpen(false); }}
            className={`w-full px-4 py-2.5 text-left text-sm transition
              ${!value ? "bg-violet-50 text-violet-700 font-bold" : "text-gray-400 hover:bg-gray-50"}`}>
            {placeholder}
          </button>
        )}
        {options.map(opt => (
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
"use client";
import { ACCESSORIES } from "../lib/accessories";

interface Props {
  value: string[];
  onChange: (val: string[]) => void;
  lang?: "en" | "ka";
}

export default function AccessoriesPicker({ value, onChange, lang = "ka" }: Props) {
  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id]);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {ACCESSORIES.map(a => {
        const on = value.includes(a.id);
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => toggle(a.id)}
            className={`flex items-center gap-2 rounded-2xl border-2 px-4 py-2 text-sm font-black transition select-none
              ${on
                ? "border-violet-500 bg-violet-50 text-violet-700 shadow-sm shadow-violet-100"
                : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:bg-white"
              }`}
          >
            <span className="text-base">{a.icon}</span>
            <span>{lang === "ka" ? a.ka : a.en}</span>
            {on && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-violet-500">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}
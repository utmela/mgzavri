"use client";
import { getAccessory } from "../lib/accessories";

interface Props {
  accessories: string[] | null | undefined;
  lang?: "en" | "ka";
  size?: "sm" | "md";
}

export default function AccessoriesBadges({ accessories, lang = "ka", size = "md" }: Props) {
  if (!accessories?.length) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {accessories.map(id => {
        const a = getAccessory(id);
        if (!a) return null;
        return (
          <span
            key={id}
            title={lang === "ka" ? a.ka : a.en}
            className={`inline-flex items-center gap-1.5 rounded-xl border border-violet-100 bg-violet-50 font-bold text-violet-700
              ${size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs"}`}
          >
            <span>{a.icon}</span>
            <span>{lang === "ka" ? a.ka : a.en}</span>
          </span>
        );
      })}
    </div>
  );
}
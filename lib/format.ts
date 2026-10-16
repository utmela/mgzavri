import type { Lang } from "./cities";

export function formatPrice(value: number, lang: Lang) {
  return lang === "ka" ? `${value} ₾` : `${value} GEL`;
}

export function formatDuration(value: string, lang: Lang) {
  if (lang === "en") return value;
  const match = value.match(/^(\d+)h(?:\s*(\d+)m)?$/);
  if (!match) return value;
  return `${match[1]} სთ${match[2] ? ` ${match[2]} წთ` : ""}`;
}

export function formatDateTime(value: string | Date, lang: Lang, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(lang === "ka" ? "ka-GE" : "en-GB", {
    ...options,
    ...(lang === "ka" ? { hourCycle: "h23" as const } : {}),
  }).format(new Date(value));
}

export function formatTime(value: string | Date, lang: Lang) {
  return formatDateTime(value, lang, { hour: "2-digit", minute: "2-digit" });
}

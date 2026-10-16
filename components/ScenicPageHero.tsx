import Image from "next/image";
import type { ReactNode } from "react";
import { IconArrowRight, IconMapPin } from "@tabler/icons-react";
import { cityImage, cityLabel, type Lang } from "../lib/cities";

type Props = {
  eyebrow: string;
  title: string;
  subtitle: string;
  lang: Lang;
  from?: string;
  to?: string;
  action?: ReactNode;
  meta?: ReactNode;
  tone?: "passenger" | "driver";
  showRoute?: boolean;
};

const TONES = {
  passenger: {
    shell: "border-violet-800/30 bg-violet-950 shadow-[0_24px_70px_rgba(46,16,101,0.22)]",
    glow: "bg-purple-400/20",
    copy: "text-violet-100/80",
    overlay: "from-violet-950 via-violet-950/20 to-slate-950/20",
    arrow: "text-violet-700",
  },
  driver: {
    shell: "border-violet-800/30 bg-violet-950 shadow-[0_24px_70px_rgba(46,16,101,0.22)]",
    glow: "bg-purple-400/20",
    copy: "text-violet-100/80",
    overlay: "from-violet-950 via-violet-950/25 to-slate-950/20",
    arrow: "text-violet-800",
  },
} as const;

export default function ScenicPageHero({ eyebrow, title, subtitle, lang, from = "Tbilisi", to = "Batumi", action, meta, tone = "passenger", showRoute = true }: Props) {
  const colors = TONES[tone];
  return (
    <section className={`group relative overflow-hidden rounded-[2rem] border text-white ${colors.shell}`}>
      <div className={`pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full blur-3xl ${colors.glow}`} />
      {!showRoute && <>
        <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full border border-white/10 bg-white/[0.04]" />
        <div className="pointer-events-none absolute -bottom-28 right-20 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.35)_1px,transparent_1px)] [background-size:42px_42px] [mask-image:linear-gradient(to_left,black,transparent_70%)]" />
      </>}
      <div className={showRoute ? "grid min-h-64 lg:grid-cols-[1.08fr_0.92fr]" : "relative flex min-h-60 items-center"}>
        <div className={`relative z-10 flex flex-col justify-center p-6 sm:p-8 lg:p-10 ${showRoute ? "" : "w-full lg:px-12"}`}>
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-violet-100 backdrop-blur">
            <IconMapPin size={13} /> {eyebrow}
          </p>
          <h1 className="mt-4 max-w-xl text-3xl font-black tracking-tight sm:text-5xl">{title}</h1>
          <p className={`mt-3 max-w-xl text-sm font-semibold leading-6 sm:text-base ${colors.copy}`}>{subtitle}</p>
          {(meta || action) && <div className="mt-6 flex flex-wrap items-center gap-3">{meta}{action}</div>}
        </div>

        {showRoute && <div className="relative min-h-48 overflow-hidden lg:min-h-full">
          <div className="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
            <Image src={cityImage(from)} alt={cityLabel(from, lang)} fill sizes="(max-width: 1024px) 50vw, 24vw" className="object-cover transition duration-700 group-hover:scale-105" />
          </div>
          <div className="absolute inset-y-0 right-0 w-1/2 overflow-hidden">
            <Image src={cityImage(to)} alt={cityLabel(to, lang)} fill sizes="(max-width: 1024px) 50vw, 24vw" className="object-cover transition duration-700 group-hover:scale-105" />
          </div>
          <div className={`absolute inset-0 bg-gradient-to-r ${colors.overlay}`} />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/85 to-transparent" />
          <div className="absolute inset-x-5 bottom-5 flex items-center justify-between gap-3 text-sm font-black drop-shadow sm:inset-x-7">
            <span>{cityLabel(from, lang)}</span>
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/40 bg-white/90 shadow-lg ${colors.arrow}`}><IconArrowRight size={17} /></span>
            <span className="text-right">{cityLabel(to, lang)}</span>
          </div>
        </div>}
      </div>
    </section>
  );
}

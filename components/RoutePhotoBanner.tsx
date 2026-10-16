import Image from "next/image";
import { IconArrowRight, IconBus } from "@tabler/icons-react";
import { cityImage, cityLabel, type Lang } from "../lib/cities";

type Props = {
  from: string;
  to: string;
  lang: Lang;
  compact?: boolean;
};

export default function RoutePhotoBanner({ from, to, lang, compact = false }: Props) {
  return (
    <div className={`relative overflow-hidden bg-slate-900 ${compact ? "h-28 md:h-24" : "h-36"}`}>
      <div className="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
        <Image src={cityImage(from)} alt={cityLabel(from, lang)} fill sizes="(max-width: 768px) 50vw, 220px" className="object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-950/25 to-transparent" />
        <p className={`absolute bottom-3 left-3 font-black text-white drop-shadow ${compact ? "text-sm" : "text-lg"}`}>{cityLabel(from, lang)}</p>
      </div>
      <div className="absolute inset-y-0 right-0 w-1/2 overflow-hidden">
        <Image src={cityImage(to)} alt={cityLabel(to, lang)} fill sizes="(max-width: 768px) 50vw, 220px" className="object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-l from-slate-950/75 via-slate-950/25 to-transparent" />
        <p className={`absolute bottom-3 right-3 text-right font-black text-white drop-shadow ${compact ? "text-sm" : "text-lg"}`}>{cityLabel(to, lang)}</p>
      </div>
      <div className="absolute inset-0 grid place-items-center">
        <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/70 bg-white/95 px-2.5 py-2 text-violet-700 shadow-lg backdrop-blur">
          <IconBus size={compact ? 14 : 16} />
          <IconArrowRight size={compact ? 13 : 15} stroke={2.8} />
        </span>
      </div>
    </div>
  );
}

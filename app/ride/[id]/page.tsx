"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import BookModal from "../../../components/BookModal";
import GeorgianPlate from "../../../components/GeorgianPlate";
import {
  IconArrowLeft, IconBus, IconPhone, IconBrandWhatsapp, IconArmchair,
  IconClock, IconCurrencyLari, IconSkiJumping, IconLuggage, IconPaw,
  IconLoader2, IconCheck, IconUsers, IconCar,
} from "@tabler/icons-react";

type Lang = "en" | "ka";

const ACCESSORIES = [
  { id: "skis",    icon: IconSkiJumping, en: "Skis / Snowboard", ka: "სათხილამურო" },
  { id: "luggage", icon: IconLuggage,    en: "Large Luggage",     ka: "დიდი ბარგი"  },
  { id: "pets",    icon: IconPaw,        en: "Pets",              ka: "შინაური ცხოველი" },
] as const;

const CITIES = [
  { en: "Tbilisi",        ka: "თბილისი",       img: "/cities/tbilisi.jpg" },
  { en: "Kutaisi",        ka: "ქუთაისი",       img: "/cities/kutaisi.jpg" },
  { en: "Batumi",         ka: "ბათუმი",        img: "/cities/batumi.jpg" },
  { en: "Rustavi",        ka: "რუსთავი",       img: "/cities/rustavi.jpg" },
  { en: "Gori",           ka: "გორი",          img: "/cities/gori.jpg" },
  { en: "Zugdidi",        ka: "ზუგდიდი",       img: "/cities/zugdidi.jpg" },
  { en: "Poti",           ka: "ფოთი",          img: "/cities/poti.jpg" },
  { en: "Samtredia",      ka: "სამტრედია",     img: "/cities/samtredia.jpg" },
  { en: "Senaki",         ka: "სენაკი",        img: "/cities/senaki.jpg" },
  { en: "Kobuleti",       ka: "ქობულეთი",      img: "/cities/kobuleti.jpg" },
  { en: "Ozurgeti",       ka: "ოზურგეთი",      img: "/cities/ozurgeti.jpg" },
  { en: "Telavi",         ka: "თელავი",        img: "/cities/telavi.jpg" },
  { en: "Mtskheta",       ka: "მცხეთა",        img: "/cities/mtskheta.jpg" },
  { en: "Borjomi",        ka: "ბორჯომი",       img: "/cities/borjomi.jpg" },
  { en: "Akhaltsikhe",    ka: "ახალციხე",      img: "/cities/akhaltsikhe.jpg" },
  { en: "Akhalkalaki",    ka: "ახალქალაქი",    img: "/cities/akhalkalaki.jpg" },
  { en: "Marneuli",       ka: "მარნეული",      img: "/cities/marneuli.jpg" },
  { en: "Bolnisi",        ka: "ბოლნისი",       img: "/cities/bolnisi.jpg" },
  { en: "Gardabani",      ka: "გარდაბანი",     img: "/cities/gardabani.jpg" },
  { en: "Sagarejo",       ka: "საგარეჯო",      img: "/cities/sagarejo.jpg" },
  { en: "Sighnaghi",      ka: "სიღნაღი",       img: "/cities/sighnaghi.jpg" },
  { en: "Lagodekhi",      ka: "ლაგოდეხი",      img: "/cities/lagodekhi.jpg" },
  { en: "Dedoplistskaro", ka: "დედოფლისწყარო", img: "/cities/dedoplistskaro.jpg" },
  { en: "Kaspi",          ka: "კასპი",         img: "/cities/kaspi.jpg" },
  { en: "Kareli",         ka: "კარელი",        img: "/cities/kareli.jpg" },
  { en: "Khashuri",       ka: "ხაშური",        img: "/cities/khashuri.jpg" },
  { en: "Surami",         ka: "სურამი",        img: "/cities/surami.jpg" },
  { en: "Zestafoni",      ka: "ზესტაფონი",     img: "/cities/zestafoni.jpg" },
  { en: "Tkibuli",        ka: "ტყიბული",       img: "/cities/tkibuli.jpg" },
  { en: "Chiatura",       ka: "ჭიათურა",       img: "/cities/chiatura.jpg" },
  { en: "Tskaltubo",      ka: "წყალტუბო",      img: "/cities/tskaltubo.jpg" },
  { en: "Lanchkhuti",     ka: "ლანჩხუთი",      img: "/cities/lanchkhuti.jpg" },
  { en: "Khobi",          ka: "ხობი",          img: "/cities/khobi.jpg" },
  { en: "Abasha",         ka: "აბაშა",         img: "/cities/abasha.jpg" },
  { en: "Tsalenjikha",    ka: "წალენჯიხა",     img: "/cities/tsalenjikha.jpg" },
  { en: "Martvili",       ka: "მარტვილი",      img: "/cities/martvili.jpg" },
  { en: "Khoni",          ka: "ხონი",          img: "/cities/khoni.jpg" },
  { en: "Vani",           ka: "ვანი",          img: "/cities/vani.jpg" },
  { en: "Baghdati",       ka: "ბაღდათი",       img: "/cities/baghdati.jpg" },
  { en: "Terjola",        ka: "თერჯოლა",       img: "/cities/terjola.jpg" },
  { en: "Ambrolauri",     ka: "ამბროლაური",    img: "/cities/ambrolauri.jpg" },
  { en: "Oni",            ka: "ონი",           img: "/cities/oni.jpg" },
  { en: "Tsageri",        ka: "ცაგერი",        img: "/cities/tsageri.jpg" },
  { en: "Dusheti",        ka: "დუშეთი",        img: "/cities/dusheti.jpg" },
  { en: "Tianeti",        ka: "თიანეთი",       img: "/cities/tianeti.jpg" },
  { en: "Ninotsminda",    ka: "ნინოწმინდა",    img: "/cities/ninotsminda.jpg" },
  { en: "Adigeni",        ka: "ადიგენი",       img: "/cities/adigeni.jpg" },
  { en: "Aspindza",       ka: "ასპინძა",       img: "/cities/aspindza.jpg" },
  { en: "Khulo",          ka: "ხულო",          img: "/cities/khulo.jpg" },
  { en: "Shuakhevi",      ka: "შუახევი",       img: "/cities/shuakhevi.jpg" },
  { en: "Bakuriani",      ka: "ბაკურიანი",     img: "/cities/bakuriani.jpg" },
  { en: "Gudauri",        ka: "გუდაური",       img: "/cities/gudauri.jpg" },
  { en: "Mestia",         ka: "მესტია",        img: "/cities/mestia.jpg" },
  { en: "Stepantsminda",  ka: "სტეფანწმინდა",  img: "/cities/stepantsminda.jpg" },
  { en: "Svaneti",        ka: "სვანეთი",       img: "/cities/svaneti.jpg" },
  { en: "Ushguli",        ka: "უშგული",        img: "/cities/ushguli.jpg" },
  { en: "Kvareli",        ka: "ყვარელი",       img: "/cities/kvareli.jpg" },
  { en: "Tusheti",        ka: "თუშეთი",        img: "/cities/tusheti.jpg" },
] as const;

const VEHICLE_COLORS: Record<string, { hex: string; ka: string; border: string }> = {
  White:  { hex: "#FFFFFF", ka: "თეთრი",      border: "#d1d5db" },
  Black:  { hex: "#1a1a1a", ka: "შავი",       border: "#374151" },
  Silver: { hex: "#C0C0C0", ka: "ვერცხლი",    border: "#9ca3af" },
  Gray:   { hex: "#6B7280", ka: "რუხი",       border: "#6B7280" },
  Red:    { hex: "#DC2626", ka: "წითელი",     border: "#DC2626" },
  Blue:   { hex: "#2563EB", ka: "ლურჯი",      border: "#2563EB" },
  Green:  { hex: "#16A34A", ka: "მწვანე",     border: "#16A34A" },
  Yellow: { hex: "#EAB308", ka: "ყვითელი",    border: "#CA8A04" },
  Orange: { hex: "#EA580C", ka: "ნარინჯი",    border: "#EA580C" },
  Brown:  { hex: "#92400E", ka: "ყავისფერი",  border: "#92400E" },
  Beige:  { hex: "#D4C5A9", ka: "კრემისფერი", border: "#9ca3af" },
  Gold:   { hex: "#B8860B", ka: "ოქროსფერი",  border: "#B8860B" },
};

const T = {
  en: {
    back: "Back", book: "Book a seat", call: "Call", whatsapp: "WhatsApp",
    seatsLeft: "seats left", full: "No seats available",
    passengers: "Passengers", noPassengers: "No bookings yet.",
    price: "Price / seat", vehicle: "Vehicle", departure: "Departure",
    phone: "Phone", plate: "Licence plate", color: "Color",
    today: "Today", tomorrow: "Tomorrow", soon: "Departing soon",
    upcoming: "Upcoming", departed: "Departed", booked: "% booked",
    accepts: "Accepts",
  },
  ka: {
    back: "უკან", book: "ადგილის დაჯავშნა", call: "ზარი", whatsapp: "WhatsApp",
    seatsLeft: "ადგილი", full: "ადგილი აღარ არის",
    passengers: "მგზავრები", noPassengers: "ჯერ დაჯავშნა არ არის.",
    price: "ფასი / ადგილი", vehicle: "მანქანა", departure: "გასვლა",
    phone: "ტელეფონი", plate: "სახ. ნომერი", color: "ფერი",
    today: "დღეს", tomorrow: "ხვალ", soon: "მალე მიდის",
    upcoming: "მომავალში", departed: "გავიდა", booked: "% დაჯავშნული",
    accepts: "მიიღება",
  },
};

function getCityData(city: string) {
  return CITIES.find(c => c.en === city) ?? CITIES[0];
}
function getCityLabel(city: string, lang: Lang) {
  const f = CITIES.find(c => c.en === city);
  return f ? (lang === "ka" ? f.ka : f.en) : city;
}
function getBadge(ts: string, t: (typeof T)[Lang]) {
  const h = (new Date(ts).getTime() - Date.now()) / 36e5;
  if (isNaN(h) || h < -1) return { label: t.departed, cls: "bg-gray-100 text-gray-700" };
  if (h <= 1)  return { label: t.soon,     cls: "bg-rose-100 text-rose-700" };
  if (h < 24)  return { label: t.today,    cls: "bg-violet-100 text-violet-700" };
  if (h < 48)  return { label: t.tomorrow, cls: "bg-indigo-100 text-indigo-700" };
  return         { label: t.upcoming,  cls: "bg-slate-100 text-slate-700" };
}
function waLink(phone: string) {
  const d = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${d.startsWith("995") ? d : `995${d}`}`;
}

export default function RidePage() {
  const { id }  = useParams();
  const router  = useRouter();
  const [ride,     setRide]     = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [lang,     setLang]     = useState<Lang>("ka");
  const [showBook, setShowBook] = useState(false);
  const t = T[lang];

  async function load() {
    const { data: r } = await supabase.from("rides").select("*").eq("id", id).single();
    setRide(r);
    const { data: b } = await supabase.from("bookings").select("*").eq("ride_id", id).order("created_at", { ascending: false });
    setBookings(b ?? []);
  }

  useEffect(() => { load(); }, []);

  if (!ride) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex items-center gap-2 text-gray-500 text-sm font-black">
        <IconLoader2 size={18} className="animate-spin text-violet-500" /> Loading…
      </div>
    </div>
  );

  const badge     = getBadge(ride.departure_time, t);
  const booked    = ride.seats_total - ride.seats_available;
  const pct       = Math.round((booked / ride.seats_total) * 100);
  const fromData  = getCityData(ride.from_city);
  const toData    = getCityData(ride.to_city);
  const colorInfo = ride.vehicle_color ? VEHICLE_COLORS[ride.vehicle_color] : null;
  const rideAccessories: string[] = ride.accessories ?? [];

  return (
    <div className="min-h-screen font-sans bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 space-y-4">

        {/* ── Back button ── */}
        <button onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 rounded-2xl border-2 border-gray-200 bg-white px-4 py-2 text-sm font-black text-gray-700 shadow-sm hover:bg-gray-50 hover:text-violet-600 hover:border-violet-200 transition">
          <IconArrowLeft size={16} stroke={2.5} /> {t.back}
        </button>

        {/* ── HERO ── */}
        <div className="relative h-52 sm:h-64 overflow-hidden rounded-3xl shadow-lg">
          <div className="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
            <img src={fromData.img} alt={ride.from_city} className="h-full w-full object-cover"/>
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-black/10"/>
            <div className="absolute bottom-4 left-5">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/60 mb-0.5">From</p>
              <p className="text-2xl font-black text-white drop-shadow">{getCityLabel(ride.from_city, lang)}</p>
            </div>
          </div>
          <div className="absolute inset-y-0 right-0 w-1/2 overflow-hidden">
            <img src={toData.img} alt={ride.to_city} className="h-full w-full object-cover"/>
            <div className="absolute inset-0 bg-gradient-to-l from-black/50 to-black/10"/>
            <div className="absolute bottom-4 right-5 text-right">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/60 mb-0.5">To</p>
              <p className="text-2xl font-black text-white drop-shadow">{getCityLabel(ride.to_city, lang)}</p>
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 shadow-xl border border-white/80">
              <IconBus size={20} stroke={2} className="text-gray-700" />
              <svg width="24" height="12" viewBox="0 0 28 14" fill="none" className="text-violet-600">
                <path d="M0 7H24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M18 1L25.5 7L18 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <div className="absolute top-4 left-4">
            <span className={`rounded-full px-3 py-1 text-[11px] font-black backdrop-blur-sm ${badge.cls}`}>{badge.label}</span>
          </div>
          <div className="absolute top-4 right-4">
            <div className="rounded-2xl bg-white/95 backdrop-blur-sm px-4 py-2 text-center shadow-lg">
              <p className="text-2xl font-black text-violet-700">{ride.price_per_seat}₾</p>
              <p className="text-[10px] font-extrabold text-gray-500 leading-none">{t.price}</p>
            </div>
          </div>
        </div>

        {/* ── Info grid ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: <IconClock size={20} stroke={1.5} className="text-violet-500" />,        label: t.departure, val: new Date(ride.departure_time).toLocaleString() },
            { icon: <IconPhone size={20} stroke={1.5} className="text-violet-500" />,         label: t.phone,     val: ride.phone },
            { icon: <IconArmchair size={20} stroke={1.5} className="text-violet-500" />,      label: t.seatsLeft, val: `${ride.seats_available} / ${ride.seats_total}` },
            { icon: <IconCurrencyLari size={20} stroke={1.5} className="text-violet-500" />,  label: t.price,     val: `${ride.price_per_seat}₾` },
          ].map(({ icon, label, val }) => (
            <div key={label} className="rounded-2xl bg-white border border-gray-200 p-4 shadow-sm">
              <div className="mb-1">{icon}</div>
              <div className="text-[10px] font-black uppercase tracking-wide text-gray-400 mb-0.5">{label}</div>
              <div className="font-black text-gray-900 text-sm break-all">{val}</div>
            </div>
          ))}
        </div>

        {/* ── Vehicle card ── */}
        <div className="rounded-3xl bg-white border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
            <IconBus size={18} stroke={2} className="text-violet-500" />
            <span className="font-black text-gray-900">{t.vehicle}</span>
          </div>
          <div className="p-5 flex flex-wrap items-start gap-6">
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100"
                style={colorInfo ? { background: `${colorInfo.hex}22`, border: `2px solid ${colorInfo.border}` } : undefined}>
                <IconBus size={40} stroke={1.5} className="text-gray-500" />
              </div>
              {colorInfo && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div className="h-4 w-4 rounded-full shrink-0" style={{ background: colorInfo.hex, border: `1.5px solid ${colorInfo.border}` }} />
                    <span className="text-sm font-black text-gray-900">{ride.vehicle_color}</span>
                  </div>
                  <span className="text-xs font-extrabold text-gray-500">{colorInfo.ka}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-4 justify-center flex-1">
              {ride.vehicle_type && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wide text-gray-400 mb-1">{lang === "ka" ? "მოდელი" : "Model"}</p>
                  <p className="text-xl font-black text-gray-900">{ride.vehicle_type}</p>
                </div>
              )}
              {ride.plate_number && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wide text-gray-400 mb-2">{t.plate}</p>
                  <GeorgianPlate plate={ride.plate_number} size="lg" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Accessories ── */}
        {rideAccessories.length > 0 && (
          <div className="rounded-3xl bg-white border border-gray-200 shadow-sm p-5">
            <p className="font-black text-gray-900 mb-3 flex items-center gap-2">
              <IconLuggage size={18} stroke={2} className="text-violet-500" /> {t.accepts}
            </p>
            <div className="flex flex-wrap gap-2">
              {rideAccessories.map(id => {
                const a = ACCESSORIES.find(x => x.id === id);
                if (!a) return null;
                const Icon = a.icon;
                return (
                  <span key={id}
                    className="inline-flex items-center gap-2 rounded-2xl border-2 border-violet-100 bg-violet-50 px-4 py-2 text-sm font-black text-violet-700">
                    <Icon size={16} stroke={2} /> {lang === "ka" ? a.ka : a.en}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Seat occupancy ── */}
        <div className="rounded-3xl bg-white border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="font-black text-gray-900 flex items-center gap-1.5">
              <IconArmchair size={18} stroke={2} className="text-violet-500" />
              {ride.seats_available} {t.seatsLeft}
            </span>
            <span className="text-sm font-black text-violet-600">{pct}{t.booked}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {Array.from({ length: Math.min(ride.seats_total, 20) }).map((_, i) => (
              <div key={i} className={`h-5 w-5 rounded-lg transition-colors ${i < ride.seats_available ? "bg-violet-500 shadow-sm shadow-violet-200" : "bg-gray-200"}`} />
            ))}
            {ride.seats_total > 20 && <span className="text-xs font-extrabold text-gray-500 self-center ml-1">+{ride.seats_total - 20}</span>}
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${pct}%` }}/>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="grid grid-cols-2 gap-3">
          <a href={`tel:${ride.phone}`}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 py-3.5 text-sm font-black text-violet-700 hover:bg-violet-100 transition">
            <IconPhone size={16} stroke={2.5} /> {t.call}
          </a>
          <a href={waLink(ride.phone)} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-sm font-black text-white hover:bg-emerald-600 transition">
            <IconBrandWhatsapp size={16} stroke={2.5} /> {t.whatsapp}
          </a>
        </div>

        {ride.seats_available > 0 ? (
          <button onClick={() => setShowBook(true)}
            className="w-full h-14 inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 text-base font-black text-white hover:bg-violet-700 transition shadow-lg shadow-violet-200">
            <IconCheck size={18} stroke={2.5} /> {t.book}
          </button>
        ) : (
          <div className="w-full h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-sm font-black text-gray-500">
            {t.full}
          </div>
        )}

        {/* ── Passengers ── */}
        <div className="rounded-3xl bg-white border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <span className="font-black text-gray-900 flex items-center gap-2">
              <IconUsers size={18} stroke={2} className="text-violet-500" /> {t.passengers}
            </span>
            {bookings.length > 0 && (
              <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-black text-violet-700">{bookings.length}</span>
            )}
          </div>
          {bookings.length === 0 ? (
            <p className="text-sm font-extrabold text-gray-500 text-center py-8">{t.noPassengers}</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {bookings.map(b => (
                <div key={b.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-sm font-black text-violet-700">
                      {b.passenger_name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <p className="font-black text-gray-900 text-sm">{b.passenger_name}</p>
                      <p className="text-xs font-extrabold text-gray-500">{b.phone} · {b.seats_booked} {t.seatsLeft}</p>
                    </div>
                  </div>
                  <a href={`tel:${b.phone}`}
                    className="inline-flex items-center justify-center rounded-xl border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-black text-violet-700 hover:bg-violet-100 transition">
                    <IconPhone size={14} stroke={2.5} />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {showBook && <BookModal ride={ride} lang={lang} onClose={() => { setShowBook(false); load(); }} />}
    </div>
  );
}
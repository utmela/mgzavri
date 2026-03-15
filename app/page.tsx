"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import BookModal from "../components/BookModal";
import GeorgianPlate from "../components/GeorgianPlate";
import CustomSelect from "../components/CustomSelect";
import { useIsAdmin } from "../lib/uselsAdmin";
import { useLanguage } from "../components/LanguageProvider";
import {
  IconSkiJumping, IconLuggage, IconPaw, IconArmchair,
  IconBus, IconMapPin, IconClock, IconPhone, IconBrandWhatsapp,
  IconSearch, IconX, IconPlus, IconTrash, IconShield,
  IconSpeakerphone, IconChevronRight, IconLoader2,
  IconUser, IconCheck, IconUsers, IconArrowRight,
  IconCalendar, IconCurrencyLari, IconMail,
} from "@tabler/icons-react";

const ACCESSORIES = [
  { id: "skis",    icon: IconSkiJumping, en: "Skis",    ka: "სათხილამურო" },
  { id: "luggage", icon: IconLuggage,    en: "Luggage",  ka: "დიდი ბარგი"  },
  { id: "pets",    icon: IconPaw,        en: "Pets",     ka: "შინაური ცხოველი" },
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
    tagline: "Your ride across Georgia",
    sub: "Find a minivan seat, book instantly, travel comfortably.",
    networkLabel: "Georgia's minivan network",
    from: "From", to: "To", allCities: "Anywhere", search: "Search rides", clear: "Clear",
    seatsLeft: "seats left", perSeat: "/ seat", full: "Full", book: "Book seat",
    whatsapp: "WhatsApp",
    noRides: "No rides found", noRidesSub: "Try different cities or post your own ride.",
    noRequests: "No passenger requests", noRequestsSub: "Passengers haven't posted travel requests yet.",
    postRide: "Post a ride", postRequest: "Post a request",
    loading: "Loading…", today: "Today", tomorrow: "Tomorrow",
    soon: "Soon", upcoming: "Upcoming", departed: "Departed",
    ad: "Advertisement", advertise: "Advertise with us",
    sort: "Sort", sortTime: "By time", sortPrice: "Price ↑", sortPriceDesc: "Price ↓",
    deleteConfirm: "Delete this ride?", deleteFail: "Failed to delete ride.",
    vehicle: "Vehicle", plate: "Plate", phone: "Phone", departure: "Departure",
    whereTo: "Search available rides", whoNeeds: "Find passengers needing a ride",
    iAm: "I am a",
    rolePassenger: "Passenger", roleDriver: "Driver",
    passengerCount: "Passengers", contactDriver: "Call",
    budget: "Budget", flexible: "Flexible",
    accepts: "Accepts", allItems: "All accessories",
    freeNoaccount: "Free · No account required to browse",
  },
  ka: {
    tagline: "შენი მგზავრობა საქართველოში",
    sub: "იპოვე მინივენში ადგილი, დაჯავშნე სწრაფად, იმგზავრე კომფორტულად.",
    networkLabel: "საქართველოს მინივენ ქსელი",
    from: "საიდან", to: "სადამდე", allCities: "ნებისმიერი", search: "მოგზაურობის ძებნა", clear: "გასუფთავება",
    seatsLeft: "ადგილი", perSeat: "/ ადგილი", full: "სავსეა", book: "დაჯავშნა",
    whatsapp: "WhatsApp",
    noRides: "მოგზაურობა ვერ მოიძებნა", noRidesSub: "სცადეთ სხვა ქალაქები ან დაამატეთ თქვენი.",
    noRequests: "მოთხოვნები არ არის", noRequestsSub: "მგზავრებს ჯერ არ დაუმატებიათ მოთხოვნები.",
    postRide: "მოგზაურობის დამატება", postRequest: "მოთხოვნის დამატება",
    loading: "იტვირთება…", today: "დღეს", tomorrow: "ხვალ",
    soon: "მალე", upcoming: "მომავალში", departed: "გავიდა",
    ad: "რეკლამა", advertise: "განათავსეთ რეკლამა",
    sort: "სორტირება", sortTime: "დროით", sortPrice: "ფასი ↑", sortPriceDesc: "ფასი ↓",
    deleteConfirm: "წაშალოთ ეს მოგზაურობა?", deleteFail: "წაშლა ვერ მოხერხდა.",
    vehicle: "მანქანა", plate: "ნომერი", phone: "ტელეფონი", departure: "გამგზავრება",
    whereTo: "ხელმისაწვდომი მოგზაურობები", whoNeeds: "მოძებნე მგზავრები",
    iAm: "მე ვარ",
    rolePassenger: "მგზავრი", roleDriver: "მძღოლი",
    passengerCount: "მგზავრი", contactDriver: "ზარი",
    budget: "ბიუჯეტი", flexible: "მოქნილი",
    accepts: "მიიღება", allItems: "ყველა",
    freeNoaccount: "უფასო · რეგისტრაცია სავალდებულო არ არის",
  },
} as const;

type Lang = keyof typeof T;
type Role = "passenger" | "driver";
type Ride = {
  user_id: any; id: string; from_city: string; to_city: string;
  price_per_seat: number; seats_total: number; seats_available: number;
  phone: string; vehicle_type: string; departure_time: string;
  plate_number?: string; vehicle_color?: string; accessories?: string[];
};
type Request = {
  id: string; user_id: any; from_city: string; to_city: string;
  departure_date: string; passengers: number; budget?: number;
  phone: string; note?: string; created_at: string;
};

function getCityImg(city: string) {
  return CITIES.find(c => c.en === city)?.img ??
    "https://images.unsplash.com/photo-1565008576549-57569a49371d?w=400&q=80";
}
function getCityLabel(city: string, lang: Lang) {
  const f = CITIES.find(c => c.en === city);
  return f ? (lang === "ka" ? f.ka : f.en) : city;
}
function getBadge(ts: string, t: (typeof T)[Lang]) {
  const h = (new Date(ts).getTime() - Date.now()) / 36e5;
  if (isNaN(h) || h < -1) return { label: t.departed, cls: "bg-gray-100 text-gray-500 border border-gray-200" };
  if (h <= 1)  return { label: t.soon,     cls: "bg-rose-50 text-rose-600 border border-rose-200" };
  if (h < 24)  return { label: t.today,    cls: "bg-violet-50 text-violet-600 border border-violet-200" };
  if (h < 48)  return { label: t.tomorrow, cls: "bg-indigo-50 text-indigo-600 border border-indigo-200" };
  return         { label: t.upcoming,  cls: "bg-slate-50 text-slate-600 border border-slate-200" };
}
function waLink(phone: string) {
  const d = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${d.startsWith("995") ? d : `995${d}`}`;
}

/* ─── Accessories Badges ── */
function AccessoriesBadges({ accessories, lang }: { accessories?: string[] | null; lang: Lang }) {
  if (!accessories?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {accessories.map(id => {
        const a = ACCESSORIES.find(x => x.id === id);
        if (!a) return null;
        const Icon = a.icon;
        return (
          <span key={id} className="inline-flex items-center gap-1 rounded-lg border border-violet-100 bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-600">
            <Icon size={11} stroke={2.5} /> {lang === "ka" ? a.ka : a.en}
          </span>
        );
      })}
    </div>
  );
}

/* ─── Role Toggle ── */
function RoleToggle({ role, setRole, t }: { role: Role; setRole: (r: Role) => void; t: (typeof T)[Lang] }) {
  return (
    <div className="inline-flex rounded-full border border-white/20 bg-white/10 backdrop-blur-sm p-1">
      <button onClick={() => setRole("passenger")}
        className={`relative flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-200 ${
          role === "passenger"
            ? "bg-violet-600 text-white shadow-lg shadow-violet-900/40"
            : "text-white/60 hover:text-white/90"
        }`}>
        <IconArmchair size={15} stroke={2.5} />
        {t.rolePassenger}
      </button>
      <button onClick={() => setRole("driver")}
        className={`relative flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-200 ${
          role === "driver"
            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/40"
            : "text-white/60 hover:text-white/90"
        }`}>
        <IconBus size={15} stroke={2.5} />
        {t.roleDriver}
      </button>
    </div>
  );
}

/* ─── Vehicle Strip ── */
function VehicleStrip({ ride, lang, t }: { ride: Ride; lang: Lang; t: (typeof T)[Lang] }) {
  const colorInfo = ride.vehicle_color ? VEHICLE_COLORS[ride.vehicle_color] : null;
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 overflow-hidden">
      <div className="flex items-stretch divide-x divide-gray-100">
        <div className="flex items-center gap-3 px-4 py-3 flex-1 min-w-0">
          {colorInfo ? (
            <div className="h-8 w-8 rounded-lg shrink-0 shadow-sm"
              style={{ background: colorInfo.hex, border: `2px solid ${colorInfo.border}` }} />
          ) : (
            <div className="h-8 w-8 rounded-lg border border-dashed border-gray-200 bg-white shrink-0 flex items-center justify-center">
              <IconBus size={16} stroke={1.5} className="text-gray-400" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 leading-none mb-0.5">{t.vehicle}</p>
            <p className="text-sm font-black text-gray-900 truncate">{ride.vehicle_type || "—"}</p>
          </div>
        </div>
        <div className="flex flex-col justify-center px-4 py-3 shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 leading-none mb-1.5">{t.plate}</p>
          {ride.plate_number ? <GeorgianPlate plate={ride.plate_number} size="sm" /> : <span className="text-xs font-bold text-gray-300">—</span>}
        </div>
        <div className="flex flex-col justify-center px-4 py-3 shrink-0 gap-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 leading-none">{t.phone}</p>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-gray-900 whitespace-nowrap">{ride.phone}</span>
            <a href={`tel:${ride.phone}`} onClick={e => e.stopPropagation()}
              className="flex items-center justify-center h-6 w-6 rounded-lg bg-violet-100 hover:bg-violet-200 text-violet-600 transition shrink-0">
              <IconPhone size={12} stroke={2.5} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Request Card ── */
function RequestCard({ req, lang, t, user, isAdmin, onDelete }: {
  req: Request; lang: Lang; t: (typeof T)[Lang];
  user: any; isAdmin: boolean; onDelete: (id: string) => void;
}) {
  const fromImg = getCityImg(req.from_city);
  const toImg   = getCityImg(req.to_city);
  const dateStr = new Date(req.departure_date).toLocaleDateString(
    lang === "ka" ? "ka-GE" : "en-GB",
    { weekday: "short", day: "numeric", month: "short" }
  );
  const canDel = user && (isAdmin || req.user_id === user.id);
  const reqAccessories: string[] = (req as any).accessories ?? [];

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-200">
      {/* Banner */}
      <div className="relative h-32 sm:h-40 overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
          <img src={fromImg} alt={req.from_city} className="h-full w-full object-cover"/>
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent"/>
          <div className="absolute bottom-4 left-4">
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/60 mb-0.5">From</p>
            <p className="text-xl font-black text-white drop-shadow leading-tight">{getCityLabel(req.from_city, lang)}</p>
          </div>
        </div>
        <div className="absolute inset-y-0 right-0 w-1/2 overflow-hidden">
          <img src={toImg} alt={req.to_city} className="h-full w-full object-cover"/>
          <div className="absolute inset-0 bg-gradient-to-l from-black/60 via-black/30 to-transparent"/>
          <div className="absolute bottom-4 right-4 text-right">
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/60 mb-0.5">To</p>
            <p className="text-xl font-black text-white drop-shadow leading-tight">{getCityLabel(req.to_city, lang)}</p>
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2 shadow-lg border border-white/80">
            <IconUser size={16} stroke={2} className="text-emerald-600" />
            <IconArrowRight size={14} stroke={2.5} className="text-emerald-500" />
          </div>
        </div>
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white">
            <IconUser size={10} stroke={2.5} /> {lang === "ka" ? "მოთხოვნა" : "Request"}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-black text-gray-800 flex items-center gap-1.5">
            <IconCalendar size={14} stroke={2} className="text-emerald-500" />
            {dateStr}
          </p>
          <div className="flex flex-col items-end">
            <p className="text-2xl font-black text-emerald-600 leading-none">
              {req.budget ? `${req.budget}₾` : <span className="text-base text-gray-400 italic">{t.flexible}</span>}
            </p>
            {req.budget && <p className="text-[10px] font-bold text-gray-400">{t.budget}</p>}
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <IconUsers size={16} stroke={2} className="text-emerald-500 shrink-0" />
            <span className="text-sm font-black text-gray-900">{req.passengers} {t.passengerCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-gray-900">{req.phone}</span>
            <a href={`tel:${req.phone}`}
              className="flex items-center justify-center h-6 w-6 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-600 transition">
              <IconPhone size={12} stroke={2.5} />
            </a>
          </div>
        </div>

        {req.note && (
          <p className="text-xs font-bold text-gray-500 italic bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
            "{req.note}"
          </p>
        )}

        {reqAccessories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {reqAccessories.map(id => {
              const a = ACCESSORIES.find(x => x.id === id);
              if (!a) return null;
              const Icon = a.icon;
              return (
                <span key={id} className="inline-flex items-center gap-1 rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600">
                  <Icon size={11} stroke={2.5} /> {lang === "ka" ? a.ka : a.en}
                </span>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <a href={waLink(req.phone)} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-black text-white hover:bg-emerald-600 transition">
            <IconBrandWhatsapp size={13} stroke={2.5} /> WhatsApp
          </a>
          <a href={`tel:${req.phone}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-50 transition">
            <IconPhone size={13} stroke={2.5} /> {t.contactDriver}
          </a>
          {canDel && (
            <button onClick={() => onDelete(req.id)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-black text-red-600 hover:bg-red-100 transition">
              <IconTrash size={13} stroke={2.5} /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main ── */
export default function Home() {
  const router = useRouter();
  const { isAdmin } = useIsAdmin();
  const { lang } = useLanguage() as { lang: Lang };
  const [role, setRole]                 = useState<Role>("passenger");
  const [user, setUser]                 = useState<any>(null);
  const [rides, setRides]               = useState<Ride[]>([]);
  const [requests, setRequests]         = useState<Request[]>([]);
  const [loading, setLoading]           = useState(true);
  const [fromCity, setFromCity]         = useState("");
  const [toCity, setToCity]             = useState("");
  const [sortMode, setSortMode]         = useState("time");
  const [filterAccessory, setFilterAccessory] = useState("");
  const [bookRide, setBookRide]         = useState<Ride | null>(null);
  const [deletingId, setDeletingId]     = useState<string | null>(null);
  const t = T[lang];

  async function loadRides(from = fromCity, to = toCity, sort = sortMode, acc = filterAccessory) {
    setLoading(true);
    const cutoff = new Date(Date.now() - 36e5).toISOString();
    let q = supabase.from("rides").select("*").gte("departure_time", cutoff);
    if (from) q = q.ilike("from_city", `%${from}%`);
    if (to)   q = q.ilike("to_city",   `%${to}%`);
    if (acc)  q = (q as any).contains("accessories", [acc]);
    if (sort === "price")       q = q.order("price_per_seat", { ascending: true });
    else if (sort === "priceD") q = q.order("price_per_seat", { ascending: false });
    else                        q = q.order("departure_time", { ascending: true });
    const { data, error } = await q;
    if (error) console.error(error);
    setRides(data ?? []);
    setLoading(false);
  }

  async function loadRequests(from = fromCity, to = toCity) {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];
    let q = supabase.from("requests").select("*").gte("departure_date", today);
    if (from) q = q.ilike("from_city", `%${from}%`);
    if (to)   q = q.ilike("to_city",   `%${to}%`);
    q = q.order("departure_date", { ascending: true });
    const { data, error } = await q;
    if (error) console.error(error);
    setRequests(data ?? []);
    setLoading(false);
  }

  function load(from = fromCity, to = toCity, sort = sortMode, acc = filterAccessory) {
    if (role === "driver") loadRequests(from, to);
    else loadRides(from, to, sort, acc);
  }

  function reset() {
    setFromCity(""); setToCity(""); setFilterAccessory("");
    load("", "", sortMode, "");
  }

  async function handleDeleteRide(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(t.deleteConfirm)) return;
    setDeletingId(id);
    const { error } = await supabase.from("rides").delete().eq("id", id);
    if (error) { alert(t.deleteFail); }
    else await loadRides();
    setDeletingId(null);
  }

  async function handleDeleteRequest(id: string) {
    if (!confirm(t.deleteConfirm)) return;
    await supabase.from("requests").delete().eq("id", id);
    await loadRequests();
  }

  function canDelete(r: Ride) { return user && (isAdmin || r.user_id === user.id); }

  useEffect(() => {
    load();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => { load(); }, [role]);

  const cityOptions      = CITIES.map(c => ({ value: c.en, label: lang === "ka" ? c.ka : c.en }));
  const accessoryOptions = ACCESSORIES.map(a => ({ value: a.id, label: lang === "ka" ? a.ka : a.en }));
  const isDriver = role === "driver";

  return (
    <div className="min-h-screen font-sans bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">

        {/* ── HERO ── */}
        <div className="mb-6 overflow-hidden rounded-2xl relative">
          <div className={`relative px-6 pt-12 pb-10 sm:px-12 sm:pt-16 text-center ${
            isDriver
              ? "bg-gradient-to-br from-[#0d3d2e] via-[#134d3a] to-[#0a2a1f]"
              : "bg-gradient-to-br from-[#1a1035] via-[#2d1f6e] to-[#1a1035]"
          }`}>
            {/* Subtle background orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className={`absolute -top-20 -left-20 w-96 h-96 rounded-full opacity-20 blur-3xl ${isDriver ? "bg-emerald-500" : "bg-violet-500"}`}/>
              <div className={`absolute -bottom-20 -right-20 w-96 h-96 rounded-full opacity-15 blur-3xl ${isDriver ? "bg-teal-400" : "bg-purple-400"}`}/>
            </div>

            {/* Network pill */}
            <div className="relative flex justify-center mb-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-1.5 text-xs font-bold text-white/80 uppercase tracking-widest">
                <IconBus size={12} stroke={2.5} />
                {t.networkLabel}
              </span>
            </div>

            <h1 className="relative text-4xl font-black tracking-tight text-white sm:text-5xl mb-3 leading-tight">
              {t.tagline}
            </h1>
            <p className="relative text-base font-medium text-white/60 mb-8 max-w-md mx-auto">{t.sub}</p>

            {/* Role toggle */}
            <div className="relative flex flex-col items-center gap-3 mb-8">
              <p className="text-xs font-bold uppercase tracking-widest text-white/40">{t.iAm}</p>
              <RoleToggle role={role} setRole={setRole} t={t} />
            </div>

            {/* CTA */}
            <div className="relative flex flex-col items-center gap-2">
              <button
                onClick={() => router.push(isDriver ? "/post" : "/post-request")}
                className={`inline-flex items-center gap-2 rounded-xl px-7 py-3 text-sm font-black text-white transition shadow-lg ${
                  isDriver
                    ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40"
                    : "bg-violet-600 hover:bg-violet-500 shadow-violet-900/40"
                }`}>
                {isDriver ? <IconBus size={16} stroke={2.5} /> : <IconUser size={16} stroke={2.5} />}
                {isDriver ? t.postRide : t.postRequest}
              </button>
              <p className="text-xs text-white/30 font-medium">{t.freeNoaccount}</p>
            </div>

            {/* Wave bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-8 overflow-hidden">
              <svg viewBox="0 0 1200 32" preserveAspectRatio="none" className="w-full h-full fill-gray-50">
                <path d="M0,32 C300,0 900,0 1200,32 L1200,32 L0,32 Z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* ── SEARCH BAR ── */}
        <div className="mb-5 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-visible">
          {/* Header strip */}
          <div className={`px-5 py-3 rounded-t-2xl border-b border-gray-100 flex items-center gap-2 ${
            isDriver ? "bg-emerald-50" : "bg-violet-50"
          }`}>
            <IconSearch size={14} stroke={2.5} className={isDriver ? "text-emerald-500" : "text-violet-500"} />
            <p className={`text-xs font-black uppercase tracking-widest ${isDriver ? "text-emerald-600" : "text-violet-600"}`}>
              {isDriver ? t.whoNeeds : t.whereTo}
            </p>
          </div>

          <div className="p-4 sm:p-5">
            <div className={`grid gap-3 ${
              isDriver
                ? "sm:grid-cols-[1fr_1fr_auto_auto]"
                : "sm:grid-cols-[1fr_1fr_1fr_1fr_auto_auto]"
            }`}>
              {[{ val: fromCity, set: setFromCity, label: t.from },
                { val: toCity,   set: setToCity,   label: t.to }].map(({ val, set, label }) => (
                <div key={label}>
                  <label className={`mb-1 block text-[10px] font-black uppercase tracking-widest ${isDriver ? "text-emerald-500" : "text-violet-500"}`}>{label}</label>
                  <CustomSelect value={val} onChange={set} placeholder={t.allCities} options={cityOptions} />
                </div>
              ))}
              {!isDriver && (
                <>
                  <div>
                    <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-violet-500">{t.sort}</label>
                    <CustomSelect value={sortMode}
                      onChange={v => { setSortMode(v); loadRides(fromCity, toCity, v, filterAccessory); }}
                      placeholder={t.sortTime} searchable={false}
                      options={[
                        { value: "time",   label: t.sortTime },
                        { value: "price",  label: t.sortPrice },
                        { value: "priceD", label: t.sortPriceDesc },
                      ]} />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-violet-500">{t.accepts}</label>
                    <CustomSelect value={filterAccessory}
                      onChange={v => { setFilterAccessory(v); loadRides(fromCity, toCity, sortMode, v); }}
                      placeholder={t.allItems} searchable={false} options={accessoryOptions} />
                  </div>
                </>
              )}
              <div className="flex items-end">
                <button onClick={() => load()} disabled={loading}
                  className={`h-11 w-full inline-flex items-center justify-center gap-2 rounded-xl text-sm font-black text-white disabled:opacity-50 transition ${
                    isDriver ? "bg-emerald-600 hover:bg-emerald-700" : "bg-violet-600 hover:bg-violet-700"
                  }`}>
                  {loading ? <IconLoader2 size={15} className="animate-spin" /> : <IconSearch size={15} stroke={2.5} />}
                  {loading ? "…" : t.search}
                </button>
              </div>
              <div className="flex items-end">
                <button onClick={reset}
                  className="h-11 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-sm font-black text-gray-600 hover:bg-gray-50 transition">
                  <IconX size={15} stroke={2.5} /> {t.clear}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── AD ── */}
        <a href="mailto:mgzavri@gmail.com?subject=Advertising"
          className="group mb-5 flex items-center justify-between gap-4 rounded-2xl border border-dashed border-violet-200 bg-violet-50/60 px-5 py-3.5 transition hover:bg-violet-100/60">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <IconSpeakerphone size={18} stroke={1.8} />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-violet-400">{t.ad}</div>
              <div className="text-sm font-black text-gray-800">{t.advertise}</div>
            </div>
          </div>
          <div className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-black text-white group-hover:bg-violet-700 transition">
            <IconMail size={12} stroke={2.5} /> mgzavri@gmail.com
          </div>
        </a>

        {/* ── LISTINGS ── */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white py-16 text-sm font-black text-gray-500">
              <IconLoader2 size={18} className="mr-2 animate-spin text-violet-400" />
              {t.loading}
            </div>

          ) : isDriver ? (
            requests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
                  <IconUser size={24} stroke={1.5} className="text-gray-400" />
                </div>
                <div className="text-base font-black text-gray-700">{t.noRequests}</div>
                <p className="mt-1 text-sm font-bold text-gray-400">{t.noRequestsSub}</p>
              </div>
            ) : requests.map(req => (
              <RequestCard key={req.id} req={req} lang={lang} t={t}
                user={user} isAdmin={isAdmin} onDelete={handleDeleteRequest} />
            ))

          ) : (
            rides.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
                  <IconBus size={24} stroke={1.5} className="text-gray-400" />
                </div>
                <div className="text-base font-black text-gray-700">{t.noRides}</div>
                <p className="mt-1 text-sm font-bold text-gray-400">{t.noRidesSub}</p>
                <Link href="/post"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-black text-white hover:bg-violet-700 transition">
                  <IconPlus size={15} stroke={2.5} /> {t.postRide}
                </Link>
              </div>
            ) : rides.map(r => {
              const badge   = getBadge(r.departure_time, t);
              const expired = badge.label === t.departed;
              const fromImg = getCityImg(r.from_city);
              const toImg   = getCityImg(r.to_city);
              const booked  = r.seats_total - r.seats_available;
              const pct     = Math.round((booked / r.seats_total) * 100);

              return (
                <div key={r.id} onClick={() => router.push(`/ride/${r.id}`)}
                  className={`overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-violet-200 cursor-pointer ${expired ? "opacity-50" : ""}`}>

                  {/* City banner */}
                  <div className="relative h-36 sm:h-44 overflow-hidden">
                    <div className="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
                      <img src={fromImg} alt={r.from_city} className="h-full w-full object-cover"/>
                      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent"/>
                      <div className="absolute bottom-4 left-4">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-white/60 mb-0.5">From</p>
                        <p className="text-2xl font-black text-white drop-shadow leading-tight">{getCityLabel(r.from_city, lang)}</p>
                      </div>
                    </div>
                    <div className="absolute inset-y-0 right-0 w-1/2 overflow-hidden">
                      <img src={toImg} alt={r.to_city} className="h-full w-full object-cover"/>
                      <div className="absolute inset-0 bg-gradient-to-l from-black/60 via-black/30 to-transparent"/>
                      <div className="absolute bottom-4 right-4 text-right">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-white/60 mb-0.5">To</p>
                        <p className="text-2xl font-black text-white drop-shadow leading-tight">{getCityLabel(r.to_city, lang)}</p>
                      </div>
                    </div>
                    {/* Center arrow */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2 shadow-lg border border-white/60">
                        <IconBus size={16} stroke={2} className="text-gray-700" />
                        <IconArrowRight size={14} stroke={2.5} className="text-violet-500" />
                      </div>
                    </div>
                    {/* Badge top-left */}
                    <div className="absolute top-3 left-3">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${badge.cls}`}>{badge.label}</span>
                    </div>
                    {/* Full badge top-right */}
                    {r.seats_available === 0 && (
                      <div className="absolute top-3 right-3">
                        <span className="rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-bold text-white">{t.full}</span>
                      </div>
                    )}
                    {/* Price badge - top right when not full */}
                    {r.seats_available > 0 && (
                      <div className="absolute top-3 right-3">
                        <div className="rounded-xl bg-white/95 backdrop-blur-sm px-3 py-1.5 text-center shadow-md">
                          <p className="text-lg font-black text-violet-700 leading-none">{r.price_per_seat}₾</p>
                          <p className="text-[9px] font-bold text-gray-400">{t.perSeat}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="p-4 sm:p-5 space-y-3">
                    {/* Row 1: time + price (if full, show price here) */}
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-black text-gray-800 flex items-center gap-1.5">
                        <IconClock size={14} stroke={2} className="text-violet-400" />
                        {new Date(r.departure_time).toLocaleString()}
                      </p>
                      {r.seats_available === 0 && (
                        <p className="text-lg font-black text-violet-700">{r.price_per_seat}₾
                          <span className="text-xs font-bold text-gray-400 ml-1">{t.perSeat}</span>
                        </p>
                      )}
                    </div>

                    {/* Vehicle strip */}
                    <VehicleStrip ride={r} lang={lang} t={t} />

                    {/* Accessories */}
                    <AccessoriesBadges accessories={r.accessories} lang={lang} />

                    {/* Seat bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-gray-600 flex items-center gap-1">
                          <IconArmchair size={13} stroke={2.5} className="text-violet-400" />
                          {r.seats_available} {t.seatsLeft} / {r.seats_total}
                        </span>
                        <span className="text-xs font-bold text-gray-400">{pct}% booked</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${pct > 80 ? "bg-rose-400" : "bg-violet-500"}`}
                          style={{ width: `${pct}%` }}/>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-1" onClick={e => e.stopPropagation()}>
                      <a href={waLink(r.phone)} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-black text-white hover:bg-emerald-600 transition">
                        <IconBrandWhatsapp size={13} stroke={2.5} /> {t.whatsapp}
                      </a>
                      {r.seats_available > 0 && (
                        <button onClick={e => { e.stopPropagation(); setBookRide(r); }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-black text-white hover:bg-violet-700 transition">
                          <IconCheck size={13} stroke={2.5} /> {t.book}
                        </button>
                      )}
                      {canDelete(r) && (
                        <button onClick={e => handleDeleteRide(r.id, e)} disabled={deletingId === r.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-black text-red-600 hover:bg-red-100 transition disabled:opacity-50 ml-auto">
                          {isAdmin && r.user_id !== user?.id
                            ? <><IconShield size={13} stroke={2.5} /> Delete</>
                            : <><IconTrash size={13} stroke={2.5} /> Delete</>
                          }
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="mt-12 border-t border-gray-200 bg-white">
                  <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-5 sm:flex-row sm:px-6">
          <img src="/logo.png" alt="mgzavri.ge" className="h-7 w-auto opacity-80" />
          <a href="mailto:mgzavri@gmail.com"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-violet-600 transition">
            <IconMail size={14} stroke={2} /> mgzavri@gmail.com
          </a>
          <span className="text-xs font-bold text-gray-400">© {new Date().getFullYear()} mgzavri</span>
        </div>
      </footer>

      {/* Mobile FAB */}
      <Link href={isDriver ? "/post" : "/post-request"}
        className={`fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-white shadow-2xl transition sm:hidden ${
          isDriver ? "bg-emerald-600 hover:bg-emerald-700" : "bg-violet-600 hover:bg-violet-700"
        }`}>
        <IconPlus size={16} stroke={2.5} /> {isDriver ? t.postRide : t.postRequest}
      </Link>

      {bookRide && <BookModal ride={bookRide} lang={lang} onClose={() => { setBookRide(null); loadRides(); }} />}
    </div>
  );
}
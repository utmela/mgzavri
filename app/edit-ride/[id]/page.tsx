"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { IconArrowLeft, IconDeviceFloppy, IconLoader2 } from "@tabler/icons-react";
import { useLanguage } from "../../../components/LanguageProvider";
import CustomDateTimePicker from "../../../components/CustomDateTimePicker";
import ScenicPageHero from "../../../components/ScenicPageHero";
import { api } from "../../../lib/api";
import type { Ride } from "../../../lib/types";

const COPY = {
  en: { title: "Edit trip", subtitle: "Update the public details without disturbing existing bookings.", vehicle: "Vehicle model", departure: "Departure", totalSeats: "Total capacity", price: "Price per passenger", pickup: "Pickup point", dropoff: "Drop-off point", fullVan: "Allow entire van booking", fullVanPrice: "Entire van price", save: "Save changes", saving: "Saving...", back: "Driver dashboard", missing: "This trip is unavailable or you do not have permission to edit it.", sold: "seats already booked" },
  ka: { title: "მგზავრობის რედაქტირება", subtitle: "განაახლეთ საჯარო ინფორმაცია არსებული ჯავშნების შეცვლის გარეშე.", vehicle: "მანქანის მოდელი", departure: "გასვლის დრო", totalSeats: "სრული ტევადობა", price: "ფასი ერთ მგზავრზე", pickup: "აყვანის ადგილი", dropoff: "ჩამოსვლის ადგილი", fullVan: "მთლიანი მინივენის დაჯავშნის დაშვება", fullVanPrice: "მთლიანი მინივენის ფასი", save: "ცვლილებების შენახვა", saving: "ინახება...", back: "მძღოლის პანელი", missing: "მგზავრობა მიუწვდომელია ან მისი რედაქტირების უფლება არ გაქვთ.", sold: "ადგილი უკვე დაჯავშნილია" },
} as const;

const inputClass = "min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-bold text-slate-900 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100";

export default function EditRidePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { lang } = useLanguage();
  const text = COPY[lang];
  const [ride, setRide] = useState<Ride | null>(null);
  const [bookedSeats, setBookedSeats] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Ride>(`/rides/${id}?manage=true`).then(({ data }) => {
      const loadedRide = data as Ride | null;
      setRide(loadedRide);
      if (loadedRide) setBookedSeats(Math.max(0, loadedRide.seats_total - loadedRide.seats_available));
      setLoading(false);
    });
  }, [id]);

  function update<K extends keyof Ride>(key: K, value: Ride[K]) {
    setRide((current) => current ? { ...current, [key]: value } : current);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ride) return;
    if (ride.seats_total < bookedSeats || ride.seats_total < 1 || ride.price_per_seat < 0) {
      setError(`${bookedSeats} ${text.sold}`);
      return;
    }
    setSaving(true);
    setError("");
    const { error: updateError } = await api(`/rides/${id}`, {
      method: "PATCH", body: {
        vehicle_type: ride.vehicle_type, departure_time: new Date(ride.departure_time).toISOString(),
        seats_total: ride.seats_total, price_per_seat: ride.price_per_seat,
        pickup_point: ride.pickup_point || null, dropoff_point: ride.dropoff_point || null,
        allow_entire_van_booking: Boolean(ride.allow_entire_van_booking),
        entire_van_price: ride.allow_entire_van_booking ? ride.entire_van_price ?? null : null,
      },
    });
    setSaving(false);
    if (updateError) { setError(updateError.message); return; }
    router.push("/my-rides");
    router.refresh();
  }

  if (loading) return <div className="grid min-h-[60vh] place-items-center"><IconLoader2 className="animate-spin text-violet-700" /></div>;
  if (!ride) return <section className="mx-auto max-w-xl px-4 py-20 text-center"><p className="font-bold text-slate-700">{text.missing}</p><Link href="/my-rides" className="mt-5 inline-flex font-black text-violet-800">{text.back}</Link></section>;

  const field = (label: string, control: React.ReactNode) => <label className="block"><span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>{control}</label>;

  return (
    <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <Link href="/my-rides" className="inline-flex items-center gap-2 text-sm font-black text-slate-600"><IconArrowLeft size={16} />{text.back}</Link>
      <div className="mt-5"><ScenicPageHero tone="driver" eyebrow={lang === "ka" ? "რეისის რედაქტორი" : "TRIP EDITOR"} title={text.title} subtitle={text.subtitle} lang={lang} from={ride.from_city} to={ride.to_city} /></div>
      <form onSubmit={save} className="relative z-10 mx-2 -mt-5 rounded-3xl border border-white/80 bg-white/95 p-5 shadow-xl shadow-violet-950/10 backdrop-blur sm:mx-8 sm:p-7">
        <div className="grid gap-5 sm:grid-cols-2">
          {field(text.vehicle, <input value={ride.vehicle_type} onChange={(event) => update("vehicle_type", event.target.value)} className={inputClass} />)}
          {field(text.departure, <CustomDateTimePicker value={ride.departure_time} onChange={(value) => update("departure_time", value)} lang={lang} min={new Date().toISOString()} placeholder={text.departure} />)}
          {field(text.totalSeats, <div><input type="number" min={bookedSeats || 1} max="30" value={ride.seats_total} onChange={(event) => update("seats_total", Number(event.target.value))} className={inputClass} /><p className="mt-1.5 text-xs font-bold text-slate-500">{bookedSeats} {text.sold}</p></div>)}
          {field(text.price, <input type="number" min="0" step="1" value={ride.price_per_seat} onChange={(event) => update("price_per_seat", Number(event.target.value))} className={inputClass} />)}
          {field(text.pickup, <input value={ride.pickup_point ?? ""} onChange={(event) => update("pickup_point", event.target.value)} className={inputClass} />)}
          {field(text.dropoff, <input value={ride.dropoff_point ?? ""} onChange={(event) => update("dropoff_point", event.target.value)} className={inputClass} />)}
          <label className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 px-4 font-bold text-slate-700 sm:col-span-2"><input type="checkbox" checked={Boolean(ride.allow_entire_van_booking)} onChange={(event) => update("allow_entire_van_booking", event.target.checked)} className="h-5 w-5 accent-violet-600" />{text.fullVan}</label>
          {ride.allow_entire_van_booking && field(text.fullVanPrice, <input type="number" min="0" step="1" value={ride.entire_van_price ?? ""} onChange={(event) => update("entire_van_price", Number(event.target.value))} className={inputClass} />)}
        </div>
        {error && <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
        <button disabled={saving} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 font-black text-white hover:bg-violet-700 disabled:opacity-50"><IconDeviceFloppy size={18} />{saving ? text.saving : text.save}</button>
      </form>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IconArrowLeft, IconBus, IconCheck, IconCurrencyLari, IconLoader2, IconMapPin, IconRoute } from "@tabler/icons-react";
import { useLanguage } from "../../components/LanguageProvider";
import CustomDateTimePicker from "../../components/CustomDateTimePicker";
import CustomSelect from "../../components/CustomSelect";
import ScenicPageHero from "../../components/ScenicPageHero";
import { cityOptions } from "../../lib/cities";
import { api } from "../../lib/api";
import { useProfileRole } from "../../lib/useProfileRole";

const COPY = {
  en: {
    eyebrow: "DRIVER LISTING", title: "Post a driver trip", subtitle: "Publish a route that passengers can book.",
    route: "Route and time", from: "From", to: "To", departure: "Departure", pickup: "Pickup point", dropoff: "Drop-off point",
    offer: "Seats and pricing", seats: "Total seats", price: "Price per passenger", fullVan: "Allow booking the entire van", fullVanPrice: "Entire van price",
    vehicle: "Vehicle and contact", model: "Vehicle model", plate: "Plate number", color: "Vehicle color", phone: "Phone number", driver: "Driver name",
    extras: "Passenger notes", accessories: "Accepted extras", skis: "Skis / snowboard", luggage: "Large luggage", pets: "Pets", notes: "Notes (optional)",
    publish: "Publish driver trip", publishing: "Publishing...", back: "Back", required: "Complete all required fields.", same: "Choose two different cities.", auth: "Sign in to post a driver trip.", success: "Trip published.", driverOnly: "Driver access required", driverOnlyText: "This page is only available to approved driver accounts.", passengerRequest: "Post a passenger request instead",
  },
  ka: {
    eyebrow: "მძღოლის განცხადება", title: "მძღოლის რეისის დამატება", subtitle: "გამოაქვეყნეთ რეისი, რომელსაც მგზავრები დაჯავშნიან.",
    route: "მარშრუტი და დრო", from: "საიდან", to: "სადამდე", departure: "გასვლის დრო", pickup: "აყვანის ადგილი", dropoff: "ჩამოსვლის ადგილი",
    offer: "ადგილები და ფასი", seats: "ადგილების რაოდენობა", price: "ფასი ერთ მგზავრზე", fullVan: "მთლიანი მინივენის დაჯავშნის დაშვება", fullVanPrice: "მთლიანი მინივენის ფასი",
    vehicle: "მანქანა და კონტაქტი", model: "მანქანის მოდელი", plate: "სახელმწიფო ნომერი", color: "მანქანის ფერი", phone: "ტელეფონის ნომერი", driver: "მძღოლის სახელი",
    extras: "მგზავრის ინფორმაცია", accessories: "დაშვებული ნივთები", skis: "თხილამურები", luggage: "დიდი ბარგი", pets: "შინაური ცხოველი", notes: "შენიშვნა (სურვილისამებრ)",
    publish: "მძღოლის რეისის გამოქვეყნება", publishing: "ქვეყნდება...", back: "უკან", required: "შეავსეთ ყველა აუცილებელი ველი.", same: "აირჩიეთ ორი განსხვავებული ქალაქი.", auth: "მძღოლის რეისის დასამატებლად შედით ანგარიშში.", success: "მგზავრობა გამოქვეყნდა.", driverOnly: "საჭიროა მძღოლის წვდომა", driverOnlyText: "ეს გვერდი ხელმისაწვდომია მხოლოდ დადასტურებული მძღოლის ანგარიშებისთვის.", passengerRequest: "ამის ნაცვლად მგზავრის მოთხოვნის დამატება",
  },
} as const;

const inputClass = "min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-bold text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100";
const VEHICLE_COLORS = ["White", "Black", "Silver", "Gray", "Red", "Blue", "Green", "Yellow", "Orange", "Brown", "Beige", "Gold"];

export default function PostTripPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const text = COPY[lang];
  const { user, canDrive, loading: roleLoading } = useProfileRole();
  const [form, setForm] = useState({ from: "", to: "", departure: "", pickup: "", dropoff: "", seats: 8, price: "", fullVanPrice: "", model: "", plate: "", color: "", phone: "", driver: "", notes: "" });
  const [allowFullVan, setAllowFullVan] = useState(false);
  const [accessories, setAccessories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageIsSuccess, setMessageIsSuccess] = useState(false);

  function update(key: keyof typeof form, value: string | number) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  useEffect(() => {
    if (roleLoading) return;
    if (!user) return;
    void (async () => {
      const params = new URLSearchParams(window.location.search);
      const requestedFrom = params.get("from") ?? "";
      const requestedTo = params.get("to") ?? "";
      const profile = (await api<{ name: string; phone: string }>("/profile")).data;
      setForm((current) => ({
        ...current,
        from: requestedFrom || current.from,
        to: requestedTo || current.to,
        driver: current.driver || profile?.name || "",
        phone: current.phone || profile?.phone || "",
      }));
    })();
  }, [roleLoading, user]);

  function toggleAccessory(value: string) {
    setAccessories((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setMessageIsSuccess(false);
    if (!user) { setMessage(text.auth); return; }
    if (!canDrive) { setMessage(text.driverOnly); return; }
    if (!form.from || !form.to || !form.departure || !form.price || !form.model || !form.phone || !form.driver || form.seats < 1 || (allowFullVan && !form.fullVanPrice)) { setMessage(text.required); return; }
    if (form.from === form.to) { setMessage(text.same); return; }

    setLoading(true);
    const baseRide = {
      driver_name: form.driver.trim(), phone: form.phone.trim(), from_city: form.from, to_city: form.to,
      departure_time: new Date(form.departure).toISOString(), vehicle_type: form.model.trim(), plate_number: form.plate.trim() || null,
      vehicle_color: form.color.trim() || null, seats_total: form.seats, seats_available: form.seats, price_per_seat: Number(form.price),
      accessories, notes: form.notes.trim() || null,
    };
    const { error } = await api("/rides", { method: "POST", body: {
      ...baseRide,
      pickup_point: form.pickup.trim() || null, dropoff_point: form.dropoff.trim() || null, allow_entire_van_booking: allowFullVan,
      entire_van_price: allowFullVan ? Number(form.fullVanPrice) : null,
    } });
    setLoading(false);
    if (error) { setMessage(error.message); return; }
    setMessageIsSuccess(true);
    setMessage(text.success);
    router.push("/my-rides");
    router.refresh();
  }

  const cities = cityOptions(lang);
  const colors = VEHICLE_COLORS.map((color) => ({ value: color, label: color }));
  const field = (label: string, control: React.ReactNode) => <label className="block"><span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>{control}</label>;

  if (roleLoading) return <section className="flex min-h-[60vh] items-center justify-center text-sm font-black text-violet-700"><IconLoader2 size={18} className="mr-2 animate-spin" />{lang === "ka" ? "წვდომა მოწმდება..." : "Checking driver access..."}</section>;
  if (!user) return <section className="mx-auto max-w-lg px-4 py-20 text-center"><IconBus size={34} className="mx-auto text-violet-700" /><h1 className="mt-4 text-2xl font-black text-slate-950">{text.auth}</h1><Link href="/auth" className="mt-6 inline-flex rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white">{lang === "ka" ? "შესვლა" : "Sign in"}</Link></section>;
  if (!canDrive) return <section className="mx-auto max-w-lg px-4 py-20 text-center"><IconBus size={34} className="mx-auto text-violet-700" /><p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-violet-700">{lang === "ka" ? "მგზავრის ანგარიში" : "Passenger account"}</p><h1 className="mt-2 text-2xl font-black text-slate-950">{text.driverOnly}</h1><p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{text.driverOnlyText}</p><Link href="/post-request" className="mt-6 inline-flex rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white">{text.passengerRequest}</Link></section>;

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <Link href="/my-rides" className="inline-flex items-center gap-2 text-sm font-black text-slate-600 hover:text-violet-800"><IconArrowLeft size={16} />{text.back}</Link>
      <div className="mt-5"><ScenicPageHero tone="driver" showRoute={false} eyebrow={text.eyebrow} title={text.title} subtitle={text.subtitle} lang={lang} meta={<span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-black backdrop-blur"><IconBus size={15} />{text.route}</span>} /></div>

      <form onSubmit={submit} className="relative z-10 mx-auto -mt-4 max-w-4xl space-y-4 px-2 sm:-mt-6">
        <section className="rounded-3xl border border-white/80 bg-white/95 p-5 shadow-xl shadow-violet-950/10 backdrop-blur sm:p-6"><h2 className="flex items-center gap-2 text-lg font-black text-slate-950"><IconRoute className="text-violet-700" size={20} />{text.route}</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">
          {field(text.from, <CustomSelect value={form.from} onChange={(value) => update("from", value)} options={cities} placeholder={text.from} />)}
          {field(text.to, <CustomSelect value={form.to} onChange={(value) => update("to", value)} options={cities} placeholder={text.to} />)}
          {field(text.departure, <CustomDateTimePicker value={form.departure} onChange={(value) => update("departure", value)} lang={lang} min={new Date().toISOString()} placeholder={text.departure} />)}
          {field(text.pickup, <input value={form.pickup} onChange={(event) => update("pickup", event.target.value)} className={inputClass} />)}
          {field(text.dropoff, <input value={form.dropoff} onChange={(event) => update("dropoff", event.target.value)} className={inputClass} />)}
        </div></section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-black text-slate-950">{text.offer}</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">
          {field(text.seats, <input type="number" min="1" max="30" value={form.seats} onChange={(event) => update("seats", Number(event.target.value))} className={inputClass} />)}
          {field(text.price, <div className="relative"><IconCurrencyLari aria-hidden="true" size={18} stroke={2.4} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-violet-600" /><input type="number" min="0" step="1" value={form.price} onChange={(event) => update("price", event.target.value)} className={`${inputClass} pl-11`} /></div>)}
          <label className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 px-4 font-bold text-slate-700 sm:col-span-2"><input type="checkbox" checked={allowFullVan} onChange={(event) => setAllowFullVan(event.target.checked)} className="h-5 w-5 accent-violet-600" />{text.fullVan}</label>
          {allowFullVan && field(text.fullVanPrice, <input type="number" min="0" step="1" value={form.fullVanPrice} onChange={(event) => update("fullVanPrice", event.target.value)} className={inputClass} />)}
        </div></section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-black text-slate-950">{text.vehicle}</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">
          {field(text.driver, <input value={form.driver} onChange={(event) => update("driver", event.target.value)} className={inputClass} />)}
          {field(text.phone, <input type="tel" value={form.phone} onChange={(event) => update("phone", event.target.value)} className={inputClass} />)}
          {field(text.model, <input value={form.model} onChange={(event) => update("model", event.target.value)} className={inputClass} />)}
          {field(text.plate, <input value={form.plate} onChange={(event) => update("plate", event.target.value.toUpperCase())} className={inputClass} placeholder="ABC-123" />)}
          {field(text.color, <CustomSelect value={form.color} onChange={(value) => update("color", value)} options={colors} placeholder={text.color} searchable={false} />)}
        </div></section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-black text-slate-950">{text.extras}</h2><p className="mt-4 text-xs font-black uppercase tracking-wide text-slate-500">{text.accessories}</p><div className="mt-2 flex flex-wrap gap-2">{([['skis', text.skis], ['luggage', text.luggage], ['pets', text.pets]] as const).map(([value, label]) => <button key={value} type="button" onClick={() => toggleAccessory(value)} className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-black ${accessories.includes(value) ? "border-violet-600 bg-violet-50 text-violet-800" : "border-slate-200 text-slate-600"}`}>{accessories.includes(value) && <IconCheck size={15} />}{label}</button>)}</div><label className="mt-5 block"><span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">{text.notes}</span><textarea value={form.notes} onChange={(event) => update("notes", event.target.value)} rows={3} className={`${inputClass} py-3`} /></label></section>

        {message && <p className={`rounded-xl border p-4 text-sm font-bold ${messageIsSuccess ? "border-violet-200 bg-violet-50 text-violet-700" : "border-red-200 bg-red-50 text-red-700"}`}>{message}</p>}
        <button disabled={loading} className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 font-black text-white shadow-lg shadow-violet-900/10 hover:bg-violet-700 disabled:opacity-50"><IconMapPin size={19} />{loading ? text.publishing : text.publish}</button>
      </form>
    </section>
  );
}

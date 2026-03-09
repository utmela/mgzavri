"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

const CITIES = [
  { en: "Tbilisi", ka: "თბილისი" },
  { en: "Kutaisi", ka: "ქუთაისი" },
  { en: "Batumi", ka: "ბათუმი" },
  { en: "Zugdidi", ka: "ზუგდიდი" },
  { en: "Gori", ka: "გორი" },
  { en: "Rustavi", ka: "რუსთავი" },
  { en: "Telavi", ka: "თელავი" },
  { en: "Borjomi", ka: "ბორჯომი" },
  { en: "Bakuriani", ka: "ბაკურიანი" },
  { en: "Gudauri", ka: "გუდაური" },
  { en: "Poti", ka: "ფოთი" },
  { en: "Senaki", ka: "სენაკი" },
  { en: "Samtredia", ka: "სამტრედია" },
  { en: "Kobuleti", ka: "ქობულეთი" },
  { en: "Ozurgeti", ka: "ოზურგეთი" },
] as const;

const T = {
  en: {
    title: "Post a ride",
    sub: "Add your route so passengers can find and contact you.",
    from: "From",
    to: "To",
    departure: "Departure time",
    price: "Price per seat",
    seats: "Total seats",
    phone: "Phone number",
    vehicle: "Vehicle type",
    submit: "Publish ride",
    publishing: "Publishing…",
    success: "Ride posted successfully",
    error: "Something went wrong",
    back: "Back to home",
    placeholderVehicle: "Mercedes Vito, Sprinter, Prius...",
    choose: "Choose city",
  },
  ka: {
    title: "მგზავრობის დამატება",
    sub: "დაამატე მარშრუტი, რომ მგზავრებმა გიპოვონ და დაგიკავშირდნენ.",
    from: "საიდან",
    to: "სადამდე",
    departure: "გასვლის დრო",
    price: "ფასი ერთ ადგილზე",
    seats: "ადგილების რაოდენობა",
    phone: "ტელეფონის ნომერი",
    vehicle: "მანქანის ტიპი",
    submit: "მგზავრობის გამოქვეყნება",
    publishing: "იტვირთება…",
    success: "მგზავრობა წარმატებით დაემატა",
    error: "დაფიქსირდა შეცდომა",
    back: "მთავარზე დაბრუნება",
    placeholderVehicle: "Mercedes Vito, Sprinter, Prius...",
    choose: "აირჩიე ქალაქი",
  },
} as const;

type Lang = keyof typeof T;

export default function PostPage() {
  const router = useRouter();

  const [lang, setLang] = useState<Lang>("ka");
  const t = T[lang];

  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [pricePerSeat, setPricePerSeat] = useState("");
  const [seatsTotal, setSeatsTotal] = useState("3");
  const [phone, setPhone] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (!fromCity || !toCity || !departureTime || !pricePerSeat || !seatsTotal || !phone) {
      setMessage(t.error);
      return;
    }

    if (fromCity === toCity) {
      setMessage(lang === "ka" ? "საწყისი და საბოლოო ქალაქი ერთნაირი ვერ იქნება" : "From and To cannot be the same");
      return;
    }

    setLoading(true);

    const seats = Number(seatsTotal);
    const price = Number(pricePerSeat);

    const { error } = await supabase.from("rides").insert([
      {
        from_city: fromCity,
        to_city: toCity,
        departure_time: new Date(departureTime).toISOString(),
        price_per_seat: price,
        seats_total: seats,
        seats_available: seats,
        phone,
        vehicle_type: vehicleType || "Minivan",
      },
    ]);

    setLoading(false);

    if (error) {
      console.error(error);
      setMessage(t.error);
      return;
    }

    setMessage(t.success);

    setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 800);
  }

  return (
    <div
      className="min-h-screen font-sans"
      style={{
        background:
          "linear-gradient(135deg,#f5f3ff 0%,#ede9fe 30%,#faf5ff 60%,#f0fdf4 100%)",
      }}
    >
      <nav
        style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)" }}
        className="sticky top-0 z-50 border-b border-violet-100"
      >
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-600 text-lg shadow-sm">
              🚐
            </div>
            <span className="text-xl font-black text-violet-700">mgzavri</span>
          </Link>

          <button
            onClick={() => setLang((l) => (l === "en" ? "ka" : "en"))}
            className="rounded-xl border border-violet-200 bg-white px-3 py-1.5 text-xs font-bold text-violet-600 transition hover:bg-violet-50"
          >
            {lang === "en" ? "🇬🇪 KA" : "🇬🇧 EN"}
          </button>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-black tracking-tight text-gray-900">{t.title}</h1>
          <p className="mt-2 text-gray-500">{t.sub}</p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-[0_4px_30px_rgba(109,40,217,0.08)]">
          <div className="bg-violet-600 px-6 py-4">
            <p className="text-sm font-bold text-violet-100">{t.title}</p>
          </div>

          
  <form onSubmit={handleSubmit} className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">

    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
        {t.from}
      </label>
      <select
        value={fromCity}
        onChange={(e) => setFromCity(e.target.value)}
        className="h-12 w-full rounded-2xl border border-gray-300 bg-white px-4 text-sm text-gray-800 outline-none transition placeholder-gray-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
        required
      >
        <option value="" className="text-gray-400">{t.choose}</option>
        {CITIES.map((c) => (
          <option key={c.en} value={c.en}>
            {lang === "ka" ? c.ka : c.en}
          </option>
        ))}
      </select>
    </div>

    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
        {t.to}
      </label>
      <select
        value={toCity}
        onChange={(e) => setToCity(e.target.value)}
        className="h-12 w-full rounded-2xl border border-gray-300 bg-white px-4 text-sm text-gray-800 outline-none transition placeholder-gray-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
        required
      >
        <option value="" className="text-gray-400">{t.choose}</option>
        {CITIES.map((c) => (
          <option key={c.en} value={c.en}>
            {lang === "ka" ? c.ka : c.en}
          </option>
        ))}
      </select>
    </div>

    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
        {t.departure}
      </label>
      <input
        type="datetime-local"
        value={departureTime}
        onChange={(e) => setDepartureTime(e.target.value)}
        className="h-12 w-full rounded-2xl border border-gray-300 bg-white px-4 text-sm text-gray-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
        required
      />
    </div>

    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
        {t.price}
      </label>
      <input
        type="number"
        min="1"
        step="1"
        value={pricePerSeat}
        onChange={(e) => setPricePerSeat(e.target.value)}
        placeholder="15"
        className="h-12 w-full rounded-2xl border border-gray-300 bg-white px-4 text-sm text-gray-800 placeholder-gray-500 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
        required
      />
    </div>

    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
        {t.seats}
      </label>
      <input
        type="number"
        min="1"
        max="20"
        step="1"
        value={seatsTotal}
        onChange={(e) => setSeatsTotal(e.target.value)}
        className="h-12 w-full rounded-2xl border border-gray-300 bg-white px-4 text-sm text-gray-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
        required
      />
    </div>

    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
        {t.phone}
      </label>
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="599123456"
        className="h-12 w-full rounded-2xl border border-gray-300 bg-white px-4 text-sm text-gray-800 placeholder-gray-500 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
        required
      />
    </div>

    <div className="sm:col-span-2">
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
        {t.vehicle}
      </label>
      <input
        type="text"
        value={vehicleType}
        onChange={(e) => setVehicleType(e.target.value)}
        placeholder={t.placeholderVehicle}
        className="h-12 w-full rounded-2xl border border-gray-300 bg-white px-4 text-sm text-gray-800 placeholder-gray-500 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
      />
    </div>
          </form>
        </div>
      </div>
    </div>
  );
}
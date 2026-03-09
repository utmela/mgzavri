"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import GeorgianPlate from "../../components/GeorgianPlate";
import CustomSelect from "../../components/CustomSelect";
import CustomDateTimePicker from "../../components/CustomDateTimePicker";

const CITIES = [
  { en: "Tbilisi",   ka: "თბილისი"   }, { en: "Kutaisi",   ka: "ქუთაისი"   },
  { en: "Batumi",    ka: "ბათუმი"    }, { en: "Zugdidi",   ka: "ზუგდიდი"   },
  { en: "Gori",      ka: "გორი"      }, { en: "Rustavi",   ka: "რუსთავი"   },
  { en: "Telavi",    ka: "თელავი"    }, { en: "Borjomi",   ka: "ბორჯომი"   },
  { en: "Bakuriani", ka: "ბაკურიანი" }, { en: "Gudauri",   ka: "გუდაური"   },
  { en: "Poti",      ka: "ფოთი"      }, { en: "Senaki",    ka: "სენაკი"    },
  { en: "Samtredia", ka: "სამტრედია" }, { en: "Kobuleti",  ka: "ქობულეთი"  },
  { en: "Ozurgeti",  ka: "ოზურგეთი"  }, { en: "Mestia",    ka: "მესტია"    },
] as const;

const VEHICLE_COLORS = [
  { en: "White",  ka: "თეთრი",      hex: "#FFFFFF", border: "#d1d5db" },
  { en: "Black",  ka: "შავი",       hex: "#1a1a1a", border: "#374151" },
  { en: "Silver", ka: "ვერცხლი",    hex: "#C0C0C0", border: "#9ca3af" },
  { en: "Gray",   ka: "რუხი",      hex: "#6B7280", border: "#6B7280" },
  { en: "Red",    ka: "წითელი",     hex: "#DC2626", border: "#DC2626" },
  { en: "Blue",   ka: "ლურჯი",      hex: "#2563EB", border: "#2563EB" },
  { en: "Green",  ka: "მწვანე",     hex: "#16A34A", border: "#16A34A" },
  { en: "Yellow", ka: "ყვითელი",    hex: "#EAB308", border: "#CA8A04" },
  { en: "Orange", ka: "ნარინჯი",    hex: "#EA580C", border: "#EA580C" },
  { en: "Brown",  ka: "ყავისფერი",  hex: "#92400E", border: "#92400E" },
  { en: "Beige",  ka: "კრემისფერი", hex: "#D4C5A9", border: "#9ca3af" },
  { en: "Gold",   ka: "ოქროსფერი",  hex: "#B8860B", border: "#B8860B" },
] as const;

function formatPlate(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (/^[A-Z]{2,3}\d{3}$/.test(clean)) {
    const letters = clean.match(/^[A-Z]+/)?.[0] ?? "";
    const digits  = clean.match(/\d+$/)?.[0] ?? "";
    return `${letters}-${digits}`;
  }
  return raw.toUpperCase();
}

const T = {
  en: {
    title: "Post a ride", sub: "Add your route so passengers can find and contact you.",
    from: "From", to: "To", departure: "Departure time",
    price: "Price per seat", seats: "Total seats", phone: "Phone number",
    vehicle: "Vehicle model", plate: "Licence plate", color: "Vehicle color",
    submit: "Publish ride", publishing: "Publishing…",
    success: "Ride posted successfully! 🎉", error: "Please fill in all fields.",
    sameCity: "From and To cannot be the same.", back: "← Back to home",
    choose: "Choose city", loginWarn: "You must be signed in to post a ride.",
    signIn: "Sign in", plateHint: "e.g. ABC-123",
    step1: "Route", step2: "Schedule & Price", step3: "Vehicle",
  },
  ka: {
    title: "მოგზაურობის დამატება", sub: "დაამატე მარშრუტი, რომ მგზავრებმა გიპოვონ და დაგიკავშირდნენ.",
    from: "საიდან", to: "სადამდე", departure: "გასვლის დრო",
    price: "ფასი ერთ ადგილზე", seats: "ადგილების რაოდენობა", phone: "ტელეფონის ნომერი",
    vehicle: "მანქანის მოდელი", plate: "სახელმწიფო ნომერი", color: "მანქანის ფერი",
    submit: "გამოქვეყნება", publishing: "იტვირთება…",
    success: "მოგზაურობა წარმატებით დაემატა! 🎉", error: "შეავსეთ ყველა სავალდებულო ველი.",
    sameCity: "საწყისი და საბოლოო ქალაქი ერთნაირი ვერ იქნება.", back: "← მთავარზე დაბრუნება",
    choose: "აირჩიე ქალაქი", loginWarn: "გამოქვეყნებისთვის გაიარე ავტორიზაცია.",
    signIn: "შესვლა", plateHint: "მაგ. ABC-123",
    step1: "მარშრუტი", step2: "განრიგი და ფასი", step3: "მანქანა",
  },
} as const;

type Lang = keyof typeof T;

export default function PostPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("ka");
  const t = T[lang];

  const [fromCity,      setFromCity]      = useState("");
  const [toCity,        setToCity]        = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [pricePerSeat,  setPricePerSeat]  = useState("");
  const [seatsTotal,    setSeatsTotal]    = useState("3");
  const [phone,         setPhone]         = useState("");
  const [vehicleType,   setVehicleType]   = useState("");
  const [plateRaw,      setPlateRaw]      = useState("");
  const [vehicleColor,  setVehicleColor]  = useState("");
  const [loading,       setLoading]       = useState(false);
  const [message,       setMessage]       = useState("");
  const [msgType,       setMsgType]       = useState<"ok" | "err" | "warn">("err");

  const plateFormatted = formatPlate(plateRaw);
  const selectedColor  = VEHICLE_COLORS.find(c => c.en === vehicleColor);

  async function handleSubmit() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setMessage(t.loginWarn); setMsgType("warn"); return; }
    if (!fromCity || !toCity || !departureTime || !pricePerSeat || !seatsTotal || !phone) {
      setMessage(t.error); setMsgType("err"); return;
    }
    if (fromCity === toCity) { setMessage(t.sameCity); setMsgType("err"); return; }

    setLoading(true);
    const seats = Number(seatsTotal);
    const { error } = await supabase.from("rides").insert([{
      user_id:       userData.user.id,
      from_city:     fromCity,
      to_city:       toCity,
      departure_time: new Date(departureTime).toISOString(),
      price_per_seat: Number(pricePerSeat),
      seats_total:   seats,
      seats_available: seats,
      phone,
      vehicle_type:  vehicleType || "Minivan",
      plate_number:  plateFormatted,
      vehicle_color: vehicleColor,
    }]);
    setLoading(false);

    if (error) { setMessage(t.error); setMsgType("err"); return; }
    setMessage(t.success); setMsgType("ok");
    setTimeout(() => { router.push("/"); router.refresh(); }, 1200);
  }

  const inp = "h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm font-medium text-gray-800 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition placeholder-gray-400 appearance-none";
  const sel = inp + " cursor-pointer bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")] bg-no-repeat bg-[right_1rem_center] pr-10";

  return (
    <div className="min-h-screen font-sans bg-gray-50">

      {/* NAV */}
      <nav style={{ background: "rgba(255,255,255,0.96)", backdropFilter: "blur(20px)" }}
        className="sticky top-0 z-50 border-b border-gray-200 shadow-sm">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-600 text-xl shadow-lg shadow-violet-200">🚐</div>
            <span className="text-xl font-black text-gray-900 tracking-tight">mgzavri</span>
          </Link>
          <button onClick={() => setLang(l => l === "en" ? "ka" : "en")}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 transition">
            <span>{lang === "en" ? "🇬🇪" : "🇬🇧"}</span>
            <span>{lang === "en" ? "KA" : "EN"}</span>
          </button>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-600 text-3xl shadow-xl shadow-violet-200">🚐</div>
          <h1 className="text-3xl font-black text-gray-900">{t.title}</h1>
          <p className="mt-2 text-gray-500 text-sm">{t.sub}</p>
        </div>

        <div className="space-y-4">

          {/* ── SECTION 1: Route ── */}
          <div className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-visible">
            <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-xs font-black text-white">1</div>
              <span className="font-black text-gray-800">{t.step1}</span>
            </div>
            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-400">{t.from}</label>
                <CustomSelect
                  value={fromCity} onChange={setFromCity}
                  placeholder={t.choose}
                  options={CITIES.map(c => ({ value: c.en, label: lang === "ka" ? c.ka : c.en }))}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-400">{t.to}</label>
                <CustomSelect
                  value={toCity} onChange={setToCity}
                  placeholder={t.choose}
                  options={CITIES.map(c => ({ value: c.en, label: lang === "ka" ? c.ka : c.en }))}
                />
              </div>

              {fromCity && toCity && (
                <div className="sm:col-span-2 flex items-center gap-4 rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 to-purple-50 px-5 py-4">
                  <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400">From</p>
                    <p className="text-lg font-black text-violet-800">{lang === "ka" ? CITIES.find(c => c.en === fromCity)?.ka : fromCity}</p>
                  </div>
                  <div className="flex-1 flex items-center justify-center gap-1">
                    <div className="h-px flex-1 bg-violet-200" />
                    <span className="text-2xl">🚐</span>
                    <div className="h-px flex-1 bg-violet-200" />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400">To</p>
                    <p className="text-lg font-black text-violet-800">{lang === "ka" ? CITIES.find(c => c.en === toCity)?.ka : toCity}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── SECTION 2: Schedule & Price ── */}
          <div className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-visible">
            <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-xs font-black text-white">2</div>
              <span className="font-black text-gray-800">{t.step2}</span>
            </div>
            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-400">{t.departure}</label>
                <CustomDateTimePicker value={departureTime} onChange={setDepartureTime} placeholder="Select date & time" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-400">{t.phone}</label>
                <div className="relative">
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="599 123 456"
                    className={inp + " pl-11"} />
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base">📞</span>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-400">{t.price} (₾)</label>
                <div className="relative">
                  <input
                    type="number" min="0" value={pricePerSeat}
                    onChange={e => setPricePerSeat(String(Math.max(0, Number(e.target.value))))}
                    placeholder="15"
                    className={inp + " pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-black text-sm">₾</span>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-400">{t.seats}</label>
                <div className="flex items-center gap-3 h-12">
                  <button type="button"
                    onClick={() => setSeatsTotal(s => String(Math.max(1, Number(s) - 1)))}
                    className="h-12 w-12 rounded-2xl border border-gray-200 bg-gray-50 text-xl font-black text-gray-600 hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700 active:scale-95 transition shrink-0">−</button>
                  <div className="flex-1 rounded-2xl border border-violet-200 bg-violet-50 h-12 flex items-center justify-center">
                    <span className="text-xl font-black text-violet-700">{seatsTotal}</span>
                  </div>
                  <button type="button"
                    onClick={() => setSeatsTotal(s => String(Math.min(30, Number(s) + 1)))}
                    className="h-12 w-12 rounded-2xl border border-gray-200 bg-gray-50 text-xl font-black text-gray-600 hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700 active:scale-95 transition shrink-0">+</button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {Array.from({ length: Math.min(Number(seatsTotal), 20) }).map((_, i) => (
                    <div key={i} className="h-3.5 w-3.5 rounded-md bg-violet-400 shadow-sm" />
                  ))}
                  {Number(seatsTotal) > 20 && <span className="text-xs text-gray-400">+{Number(seatsTotal) - 20}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION 3: Vehicle ── */}
          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-xs font-black text-white">3</div>
              <span className="font-black text-gray-800">{t.step3}</span>
            </div>
            <div className="grid gap-5 p-6 sm:grid-cols-2">

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-400">{t.vehicle}</label>
                <input type="text" value={vehicleType} onChange={e => setVehicleType(e.target.value)}
                  placeholder="Mercedes Vito, Sprinter, Prius…" className={inp} />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-400">{t.plate}</label>
                <input
                  type="text"
                  value={plateRaw}
                  onChange={e => setPlateRaw(e.target.value.toUpperCase().slice(0, 10))}
                  placeholder={t.plateHint}
                  maxLength={10}
                  className={inp + " font-black tracking-widest uppercase"}
                />
              </div>

              {/* Color picker */}
              <div className="sm:col-span-2">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-400">{t.color}</label>
                <div className="flex flex-wrap gap-2">
                  {VEHICLE_COLORS.map(c => (
                    <button key={c.en} type="button" onClick={() => setVehicleColor(c.en)}
                      title={`${c.en} · ${c.ka}`}
                      className={`flex flex-col items-center gap-1 rounded-xl p-2 border-2 transition ${
                        vehicleColor === c.en
                          ? "border-violet-500 bg-violet-50 scale-110 shadow-md"
                          : "border-transparent hover:border-gray-300 hover:bg-gray-50"
                      }`}>
                      <div className="h-7 w-7 rounded-full shadow-inner"
                        style={{ background: c.hex, border: `2px solid ${c.border}` }} />
                      <span className="text-[9px] font-bold text-gray-500 leading-none">{lang === "ka" ? c.ka : c.en}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Vehicle preview */}
              {(vehicleType || plateRaw || vehicleColor) && (
                <div className="sm:col-span-2 rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Vehicle preview</p>
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-5xl"
                        style={{ filter: selectedColor ? `drop-shadow(0 2px 8px ${selectedColor.hex}55)` : undefined }}>
                        🚐
                      </div>
                      {selectedColor && (
                        <div className="flex items-center gap-1.5 rounded-xl bg-white border border-gray-200 px-3 py-1.5">
                          <div className="h-3.5 w-3.5 rounded-full shrink-0"
                            style={{ background: selectedColor.hex, border: `1.5px solid ${selectedColor.border}` }} />
                          {/* Both language labels */}
                          <span className="text-xs font-black text-gray-800">{selectedColor.en}</span>
                          <span className="text-xs text-gray-300">·</span>
                          <span className="text-xs font-bold text-gray-500">{selectedColor.ka}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-3">
                      {vehicleType && <p className="text-lg font-black text-gray-800">{vehicleType}</p>}
                      {plateRaw && <GeorgianPlate plate={plateFormatted} size="md" />}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`rounded-2xl px-5 py-4 text-sm font-semibold text-center ${
              msgType === "ok"   ? "bg-green-50 border border-green-200 text-green-700" :
              msgType === "warn" ? "bg-amber-50 border border-amber-200 text-amber-700" :
                                   "bg-red-50 border border-red-200 text-red-600"
            }`}>
              {message}
              {msgType === "warn" && (
                <Link href="/auth" className="ml-2 underline font-bold">{t.signIn}</Link>
              )}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pb-8">
            <button onClick={handleSubmit} disabled={loading}
              className="h-14 flex-1 rounded-2xl bg-violet-600 font-black text-white text-base hover:bg-violet-700 disabled:opacity-50 transition shadow-lg shadow-violet-200">
              {loading ? t.publishing : `🚐 ${t.submit}`}
            </button>
            <Link href="/"
              className="flex h-14 items-center rounded-2xl border border-gray-200 bg-white px-6 font-bold text-gray-600 hover:bg-gray-50 transition">
              {t.back}
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
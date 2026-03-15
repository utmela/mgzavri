"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import GeorgianPlate from "../../components/GeorgianPlate";
import CustomSelect from "../../components/CustomSelect";
import CustomDateTimePicker from "../../components/CustomDateTimePicker";
import { useLanguage } from "../../components/LanguageProvider";
import {
  IconBus, IconMapPin, IconClock, IconPhone, IconCurrencyLari,
  IconArmchair, IconId, IconPalette, IconSkiJumping, IconLuggage,
  IconPaw, IconCheck, IconArrowLeft, IconPlus, IconMinus,
  IconCircleCheck, IconAlertCircle, IconAlertTriangle,
} from "@tabler/icons-react";

const ACCESSORIES = [
  { id: "skis",    icon: IconSkiJumping, en: "Skis / Snowboard", ka: "სათხილამურო" },
  { id: "luggage", icon: IconLuggage,    en: "Large Luggage",     ka: "დიდი ბარგი"  },
  { id: "pets",    icon: IconPaw,        en: "Pets",              ka: "შინაური ცხოველი" },
] as const;

const CITIES = [
  { en: "Tbilisi",        ka: "თბილისი"       }, { en: "Kutaisi",        ka: "ქუთაისი"       },
  { en: "Batumi",         ka: "ბათუმი"        }, { en: "Zugdidi",        ka: "ზუგდიდი"       },
  { en: "Gori",           ka: "გორი"          }, { en: "Rustavi",        ka: "რუსთავი"       },
  { en: "Telavi",         ka: "თელავი"        }, { en: "Borjomi",        ka: "ბორჯომი"       },
  { en: "Bakuriani",      ka: "ბაკურიანი"     }, { en: "Gudauri",        ka: "გუდაური"       },
  { en: "Poti",           ka: "ფოთი"          }, { en: "Senaki",         ka: "სენაკი"        },
  { en: "Samtredia",      ka: "სამტრედია"     }, { en: "Kobuleti",       ka: "ქობულეთი"      },
  { en: "Ozurgeti",       ka: "ოზურგეთი"      }, { en: "Mestia",         ka: "მესტია"        },
  { en: "Mtskheta",       ka: "მცხეთა"        }, { en: "Akhaltsikhe",    ka: "ახალციხე"      },
  { en: "Akhalkalaki",    ka: "ახალქალაქი"    }, { en: "Marneuli",       ka: "მარნეული"      },
  { en: "Bolnisi",        ka: "ბოლნისი"       }, { en: "Gardabani",      ka: "გარდაბანი"     },
  { en: "Sagarejo",       ka: "საგარეჯო"      }, { en: "Sighnaghi",      ka: "სიღნაღი"       },
  { en: "Lagodekhi",      ka: "ლაგოდეხი"      }, { en: "Dedoplistskaro", ka: "დედოფლისწყარო" },
  { en: "Kaspi",          ka: "კასპი"         }, { en: "Kareli",         ka: "კარელი"        },
  { en: "Khashuri",       ka: "ხაშური"        }, { en: "Surami",         ka: "სურამი"        },
  { en: "Zestafoni",      ka: "ზესტაფონი"     }, { en: "Tkibuli",        ka: "ტყიბული"       },
  { en: "Chiatura",       ka: "ჭიათურა"       }, { en: "Tskaltubo",      ka: "წყალტუბო"      },
  { en: "Lanchkhuti",     ka: "ლანჩხუთი"      }, { en: "Khobi",          ka: "ხობი"          },
  { en: "Abasha",         ka: "აბაშა"         }, { en: "Tsalenjikha",    ka: "წალენჯიხა"     },
  { en: "Martvili",       ka: "მარტვილი"      }, { en: "Khoni",          ka: "ხონი"          },
  { en: "Vani",           ka: "ვანი"          }, { en: "Baghdati",       ka: "ბაღდათი"       },
  { en: "Terjola",        ka: "თერჯოლა"       }, { en: "Ambrolauri",     ka: "ამბროლაური"    },
  { en: "Oni",            ka: "ონი"           }, { en: "Tsageri",        ka: "ცაგერი"        },
  { en: "Dusheti",        ka: "დუშეთი"        }, { en: "Tianeti",        ka: "თიანეთი"       },
  { en: "Ninotsminda",    ka: "ნინოწმინდა"    }, { en: "Adigeni",        ka: "ადიგენი"       },
  { en: "Aspindza",       ka: "ასპინძა"       }, { en: "Khulo",          ka: "ხულო"          },
  { en: "Shuakhevi",      ka: "შუახევი"       }, { en: "Stepantsminda",  ka: "სტეფანწმინდა"  },
  { en: "Svaneti",        ka: "სვანეთი"       }, { en: "Ushguli",        ka: "უშგული"        },
  { en: "Kvareli",        ka: "ყვარელი"       }, { en: "Tusheti",        ka: "თუშეთი"        },
] as const;

const VEHICLE_COLORS = [
  { en: "White",  ka: "თეთრი",      hex: "#FFFFFF", border: "#d1d5db" },
  { en: "Black",  ka: "შავი",       hex: "#1a1a1a", border: "#374151" },
  { en: "Silver", ka: "ვერცხლი",    hex: "#C0C0C0", border: "#9ca3af" },
  { en: "Gray",   ka: "რუხი",       hex: "#6B7280", border: "#6B7280" },
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
    success: "Ride posted successfully!", error: "Please fill in all fields.",
    sameCity: "From and To cannot be the same.", back: "Back to home",
    choose: "Choose city", loginWarn: "You must be signed in to post a ride.",
    signIn: "Sign in", plateHint: "e.g. ABC-123",
    step1: "Route", step2: "Schedule & Price", step3: "Vehicle", step4: "Accepts",
    step4sub: "What can passengers bring?",
  },
  ka: {
    title: "მოგზაურობის დამატება", sub: "დაამატე მარშრუტი, რომ მგზავრებმა გიპოვონ და დაგიკავშირდნენ.",
    from: "საიდან", to: "სადამდე", departure: "გასვლის დრო",
    price: "ფასი ერთ ადგილზე", seats: "ადგილების რაოდენობა", phone: "ტელეფონის ნომერი",
    vehicle: "მანქანის მოდელი", plate: "სახელმწიფო ნომერი", color: "მანქანის ფერი",
    submit: "გამოქვეყნება", publishing: "იტვირთება…",
    success: "მოგზაურობა წარმატებით დაემატა!", error: "შეავსეთ ყველა სავალდებულო ველი.",
    sameCity: "საწყისი და საბოლოო ქალაქი ერთნაირი ვერ იქნება.", back: "მთავარზე დაბრუნება",
    choose: "აირჩიე ქალაქი", loginWarn: "გამოქვეყნებისთვის გაიარე ავტორიზაცია.",
    signIn: "შესვლა", plateHint: "მაგ. ABC-123",
    step1: "მარშრუტი", step2: "განრიგი და ფასი", step3: "მანქანა", step4: "მიიღება",
    step4sub: "რა შეუძლიათ მგზავრებს წამოიღონ?",
  },
} as const;

type Lang = keyof typeof T;

export default function PostPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const t = T[lang as Lang];

  const [fromCity,      setFromCity]      = useState("");
  const [toCity,        setToCity]        = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [pricePerSeat,  setPricePerSeat]  = useState("");
  const [seatsTotal,    setSeatsTotal]    = useState("3");
  const [phone,         setPhone]         = useState("");
  const [vehicleType,   setVehicleType]   = useState("");
  const [plateRaw,      setPlateRaw]      = useState("");
  const [vehicleColor,  setVehicleColor]  = useState("");
  const [accessories,   setAccessories]   = useState<string[]>([]);
  const [loading,       setLoading]       = useState(false);
  const [message,       setMessage]       = useState("");
  const [msgType,       setMsgType]       = useState<"ok" | "err" | "warn">("err");

  const plateFormatted = formatPlate(plateRaw);
  const selectedColor  = VEHICLE_COLORS.find(c => c.en === vehicleColor);

  function toggleAccessory(id: string) {
    setAccessories(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);
  }

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
      user_id: userData.user.id, from_city: fromCity, to_city: toCity,
      departure_time: new Date(departureTime).toISOString(),
      price_per_seat: Number(pricePerSeat), seats_total: seats, seats_available: seats,
      phone, vehicle_type: vehicleType || "Minivan",
      plate_number: plateFormatted, vehicle_color: vehicleColor, accessories,
    }]);
    setLoading(false);
    if (error) { setMessage(t.error); setMsgType("err"); return; }
    setMessage(t.success); setMsgType("ok");
    setTimeout(() => { router.push("/"); router.refresh(); }, 1200);
  }

  const inp = "h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm font-extrabold text-gray-800 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition placeholder-gray-400";

  const sectionHdr = (num: number, label: string, sub?: string) => (
    <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-xs font-black text-white">{num}</div>
      <span className="font-black text-gray-800">{label}</span>
      {sub && <span className="ml-1 text-xs font-bold text-gray-400">{sub}</span>}
    </div>
  );

  return (
    <div className="min-h-screen font-sans bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">

        {/* Back button */}
        <div className="mb-6">
          <Link href="/"
            className="inline-flex items-center gap-1.5 rounded-2xl border-2 border-gray-200 bg-white px-4 py-2 text-sm font-black text-gray-700 shadow-sm hover:bg-gray-50 hover:text-violet-600 hover:border-violet-200 transition">
            <IconArrowLeft size={16} stroke={2.5} /> {t.back}
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-600 shadow-xl shadow-violet-200">
            <IconBus size={32} stroke={1.5} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900">{t.title}</h1>
          <p className="mt-2 font-extrabold text-gray-500 text-sm">{t.sub}</p>
        </div>

        <div className="space-y-4">

          {/* ── SECTION 1: Route ── */}
          <div className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-visible">
            {sectionHdr(1, t.step1)}
            <div className="grid gap-4 p-6 sm:grid-cols-2">
              {[{ val: fromCity, set: setFromCity, label: t.from }, { val: toCity, set: setToCity, label: t.to }].map(({ val, set, label }) => (
                <div key={label}>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-gray-400">
                    <IconMapPin size={12} stroke={2.5} /> {label}
                  </label>
                  <CustomSelect value={val} onChange={set} placeholder={t.choose}
                    options={CITIES.map(c => ({ value: c.en, label: lang === "ka" ? c.ka : c.en }))} />
                </div>
              ))}
              {fromCity && toCity && (
                <div className="sm:col-span-2 flex items-center gap-4 rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 to-purple-50 px-5 py-4">
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-violet-400">From</p>
                    <p className="text-lg font-black text-violet-800">{lang === "ka" ? CITIES.find(c => c.en === fromCity)?.ka : fromCity}</p>
                  </div>
                  <div className="flex-1 flex items-center justify-center gap-1">
                    <div className="h-px flex-1 bg-violet-200" />
                    <IconBus size={22} stroke={1.5} className="text-violet-500" />
                    <div className="h-px flex-1 bg-violet-200" />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-violet-400">To</p>
                    <p className="text-lg font-black text-violet-800">{lang === "ka" ? CITIES.find(c => c.en === toCity)?.ka : toCity}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── SECTION 2: Schedule & Price ── */}
          <div className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-visible">
            {sectionHdr(2, t.step2)}
            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-gray-400">
                  <IconClock size={12} stroke={2.5} /> {t.departure}
                </label>
                <CustomDateTimePicker value={departureTime} onChange={setDepartureTime} placeholder="Select date & time" />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-gray-400">
                  <IconPhone size={12} stroke={2.5} /> {t.phone}
                </label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="599 123 456" className={inp} />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-gray-400">
                  <IconCurrencyLari size={12} stroke={2.5} /> {t.price}
                </label>
                <input type="number" min="0" value={pricePerSeat}
                  onChange={e => setPricePerSeat(String(Math.max(0, Number(e.target.value))))}
                  placeholder="15" className={inp + " [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"} />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-gray-400">
                  <IconArmchair size={12} stroke={2.5} /> {t.seats}
                </label>
                <div className="flex items-center gap-3 h-12">
                  <button type="button" onClick={() => setSeatsTotal(s => String(Math.max(1, Number(s) - 1)))}
                    className="h-12 w-12 rounded-2xl border border-gray-200 bg-gray-50 font-black text-gray-600 hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700 active:scale-95 transition shrink-0 flex items-center justify-center">
                    <IconMinus size={16} stroke={2.5} />
                  </button>
                  <div className="flex-1 rounded-2xl border border-violet-200 bg-violet-50 h-12 flex items-center justify-center">
                    <span className="text-xl font-black text-violet-700">{seatsTotal}</span>
                  </div>
                  <button type="button" onClick={() => setSeatsTotal(s => String(Math.min(30, Number(s) + 1)))}
                    className="h-12 w-12 rounded-2xl border border-gray-200 bg-gray-50 font-black text-gray-600 hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700 active:scale-95 transition shrink-0 flex items-center justify-center">
                    <IconPlus size={16} stroke={2.5} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {Array.from({ length: Math.min(Number(seatsTotal), 20) }).map((_, i) => (
                    <div key={i} className="h-3.5 w-3.5 rounded-md bg-violet-400 shadow-sm" />
                  ))}
                  {Number(seatsTotal) > 20 && <span className="text-xs font-extrabold text-gray-500">+{Number(seatsTotal) - 20}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION 3: Vehicle ── */}
          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
            {sectionHdr(3, t.step3)}
            <div className="grid gap-5 p-6 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-gray-400">
                  <IconBus size={12} stroke={2.5} /> {t.vehicle}
                </label>
                <input type="text" value={vehicleType} onChange={e => setVehicleType(e.target.value)}
                  placeholder="Mercedes Vito, Sprinter, Prius…" className={inp} />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-gray-400">
                  <IconId size={12} stroke={2.5} /> {t.plate}
                </label>
                <input type="text" value={plateRaw}
                  onChange={e => setPlateRaw(e.target.value.toUpperCase().slice(0, 10))}
                  placeholder={t.plateHint} maxLength={10}
                  className={inp + " font-black tracking-widest uppercase"} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-gray-400">
                  <IconPalette size={12} stroke={2.5} /> {t.color}
                </label>
                <div className="flex flex-wrap gap-2">
                  {VEHICLE_COLORS.map(c => (
                    <button key={c.en} type="button" onClick={() => setVehicleColor(c.en)} title={`${c.en} · ${c.ka}`}
                      className={`flex flex-col items-center gap-1 rounded-xl p-2 border-2 transition ${
                        vehicleColor === c.en ? "border-violet-500 bg-violet-50 scale-110 shadow-md" : "border-transparent hover:border-gray-300 hover:bg-gray-50"
                      }`}>
                      <div className="h-7 w-7 rounded-full shadow-inner" style={{ background: c.hex, border: `2px solid ${c.border}` }} />
                      <span className="text-[9px] font-black text-gray-500 leading-none">{lang === "ka" ? c.ka : c.en}</span>
                    </button>
                  ))}
                </div>
              </div>
              {(vehicleType || plateRaw || vehicleColor) && (
                <div className="sm:col-span-2 rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Vehicle preview</p>
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white border-2 border-gray-200"
                        style={selectedColor ? { borderColor: selectedColor.border, background: `${selectedColor.hex}18` } : undefined}>
                        <IconBus size={40} stroke={1.5} className="text-gray-500" />
                      </div>
                      {selectedColor && (
                        <div className="flex items-center gap-1.5 rounded-xl bg-white border border-gray-200 px-3 py-1.5">
                          <div className="h-3.5 w-3.5 rounded-full shrink-0" style={{ background: selectedColor.hex, border: `1.5px solid ${selectedColor.border}` }} />
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

          {/* ── SECTION 4: Accessories ── */}
          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
            {sectionHdr(4, t.step4, t.step4sub)}
            <div className="p-6">
              <div className="flex flex-wrap gap-3">
                {ACCESSORIES.map(a => {
                  const on = accessories.includes(a.id);
                  const Icon = a.icon;
                  return (
                    <button key={a.id} type="button" onClick={() => toggleAccessory(a.id)}
                      className={`flex items-center gap-2.5 rounded-2xl border-2 px-5 py-3 text-sm font-black transition select-none ${
                        on ? "border-violet-500 bg-violet-50 text-violet-700 shadow-sm shadow-violet-100"
                           : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:bg-white"
                      }`}>
                      <Icon size={18} stroke={2} />
                      <span>{lang === "ka" ? a.ka : a.en}</span>
                      {on && <IconCheck size={14} stroke={3} className="text-violet-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
              {accessories.length > 0 && (
                <p className="mt-3 text-xs font-black text-violet-500 flex items-center gap-1">
                  <IconCheck size={14} stroke={3} /> {accessories.length} {lang === "ka" ? "მონიშნულია" : "selected"}
                </p>
              )}
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`rounded-2xl px-5 py-4 text-sm font-extrabold flex items-center gap-2 ${
              msgType === "ok"   ? "bg-green-50 border border-green-200 text-green-700" :
              msgType === "warn" ? "bg-amber-50 border border-amber-200 text-amber-700" :
                                   "bg-red-50 border border-red-200 text-red-600"
            }`}>
              {msgType === "ok"   && <IconCircleCheck size={18} stroke={2.5} />}
              {msgType === "err"  && <IconAlertCircle size={18} stroke={2.5} />}
              {msgType === "warn" && <IconAlertTriangle size={18} stroke={2.5} />}
              {message}
              {msgType === "warn" && <Link href="/auth" className="ml-2 underline font-black">{t.signIn}</Link>}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pb-8">
            <button onClick={handleSubmit} disabled={loading}
              className="h-14 flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 font-black text-white text-base hover:bg-violet-700 disabled:opacity-50 transition shadow-lg shadow-violet-200">
              <IconBus size={20} stroke={2} />
              {loading ? t.publishing : t.submit}
            </button>
            <Link href="/"
              className="flex h-14 items-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 font-black text-gray-700 hover:bg-gray-50 transition">
              <IconArrowLeft size={16} stroke={2.5} /> {t.back}
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
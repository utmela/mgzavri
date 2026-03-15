"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import CustomSelect from "../../components/CustomSelect";
import CustomDateTimePicker from "../../components/CustomDateTimePicker";
import { useLanguage } from "../../components/LanguageProvider";
import {
  IconUser, IconMapPin, IconCalendar, IconPhone, IconCurrencyLari,
  IconUsers, IconNotes, IconSkiJumping, IconLuggage, IconPaw,
  IconCheck, IconArrowLeft, IconPlus, IconMinus,
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

const T = {
  en: {
    title: "Post a request", sub: "Let drivers know you need a ride.",
    from: "From", to: "To", date: "Travel date", passengers: "Passengers",
    budget: "Budget per seat (₾)", budgetHint: "Leave empty if flexible",
    phone: "Phone number", note: "Note (optional)", notePlaceholder: "Any extra info for the driver…",
    submit: "Post request", publishing: "Posting…",
    success: "Request posted successfully!", error: "Please fill in all required fields.",
    sameCity: "From and To cannot be the same.", back: "Back to home",
    choose: "Choose city", loginWarn: "You must be signed in to post a request.",
    signIn: "Sign in",
    step1: "Route", step2: "Details", step3: "Bringing",
    step3sub: "What are you bringing?",
  },
  ka: {
    title: "მოთხოვნის დამატება", sub: "აცნობე მძღოლებს, რომ მგზავრობა გჭირდება.",
    from: "საიდან", to: "სადამდე", date: "მგზავრობის თარიღი", passengers: "მგზავრების რაოდენობა",
    budget: "ბიუჯეტი ერთ ადგილზე (₾)", budgetHint: "დატოვე ცარიელი თუ მოქნილია",
    phone: "ტელეფონის ნომერი", note: "შენიშვნა (სურვილისამებრ)", notePlaceholder: "დამატებითი ინფორმაცია მძღოლისთვის…",
    submit: "მოთხოვნის გამოქვეყნება", publishing: "იტვირთება…",
    success: "მოთხოვნა წარმატებით დაემატა!", error: "შეავსეთ ყველა სავალდებულო ველი.",
    sameCity: "საწყისი და საბოლოო ქალაქი ერთნაირი ვერ იქნება.", back: "მთავარზე დაბრუნება",
    choose: "აირჩიე ქალაქი", loginWarn: "გამოქვეყნებისთვის გაიარე ავტორიზაცია.",
    signIn: "შესვლა",
    step1: "მარშრუტი", step2: "დეტალები", step3: "წამოვიღებ",
    step3sub: "რას წამოიღებ?",
  },
} as const;

type Lang = keyof typeof T;

export default function PostRequestPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const t = T[lang as Lang];

  const [fromCity,    setFromCity]    = useState("");
  const [toCity,      setToCity]      = useState("");
  const [date,        setDate]        = useState("");
  const [passengers,  setPassengers]  = useState(1);
  const [budget,      setBudget]      = useState("");
  const [phone,       setPhone]       = useState("");
  const [note,        setNote]        = useState("");
  const [accessories, setAccessories] = useState<string[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [message,     setMessage]     = useState("");
  const [msgType,     setMsgType]     = useState<"ok" | "err" | "warn">("err");

  function toggleAccessory(id: string) {
    setAccessories(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);
  }

  const inp = "h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm font-extrabold text-gray-800 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition placeholder-gray-400";

  async function handleSubmit() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setMessage(t.loginWarn); setMsgType("warn"); return; }
    if (!fromCity || !toCity || !date || !phone) { setMessage(t.error); setMsgType("err"); return; }
    if (fromCity === toCity) { setMessage(t.sameCity); setMsgType("err"); return; }

    setLoading(true);
    const { error } = await supabase.from("requests").insert([{
      user_id: userData.user.id, from_city: fromCity, to_city: toCity,
      departure_date: date, passengers,
      budget: budget ? Number(budget) : null,
      phone, note: note || null, accessories,
    }]);
    setLoading(false);
    if (error) { setMessage(t.error); setMsgType("err"); return; }
    setMessage(t.success); setMsgType("ok");
    setTimeout(() => { router.push("/"); router.refresh(); }, 1200);
  }

  const sectionHdr = (num: number, label: string, sub?: string) => (
    <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-black text-white">{num}</div>
      <span className="font-black text-gray-800">{label}</span>
      {sub && <span className="ml-1 text-xs font-bold text-gray-400">{sub}</span>}
    </div>
  );

  return (
    <div className="min-h-screen font-sans bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">

        {/* Back */}
        <div className="mb-6">
          <Link href="/"
            className="inline-flex items-center gap-1.5 rounded-2xl border-2 border-gray-200 bg-white px-4 py-2 text-sm font-black text-gray-700 shadow-sm hover:bg-gray-50 hover:text-emerald-600 hover:border-emerald-200 transition">
            <IconArrowLeft size={16} stroke={2.5} /> {t.back}
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-600 shadow-xl shadow-emerald-200">
            <IconUser size={32} stroke={1.5} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900">{t.title}</h1>
          <p className="mt-2 font-extrabold text-gray-500 text-sm">{t.sub}</p>
        </div>

        <div className="space-y-4">

          {/* ── Section 1: Route ── */}
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
                <div className="sm:col-span-2 flex items-center gap-4 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-4">
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">From</p>
                    <p className="text-lg font-black text-emerald-800">{lang === "ka" ? CITIES.find(c => c.en === fromCity)?.ka : fromCity}</p>
                  </div>
                  <div className="flex-1 flex items-center justify-center gap-1">
                    <div className="h-px flex-1 bg-emerald-200" />
                    <IconUser size={20} stroke={1.5} className="text-emerald-500" />
                    <div className="h-px flex-1 bg-emerald-200" />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">To</p>
                    <p className="text-lg font-black text-emerald-800">{lang === "ka" ? CITIES.find(c => c.en === toCity)?.ka : toCity}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Section 2: Details ── */}
          <div className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-visible">
            {sectionHdr(2, t.step2)}
            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-gray-400">
                  <IconCalendar size={12} stroke={2.5} /> {t.date}
                </label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]} className={inp} />
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
                  <IconUsers size={12} stroke={2.5} /> {t.passengers}
                </label>
                <div className="flex items-center gap-3 h-12">
                  <button type="button" onClick={() => setPassengers(p => Math.max(1, p - 1))}
                    className="h-12 w-12 rounded-2xl border border-gray-200 bg-gray-50 font-black text-gray-600 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 active:scale-95 transition shrink-0 flex items-center justify-center">
                    <IconMinus size={16} stroke={2.5} />
                  </button>
                  <div className="flex-1 rounded-2xl border border-emerald-200 bg-emerald-50 h-12 flex items-center justify-center">
                    <span className="text-xl font-black text-emerald-700">{passengers}</span>
                  </div>
                  <button type="button" onClick={() => setPassengers(p => Math.min(20, p + 1))}
                    className="h-12 w-12 rounded-2xl border border-gray-200 bg-gray-50 font-black text-gray-600 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 active:scale-95 transition shrink-0 flex items-center justify-center">
                    <IconPlus size={16} stroke={2.5} />
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-gray-400">
                  <IconCurrencyLari size={12} stroke={2.5} /> {t.budget}
                </label>
                <p className="text-[11px] font-bold text-gray-400 mb-1.5">{t.budgetHint}</p>
                <input type="number" min="0" value={budget} onChange={e => setBudget(e.target.value)}
                  placeholder="20" className={inp + " [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-gray-400">
                  <IconNotes size={12} stroke={2.5} /> {t.note}
                </label>
                <textarea value={note} onChange={e => setNote(e.target.value)}
                  placeholder={t.notePlaceholder} rows={3}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-extrabold text-gray-800 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition placeholder-gray-400 resize-none" />
              </div>
            </div>
          </div>

          {/* ── Section 3: Accessories ── */}
          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
            {sectionHdr(3, t.step3, t.step3sub)}
            <div className="p-6">
              <div className="flex flex-wrap gap-3">
                {ACCESSORIES.map(a => {
                  const on = accessories.includes(a.id);
                  const Icon = a.icon;
                  return (
                    <button key={a.id} type="button" onClick={() => toggleAccessory(a.id)}
                      className={`flex items-center gap-2.5 rounded-2xl border-2 px-5 py-3 text-sm font-black transition select-none ${
                        on ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                           : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:bg-white"
                      }`}>
                      <Icon size={18} stroke={2} />
                      <span>{lang === "ka" ? a.ka : a.en}</span>
                      {on && <IconCheck size={14} stroke={3} className="text-emerald-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
              {accessories.length > 0 && (
                <p className="mt-3 text-xs font-black text-emerald-500 flex items-center gap-1">
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
              className="h-14 flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 font-black text-white text-base hover:bg-emerald-700 disabled:opacity-50 transition shadow-lg shadow-emerald-200">
              <IconUser size={20} stroke={2} />
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
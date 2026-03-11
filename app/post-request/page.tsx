"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import CustomSelect from "../../components/CustomSelect";
import { useLanguage } from "../../components/LanguageProvider";

const CITIES = [
  { en: "Tbilisi",   ka: "თბილისი" },
  { en: "Kutaisi",   ka: "ქუთაისი" },
  { en: "Batumi",    ka: "ბათუმი" },
  { en: "Zugdidi",   ka: "ზუგდიდი" },
  { en: "Gori",      ka: "გორი" },
  { en: "Rustavi",   ka: "რუსთავი" },
  { en: "Telavi",    ka: "თელავი" },
  { en: "Borjomi",   ka: "ბორჯომი" },
  { en: "Bakuriani", ka: "ბაკურიანი" },
  { en: "Gudauri",   ka: "გუდაური" },
  { en: "Poti",      ka: "ფოთი" },
  { en: "Senaki",    ka: "სენაკი" },
  { en: "Samtredia", ka: "სამტრედია" },
  { en: "Kobuleti",  ka: "ქობულეთი" },
  { en: "Ozurgeti",  ka: "ოზურგეთი" },
  { en: "Mestia",    ka: "მესტია" },
] as const;

const T = {
  en: {
    title: "Post a travel request",
    sub: "Let drivers find you — fill in your travel details.",
    from: "From", to: "To",
    date: "Travel date",
    passengers: "Number of passengers",
    budget: "Budget per seat (₾)", budgetHint: "Leave empty if flexible",
    phone: "Your phone number",
    note: "Note (optional)", notePlaceholder: "e.g. need early morning, have luggage…",
    submit: "Post request", submitting: "Posting…",
    success: "Request posted!", successSub: "Drivers will contact you directly.",
    backHome: "← Back to home",
    errorAuth: "You must be signed in to post a request.",
    errorFields: "Please fill in all required fields.",
    errorCity: "From and To cities must be different.",
    signIn: "Sign in",
  },
  ka: {
    title: "მოთხოვნის დამატება",
    sub: "მძღოლებმა რომ გიპოვონ — შეავსე მგზავრობის დეტალები.",
    from: "საიდან", to: "სადამდე",
    date: "მგზავრობის თარიღი",
    passengers: "მგზავრების რაოდენობა",
    budget: "ბიუჯეტი ადგილზე (₾)", budgetHint: "დატოვე ცარიელი თუ მოქნილია",
    phone: "შენი ტელეფონის ნომერი",
    note: "შენიშვნა (არასავალდებულო)", notePlaceholder: "მაგ. დილით მჭირდება, მაქვს ბარგი…",
    submit: "მოთხოვნის დამატება", submitting: "ემატება…",
    success: "მოთხოვნა დაემატა!", successSub: "მძღოლები დაგიკავშირდებიან პირდაპირ.",
    backHome: "← მთავარ გვერდზე",
    errorAuth: "მოთხოვნის დასამატებლად შედი სისტემაში.",
    errorFields: "გთხოვ შეავსო ყველა სავალდებულო ველი.",
    errorCity: "საიდან და სადამდე ქალაქები განსხვავებული უნდა იყოს.",
    signIn: "შესვლა",
  },
} as const;

type Lang = keyof typeof T;

export default function PostRequest() {
  const router = useRouter();
  const { lang } = useLanguage();
  const [user, setUser]           = useState<any>(null);
  const [fromCity, setFromCity]   = useState("");
  const [toCity, setToCity]       = useState("");
  const [date, setDate]           = useState("");
  const [passengers, setPassengers] = useState("1");
  const [budget, setBudget]       = useState("");
  const [phone, setPhone]         = useState("");
  const [note, setNote]           = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState("");
  const t = T[lang as "en" | "ka"];

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    // default date = today
    setDate(new Date().toISOString().split("T")[0]);
  }, []);

  const cityOptions = CITIES.map(c => ({ value: c.en, label: lang === "ka" ? c.ka : c.en }));
  const paxOptions  = [1,2,3,4,5,6,7,8].map(n => ({ value: String(n), label: String(n) }));

  async function handleSubmit() {
    setError("");
    if (!user) { setError(t.errorAuth); return; }
    if (!fromCity || !toCity || !date || !phone) { setError(t.errorFields); return; }
    if (fromCity === toCity) { setError(t.errorCity); return; }

    setSubmitting(true);
    const { error: err } = await supabase.from("requests").insert({
      user_id:        user.id,
      from_city:      fromCity,
      to_city:        toCity,
      departure_date: date,
      passengers:     parseInt(passengers),
      budget:         budget ? parseInt(budget) : null,
      phone,
      note:           note || null,
    });

    if (err) {
      setError(err.message);
      setSubmitting(false);
    } else {
      setSuccess(true);
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">

        {success ? (
          /* ── SUCCESS ── */
          <div className="rounded-3xl border-2 border-emerald-200 bg-white p-12 text-center shadow-md">
            <div className="mb-4 text-6xl">🎉</div>
            <h2 className="text-2xl font-black text-gray-900">{t.success}</h2>
            <p className="mt-2 text-sm font-bold text-gray-500">{t.successSub}</p>
            <Link href="/"
              className="mt-8 inline-flex rounded-2xl bg-emerald-600 px-8 py-3 text-sm font-black text-white hover:bg-emerald-700 transition shadow-md shadow-emerald-200">
              {t.backHome}
            </Link>
          </div>

        ) : (
          <>
            {/* ── HEADER ── */}
            <div className="mb-8 text-center">
              <div className="mb-3 inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-600 text-3xl text-white shadow-xl shadow-violet-200">
                🙋
              </div>
              <h1 className="text-3xl font-black text-gray-900">{t.title}</h1>
              <p className="mt-2 text-sm font-bold text-gray-500">{t.sub}</p>
            </div>

            {/* ── FORM ── */}
            <div className="overflow-hidden rounded-3xl border-2 border-gray-200 bg-white shadow-md">

              {/* Accent bar */}
              <div className="h-2 bg-gradient-to-r from-violet-500 to-purple-500" />

              <div className="p-6 sm:p-8 space-y-6">

                {/* From / To */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {[{ val: fromCity, set: setFromCity, label: t.from },
                    { val: toCity,   set: setToCity,   label: t.to }].map(({ val, set, label }) => (
                    <div key={label}>
                      <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-emerald-500">{label}</label>
                      <CustomSelect value={val} onChange={set} placeholder="—" options={cityOptions} />
                    </div>
                  ))}
                </div>

                {/* Date */}
                <div>
                  <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-violet-500">{t.date}</label>
                  <input
                    type="date"
                    value={date}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={e => setDate(e.target.value)}
                    className="w-full h-12 rounded-2xl border-2 border-gray-200 bg-gray-50 px-4 text-sm font-bold text-gray-800 focus:border-violet-400 focus:outline-none transition"
                  />
                </div>

                {/* Passengers */}
                <div>
                  <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-violet-500">{t.passengers}</label>
                  <div className="flex flex-wrap gap-2">
                    {[1,2,3,4,5,6,7,8].map(n => (
                      <button key={n} onClick={() => setPassengers(String(n))}
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl border-2 text-sm font-black transition ${
                          passengers === String(n)
                            ? "border-violet-500 bg-violet-600 text-white shadow-md shadow-violet-200"
                            : "border-gray-200 bg-gray-50 text-gray-700 hover:border-violet-300"
                        }`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Budget */}
                <div>
                  <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-violet-500">{t.budget}</label>
                  <div className="relative">
                    <input
                      type="number" min="0" placeholder={t.budgetHint}
                      value={budget} onChange={e => setBudget(e.target.value)}
                      className="w-full h-12 rounded-2xl border-2 border-gray-200 bg-gray-50 px-4 pr-10 text-sm font-bold text-gray-800 placeholder-gray-400 focus:border-violet-400 focus:outline-none transition"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-black text-gray-400">₾</span>
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-violet-500">{t.phone}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-gray-400">+995</span>
                    <input
                      type="tel" placeholder="5XX XXX XXX"
                      value={phone} onChange={e => setPhone(e.target.value)}
                      className="w-full h-12 rounded-2xl border-2 border-gray-200 bg-gray-50 pl-16 pr-4 text-sm font-bold text-gray-800 placeholder-gray-400 focus:border-violet-400 focus:outline-none transition"
                    />
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-violet-500">{t.note}</label>
                  <textarea
                    rows={3} placeholder={t.notePlaceholder}
                    value={note} onChange={e => setNote(e.target.value)}
                    className="w-full rounded-2xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-800 placeholder-gray-400 focus:border-violet-400 focus:outline-none transition resize-none"
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                    ⚠️ {error}
                  </div>
                )}

                {/* Not logged in warning */}
                {!user && (
                  <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700 flex items-center justify-between gap-3">
                    <span>⚠️ {t.errorAuth}</span>
                    <Link href="/auth" className="rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-black text-white hover:bg-amber-600 transition shrink-0">
                      {t.signIn}
                    </Link>
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !user}
                  className="w-full h-14 rounded-2xl bg-violet-600 text-base font-black text-white hover:bg-violet-700 disabled:opacity-50 transition shadow-lg shadow-violet-200"
                >
                  {submitting ? t.submitting : `🙋 ${t.submit}`}
                </button>

                <Link href="/" className="block text-center text-sm font-bold text-gray-400 hover:text-gray-600 transition">
                  {t.backHome}
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
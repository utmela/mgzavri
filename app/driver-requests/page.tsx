"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconCalendar, IconCoin, IconLoader2, IconPhone, IconRoute, IconUsers } from "@tabler/icons-react";
import AccessoriesBadges from "../../components/accessoriesBadges";
import CustomSelect from "../../components/CustomSelect";
import { useLanguage } from "../../components/LanguageProvider";
import RoutePhotoBanner from "../../components/RoutePhotoBanner";
import ScenicPageHero from "../../components/ScenicPageHero";
import { cityLabel, cityOptions, type Lang } from "../../lib/cities";
import { formatDateTime, formatPrice } from "../../lib/format";
import { api } from "../../lib/api";
import { supabase } from "../../lib/supabase";
import type { PassengerRequest } from "../../lib/types";

const COPY = {
  en: {
    eyebrow: "DRIVER OPPORTUNITIES",
    title: "Passenger requests",
    subtitle: "See where passengers need to travel, then contact them and post a matching trip.",
    from: "From any city",
    to: "To any city",
    results: "open requests",
    passengers: "passengers",
    budget: "Preferred budget",
    flexible: "Budget flexible",
    call: "Call passenger",
    post: "Post this route",
    empty: "No requests match this route yet.",
    emptyText: "Clear the filters or check again soon as passengers add new routes.",
    loading: "Loading passenger requests...",
    signIn: "Sign in to view passenger requests",
    signInText: "This area is for drivers who want to find routes with active demand.",
    signInButton: "Sign in",
    error: "Requests could not be loaded.",
  },
  ka: {
    eyebrow: "შესაძლებლობები მძღოლებისთვის",
    title: "მგზავრების მოთხოვნები",
    subtitle: "ნახეთ, სად სურთ მგზავრებს გამგზავრება, დაუკავშირდით და დაამატეთ შესაბამისი რეისი.",
    from: "ნებისმიერი ქალაქიდან",
    to: "ნებისმიერ ქალაქამდე",
    results: "ღია მოთხოვნა",
    passengers: "მგზავრი",
    budget: "სასურველი ბიუჯეტი",
    flexible: "ბიუჯეტი შეთანხმებით",
    call: "მგზავრთან დარეკვა",
    post: "ამ მარშრუტის დამატება",
    empty: "ამ მარშრუტზე მოთხოვნა ჯერ არ არის.",
    emptyText: "გაასუფთავეთ ფილტრები ან შეამოწმეთ მოგვიანებით.",
    loading: "მოთხოვნები იტვირთება...",
    signIn: "მოთხოვნების სანახავად შედით ანგარიშში",
    signInText: "ეს სივრცე განკუთვნილია მძღოლებისთვის, რომლებიც აქტიურ მარშრუტებს ეძებენ.",
    signInButton: "შესვლა",
    error: "მოთხოვნების ჩატვირთვა ვერ მოხერხდა.",
  },
} as const;

export default function DriverRequestsPage() {
  const { lang } = useLanguage() as { lang: Lang };
  const text = COPY[lang];
  const [requests, setRequests] = useState<PassengerRequest[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(true);
  const [error, setError] = useState("");
  const [driverAccess, setDriverAccess] = useState(false);

  useEffect(() => {
    async function loadRequests() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        setSignedIn(false);
        setLoading(false);
        return;
      }

      const { data: profile, error: accessError } = await api<{ role: string }>("/profile");
      if (accessError || !["driver", "verified_driver", "admin"].includes(profile?.role ?? "")) {
        if (accessError) setError(text.error);
        setLoading(false);
        return;
      }
      setDriverAccess(true);
      const { data, error: requestError } = await api<PassengerRequest[]>("/requests");

      if (requestError) setError(requestError.message || text.error);
      setRequests((data ?? []) as PassengerRequest[]);
      setLoading(false);
    }

    void loadRequests();
  }, [text.error]);

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center text-sm font-bold text-slate-500"><IconLoader2 size={18} className="mr-2 animate-spin text-violet-700" />{text.loading}</div>;
  if (!signedIn) return <section className="mx-auto max-w-lg px-4 py-20 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-100 text-violet-800"><IconRoute size={28} /></span><h1 className="mt-5 text-2xl font-black text-slate-950">{text.signIn}</h1><p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{text.signInText}</p><Link href="/auth" className="mt-6 inline-flex rounded-xl bg-violet-950 px-5 py-3 text-sm font-black text-white hover:bg-violet-900">{text.signInButton}</Link></section>;

  if (!driverAccess) return <section className="mx-auto max-w-lg px-4 py-20 text-center"><IconRoute size={32} className="mx-auto text-violet-800" /><p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-violet-700">{lang === "ka" ? "მგზავრის ანგარიში" : "Passenger account"}</p><h1 className="mt-2 text-2xl font-black text-slate-950">{lang === "ka" ? "საჭიროა მძღოლის წვდომა" : "Driver access required"}</h1><p className="mt-3 text-sm leading-6 text-slate-600">{lang === "ka" ? "მგზავრების მოთხოვნებზე წვდომისთვის საჭიროა დადასტურებული მძღოლის ანგარიში." : "Passenger requests are available only to approved driver accounts."}</p>{error && <p role="alert" className="mt-4 text-red-700">{error}</p>}<Link href="/post-request" className="mt-6 inline-flex rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white">{lang === "ka" ? "მგზავრის მოთხოვნის დამატება" : "Post a passenger request"}</Link></section>;
  const filtered = requests.filter((request) => (!from || request.from_city === from) && (!to || request.to_city === to));
  return (
    <section className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#d1fae5_0,_#f8fafc_34%,_#f8fafc_100%)]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <ScenicPageHero tone="driver" showRoute={false} eyebrow={text.eyebrow} title={text.title} subtitle={text.subtitle} lang={lang} meta={<span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-black backdrop-blur">{requests.length} {text.results}</span>} />

        <section className="relative z-10 mx-auto -mt-5 grid max-w-4xl gap-3 rounded-2xl border border-white/80 bg-white/95 p-4 shadow-xl shadow-violet-950/10 backdrop-blur sm:grid-cols-2 sm:p-5">
          <CustomSelect value={from} onChange={setFrom} options={cityOptions(lang)} placeholder={text.from} />
          <CustomSelect value={to} onChange={setTo} options={cityOptions(lang)} placeholder={text.to} />
        </section>

        {error && <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}

        {filtered.length === 0 ? (
          <section className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center"><IconRoute size={34} className="mx-auto text-slate-400" /><h2 className="mt-4 text-xl font-black text-slate-950">{text.empty}</h2><p className="mt-2 text-sm font-semibold text-slate-600">{text.emptyText}</p></section>
        ) : (
          <section className="mt-8 grid gap-5 md:grid-cols-2">
            {filtered.map((request) => (
              <article key={request.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-xl hover:shadow-violet-950/10">
                <RoutePhotoBanner from={request.from_city} to={request.to_city} lang={lang} compact />
                <div className="p-5">
                  <h2 className="text-xl font-black text-slate-950">{cityLabel(request.from_city, lang)} <span className="text-violet-600">→</span> {cityLabel(request.to_city, lang)}</h2>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-slate-50 p-3"><IconCalendar size={17} className="text-violet-700" /><p className="mt-2 text-sm font-black text-slate-900">{formatDateTime(request.departure_date, lang, { day: "numeric", month: "long", year: "numeric" })}</p></div>
                    <div className="rounded-2xl bg-slate-50 p-3"><IconUsers size={17} className="text-violet-700" /><p className="mt-2 text-sm font-black text-slate-900">{request.passengers} {text.passengers}</p></div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-black text-violet-950"><IconCoin size={18} className="text-violet-600" /><span>{text.budget}: {request.budget ? formatPrice(request.budget, lang) : text.flexible}</span></div>
                  {request.note && <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">{request.note}</p>}
                  <div className="mt-4"><AccessoriesBadges accessories={request.accessories} lang={lang} size="sm" /></div>
                  <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    <a href={`tel:${request.phone}`} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-violet-950 px-4 text-sm font-black text-white hover:bg-violet-900"><IconPhone size={16} />{text.call}</a>
                    <Link href={`/post?from=${encodeURIComponent(request.from_city)}&to=${encodeURIComponent(request.to_city)}`} className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-violet-200 bg-violet-50 px-4 text-center text-sm font-black text-violet-900 hover:bg-violet-100">{text.post}</Link>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </section>
  );
}

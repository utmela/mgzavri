"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconLoader2, IconPlus, IconRoute, IconTrash } from "@tabler/icons-react";
import { api } from "../../lib/api";
import { cityLabel } from "../../lib/cities";
import type { PassengerRequest } from "../../lib/types";
import { useProfileRole } from "../../lib/useProfileRole";
import { useLanguage } from "../../components/LanguageProvider";
import ScenicPageHero from "../../components/ScenicPageHero";

const COPY = {
  en: { title: "My passenger requests", subtitle: "Keep track of the routes you need and remove requests when your plans change.", add: "Post a request", empty: "You have no passenger requests yet.", signIn: "Sign in to manage your passenger requests.", remove: "Remove request", confirm: "Remove this passenger request?", passengers: "passengers", flexible: "Budget flexible", loading: "Loading requests...", more: "Load more" },
  ka: { title: "ჩემი მგზავრობის მოთხოვნები", subtitle: "ნახეთ თქვენი სასურველი მარშრუტები და წაშალეთ მოთხოვნა, თუ გეგმები შეიცვლება.", add: "მოთხოვნის დამატება", empty: "მგზავრობის მოთხოვნა ჯერ არ გაქვთ.", signIn: "თქვენი მოთხოვნების სამართავად შედით ანგარიშში.", remove: "მოთხოვნის წაშლა", confirm: "წაიშალოს მგზავრობის მოთხოვნა?", passengers: "მგზავრი", flexible: "ბიუჯეტი შეთანხმებით", loading: "მოთხოვნები იტვირთება...", more: "მეტის ჩატვირთვა" },
} as const;

export default function MyRequestsPage() {
  const { lang } = useLanguage();
  const text = COPY[lang];
  const { user, loading: authLoading } = useProfileRole();
  const [requests, setRequests] = useState<PassengerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    api<PassengerRequest[]>("/requests?scope=mine").then(({ data, error }) => {
      if (!active) return;
      setRequests(data ?? []);
      setHasMore(data?.length === 100);
      setError(error?.message ?? "");
      setLoading(false);
    });
    return () => { active = false; };
  }, [user]);

  async function loadMore() {
    setLoading(true);
    const { data, error } = await api<PassengerRequest[]>(`/requests?scope=mine&offset=${requests.length}`);
    if (error) setError(error.message);
    else { setRequests((current) => [...current, ...(data ?? [])]); setHasMore(data?.length === 100); }
    setLoading(false);
  }

  async function remove(id: string) {
    if (!window.confirm(text.confirm)) return;
    setBusyId(id);
    setError("");
    const { error } = await api(`/requests/${id}`, { method: "DELETE" });
    if (error) setError(error.message);
    else setRequests((current) => current.filter((item) => item.id !== id));
    setBusyId(null);
  }

  if (authLoading) return <div className="grid min-h-[50vh] place-items-center"><IconLoader2 aria-label={text.loading} className="animate-spin text-violet-700" /></div>;
  if (!user) return <section className="mx-auto max-w-lg px-4 py-20 text-center"><h1 className="text-2xl font-black">{text.signIn}</h1><Link href="/auth" className="mt-6 inline-flex rounded-xl bg-violet-700 px-5 py-3 font-bold text-white">{lang === "ka" ? "შესვლა" : "Sign in"}</Link></section>;

  return <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
    <ScenicPageHero showRoute={false} eyebrow={lang === "ka" ? "მგზავრის გვერდი" : "PASSENGER DASHBOARD"} title={text.title} subtitle={text.subtitle} lang={lang} action={<Link href="/post-request" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-violet-950"><IconPlus size={16} />{text.add}</Link>} />
    {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 font-semibold text-red-700">{error}</p>}
    {loading && requests.length === 0 ? <p role="status" className="py-12 text-center font-semibold text-slate-500">{text.loading}</p> : requests.length === 0 && !error ? <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-10 text-center"><IconRoute size={32} className="mx-auto text-violet-700" /><p className="mt-4 font-semibold text-slate-600">{text.empty}</p></div> : <div className="mt-6 space-y-3">{requests.map((request) => <article key={request.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div><h2 className="font-black text-slate-900">{cityLabel(request.from_city, lang)} → {cityLabel(request.to_city, lang)}</h2><p className="mt-2 text-sm font-semibold text-slate-500">{request.departure_date} · {request.passengers} {text.passengers} · {request.budget == null ? text.flexible : `${request.budget} GEL`}</p>{request.note && <p className="mt-2 text-sm text-slate-600">{request.note}</p>}</div>
      <button type="button" disabled={busyId === request.id} onClick={() => void remove(request.id)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"><IconTrash size={16} />{text.remove}</button>
    </article>)}</div>}
    {hasMore && <button type="button" disabled={loading} onClick={() => void loadMore()} className="mt-6 rounded-xl bg-violet-700 px-5 py-3 font-bold text-white disabled:opacity-50">{loading ? text.loading : text.more}</button>}
  </section>;
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import {
  IconShield, IconRefresh, IconArrowLeft, IconTrash,
  IconBus, IconBookmark, IconChartBar, IconSearch,
  IconLoader2, IconEye, IconUser,
} from "@tabler/icons-react";

const ADMIN_IDS: string[] = [
  "5d249be0-a9a5-43da-a4fd-b43f75fe09b0",
  "110e686c-d3b4-4060-b72e-ffd0c6cc9727",
];

type Ride = {
  id: string; user_id: string; from_city: string; to_city: string;
  price_per_seat: number; seats_total: number; seats_available: number;
  phone: string; vehicle_type: string; departure_time: string;
  plate_number?: string; vehicle_color?: string; created_at?: string;
};

type Request = {
  id: string; user_id: string; from_city: string; to_city: string;
  departure_date: string; passengers: number; budget?: number;
  phone: string; note?: string; created_at: string;
};

type Booking = {
  id: string; ride_id: string; user_id: string;
  seats: number; status: string; created_at: string;
  passenger_name?: string; passenger_phone?: string;
};

type Tab = "rides" | "requests" | "bookings" | "stats";

export default function AdminPage() {
  const router = useRouter();
  const [user,       setUser]       = useState<any>(null);
  const [authReady,  setAuthReady]  = useState(false);
  const [rides,      setRides]      = useState<Ride[]>([]);
  const [requests,   setRequests]   = useState<Request[]>([]);
  const [bookings,   setBookings]   = useState<Booking[]>([]);
  const [tab,        setTab]        = useState<Tab>("rides");
  const [loading,    setLoading]    = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search,     setSearch]     = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      setUser(u);
      setAuthReady(true);
      if (!u || !ADMIN_IDS.includes(u.id)) router.replace("/");
    });
  }, []);

  async function loadAll() {
    setLoading(true);
    const [rRes, reqRes, bRes] = await Promise.all([
      supabase.from("rides").select("*").order("created_at", { ascending: false }),
      supabase.from("requests").select("*").order("created_at", { ascending: false }),
      supabase.from("bookings").select("*").order("created_at", { ascending: false }),
    ]);
    setRides(rRes.data ?? []);
    setRequests(reqRes.data ?? []);
    setBookings(bRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => { if (authReady && user && ADMIN_IDS.includes(user.id)) loadAll(); }, [authReady]);

  async function deleteRide(id: string) {
    if (!confirm("Permanently delete this ride and all its bookings?")) return;
    setDeletingId(id);
    await supabase.from("bookings").delete().eq("ride_id", id);
    const { error } = await supabase.from("rides").delete().eq("id", id);
    if (error) alert("Error: " + error.message);
    else await loadAll();
    setDeletingId(null);
  }

  async function deleteRequest(id: string) {
    if (!confirm("Delete this passenger request?")) return;
    setDeletingId(id);
    const { error } = await supabase.from("requests").delete().eq("id", id);
    if (error) alert("Error: " + error.message);
    else await loadAll();
    setDeletingId(null);
  }

  async function deleteBooking(id: string) {
    if (!confirm("Cancel this booking?")) return;
    const { error } = await supabase.from("bookings").delete().eq("id", id);
    if (error) alert("Error: " + error.message);
    else await loadAll();
  }

  if (!authReady) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex items-center gap-2 text-sm font-black text-gray-500">
        <IconLoader2 size={18} className="animate-spin text-violet-400" /> Checking auth…
      </div>
    </div>
  );
  if (!user || !ADMIN_IDS.includes(user.id)) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-sm font-black text-gray-400">Access denied.</p>
    </div>
  );

  const totalRevenue = bookings.reduce((s, b) => {
    const ride = rides.find(r => r.id === b.ride_id);
    return s + (ride ? ride.price_per_seat * b.seats : 0);
  }, 0);

  const q = search.toLowerCase();
  const filteredRides    = rides.filter(r =>
    !q || r.from_city.toLowerCase().includes(q) || r.to_city.toLowerCase().includes(q) ||
    r.phone.includes(q) || r.vehicle_type?.toLowerCase().includes(q));
  const filteredRequests = requests.filter(r =>
    !q || r.from_city.toLowerCase().includes(q) || r.to_city.toLowerCase().includes(q) ||
    r.phone.includes(q));
  const filteredBookings = bookings.filter(b =>
    !q || b.ride_id.includes(q) || b.passenger_phone?.includes(q) ||
    b.passenger_name?.toLowerCase().includes(q));

  const tabs: { key: Tab; icon: React.ReactNode; label: string; count: number }[] = [
    { key: "rides",    icon: <IconBus size={15} stroke={2.5} />,      label: "Rides",    count: rides.length },
    { key: "requests", icon: <IconUser size={15} stroke={2.5} />,     label: "Requests", count: requests.length },
    { key: "bookings", icon: <IconBookmark size={15} stroke={2.5} />, label: "Bookings", count: bookings.length },
    { key: "stats",    icon: <IconChartBar size={15} stroke={2.5} />, label: "Stats",    count: 0 },
  ];

  const thCls = "px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap";
  const tdCls = "px-4 py-3";

  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      {/* Admin header */}
      <div className="sticky top-0 z-50 border-b border-amber-200 bg-amber-50/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500">
              <IconShield size={16} stroke={2} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-black text-gray-900 leading-none">Admin Panel</p>
              <p className="text-[11px] font-bold text-gray-400">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-black text-amber-700 hover:bg-amber-100 transition">
              <IconRefresh size={13} stroke={2.5} /> Refresh
            </button>
            <Link href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-black text-gray-600 hover:bg-gray-100 transition">
              <IconArrowLeft size={13} stroke={2.5} /> Back to site
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 space-y-5">

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: <IconBus size={18} stroke={1.5} className="text-violet-500" />,      val: rides.length,       label: "Total rides",     bg: "bg-violet-50" },
            { icon: <IconUser size={18} stroke={1.5} className="text-emerald-500" />,    val: requests.length,    label: "Requests",        bg: "bg-emerald-50" },
            { icon: <IconBookmark size={18} stroke={1.5} className="text-blue-500" />,   val: bookings.length,    label: "Bookings",        bg: "bg-blue-50" },
            { icon: <IconChartBar size={18} stroke={1.5} className="text-amber-500" />,  val: `${totalRevenue}₾`, label: "Est. revenue",    bg: "bg-amber-50" },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl border border-gray-200 ${s.bg} p-4`}>
              <div className="mb-2">{s.icon}</div>
              <p className="text-2xl font-black text-gray-900">{s.val}</p>
              <p className="text-[11px] font-black text-gray-500 uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 rounded-2xl border border-gray-200 bg-white p-1 shadow-sm w-fit">
          {tabs.map(tb => (
            <button key={tb.key} onClick={() => setTab(tb.key)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black transition ${
                tab === tb.key
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
              }`}>
              {tb.icon} {tb.label}
              {tb.count > 0 && (
                <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                  tab === tb.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                }`}>{tb.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <IconSearch size={15} stroke={2.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by city, phone, vehicle…"
            className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm font-extrabold text-gray-700 outline-none focus:border-violet-400 transition" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm font-black text-gray-400">
            <IconLoader2 size={18} className="mr-2 animate-spin text-violet-400" /> Loading…
          </div>

        ) : tab === "rides" ? (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {["Route", "Departure", "Vehicle / Plate", "Seats", "Price", "Phone", "User ID", "Actions"].map(h => (
                      <th key={h} className={thCls}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRides.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50 transition">
                      <td className={tdCls + " font-black text-gray-900 whitespace-nowrap"}>{r.from_city} → {r.to_city}</td>
                      <td className={tdCls + " font-bold text-gray-600 whitespace-nowrap text-xs"}>{new Date(r.departure_time).toLocaleString()}</td>
                      <td className={tdCls + " font-bold text-gray-700 whitespace-nowrap"}>{r.vehicle_type || "—"}{r.plate_number ? ` · ${r.plate_number}` : ""}</td>
                      <td className={tdCls + " font-black text-gray-800 whitespace-nowrap"}>{r.seats_available}/{r.seats_total}</td>
                      <td className={tdCls + " font-black text-violet-700 whitespace-nowrap"}>{r.price_per_seat}₾</td>
                      <td className={tdCls + " whitespace-nowrap"}>
                        <a href={`tel:${r.phone}`} className="font-black text-violet-600 hover:underline">{r.phone}</a>
                      </td>
                      <td className={tdCls + " font-mono text-xs text-gray-400 whitespace-nowrap"} title={r.user_id}>{r.user_id?.slice(0, 8)}…</td>
                      <td className={tdCls + " whitespace-nowrap"}>
                        <div className="flex items-center gap-2">
                          <Link href={`/ride/${r.id}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-black text-gray-600 hover:bg-gray-200 transition">
                            <IconEye size={12} stroke={2.5} /> View
                          </Link>
                          <button onClick={() => deleteRide(r.id)} disabled={deletingId === r.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-red-500 px-2.5 py-1.5 text-xs font-black text-white hover:bg-red-600 transition disabled:opacity-50">
                            <IconTrash size={12} stroke={2.5} /> {deletingId === r.id ? "…" : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredRides.length === 0 && (
                    <tr><td colSpan={8} className="py-12 text-center text-sm font-black text-gray-400">No rides found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        ) : tab === "requests" ? (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {["Route", "Date", "Passengers", "Budget", "Phone", "Note", "User ID", "Actions"].map(h => (
                      <th key={h} className={thCls}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRequests.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50 transition">
                      <td className={tdCls + " font-black text-gray-900 whitespace-nowrap"}>{r.from_city} → {r.to_city}</td>
                      <td className={tdCls + " font-bold text-gray-600 whitespace-nowrap text-xs"}>{new Date(r.departure_date).toLocaleDateString()}</td>
                      <td className={tdCls + " font-black text-gray-800"}>{r.passengers}</td>
                      <td className={tdCls + " font-black text-violet-700 whitespace-nowrap"}>
                        {r.budget ? `${r.budget}₾` : <span className="italic text-gray-400 font-bold text-xs">flexible</span>}
                      </td>
                      <td className={tdCls + " whitespace-nowrap"}>
                        <a href={`tel:${r.phone}`} className="font-black text-violet-600 hover:underline">{r.phone}</a>
                      </td>
                      <td className={tdCls + " text-xs font-bold text-gray-500 max-w-[160px] truncate"}>{r.note || "—"}</td>
                      <td className={tdCls + " font-mono text-xs text-gray-400 whitespace-nowrap"} title={r.user_id}>{r.user_id?.slice(0, 8)}…</td>
                      <td className={tdCls + " whitespace-nowrap"}>
                        <button onClick={() => deleteRequest(r.id)} disabled={deletingId === r.id}
                          className="inline-flex items-center gap-1 rounded-lg bg-red-500 px-2.5 py-1.5 text-xs font-black text-white hover:bg-red-600 transition disabled:opacity-50">
                          <IconTrash size={12} stroke={2.5} /> {deletingId === r.id ? "…" : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredRequests.length === 0 && (
                    <tr><td colSpan={8} className="py-12 text-center text-sm font-black text-gray-400">No requests found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        ) : tab === "bookings" ? (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {["ID", "Ride", "Passenger", "Phone", "Seats", "Status", "Date", "Actions"].map(h => (
                      <th key={h} className={thCls}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBookings.map(b => {
                    const ride = rides.find(r => r.id === b.ride_id);
                    return (
                      <tr key={b.id} className="hover:bg-gray-50 transition">
                        <td className={tdCls + " font-mono text-xs text-gray-400"}>{b.id.slice(0, 8)}…</td>
                        <td className={tdCls + " font-black text-gray-800 whitespace-nowrap"}>
                          {ride ? `${ride.from_city} → ${ride.to_city}` : <span className="italic text-gray-400">deleted</span>}
                        </td>
                        <td className={tdCls + " font-bold text-gray-700"}>{b.passenger_name || "—"}</td>
                        <td className={tdCls + " whitespace-nowrap"}>
                          {b.passenger_phone
                            ? <a href={`tel:${b.passenger_phone}`} className="font-black text-violet-600 hover:underline">{b.passenger_phone}</a>
                            : "—"}
                        </td>
                        <td className={tdCls + " font-black text-violet-700"}>{b.seats}</td>
                        <td className={tdCls}>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                            b.status === "confirmed" ? "bg-emerald-100 text-emerald-700" :
                            b.status === "cancelled" ? "bg-red-100 text-red-600" :
                            "bg-gray-100 text-gray-600"
                          }`}>{b.status}</span>
                        </td>
                        <td className={tdCls + " text-xs font-bold text-gray-500 whitespace-nowrap"}>{new Date(b.created_at).toLocaleDateString()}</td>
                        <td className={tdCls}>
                          <button onClick={() => deleteBooking(b.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-red-500 px-2.5 py-1.5 text-xs font-black text-white hover:bg-red-600 transition">
                            <IconTrash size={12} stroke={2.5} /> Cancel
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredBookings.length === 0 && (
                    <tr><td colSpan={8} className="py-12 text-center text-sm font-black text-gray-400">No bookings found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Top Routes</h3>
              {Object.entries(
                rides.reduce<Record<string, number>>((acc, r) => {
                  const k = `${r.from_city} → ${r.to_city}`;
                  acc[k] = (acc[k] ?? 0) + 1;
                  return acc;
                }, {})
              ).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([route, cnt]) => (
                <div key={route} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm font-black text-gray-800">{route}</span>
                  <span className="text-sm font-black text-violet-600">{cnt} rides</span>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Price Distribution</h3>
              {[0, 10, 20, 30, 40, 50].map((min, i, arr) => {
                const max = arr[i + 1] ?? Infinity;
                const cnt = rides.filter(r => r.price_per_seat >= min && r.price_per_seat < max).length;
                const pct = rides.length ? Math.round(cnt / rides.length * 100) : 0;
                return max === Infinity ? null : (
                  <div key={min} className="mb-3">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-black text-gray-600">{min}₾ – {max}₾</span>
                      <span className="text-xs font-black text-violet-600">{cnt} rides</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
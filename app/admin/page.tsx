"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

// ── Same list as in page.tsx — keep in sync (or extract to a shared constant)
const ADMIN_IDS: string[] = [
  // "your-admin-uuid-here",
];

type Ride = {
  id: string; user_id: string;
  from_city: string; to_city: string;
  price_per_seat: number; seats_total: number; seats_available: number;
  phone: string; vehicle_type: string; departure_time: string;
  plate_number?: string; vehicle_color?: string;
  created_at?: string;
};

type Booking = {
  id: string; ride_id: string; user_id: string;
  seats: number; status: string; created_at: string;
  passenger_name?: string; passenger_phone?: string;
};

export default function AdminPage() {
 const ADMIN_IDS: string[] = [
  "5d249be0-a9a5-43da-a4fd-b43f75fe09b0",
  "110e686c-d3b4-4060-b72e-ffd0c6cc9727",
];
  const router = useRouter();
  const [user,       setUser]       = useState<any>(null);
  const [authReady,  setAuthReady]  = useState(false);
  const [rides,      setRides]      = useState<Ride[]>([]);
  const [bookings,   setBookings]   = useState<Booking[]>([]);
  const [tab,        setTab]        = useState<"rides" | "bookings" | "stats">("rides");
  const [loading,    setLoading]    = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search,     setSearch]     = useState("");

  /* ── Auth guard ── */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      setUser(u);
      setAuthReady(true);
      if (!u || !ADMIN_IDS.includes(u.id)) router.replace("/");
    });
  }, []);

  /* ── Load data ── */
  async function loadAll() {
    setLoading(true);
    const [rRes, bRes] = await Promise.all([
      supabase.from("rides").select("*").order("created_at", { ascending: false }),
      supabase.from("bookings").select("*").order("created_at", { ascending: false }),
    ]);
    setRides(rRes.data   ?? []);
    setBookings(bRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => { if (authReady && user && ADMIN_IDS.includes(user.id)) loadAll(); }, [authReady]);

  async function deleteRide(id: string) {
    if (!confirm("Permanently delete this ride and all its bookings?")) return;
    setDeletingId(id);
    // delete bookings first (FK)
    await supabase.from("bookings").delete().eq("ride_id", id);
    const { error } = await supabase.from("rides").delete().eq("id", id);
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

  /* ── Guard rendering ── */
  if (!authReady) return <div className="min-h-screen flex items-center justify-center text-sm text-gray-400">Checking auth…</div>;
  if (!user || !ADMIN_IDS.includes(user.id))
    return <div className="min-h-screen flex items-center justify-center text-sm text-gray-400">Access denied.</div>;

  /* ── Stats ── */
  const totalRevenue = bookings.reduce((s, b) => {
    const ride = rides.find(r => r.id === b.ride_id);
    return s + (ride ? ride.price_per_seat * b.seats : 0);
  }, 0);
  const totalSeats = rides.reduce((s, r) => s + r.seats_available, 0);

  /* ── Filtered ── */
  const q = search.toLowerCase();
  const filteredRides = rides.filter(r =>
    !q || r.from_city.toLowerCase().includes(q) || r.to_city.toLowerCase().includes(q) ||
    r.phone.includes(q) || r.vehicle_type?.toLowerCase().includes(q));
  const filteredBookings = bookings.filter(b =>
    !q || b.ride_id.includes(q) || b.passenger_phone?.includes(q) || b.passenger_name?.toLowerCase().includes(q));

  const tabs = [
    { key: "rides",    label: `🚐 Rides (${rides.length})` },
    { key: "bookings", label: `📖 Bookings (${bookings.length})` },
    { key: "stats",    label: "📊 Stats" },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      {/* Header */}
      <div className="sticky top-0 z-50 border-b-2 border-amber-200 bg-amber-50/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 text-xl text-white shadow-md">🛡</div>
            <div>
              <p className="text-base font-black text-gray-900 leading-tight">mgzavri admin</p>
              <p className="text-xs font-semibold text-gray-400">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadAll} className="rounded-xl border-2 border-amber-300 bg-white px-3 py-1.5 text-xs font-black text-amber-700 hover:bg-amber-100 transition">
              🔄 Refresh
            </button>
            <Link href="/" className="rounded-xl border-2 border-gray-200 bg-white px-3 py-1.5 text-xs font-black text-gray-600 hover:bg-gray-100 transition">
              ← Back to site
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-6">

        {/* Quick stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: "🚐", val: rides.length,    label: "Total rides" },
            { icon: "📖", val: bookings.length,  label: "Bookings" },
            { icon: "💺", val: totalSeats,       label: "Seats available" },
            { icon: "💰", val: `${totalRevenue}₾`, label: "Est. revenue" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border-2 border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-2xl mb-1">{s.icon}</p>
              <p className="text-2xl font-black text-gray-900">{s.val}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b-2 border-gray-200">
          {tabs.map(tb => (
            <button key={tb.key} onClick={() => setTab(tb.key)}
              className={`px-5 py-2.5 text-sm font-black rounded-t-xl border-2 border-b-0 transition -mb-0.5 ${tab === tb.key ? "border-amber-400 bg-amber-50 text-amber-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              {tb.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by city, phone, vehicle…"
          className="w-full rounded-2xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 outline-none focus:border-violet-400 transition" />

        {loading ? (
          <div className="flex items-center justify-center py-20 text-sm font-bold text-gray-400">Loading…</div>
        ) : tab === "rides" ? (
          /* ─── RIDES TABLE ─── */
          <div className="overflow-hidden rounded-3xl border-2 border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-100 bg-gray-50">
                    {["Route", "Departure", "Vehicle / Plate", "Seats", "Price", "Phone", "User", "Actions"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRides.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-black text-gray-900 whitespace-nowrap">
                        {r.from_city} → {r.to_city}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">
                        {new Date(r.departure_time).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">
                        {r.vehicle_type || "—"}{r.plate_number ? ` · ${r.plate_number}` : ""}
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-700 whitespace-nowrap">
                        {r.seats_available}/{r.seats_total}
                      </td>
                      <td className="px-4 py-3 font-black text-violet-700 whitespace-nowrap">{r.price_per_seat}₾</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <a href={`tel:${r.phone}`} className="font-bold text-violet-600 hover:underline">{r.phone}</a>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-400 whitespace-nowrap max-w-[100px] truncate" title={r.user_id}>
                        {r.user_id?.slice(0, 8)}…
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Link href={`/ride/${r.id}`}
                            className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-black text-gray-600 hover:bg-gray-200 transition">
                            View
                          </Link>
                          <button onClick={() => deleteRide(r.id)} disabled={deletingId === r.id}
                            className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-black text-white hover:bg-red-600 transition disabled:opacity-50">
                            {deletingId === r.id ? "…" : "🗑 Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredRides.length === 0 && (
                    <tr><td colSpan={8} className="py-12 text-center text-sm font-bold text-gray-400">No rides found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : tab === "bookings" ? (
          /* ─── BOOKINGS TABLE ─── */
          <div className="overflow-hidden rounded-3xl border-2 border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-100 bg-gray-50">
                    {["Booking ID", "Ride", "Passenger", "Phone", "Seats", "Status", "Date", "Actions"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBookings.map(b => {
                    const ride = rides.find(r => r.id === b.ride_id);
                    return (
                      <tr key={b.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 font-mono text-xs text-gray-400">{b.id.slice(0, 8)}…</td>
                        <td className="px-4 py-3 font-black text-gray-800 whitespace-nowrap">
                          {ride ? `${ride.from_city} → ${ride.to_city}` : <span className="text-gray-400 italic">deleted</span>}
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-700">{b.passenger_name || "—"}</td>
                        <td className="px-4 py-3">
                          {b.passenger_phone
                            ? <a href={`tel:${b.passenger_phone}`} className="font-bold text-violet-600 hover:underline">{b.passenger_phone}</a>
                            : "—"}
                        </td>
                        <td className="px-4 py-3 font-black text-violet-700">{b.seats}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                            b.status === "confirmed" ? "bg-emerald-100 text-emerald-700" :
                            b.status === "cancelled" ? "bg-red-100 text-red-600" :
                            "bg-gray-100 text-gray-600"
                          }`}>{b.status}</span>
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">
                          {new Date(b.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => deleteBooking(b.id)}
                            className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-black text-white hover:bg-red-600 transition">
                            Cancel
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredBookings.length === 0 && (
                    <tr><td colSpan={8} className="py-12 text-center text-sm font-bold text-gray-400">No bookings found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ─── STATS TAB ─── */
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-3xl border-2 border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">Top Routes</h3>
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
            <div className="rounded-3xl border-2 border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">Price Distribution</h3>
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
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500" style={{ width: `${pct}%` }} />
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
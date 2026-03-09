"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Ride = {
  id: string; from_city: string; to_city: string;
  departure_time: string; price_per_seat: number;
  seats_total: number; seats_available: number; vehicle_type: string;
};
type Booking = { id: string; passenger_name: string; phone: string; seats: number; };

export default function MyRides() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [bookings, setBookings] = useState<Record<string, Booking[]>>({});
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  async function loadRides() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { window.location.href = "/auth"; return; }

    const { data: ridesData } = await supabase
      .from("rides").select("*").eq("user_id", userData.user.id)
      .order("departure_time", { ascending: true });

    setRides(ridesData ?? []);

    // load bookings for all rides
    if (ridesData && ridesData.length > 0) {
      const ids = ridesData.map((r) => r.id);
      const { data: bookData } = await supabase
        .from("bookings").select("*").in("ride_id", ids);
      const map: Record<string, Booking[]> = {};
      for (const b of bookData ?? []) {
        if (!map[b.ride_id]) map[b.ride_id] = [];
        map[b.ride_id].push(b);
      }
      setBookings(map);
    }

    setLoading(false);
  }

  async function deleteRide(id: string) {
    await supabase.from("bookings").delete().eq("ride_id", id);
    await supabase.from("rides").delete().eq("id", id);
    setRides((r) => r.filter((x) => x.id !== id));
    setDeleteId(null);
    setToast("მოგზაურობა წაიშალა / Ride deleted");
    setTimeout(() => setToast(""), 3000);
  }

  useEffect(() => { loadRides(); }, []);

  return (
    <div className="min-h-screen font-sans" style={{ background: "linear-gradient(135deg,#f5f3ff 0%,#ede9fe 30%,#faf5ff 60%,#f0fdf4 100%)" }}>

      {/* NAV */}
      <nav style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(16px)" }}
        className="sticky top-0 z-50 border-b border-violet-100 shadow-sm">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <a href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-600 text-lg shadow">🚐</div>
            <span className="text-xl font-black text-violet-700">mgzavri</span>
          </a>
          <Link href="/post" className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-700 transition">
            + Post ride
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900">My Rides</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your posted routes and see who booked.</p>
        </div>

        {/* Toast */}
        {toast && (
          <div className="mb-4 rounded-2xl bg-green-50 border border-green-200 px-4 py-3 text-sm font-semibold text-green-700 flex items-center gap-2">
            ✅ {toast}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Loading…
          </div>
        ) : rides.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-violet-200 bg-white py-20 text-center">
            <div className="text-5xl mb-4">🚐</div>
            <p className="font-black text-gray-700 text-lg">No rides posted yet</p>
            <p className="text-gray-400 text-sm mt-1">Post your first ride and start accepting passengers.</p>
            <Link href="/post" className="mt-5 inline-flex rounded-2xl bg-violet-600 px-6 py-3 text-sm font-bold text-white hover:bg-violet-700 transition">
              + Post a ride
            </Link>
          </div>
        ) : (
          <div className="grid gap-5">
            {rides.map((ride) => {
              const rideBookings = bookings[ride.id] ?? [];
              const booked = ride.seats_total - ride.seats_available;
              const pct = Math.round((booked / ride.seats_total) * 100);

              return (
                <div key={ride.id}
                  className="overflow-hidden rounded-3xl bg-white border border-violet-100 shadow-[0_4px_20px_rgba(109,40,217,0.07)]">

                  {/* Top bar */}
                  <div className="grid sm:grid-cols-[1fr_auto]">
                    <div className="p-5 sm:p-6">
                      <h2 className="text-xl font-black text-gray-900 mb-1">
                        {ride.from_city} <span className="text-violet-400">→</span> {ride.to_city}
                      </h2>
                      <p className="text-sm text-gray-400 mb-1">🚐 {ride.vehicle_type}</p>
                      <p className="text-sm text-gray-400 mb-4">🕐 {new Date(ride.departure_time).toLocaleString()}</p>

                      {/* Occupancy bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1.5">
                          <span>💺 {booked}/{ride.seats_total} booked</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Link href={`/ride/${ride.id}`}
                          className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50 transition">
                          View
                        </Link>
                        <button onClick={() => setDeleteId(ride.id)}
                          className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 transition">
                          🗑 Delete
                        </button>
                      </div>
                    </div>

                    <div className="flex min-w-[100px] flex-col items-center justify-center border-l border-violet-50 bg-gradient-to-b from-violet-50 to-purple-50 px-6 py-5">
                      <div className="text-3xl font-black text-violet-700">{ride.price_per_seat}₾</div>
                      <div className="text-xs font-semibold text-violet-400">/ seat</div>
                      <div className="mt-2 text-xl font-black text-gray-800">{ride.seats_available}</div>
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">left</div>
                    </div>
                  </div>

                  {/* Passenger list */}
                  {rideBookings.length > 0 && (
                    <div className="border-t border-violet-50 bg-violet-50/50 px-5 sm:px-6 py-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-violet-500 mb-3">
                        Passengers ({rideBookings.length})
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {rideBookings.map((b) => (
                          <div key={b.id} className="flex items-center justify-between rounded-xl bg-white border border-violet-100 px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-violet-100 flex items-center justify-center text-xs font-black text-violet-600">
                                {b.passenger_name?.[0]?.toUpperCase() ?? "?"}
                              </div>
                              <span className="text-sm font-semibold text-gray-700">{b.passenger_name}</span>
                            </div>
                            <a href={`tel:${b.phone}`} className="text-xs text-violet-600 font-semibold hover:underline">{b.phone}</a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete confirm modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center">
            <div className="text-4xl mb-3">🗑</div>
            <p className="font-black text-gray-800 text-lg mb-2">Delete this ride?</p>
            <p className="text-sm text-gray-400 mb-6">This will also remove all passenger bookings for this ride.</p>
            <div className="flex gap-3">
              <button onClick={() => deleteRide(deleteId)}
                className="flex-1 h-12 rounded-2xl bg-red-500 font-bold text-white hover:bg-red-600 transition">Delete</button>
              <button onClick={() => setDeleteId(null)}
                className="flex-1 h-12 rounded-2xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
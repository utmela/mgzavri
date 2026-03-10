"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Link from "next/link";

type Ride = {
  id: string;
  from_city: string;
  to_city: string;
  departure_time: string;
  vehicle_type: string;
  seats_available: number;
  price_per_seat: number;
  bookings: {
    id: string;
    passenger_name: string;
    phone: string;
    seats_booked: number;
  }[];
};

export default function MyRides() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadRides() {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) return;

    const { data, error } = await supabase
      .from("rides")
      .select(`
        id,
        from_city,
        to_city,
        departure_time,
        vehicle_type,
        seats_available,
        price_per_seat,
        bookings (
          id,
          passenger_name,
          phone,
          seats_booked
        )
      `)
      .eq("user_id", userData.user.id)
      .order("departure_time", { ascending: true });

    if (!error && data) {
      setRides(data as any);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadRides();
  }, []);

  async function deleteRide(id: string) {
    const confirmDelete = confirm("Delete this ride?");
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("rides")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Failed to delete ride");
    } else {
      loadRides();
    }
  }

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-700 font-semibold">
        Loading your rides...
      </div>
    );
  }

 return (
  <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">

    <div className="mb-8">
      <h1 className="text-4xl font-black tracking-tight text-gray-900">
        My Rides
      </h1>
      <p className="text-gray-500 mt-1">
        Manage your posted trips and passengers.
      </p>
    </div>

    {rides.length === 0 && (
      <div className="rounded-3xl border border-dashed border-gray-200 bg-white py-20 text-center">
        <div className="text-5xl mb-3">🚐</div>
        <p className="text-lg font-black text-gray-700">
          You haven't posted any rides yet.
        </p>
      </div>
    )}

    <div className="space-y-6">
      {rides.map((ride) => (
        <div
          key={ride.id}
          className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm"
        >

          {/* HEADER */}
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4 text-white">
            <h2 className="text-lg font-black">
              {ride.from_city} → {ride.to_city}
            </h2>
          </div>

          {/* BODY */}
          <div className="p-6">

            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">

              <div className="space-y-1 text-sm text-gray-600">
                <p>🚐 {ride.vehicle_type}</p>
                <p>🕐 {new Date(ride.departure_time).toLocaleString()}</p>
                <p>
                  Seats left: <b className="text-gray-900">{ride.seats_available}</b>
                </p>
                <p>
                  Price: <b className="text-violet-700">{ride.price_per_seat}₾</b>
                </p>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-3">

                <Link
                  href={`/edit-ride/${ride.id}`}
                  className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-700 transition"
                >
                  Edit
                </Link>

                <button
                  onClick={() => deleteRide(ride.id)}
                  className="rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 transition"
                >
                  Delete
                </button>

              </div>
            </div>

            {/* PASSENGERS */}
            <div className="mt-4">
              <h3 className="text-sm font-black uppercase tracking-wide text-gray-500 mb-3">
                Passengers
              </h3>

              {ride.bookings.length === 0 ? (
                <p className="text-sm text-gray-400">
                  No passengers yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {ride.bookings.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3"
                    >
                      <div>
                        <p className="font-bold text-gray-800">
                          {b.passenger_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          📞 {b.phone}
                        </p>
                      </div>

                      <div className="text-sm font-black text-violet-700">
                        {b.seats_booked} seats
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      ))}
    </div>
  </div>
);
}
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

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

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500">
        Loading your rides...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="text-3xl font-black mb-6">My Rides</h1>

      {rides.length === 0 && (
        <div className="text-gray-500">
          You haven't posted any rides yet.
        </div>
      )}

      <div className="space-y-6">
        {rides.map((ride) => (
          <div
            key={ride.id}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-xl font-black">
              {ride.from_city} → {ride.to_city}
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              🚐 {ride.vehicle_type}
            </p>

            <p className="text-sm text-gray-500">
              🕐 {new Date(ride.departure_time).toLocaleString()}
            </p>

            <p className="text-sm mt-2">
              Seats left: <b>{ride.seats_available}</b>
            </p>

            <p className="text-sm">
              Price: <b>{ride.price_per_seat}₾</b>
            </p>

            <div className="mt-5">
              <h3 className="font-bold text-gray-700 mb-2">
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
                      className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-2"
                    >
                      <div>
                        <p className="font-semibold">
                          {b.passenger_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          📞 {b.phone}
                        </p>
                      </div>

                      <div className="text-sm font-bold text-violet-700">
                        {b.seats_booked} seats
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
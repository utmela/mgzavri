"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Link from "next/link";

type Booking = {
  id: string;
  passenger_name: string;
  phone: string;
  seats_booked: number;
  ride: {
    id: string;
    from_city: string;
    to_city: string;
    departure_time: string;
    price_per_seat: number;
    vehicle_type: string;
  };
};

export default function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadBookings() {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id,
        passenger_name,
        phone,
        seats_booked,
        ride:rides (
          id,
          from_city,
          to_city,
          departure_time,
          price_per_seat,
          vehicle_type
        )
      `)
      .order("id", { ascending: false });

    if (!error && data) {
      setBookings(data as any);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadBookings();
  }, []);

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500">
        Loading bookings...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-3xl font-black mb-6">My Bookings</h1>

      {bookings.length === 0 && (
        <div className="text-gray-500">You have no bookings yet.</div>
      )}

      <div className="grid gap-4">
        {bookings.map((b) => (
          <div
            key={b.id}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <h2 className="text-xl font-bold">
              {b.ride.from_city} → {b.ride.to_city}
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              🚐 {b.ride.vehicle_type}
            </p>

            <p className="text-sm text-gray-500">
              🕐 {new Date(b.ride.departure_time).toLocaleString()}
            </p>

            <p className="mt-3 text-sm">
              Seats booked: <b>{b.seats_booked}</b>
            </p>

            <p className="text-sm">
              Phone: <b>{b.phone}</b>
            </p>

            <p className="text-sm">
              Total:{" "}
              <b>
                {b.seats_booked * b.ride.price_per_seat}₾
              </b>
            </p>

            <Link
              href={`/ride/${b.ride.id}`}
              className="inline-block mt-4 rounded-xl bg-violet-600 px-4 py-2 text-white text-sm font-bold hover:bg-violet-700"
            >
              View Ride
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
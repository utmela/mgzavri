"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Link from "next/link";

type Ride = {
  id: string;
  from_city: string;
  to_city: string;
  departure_time: string;
  price_per_seat: number;
  seats_total: number;
  seats_available: number;
  vehicle_type: string;
};

export default function MyRides() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadRides() {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      window.location.href = "/auth";
      return;
    }

    const { data, error } = await supabase
      .from("rides")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("departure_time", { ascending: true });

    if (error) {
      console.error(error);
      setRides([]);
    } else {
      setRides(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadRides();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-6">

      <div className="max-w-4xl mx-auto">

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-black">My Rides</h1>

          <Link
            href="/post"
            className="bg-violet-600 text-white px-4 py-2 rounded-xl font-bold"
          >
            + Post Ride
          </Link>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : rides.length === 0 ? (
          <div className="bg-white rounded-xl p-6 shadow">
            <p className="text-gray-600">You have not posted any rides yet.</p>
          </div>
        ) : (
          <div className="grid gap-4">

            {rides.map((ride) => (
              <div
                key={ride.id}
                className="bg-white rounded-xl p-5 shadow border"
              >

                <h2 className="text-xl font-bold">
                  {ride.from_city} → {ride.to_city}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  🚐 {ride.vehicle_type}
                </p>

                <p className="text-sm text-gray-500">
                  🕐 {new Date(ride.departure_time).toLocaleString()}
                </p>

                <div className="mt-3 flex gap-4 text-sm">

                  <span>
                    💺 {ride.seats_available}/{ride.seats_total}
                  </span>

                  <span>
                    💰 {ride.price_per_seat}₾
                  </span>

                </div>

                <div className="mt-4 flex gap-2">

                  <Link
                    href={`/ride/${ride.id}`}
                    className="px-3 py-1 rounded-lg bg-gray-100 text-sm"
                  >
                    View
                  </Link>

                  <button
                    className="px-3 py-1 rounded-lg bg-red-100 text-red-600 text-sm"
                  >
                    Delete
                  </button>

                </div>

              </div>
            ))}

          </div>
        )}
      </div>
    </main>
  );
}
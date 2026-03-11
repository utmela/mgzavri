"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Link from "next/link";
import { useLanguage } from "../../components/LanguageProvider";

const T = {
  en: {
    title: "My Rides",
    subtitle: "Manage your posted trips and passengers.",
    passengers: "Passengers",
    noPassengers: "No passengers yet.",
    seatsLeft: "Seats left",
    price: "Price",
    edit: "Edit",
    delete: "Delete",
  },
  ka: {
    title: "ჩემი მგზავრობები",
    subtitle: "მართეთ თქვენი დამატებული მგზავრობები და მგზავრები.",
    passengers: "მგზავრები",
    noPassengers: "ჯერ მგზავრები არ არიან.",
    seatsLeft: "დარჩენილი ადგილები",
    price: "ფასი",
    edit: "რედაქტირება",
    delete: "წაშლა",
  },
};

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
  const { lang } = useLanguage();
  const t = T[lang as "en" | "ka"];

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

  async function deleteRide(id: string) {
    if (!confirm("Delete this ride?")) return;

    await supabase.from("rides").delete().eq("id", id);

    loadRides();
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
    <div className="min-h-screen bg-gray-50">

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">

        {/* HEADER */}
        <div className="mb-10">

          <h1 className="text-4xl font-black text-gray-900">
            {t.title}
          </h1>

          <p className="text-gray-500 mt-2">
            {t.subtitle}
          </p>

        </div>

        {rides.length === 0 && (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white py-20 text-center shadow-sm">
            <div className="text-5xl mb-3">🚐</div>
            <p className="text-lg font-black text-gray-700">
              No rides posted yet.
            </p>
          </div>
        )}

        <div className="space-y-6">

          {rides.map((ride) => (

            <div
              key={ride.id}
              className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm"
            >

              {/* RIDE HEADER */}
              <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4 text-white">

                <h2 className="text-lg font-black">
                  {ride.from_city} → {ride.to_city}
                </h2>

              </div>

              {/* BODY */}
              <div className="p-6 flex flex-wrap items-start justify-between gap-4">

                {/* LEFT INFO */}
                <div className="space-y-2 text-gray-700 text-sm">

                  <p>
                    🚐 {ride.vehicle_type}
                  </p>

                  <p>
                    🕐 {new Date(ride.departure_time).toLocaleString()}
                  </p>

                  <p>
                    {t.seatsLeft}: <b>{ride.seats_available}</b>
                  </p>

                  <p>
                    {t.price}:{" "}
                    <b className="text-violet-700">
                      {ride.price_per_seat}₾
                    </b>
                  </p>

                </div>

                {/* BUTTONS */}
                <div className="flex gap-3">

                  <Link
                    href={`/edit-ride/${ride.id}`}
                    className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-700 transition"
                  >
                    {t.edit}
                  </Link>

                  <button
                    onClick={() => deleteRide(ride.id)}
                    className="rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 transition"
                  >
                    {t.delete}
                  </button>

                </div>

              </div>

              {/* PASSENGERS */}
              <div className="px-6 pb-6">

                <h3 className="text-sm font-black text-gray-800 mb-3">
                  {t.passengers}
                </h3>

                {ride.bookings.length === 0 ? (

                  <p className="text-sm text-gray-400">
                    {t.noPassengers}
                  </p>

                ) : (

                  <div className="space-y-2">

                    {ride.bookings.map((b) => (

                      <div
                        key={b.id}
                        className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3"
                      >

                        <div>

                          <p className="font-semibold text-gray-800">
                            {b.passenger_name}
                          </p>

                          <p className="text-xs text-gray-500">
                            📞 {b.phone}
                          </p>

                        </div>

                        <div className="text-sm font-bold text-violet-700">
                          {b.seats_booked}
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

    </div>
  );
}
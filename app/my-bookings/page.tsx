"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useLanguage } from "../../components/LanguageProvider";

const T = {
  en: {
    title: "My Bookings",
    subtitle: "View all rides you have reserved.",
    empty: "You have no bookings yet.",
    emptySub: "Find a ride and reserve a seat.",
    seats: "Seats booked",
    price: "Price per seat",
    call: "Call",
    whatsapp: "WhatsApp",
  },
  ka: {
    title: "ჩემი ჯავშნები",
    subtitle: "იხილეთ ყველა თქვენი დაჯავშნილი მგზავრობა.",
    empty: "ჯერ ჯავშნები არ გაქვთ.",
    emptySub: "იპოვეთ მგზავრობა და დაჯავშნეთ ადგილი.",
    seats: "დაჯავშნილი ადგილები",
    price: "ფასი ერთ ადგილზე",
    call: "დარეკვა",
    whatsapp: "WhatsApp",
  },
};

type Booking = {
  id: string;
  seats_booked: number;
  ride: {
    id: string;
    from_city: string;
    to_city: string;
    departure_time: string;
    price_per_seat: number;
    vehicle_type: string;
    phone: string;
  };
};

export default function MyBookings() {
  const { lang } = useLanguage();
  const t = T[lang as "en" | "ka"];

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadBookings() {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) return;

    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id,
        seats_booked,
        ride:rides (
          id,
          from_city,
          to_city,
          departure_time,
          price_per_seat,
          vehicle_type,
          phone
        )
      `)
      .eq("user_id", userData.user.id)
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
      <div className="min-h-screen bg-gray-50">
        <div className="p-10 text-center text-gray-500">
          Loading your bookings...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">

        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-tight text-gray-900">
            {t.title}
          </h1>
          <p className="mt-2 text-gray-500">
            {t.subtitle}
          </p>
        </div>

        {bookings.length === 0 && (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white py-20 text-center shadow-sm">
            <div className="mb-4 text-5xl">🪑</div>
            <p className="text-lg font-black text-gray-700">
              {t.empty}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {t.emptySub}
            </p>
          </div>
        )}

        <div className="space-y-6">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm"
            >

              <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4 text-white">
                <h2 className="text-lg font-black">
                  {booking.ride.from_city} → {booking.ride.to_city}
                </h2>
              </div>

              <div className="p-6 flex flex-wrap items-center justify-between gap-4">

                <div className="space-y-1 text-sm text-gray-600">
                  <p>
                    🕐 {new Date(booking.ride.departure_time).toLocaleString()}
                  </p>

                  <p>
                    🚐 {booking.ride.vehicle_type}
                  </p>

                  <p>
                    {t.seats}:
                    <b className="ml-1 text-gray-900">
                      {booking.seats_booked}
                    </b>
                  </p>

                  <p>
                    {t.price}:
                    <b className="ml-1 text-violet-700">
                      {booking.ride.price_per_seat}₾
                    </b>
                  </p>
                </div>

                <div className="flex gap-3">

                  <a
                    href={`tel:${booking.ride.phone}`}
                    className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100 transition"
                  >
                    📞 {t.call}
                  </a>

                  <a
                    href={`https://wa.me/${booking.ride.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-600 transition"
                  >
                    💬 {t.whatsapp}
                  </a>

                </div>

              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
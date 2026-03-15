"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useLanguage } from "../../components/LanguageProvider";
import Link from "next/link";
import {
  IconBus, IconClock, IconArmchair, IconCurrencyLari,
  IconPhone, IconBrandWhatsapp, IconLoader2, IconBookmark,
} from "@tabler/icons-react";

const T = {
  en: {
    title: "My Bookings", subtitle: "View all rides you have reserved.",
    empty: "No bookings yet.", emptySub: "Find a ride and reserve a seat.",
    seats: "Seats booked", price: "Price / seat", call: "Call", whatsapp: "WhatsApp",
    browse: "Browse rides",
  },
  ka: {
    title: "ჩემი ჯავშნები", subtitle: "იხილეთ ყველა თქვენი დაჯავშნილი მგზავრობა.",
    empty: "ჯერ ჯავშნები არ გაქვთ.", emptySub: "იპოვეთ მგზავრობა და დაჯავშნეთ ადგილი.",
    seats: "დაჯავშნილი ადგილები", price: "ფასი / ადგილი", call: "დარეკვა", whatsapp: "WhatsApp",
    browse: "მოგზაურობის ძებნა",
  },
};

type Booking = {
  id: string; seats_booked: number;
  ride: {
    id: string; from_city: string; to_city: string;
    departure_time: string; price_per_seat: number;
    vehicle_type: string; phone: string;
  };
};

function waLink(phone: string) {
  const d = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${d.startsWith("995") ? d : `995${d}`}`;
}

export default function MyBookings() {
  const { lang } = useLanguage();
  const t = T[lang as "en" | "ka"];
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { setLoading(false); return; }
      const { data: rows } = await supabase
        .from("bookings")
        .select(`id, seats_booked, ride:rides ( id, from_city, to_city, departure_time, price_per_seat, vehicle_type, phone )`)
        .eq("user_id", data.user.id)
        .order("id", { ascending: false });
      setBookings((rows ?? []) as any);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex items-center gap-2 text-sm font-black text-gray-500">
        <IconLoader2 size={18} className="animate-spin text-violet-400" /> Loading…
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100">
              <IconBookmark size={18} stroke={2} className="text-violet-600" />
            </div>
            <h1 className="text-3xl font-black text-gray-900">{t.title}</h1>
          </div>
          <p className="font-bold text-gray-500 mt-1 ml-12">{t.subtitle}</p>
        </div>

        {bookings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
              <IconArmchair size={24} stroke={1.5} className="text-gray-400" />
            </div>
            <p className="text-base font-black text-gray-700">{t.empty}</p>
            <p className="text-sm font-bold text-gray-400 mt-1 mb-5">{t.emptySub}</p>
            <Link href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-black text-white hover:bg-violet-700 transition">
              <IconBus size={15} stroke={2.5} /> {t.browse}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map(b => (
              <div key={b.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-violet-200">

                {/* Header strip */}
                <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3.5 flex items-center gap-2">
                  <IconBus size={16} stroke={2.5} className="text-white/80" />
                  <h2 className="text-base font-black text-white">
                    {b.ride.from_city} → {b.ride.to_city}
                  </h2>
                </div>

                {/* Body */}
                <div className="p-5 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-black text-gray-800 flex items-center gap-2">
                      <IconClock size={14} stroke={2} className="text-violet-400" />
                      {new Date(b.ride.departure_time).toLocaleString()}
                    </p>
                    <p className="text-sm font-extrabold text-gray-700 flex items-center gap-2">
                      <IconBus size={14} stroke={2} className="text-violet-400" />
                      {b.ride.vehicle_type}
                    </p>
                    <p className="text-sm font-extrabold text-gray-700 flex items-center gap-2">
                      <IconArmchair size={14} stroke={2} className="text-violet-400" />
                      {t.seats}: <span className="font-black text-gray-900 ml-1">{b.seats_booked}</span>
                    </p>
                    <p className="text-sm font-extrabold text-gray-700 flex items-center gap-2">
                      <IconCurrencyLari size={14} stroke={2} className="text-violet-400" />
                      {t.price}: <span className="font-black text-violet-700 ml-1">{b.ride.price_per_seat}₾</span>
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <a href={`tel:${b.ride.phone}`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-black text-violet-700 hover:bg-violet-100 transition">
                      <IconPhone size={14} stroke={2.5} /> {t.call}
                    </a>
                    <a href={waLink(b.ride.phone)} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-black text-white hover:bg-emerald-600 transition">
                      <IconBrandWhatsapp size={14} stroke={2.5} /> {t.whatsapp}
                    </a>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
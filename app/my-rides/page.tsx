"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Link from "next/link";
import { useLanguage } from "../../components/LanguageProvider";
import {
  IconBus, IconClock, IconArmchair, IconCurrencyLari,
  IconPencil, IconTrash, IconUsers, IconUser,
} from "@tabler/icons-react";

const T = {
  en: {
    myRides: "My Rides",
    myBookings: "My Bookings",
    driverTab: "Driver",
    passengerTab: "Passenger",
    subtitle: "Manage your posted trips and passengers.",
    bookingSubtitle: "Rides you have booked.",
    passengers: "Passengers",
    noPassengers: "No passengers yet.",
    seatsLeft: "Seats left",
    price: "Price",
    edit: "Edit",
    delete: "Delete",
    noRides: "No rides posted yet.",
    noBookings: "No bookings yet.",
    seatsBooked: "Seats",
    total: "Total",
    departure: "Departure",
  },
  ka: {
    myRides: "ჩემი მგზავრობები",
    myBookings: "ჩემი ჯავშნები",
    driverTab: "მძღოლი",
    passengerTab: "მგზავრი",
    subtitle: "მართეთ თქვენი დამატებული მგზავრობები და მგზავრები.",
    bookingSubtitle: "მგზავრობები, რომლებიც დაჯავშნეთ.",
    passengers: "მგზავრები",
    noPassengers: "ჯერ მგზავრები არ არიან.",
    seatsLeft: "დარჩენილი ადგილები",
    price: "ფასი",
    edit: "რედაქტირება",
    delete: "წაშლა",
    noRides: "მგზავრობები არ არის.",
    noBookings: "ჯავშნები არ არის.",
    seatsBooked: "ადგილები",
    total: "სულ",
    departure: "გამგზავრება",
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
  bookings: { id: string; passenger_name: string; seats_booked: number }[];
};

type Booking = {
  id: string;
  passenger_name: string;
  seats_booked: number;
  total_price: number | null;
  payment_status: string;
  ride: {
    id: string;
    from_city: string;
    to_city: string;
    departure_time: string;
    price_per_seat: number;
    vehicle_type: string;
  };
};

export default function MyRides() {
  const { lang } = useLanguage();
  const t = T[lang as "en" | "ka"];

  const [tab, setTab] = useState<"driver" | "passenger">("driver");
  const [rides, setRides] = useState<Ride[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const uid = userData.user.id;

    // Driver: rides I posted + their bookings
    const { data: ridesData, error: ridesErr } = await supabase
      .from("rides")
      .select(`
        id, from_city, to_city, departure_time, vehicle_type, seats_available, price_per_seat,
        bookings ( id, passenger_name, seats_booked )
      `)
      .eq("user_id", uid)
      .order("departure_time", { ascending: true });

    if (ridesErr) console.error("RIDES ERR:", ridesErr);
    if (ridesData) setRides(ridesData as any);

    // Passenger: bookings I made
    const { data: bookingsData, error: bookingsErr } = await supabase
      .from("bookings")
      .select(`
        id, passenger_name, seats_booked, total_price, payment_status,
        ride:ride_id ( id, from_city, to_city, departure_time, price_per_seat, vehicle_type )
      `)
      .eq("user_id", uid)
      .order("id", { ascending: false });

    if (bookingsErr) console.error("BOOKINGS ERR:", bookingsErr);
    if (bookingsData) setBookings(bookingsData as any);

    setLoading(false);
  }

  async function deleteRide(id: string) {
    if (!confirm("Delete this ride?")) return;
    await supabase.from("rides").delete().eq("id", id);
    loadAll();
  }

  useEffect(() => { loadAll(); }, []);

  if (loading) return (
    <div className="p-10 text-center text-sm font-black text-gray-500">Loading...</div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900">
            {tab === "driver" ? t.myRides : t.myBookings}
          </h1>
          <p className="font-extrabold text-gray-600 mt-2">
            {tab === "driver" ? t.subtitle : t.bookingSubtitle}
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex gap-2">
          <button
            onClick={() => setTab("driver")}
            className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-black transition ${
              tab === "driver"
                ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                : "bg-white border border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-700"
            }`}
          >
            <IconBus size={16} stroke={2.5} /> {t.driverTab}
          </button>
          <button
            onClick={() => setTab("passenger")}
            className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-black transition ${
              tab === "passenger"
                ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                : "bg-white border border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-700"
            }`}
          >
            <IconUser size={16} stroke={2.5} /> {t.passengerTab}
          </button>
        </div>

        {/* Driver View */}
        {tab === "driver" && (
          <div className="space-y-6">
            {rides.length === 0 && (
              <div className="rounded-3xl border border-dashed border-gray-200 bg-white py-20 text-center shadow-sm">
                <IconBus size={48} stroke={1} className="mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-black text-gray-800">{t.noRides}</p>
              </div>
            )}
            {rides.map(ride => (
              <div key={ride.id} className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
                <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4 text-white">
                  <h2 className="text-lg font-black flex items-center gap-2">
                    <IconBus size={18} stroke={2.5} /> {ride.from_city} → {ride.to_city}
                  </h2>
                </div>
                <div className="p-6 flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2 text-sm">
                    <p className="font-extrabold text-gray-800 flex items-center gap-2">
                      <IconBus size={15} stroke={2} className="text-violet-400" /> {ride.vehicle_type}
                    </p>
                    <p className="font-extrabold text-gray-800 flex items-center gap-2">
                      <IconClock size={15} stroke={2} className="text-violet-400" />
                      {new Date(ride.departure_time).toLocaleString()}
                    </p>
                    <p className="font-extrabold text-gray-800 flex items-center gap-2">
                      <IconArmchair size={15} stroke={2} className="text-violet-400" />
                      {t.seatsLeft}: <span className="font-black text-gray-900">{ride.seats_available}</span>
                    </p>
                    <p className="font-extrabold text-gray-800 flex items-center gap-2">
                      <IconCurrencyLari size={15} stroke={2} className="text-violet-400" />
                      {t.price}: <span className="font-black text-violet-700">{ride.price_per_seat}₾</span>
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Link href={`/edit-ride/${ride.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-black text-white hover:bg-violet-700 transition">
                      <IconPencil size={14} stroke={2.5} /> {t.edit}
                    </Link>
                    <button onClick={() => deleteRide(ride.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-red-500 px-4 py-2 text-sm font-black text-white hover:bg-red-600 transition">
                      <IconTrash size={14} stroke={2.5} /> {t.delete}
                    </button>
                  </div>
                </div>
                <div className="px-6 pb-6">
                  <h3 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
                    <IconUsers size={16} stroke={2} className="text-violet-500" /> {t.passengers}
                    {ride.bookings.length > 0 && (
                      <span className="ml-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-black text-violet-700">
                        {ride.bookings.length}
                      </span>
                    )}
                  </h3>
                  {ride.bookings.length === 0 ? (
                    <p className="text-sm font-extrabold text-gray-500">{t.noPassengers}</p>
                  ) : (
                    <div className="space-y-2">
                      {ride.bookings.map(b => (
                        <div key={b.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                          <p className="font-black text-gray-900">{b.passenger_name}</p>
                          <div className="flex items-center gap-1.5 rounded-lg bg-violet-100 px-3 py-1">
                            <IconArmchair size={13} stroke={2.5} className="text-violet-600" />
                            <span className="text-sm font-black text-violet-700">{b.seats_booked}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Passenger View */}
        {tab === "passenger" && (
          <div className="space-y-4">
            {bookings.length === 0 && (
              <div className="rounded-3xl border border-dashed border-gray-200 bg-white py-20 text-center shadow-sm">
                <IconUser size={48} stroke={1} className="mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-black text-gray-800">{t.noBookings}</p>
              </div>
            )}
            {bookings.map(b => (
              <div key={b.id} className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 text-white">
                  <h2 className="text-lg font-black flex items-center gap-2">
                    <IconBus size={18} stroke={2.5} />
                    {b.ride?.from_city} → {b.ride?.to_city}
                  </h2>
                </div>
                <div className="p-6 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-2 text-sm">
                    <p className="font-extrabold text-gray-800 flex items-center gap-2">
                      <IconClock size={15} stroke={2} className="text-emerald-400" />
                      {b.ride?.departure_time
                        ? new Date(b.ride.departure_time).toLocaleString()
                        : "—"}
                    </p>
                    <p className="font-extrabold text-gray-800 flex items-center gap-2">
                      <IconArmchair size={15} stroke={2} className="text-emerald-400" />
                      {t.seatsBooked}: <span className="font-black text-gray-900">{b.seats_booked}</span>
                    </p>
                    <p className="font-extrabold text-gray-800 flex items-center gap-2">
                      <IconCurrencyLari size={15} stroke={2} className="text-emerald-400" />
                      {t.total}: <span className="font-black text-emerald-700">
                        {b.total_price ?? (b.ride?.price_per_seat ?? 0) * b.seats_booked}₾
                      </span>
                    </p>
                  </div>
                  <div className={`rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-wide ${
                    b.payment_status === "paid"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {b.payment_status}
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
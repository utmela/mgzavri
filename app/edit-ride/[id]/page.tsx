"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

const T = {
  en: {
    title: "Edit Ride",
    vehicle: "Vehicle",
    seats: "Seats Available",
    price: "Price Per Seat",
    departure: "Departure Time",
    save: "Save Changes",
    cancel: "Cancel",
  },
  ka: {
    title: "მგზავრობის რედაქტირება",
    vehicle: "მანქანა",
    seats: "ხელმისაწვდომი ადგილები",
    price: "ფასი ერთ ადგილზე",
    departure: "გასვლის დრო",
    save: "შენახვა",
    cancel: "გაუქმება",
  },
};



export default function EditRide() {
  const router = useRouter();
  const params = useParams();

  const [lang, setLang] = useState<"en" | "ka">("ka");
  const t = T[lang];

  const [vehicle, setVehicle] = useState("");
  const [seats, setSeats] = useState(1);
  const [price, setPrice] = useState(0);
  const [departure, setDeparture] = useState("");

  async function loadRide() {
    const { data } = await supabase
      .from("rides")
      .select("*")
      .eq("id", params.id)
      .single();

    if (data) {
      setVehicle(data.vehicle_type);
      setSeats(data.seats_available);
      setPrice(data.price_per_seat);
      setDeparture(data.departure_time);
    }
  }

  async function saveRide() {
    await supabase
      .from("rides")
      .update({
        vehicle_type: vehicle,
        seats_available: seats,
        price_per_seat: price,
        departure_time: departure,
      })
      .eq("id", params.id);

    router.push("/my-rides");
  }

  useEffect(() => {
    loadRide();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">

        {/* HEADER */}
        <div className="mb-10 flex items-center justify-between">

          <h1 className="text-4xl font-black text-gray-900">
            {t.title}
          </h1>

          <button
            onClick={() => setLang((l) => (l === "en" ? "ka" : "en"))}
            className="rounded-xl border border-violet-200 bg-white px-3 py-1.5 text-xs font-bold text-violet-600 hover:bg-violet-50 transition"
          >
            {lang === "en" ? "🇬🇪 KA" : "🇬🇧 EN"}
          </button>

        </div>

        {/* CARD */}
        <div className="rounded-3xl border border-gray-200 bg-white shadow-sm p-8 space-y-6">

          {/* VEHICLE */}
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-2">
              {t.vehicle}
            </label>

            <input
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition"
            />
          </div>

          {/* SEATS */}
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-2">
              {t.seats}
            </label>

            <input
              type="number"
              value={seats}
              onChange={(e) => setSeats(Number(e.target.value))}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition"
            />
          </div>

          {/* PRICE */}
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-2">
              {t.price}
            </label>

            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition"
            />
          </div>

          {/* DEPARTURE */}
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-2">
              {t.departure}
            </label>

            <input
              type="datetime-local"
              value={departure}
              onChange={(e) => setDeparture(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition"
            />
          </div>

          {/* BUTTONS */}
          <div className="flex gap-4 pt-4">

            <button
              onClick={saveRide}
              className="flex-1 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 py-3 font-bold text-white hover:opacity-90 transition"
            >
              {t.save}
            </button>

            <button
              onClick={() => router.push("/my-rides")}
              className="flex-1 rounded-2xl border border-gray-200 bg-white py-3 font-bold text-gray-700 hover:bg-gray-50 transition"
            >
              {t.cancel}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}
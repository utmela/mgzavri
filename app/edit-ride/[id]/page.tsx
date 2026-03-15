"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { useLanguage } from "../../../components/LanguageProvider";
import { IconBus, IconArmchair, IconCurrencyLari, IconClock, IconDeviceFloppy, IconX } from "@tabler/icons-react";

const T = {
  en: {
    title: "Edit Ride",
    vehicle: "Vehicle", seats: "Seats Available",
    price: "Price Per Seat", departure: "Departure Time",
    save: "Save Changes", cancel: "Cancel",
  },
  ka: {
    title: "მგზავრობის რედაქტირება",
    vehicle: "მანქანა", seats: "ხელმისაწვდომი ადგილები",
    price: "ფასი ერთ ადგილზე", departure: "გასვლის დრო",
    save: "შენახვა", cancel: "გაუქმება",
  },
};

export default function EditRide() {
  const router = useRouter();
  const params = useParams();
  const { lang } = useLanguage();
  const t = T[lang as "en" | "ka"];

  const [vehicle,   setVehicle]   = useState("");
  const [seats,     setSeats]     = useState(1);
  const [price,     setPrice]     = useState(0);
  const [departure, setDeparture] = useState("");

  async function loadRide() {
    const { data } = await supabase.from("rides").select("*").eq("id", params.id).single();
    if (data) {
      setVehicle(data.vehicle_type);
      setSeats(data.seats_available);
      setPrice(data.price_per_seat);
      setDeparture(data.departure_time);
    }
  }

  async function saveRide() {
    await supabase.from("rides").update({
      vehicle_type: vehicle, seats_available: seats,
      price_per_seat: price, departure_time: departure,
    }).eq("id", params.id);
    router.push("/my-rides");
  }

  useEffect(() => { loadRide(); }, []);

  const inp = "w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-extrabold text-gray-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition placeholder-gray-400";

  const fields = [
    { icon: <IconBus size={16} stroke={2} className="text-violet-400" />,          label: t.vehicle,    content: <input value={vehicle} onChange={e => setVehicle(e.target.value)} className={inp} /> },
    { icon: <IconArmchair size={16} stroke={2} className="text-violet-400" />,     label: t.seats,      content: <input type="number" value={seats} onChange={e => setSeats(Number(e.target.value))} className={inp} /> },
    { icon: <IconCurrencyLari size={16} stroke={2} className="text-violet-400" />, label: t.price,      content: <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className={inp} /> },
    { icon: <IconClock size={16} stroke={2} className="text-violet-400" />,        label: t.departure,  content: <input type="datetime-local" value={departure} onChange={e => setDeparture(e.target.value)} className={inp} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-black text-gray-900 mb-8">{t.title}</h1>

        <div className="rounded-3xl border border-gray-200 bg-white shadow-sm p-8 space-y-6">
          {fields.map(({ icon, label, content }) => (
            <div key={label}>
              <label className="flex items-center gap-2 text-sm font-black text-gray-800 mb-2">
                {icon} {label}
              </label>
              {content}
            </div>
          ))}

          <div className="flex gap-4 pt-4">
            <button onClick={saveRide}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 py-3 font-black text-white hover:opacity-90 transition">
              <IconDeviceFloppy size={18} stroke={2.5} /> {t.save}
            </button>
            <button onClick={() => router.push("/my-rides")}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-3 font-black text-gray-800 hover:bg-gray-50 transition">
              <IconX size={18} stroke={2.5} /> {t.cancel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
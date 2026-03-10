"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useParams, useRouter } from "next/navigation";

export default function EditRide() {
  const { id } = useParams();
  const router = useRouter();

  const [ride, setRide] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [vehicle, setVehicle] = useState("");
  const [seats, setSeats] = useState(1);
  const [price, setPrice] = useState(1);
  const [time, setTime] = useState("");

  useEffect(() => {
    loadRide();
  }, []);

  async function loadRide() {
    const { data, error } = await supabase
      .from("rides")
      .select("*")
      .eq("id", id)
      .single();

    if (!error && data) {
      setRide(data);
      setVehicle(data.vehicle_type);
      setSeats(data.seats_available);
      setPrice(data.price_per_seat);
      setTime(data.departure_time.slice(0, 16));
    }

    setLoading(false);
  }

  async function save() {
    const { error } = await supabase
      .from("rides")
      .update({
        vehicle_type: vehicle,
        seats_available: seats,
        price_per_seat: price,
        departure_time: new Date(time).toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Failed to update ride");
    } else {
      router.push("/my-rides");
      router.refresh();
    }
  }

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-700">
        Loading ride...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="text-3xl font-black mb-6 text-gray-900">
        Edit Ride
      </h1>

      <div className="space-y-4">

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Vehicle
          </label>
          <input
            value={vehicle}
            onChange={(e) => setVehicle(e.target.value)}
            className="w-full rounded-xl border px-4 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Seats Available
          </label>
          <input
            type="number"
            value={seats}
            onChange={(e) => setSeats(Number(e.target.value))}
            className="w-full rounded-xl border px-4 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Price Per Seat
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full rounded-xl border px-4 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Departure Time
          </label>
          <input
            type="datetime-local"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full rounded-xl border px-4 py-2"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={save}
            className="rounded-xl bg-violet-600 px-6 py-3 font-bold text-white hover:bg-violet-700"
          >
            Save Changes
          </button>

          <button
            onClick={() => router.push("/my-rides")}
            className="rounded-xl border px-6 py-3 font-bold text-gray-700"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
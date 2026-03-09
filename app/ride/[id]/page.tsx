"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function RidePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [ride, setRide] = useState<any>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [seats, setSeats] = useState(1);

  async function loadRide() {
    const { data } = await supabase
      .from("rides")
      .select("*")
      .eq("id", id)
      .single();

    setRide(data);
  }

  async function bookSeat() {
    if (!name || !phone) {
      alert("Please enter name and phone");
      return;
    }

    if (!ride) return;

    if (seats > ride.seats_available) {
      alert("Not enough seats available");
      return;
    }

    // create booking
    const { error: bookingError } = await supabase
      .from("bookings")
      .insert({
        ride_id: ride.id,
        passenger_name: name,
        phone: phone
    });
    
    if (bookingError) {
      console.log("Booking error:", bookingError);
      alert("Booking failed");
      return;
    }

    // update available seats
    const { error: seatError } = await supabase
      .from("rides")
      .update({
        seats_available: ride.seats_available - seats,
      })
      .eq("id", ride.id);

    if (seatError) {
      console.log(seatError);
      return;
    }

    alert("Booking successful!");

    router.push("/");
  }

  useEffect(() => {
    loadRide();
  }, []);

  if (!ride) {
    return <div className="text-white p-10">Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-6">

      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-xl">

        <a href="/" className="text-gray-500 mb-6 block">
          ← Back
        </a>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {ride.from_city} → {ride.to_city}
        </h1>

        <div className="flex justify-between text-gray-700 mb-3">
          <span>Price per seat</span>
          <span className="font-semibold">{ride.price_per_seat} ₾</span>
        </div>

        <div className="flex justify-between text-gray-700 mb-6">
          <span>Seats available</span>
          <span className="font-semibold">{ride.seats_available}</span>
        </div>

        <input
          placeholder="Enter your name and surname"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-300 rounded-xl p-3 mb-3 text-gray-800 placeholder-gray-500"
        />

        <input
          placeholder="Enter your phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full border border-gray-300 rounded-xl p-3 mb-3 text-gray-800 placeholder-gray-500"
        />

        <input
          type="number"
          min="1"
          max={ride.seats_available}
          value={seats}
          onChange={(e) => setSeats(Number(e.target.value))}
          className="w-full border border-gray-300 rounded-xl p-3 mb-4 text-gray-800"
        />

        <button
          onClick={bookSeat}
          disabled={ride.seats_available === 0}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold hover:opacity-90 transition disabled:bg-gray-400"
        >
          {ride.seats_available > 0 ? "Book Seat" : "No seats left"}
        </button>

      </div>

    </main>
  );
}
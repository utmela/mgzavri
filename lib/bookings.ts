import { apiValue, ApiClientError } from "./api";
import type { BookingType } from "./types";
import { supabase } from "./supabase";
import { bookingAttemptKey, clearBookingAttempt, getBookingAttempt } from "./booking-attempt";

type CreateBookingInput = {
  rideId: string;
  passengerName: string;
  passengerPhone: string;
  seats: number;
  bookingType: BookingType;
};

export async function createBooking(input: CreateBookingInput) {
  return reserve("/bookings", input.rideId, "platform", input);
}

async function reserve(path: string, rideId: string, source: "platform" | "external", body: unknown) {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error("Please sign in to book this trip.");
  const key = bookingAttemptKey(data.session.user.id, rideId, source);
  try {
    const result = await apiValue<string>(path, { method: "POST", body, idempotencyKey: getBookingAttempt(key) });
    clearBookingAttempt(key);
    return result;
  } catch (error) {
    if (error instanceof ApiClientError && error.code === "BOOKING_CANCELLED") clearBookingAttempt(key);
    throw error;
  }
}

export async function adjustRideSeats(rideId: string, delta: number) {
  return apiValue<number>(`/rides/${rideId}/availability`, { method: "PATCH", body: { delta } });
}

export async function createExternalBooking(rideId: string, seats: number, passengerName?: string) {
  return reserve("/bookings/external", rideId, "external", { rideId, seats, passengerName: passengerName?.trim() || null });
}

export async function cancelBooking(bookingId: string) {
  await apiValue(`/bookings/${bookingId}`, { method: "DELETE" });
}

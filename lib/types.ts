export type BookingType = "seat" | "full_van";
export type BookingSource = "platform" | "external";
export type BookingStatus = "confirmed" | "cancelled";

export type Ride = {
  id: string;
  user_id: string;
  driver_name: string | null;
  phone?: string;
  from_city: string;
  to_city: string;
  departure_time: string;
  vehicle_type: string;
  seats_total: number;
  seats_available: number;
  price_per_seat: number;
  accessories: string[] | null;
  notes: string | null;
  created_at: string;
  plate_number: string | null;
  vehicle_color: string | null;
  entire_van_price?: number | null;
  allow_entire_van_booking?: boolean;
  full_van_booked?: boolean;
  pickup_point?: string | null;
  dropoff_point?: string | null;
};

export type Booking = {
  id: string;
  ride_id: string;
  passenger_name: string | null;
  passenger_phone: string | null;
  seats_booked: number;
  total_price: number | null;
  payment_status: string | null;
  created_at: string;
  user_id: string | null;
  booking_type?: BookingType;
  source?: BookingSource;
  status?: BookingStatus;
};

export type RideBooking = Booking & { ride: Ride };

export type PassengerRequest = {
  id: string;
  user_id: string;
  from_city: string;
  to_city: string;
  departure_date: string;
  passengers: number;
  budget: number | null;
  phone: string;
  note: string | null;
  created_at: string;
  accessories: string[] | null;
};

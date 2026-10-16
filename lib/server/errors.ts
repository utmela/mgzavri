export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const databaseErrors: Record<string, [number, string]> = {
  MAINTENANCE: [503, "Bookings and changes are temporarily paused. Please try again later."],
  RATE_LIMITED: [429, "Too many changes. Please wait and try again."],
  IDEMPOTENCY_CONFLICT: [409, "This booking attempt was already used with different details. Check your bookings before trying again."],
  BOOKING_CANCELLED: [409, "This booking has been cancelled. Start a new booking to reserve again."],
  AUTH_REQUIRED: [401, "Please sign in to continue."],
  NOT_AUTHORIZED: [403, "You do not have access to this action."],
  RIDE_NOT_FOUND: [404, "This trip could not be found."],
  BOOKING_NOT_FOUND: [404, "This booking could not be found."],
  NOT_ENOUGH_SEATS: [409, "Not enough seats are still available."],
  FULL_VAN_UNAVAILABLE: [409, "The entire van is no longer available."],
  TRIP_FULLY_BOOKED: [409, "This trip has already been fully booked."],
  ABOVE_CAPACITY: [409, "Available seats cannot exceed the unreserved capacity."],
  RIDE_DEPARTED: [409, "The departure time must be in the future."],
  RIDE_HAS_BOOKINGS: [409, "Trips with booking history cannot be deleted."],
  TRIP_HAS_BOOKINGS: [409, "Trips with booking history cannot be deleted."],
  INVALID_SEAT_COUNT: [400, "Check the seat count and existing reservations."],
};

export function databaseError(error: { code?: string; message: string }): never {
  for (const [code, [status, message]] of Object.entries(databaseErrors)) {
    if (error.message.includes(code)) throw new ApiError(status, code, message);
  }
  if (error.code === "42501") throw new ApiError(403, "FORBIDDEN", "You do not have access to this action.");
  if (error.code === "23505") throw new ApiError(409, "ALREADY_BOOKED", "You already have an active reservation for this trip. Check My bookings.");
  if (error.code === "23503") throw new ApiError(409, "CONFLICT", "This change conflicts with an existing record.");
  if (error.code === "23514" || error.message.startsWith("INVALID_") || error.message === "PASSENGER_DETAILS_REQUIRED") {
    throw new ApiError(400, "INVALID_INPUT", "Check the supplied trip or passenger details.");
  }
  // Schema details, SQL and personal information must never be returned to clients.
  throw new ApiError(503, "BACKEND_UNAVAILABLE", "The booking service is temporarily unavailable. Please try again.");
}

export function errorResponse(error: unknown): Response {
  const known = error instanceof ApiError ? error : new ApiError(500, "INTERNAL_ERROR", "Something went wrong. Please try again.");
  return Response.json({ error: { code: known.code, message: known.message } }, {
    status: known.status, headers: { "Cache-Control": "no-store", ...(known.status === 429 ? { "Retry-After": "60" } : {}) },
  });
}

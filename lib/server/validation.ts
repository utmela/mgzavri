import { ApiError } from "./errors.ts";
import { CITIES } from "../cities.ts";

type Input = Record<string, unknown>;

export function invalid(message: string): never {
  throw new ApiError(400, "INVALID_INPUT", message);
}

export async function readBody(request: Request): Promise<Input> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new ApiError(415, "JSON_REQUIRED", "Send an application/json request.");
  }
  // Stream the body with a hard bound, including when Content-Length is absent.
  const reader = request.body?.getReader();
  if (!reader) return invalid("A JSON object is required.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 16384) {
      await reader.cancel();
      throw new ApiError(413, "BODY_TOO_LARGE", "The request is too large.");
    }
    chunks.push(value);
  }
  let value: unknown;
  try {
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    value = JSON.parse(new TextDecoder().decode(bytes));
  } catch { return invalid("Invalid JSON."); }
  if (!value || typeof value !== "object" || Array.isArray(value)) return invalid("A JSON object is required.");
  return value as Input;
}

export function uuid(value: unknown): string {
  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) return invalid("Invalid record ID.");
  return value;
}

export function text(value: unknown, name: string, max = 120): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) return invalid(`Check ${name}.`);
  return value.trim();
}

function optionalText(value: unknown, name: string, max: number): string | null {
  return value == null || value === "" ? null : text(value, name, max);
}

export function number(value: unknown, name: string, min: number, max: number, integer = false): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) return invalid(`Check ${name}.`);
  return value;
}

export function city(value: unknown): string {
  const name = text(value, "city");
  if (!CITIES.some((item) => item.name === name)) return invalid("Choose a supported city.");
  return name;
}

function route(input: Input) {
  const from_city = city(input.from_city), to_city = city(input.to_city);
  if (from_city === to_city) return invalid("Choose two different cities.");
  return { from_city, to_city };
}

function accessories(value: unknown): string[] {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length > 3 || value.some((item) => !["skis", "luggage", "pets"].includes(item))) return invalid("Check the selected accessories.");
  return [...new Set(value)] as string[];
}

export function date(value: unknown): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) return invalid("Choose a valid date.");
  return value;
}

export function georgiaToday(): string {
  return new Date(Date.now() + 4 * 3600000).toISOString().slice(0, 10);
}

export function tripDetails(input: Input) {
  const departure = text(input.departure_time, "departure time", 40);
  if (!/^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/.test(departure) || !Number.isFinite(Date.parse(departure)) || Date.parse(departure) <= Date.now()) return invalid("Choose a future departure time with a timezone.");
  if (typeof input.allow_entire_van_booking !== "boolean") return invalid("Check the entire van option.");
  return {
    vehicle_type: text(input.vehicle_type, "vehicle model"),
    departure_time: new Date(departure).toISOString(),
    seats_total: number(input.seats_total, "total capacity", 1, 30, true),
    price_per_seat: number(input.price_per_seat, "seat price", 0, 100000),
    pickup_point: optionalText(input.pickup_point, "pickup point", 250),
    dropoff_point: optionalText(input.dropoff_point, "drop-off point", 250),
    allow_entire_van_booking: input.allow_entire_van_booking,
    entire_van_price: input.allow_entire_van_booking ? number(input.entire_van_price, "entire van price", 0, 100000) : null,
  };
}

export function newTrip(input: Input) {
  const details = tripDetails(input);
  return {
    ...details, ...route(input), seats_available: details.seats_total,
    driver_name: text(input.driver_name, "driver name"), phone: text(input.phone, "phone number", 32),
    plate_number: optionalText(input.plate_number, "plate number", 20),
    vehicle_color: optionalText(input.vehicle_color, "vehicle color", 40),
    notes: optionalText(input.notes, "notes", 2000), accessories: accessories(input.accessories),
  };
}

export function newRequest(input: Input) {
  const departure_date = date(input.departure_date);
  if (departure_date < georgiaToday()) return invalid("Choose today or a future date.");
  return {
    ...route(input), departure_date,
    passengers: number(input.passengers, "passengers", 1, 30, true),
    budget: input.budget == null ? null : number(input.budget, "budget", 0, 100000),
    phone: text(input.phone, "phone number", 32), note: optionalText(input.note, "notes", 2000),
    accessories: accessories(input.accessories),
  };
}

export function newBooking(input: Input) {
  if (input.bookingType !== "seat" && input.bookingType !== "full_van") return invalid("Choose a booking type.");
  return {
    p_ride_id: uuid(input.rideId), p_passenger_name: text(input.passengerName, "passenger name"),
    p_passenger_phone: text(input.passengerPhone, "phone number", 32),
    p_seats: number(input.seats, "passengers", 1, 30, true), p_booking_type: input.bookingType,
  };
}

export function pagination(params: URLSearchParams) {
  const limit = params.has("limit") ? Number(params.get("limit")) : 100;
  const offset = params.has("offset") ? Number(params.get("offset")) : 0;
  return { limit: number(limit, "limit", 1, 100, true), offset: number(offset, "offset", 0, 100000, true) };
}

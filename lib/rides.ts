import { apiValue } from "./api";

export async function getDriverPhone(rideId: string): Promise<string | null> {
  return apiValue<string | null>(`/rides/${rideId}/contact`);
}

"use client";

import { supabase } from "./supabase";

export class ApiClientError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

export type ApiResult<T> = { data: T | null; error: ApiClientError | null };

// A single transport keeps authentication, JSON and network failures consistent.
// Auth remains in the existing browser session; the API verifies its JWT.
export async function api<T>(path: string, options: { method?: string; body?: unknown; public?: boolean; idempotencyKey?: string } = {}): Promise<ApiResult<T>> {
  try {
    const headers = new Headers();
    if (options.idempotencyKey) headers.set("Idempotency-Key", options.idempotencyKey);
    if (!options.public) {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw new ApiClientError(401, "AUTH_REQUIRED", "Please sign in again.");
      if (data.session) headers.set("Authorization", `Bearer ${data.session.access_token}`);
    }
    if (options.body !== undefined) headers.set("Content-Type", "application/json");
    const response = await fetch(`/api${path}`, {
      method: options.method || "GET", headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      cache: "no-store", signal: AbortSignal.timeout(15000),
    });
    const result = await response.json();
    if (!response.ok) throw new ApiClientError(response.status, result.error?.code || "REQUEST_FAILED", result.error?.message || "Please try again.");
    return { data: result.data as T, error: null };
  } catch (error) {
    return { data: null, error: error instanceof ApiClientError ? error : new ApiClientError(503, "NETWORK_ERROR", "The service could not be reached. Please try again.") };
  }
}

export async function apiValue<T>(path: string, options?: Parameters<typeof api>[1]): Promise<T> {
  const result = await api<T>(path, options);
  if (result.error) throw result.error;
  return result.data as T;
}

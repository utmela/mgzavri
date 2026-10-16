// Keep only the random attempt ID in session storage, never passenger details.
// The in-memory map covers environments where session storage is unavailable.
const attempts = new Map<string, string>();

export function bookingAttemptKey(userId: string, rideId: string, source: "platform" | "external") {
  return `mgzavri:booking-attempt:v1:${userId}:${rideId}:${source}`;
}

export function getBookingAttempt(key: string): string {
  try {
    const saved = sessionStorage.getItem(key);
    if (saved && /^[0-9a-f-]{36}$/i.test(saved)) return saved;
  } catch { /* Storage may be disabled. The in-memory key still supports retries. */ }
  const attempt = attempts.get(key) ?? crypto.randomUUID();
  attempts.set(key, attempt);
  try { sessionStorage.setItem(key, attempt); } catch { /* In-memory fallback. */ }
  return attempt;
}

export function clearBookingAttempt(key: string) {
  attempts.delete(key);
  try { sessionStorage.removeItem(key); } catch { /* Storage may be disabled. */ }
}

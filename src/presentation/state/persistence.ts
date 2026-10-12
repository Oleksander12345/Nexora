// Browser storage can be missing, full or blocked (private mode), so every
// access is guarded and the app keeps working with in-memory state.
export function readStored<T>(
  key: string,
  parse: (value: unknown) => T,
  fallback: T,
): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : parse(JSON.parse(raw));
  } catch {
    return fallback;
  }
}
export function writeStored(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Persistence is a convenience; ignore quota and privacy errors.
  }
}

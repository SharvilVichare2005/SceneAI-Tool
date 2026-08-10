import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const SUPABASE_PROJECT_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://tfhyeamkietfqmbylyqt.supabase.co";

const DEFAULT_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

let cachedClient: SupabaseClient | null = null;
let currentKey = "";

/**
 * Retrieves the currently active Supabase Anon Key (from env or localStorage).
 */
export function getSupabaseAnonKey(): string {
  if (typeof window !== "undefined") {
    const local = localStorage.getItem("labellingapp:supabase_anon_key");
    if (local && local.trim()) return local.trim();
  }
  return DEFAULT_ANON_KEY.trim();
}

/**
 * Saves a new anon key to localStorage and resets the client.
 */
export function saveSupabaseAnonKey(key: string): void {
  if (typeof window !== "undefined") {
    if (key.trim()) {
      localStorage.setItem("labellingapp:supabase_anon_key", key.trim());
    } else {
      localStorage.removeItem("labellingapp:supabase_anon_key");
    }
  }
  cachedClient = null;
  currentKey = "";
}

/**
 * Returns true if a non-empty Supabase anon key is available.
 */
export function isSupabaseConfigured(): boolean {
  const key = getSupabaseAnonKey();
  return Boolean(key && key.length > 20 && !key.includes("placeholder"));
}

/**
 * Returns the Supabase client singleton instance.
 */
export function getSupabase(): SupabaseClient {
  const key = getSupabaseAnonKey() || "anon-key-placeholder";
  if (!cachedClient || currentKey !== key) {
    currentKey = key;
    cachedClient = createClient(SUPABASE_PROJECT_URL, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return cachedClient;
}

export const supabase = getSupabase();

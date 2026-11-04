import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(
  url &&
  key &&
  url.startsWith("https://") &&
  !url.includes("YOUR_PROJECT")
);

export const supabase = isSupabaseConfigured
  ? createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function getSupabase() {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Check Vercel Environment Variables."
    );
  }

  return supabase;
}

export const requireSupabase = getSupabase;

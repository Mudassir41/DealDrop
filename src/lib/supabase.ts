import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// In-memory store as fallback when Supabase isn't configured
export const memoryStore = {
  stores: [] as any[],
  deals: [] as any[],
  customers: [] as any[],
  notifications: [] as any[],
};

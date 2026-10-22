import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";

const supabaseConfig = getSupabaseConfig();

export const isSupabaseConfigured = supabaseConfig !== null;

export const supabase = supabaseConfig
  ? createBrowserClient(supabaseConfig.url, supabaseConfig.anonKey)
  : null;

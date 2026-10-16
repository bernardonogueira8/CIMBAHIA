import { createBrowserClient } from "@supabase/ssr";

// Fallback oficial do projeto PharmaCare
const DEFAULT_SUPABASE_URL = "https://uzjvycaygwtpaiwvkylt.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6anZ5Y2F5Z3d0cGFpd3ZreWx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNTYyNzIsImV4cCI6MjEwNzczMjI3Mn0.GbVUAIkl-sy3Tcp1Oq0hFzeFCoA0d8cZhFd13gQakDI";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes("seu-projeto")
);

export const supabase = isSupabaseConfigured
  ? createBrowserClient(supabaseUrl, supabaseAnonKey)
  : null;

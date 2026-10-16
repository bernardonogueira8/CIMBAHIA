import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Fallback oficial do projeto PharmaCare
const DEFAULT_SUPABASE_URL = "https://uzjvycaygwtpaiwvkylt.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6anZ5Y2F5Z3d0cGFpd3ZreWx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNTYyNzIsImV4cCI6MjEwNzczMjI3Mn0.GbVUAIkl-sy3Tcp1Oq0hFzeFCoA0d8cZhFd13gQakDI";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    }
  );
}

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export type SupabaseMode = "configured" | "setup_required";

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  return url && key ? { mode: "configured" as const, url, key } : { mode: "setup_required" as const };
}

// Dev-only passwordless login. When enabled, any entered code signs the member in as a real
// Supabase user (so real rows are written) without needing an email inbox. Turn this off by
// removing CORGI_DEV_LOGIN once real Supabase OTP email is wired up.
export function isDevLoginEnabled() {
  return process.env.CORGI_DEV_LOGIN === "1";
}

// Server-only admin client (service-role key). Never import into client code.
export function createCorgiAdminClient() {
  const config = getSupabaseConfig();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (config.mode === "setup_required" || !serviceKey) return null;
  return createClient(config.url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function createCorgiServerClient() {
  const config = getSupabaseConfig();
  if (config.mode === "setup_required") return null;
  const cookieStore = await cookies();
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (values) => {
        for (const { name, value, options } of values) {
          cookieStore.set(name, value, options);
        }
      },
    },
  });
}


import { NextResponse } from "next/server";
import { createCorgiServerClient, getSupabaseConfig } from "../../../../lib/supabase";

export async function GET(request: Request) {
  if (getSupabaseConfig().mode === "setup_required") {
    return NextResponse.redirect(new URL("/?setup=supabase", request.url));
  }
  const supabase = await createCorgiServerClient();
  const origin = new URL(request.url).origin;
  const { data, error } = await supabase!.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });
  return error || !data.url
    ? NextResponse.redirect(new URL("/?auth=google-unavailable", request.url))
    : NextResponse.redirect(data.url);
}


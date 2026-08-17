import { NextResponse } from "next/server";
import { createCorgiServerClient, getSupabaseConfig } from "../../../../lib/supabase";

export async function POST() {
  if (getSupabaseConfig().mode === "configured") {
    const supabase = await createCorgiServerClient();
    await supabase!.auth.signOut();
  }
  const response = NextResponse.json({ status: "signed_out" });
  response.cookies.set("corgi_exa_otp", "", { path: "/", maxAge: 0 });
  return response;
}

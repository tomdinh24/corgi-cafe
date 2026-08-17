import { NextResponse } from "next/server";
import { createCorgiAdminClient, createCorgiServerClient, getSupabaseConfig } from "../../../../lib/supabase";

// Permanently deletes the signed-in member's account. Deleting the auth user cascades through
// members -> profiles / profile_sources / sessions / recommendations / feedback / media via the
// schema's ON DELETE CASCADE, so this one call removes everything tied to the member. The user id
// is taken from the verified session cookie (never from the request body), so a caller can only
// ever delete their own account. Requires the service-role admin client (auth.admin.deleteUser).
export async function POST() {
  if (getSupabaseConfig().mode === "setup_required") {
    return NextResponse.json({ status: "preview_only", message: "Supabase is not connected. Nothing was deleted." });
  }
  const supabase = await createCorgiServerClient();
  const { data: auth, error: authError } = await supabase!.auth.getUser();
  if (authError || !auth.user) return NextResponse.json({ message: "Sign in again." }, { status: 401 });

  const admin = createCorgiAdminClient();
  if (!admin) return NextResponse.json({ message: "Account deletion is unavailable right now." }, { status: 500 });

  const { error: deleteError } = await admin.auth.admin.deleteUser(auth.user.id);
  if (deleteError) return NextResponse.json({ message: "Your account could not be deleted. Try again." }, { status: 502 });

  // Clear the local session cookie now that the user no longer exists.
  await supabase!.auth.signOut().catch(() => undefined);
  const response = NextResponse.json({ status: "deleted" });
  response.cookies.set("corgi_exa_otp", "", { path: "/", maxAge: 0 });
  return response;
}

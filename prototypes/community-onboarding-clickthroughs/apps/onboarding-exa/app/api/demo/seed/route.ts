import { NextResponse } from "next/server";
import { z } from "zod";
import { seedDemoPeople } from "@/lib/demoSeed";
import { createCorgiAdminClient, createCorgiServerClient, getSupabaseConfig } from "@/lib/supabase";

// Re-arms the isolated demo pool right before a demo user runs the matcher. Requires a signed-in
// caller (so it can't be used to spam-create users) and the service-role key (server-only). The
// caller passes the boundaries it just started its session with, which are copied onto the demo
// people's fresh sessions so the exact-equality match filter passes.
const BodySchema = z.object({
  boundaries: z.object({
    fundraising: z.boolean(),
    recruiting: z.boolean(),
    sales: z.boolean(),
  }),
});

export async function POST(request: Request) {
  if (getSupabaseConfig().mode === "setup_required") {
    return NextResponse.json({ status: "preview_only" });
  }
  const server = await createCorgiServerClient();
  const { data: auth, error: authError } = await server!.auth.getUser();
  if (authError || !auth.user) {
    return NextResponse.json({ message: "Sign in again before starting a demo." }, { status: 401 });
  }

  const admin = createCorgiAdminClient();
  if (!admin) {
    return NextResponse.json({ message: "Demo mode isn’t configured on the server." }, { status: 503 });
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Check the demo request and try again." }, { status: 400 });
  }

  try {
    const results = await seedDemoPeople(admin, parsed.data.boundaries);
    const seeded = results.filter((r) => r.ok).length;
    if (!seeded) {
      return NextResponse.json({ message: "No demo people could be prepared.", results }, { status: 502 });
    }
    return NextResponse.json({ status: "seeded", seeded });
  } catch {
    return NextResponse.json({ message: "Could not prepare demo matches." }, { status: 502 });
  }
}

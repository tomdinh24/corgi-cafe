import { NextResponse } from "next/server";
import { createCorgiServerClient, getSupabaseConfig } from "../../../lib/supabase";

const MEDIA_KIND: Record<string, string> = { self: "self_and_outfit", nearby: "nearby_view" };
const MAX_BYTES = 5 * 1024 * 1024;

// Uploads a recognition photo into the recognition-media bucket and records it. RLS on both the
// bucket and public.recognition_media already require the caller to have chosen "continue" on
// this introduction, so an authenticated, cookie-scoped client is enough — no service role.
export async function POST(request: Request) {
  if (getSupabaseConfig().mode === "setup_required") {
    return NextResponse.json({ status: "preview_only", message: "Supabase is not connected. Nothing was uploaded." });
  }
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const kindParam = form?.get("kind");
  const recommendationId = form?.get("recommendationId");
  if (!(file instanceof File) || typeof kindParam !== "string" || !MEDIA_KIND[kindParam] || typeof recommendationId !== "string") {
    return NextResponse.json({ message: "Missing photo, kind, or introduction." }, { status: 400 });
  }
  if (!file.type.startsWith("image/") || file.size > MAX_BYTES) {
    return NextResponse.json({ message: "Photos must be an image under 5MB." }, { status: 400 });
  }

  const supabase = await createCorgiServerClient();
  const { data: auth, error: authError } = await supabase!.auth.getUser();
  if (authError || !auth.user) return NextResponse.json({ message: "Sign in again." }, { status: 401 });

  const mediaKind = MEDIA_KIND[kindParam];
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${auth.user.id}/${recommendationId}/${mediaKind}-${Date.now()}.${extension}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: uploadError } = await supabase!.storage.from("recognition-media").upload(path, bytes, { contentType: file.type, upsert: true });
  if (uploadError) return NextResponse.json({ message: "Your photo could not be uploaded." }, { status: 502 });

  const { error: rowError } = await supabase!.from("recognition_media").upsert({
    recommendation_id: recommendationId,
    member_id: auth.user.id,
    media_kind: mediaKind,
    storage_path: path,
    expires_at: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
  }, { onConflict: "recommendation_id,member_id,media_kind" });
  if (rowError) return NextResponse.json({ message: "Your photo could not be saved." }, { status: 502 });

  return NextResponse.json({ status: "uploaded" });
}

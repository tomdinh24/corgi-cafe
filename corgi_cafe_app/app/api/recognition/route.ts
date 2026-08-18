import { NextResponse } from "next/server";
import { createCorgiServerClient, getSupabaseConfig } from "../../../lib/supabase";

const MEDIA_KIND: Record<string, string> = { self: "self_and_outfit", nearby: "nearby_view" };
const MAX_BYTES = 5 * 1024 * 1024;

// Returns the COUNTERPART's two recognition photos (self+outfit, nearby view) as short-lived signed
// URLs so the find-each-other screen can actually show them. The recognition-media bucket is private;
// RLS (recognition_pair_select / recognition_storage_pair_select) already lets a participant who chose
// "continue" read the other side's rows and objects during the live, unexpired introduction — so the
// cookie-scoped client is enough and a member outside the pair (or after expiry) simply gets nothing.
export async function GET(request: Request) {
  if (getSupabaseConfig().mode === "setup_required") {
    return NextResponse.json({ status: "preview_only", self: null, nearby: null });
  }
  const recommendationId = new URL(request.url).searchParams.get("recommendationId");
  if (!recommendationId) return NextResponse.json({ message: "Missing introduction." }, { status: 400 });

  const supabase = await createCorgiServerClient();
  const { data: auth, error: authError } = await supabase!.auth.getUser();
  if (authError || !auth.user) return NextResponse.json({ message: "Sign in again." }, { status: 401 });

  // The counterpart's rows only: my own participation + "continue" is enforced by RLS, and I already
  // took my own photos. Rows the pair-select policy hides (not a participant, expired, deleted) are
  // simply absent.
  const { data: rows } = await supabase!
    .from("recognition_media")
    .select("media_kind,storage_path")
    .eq("recommendation_id", recommendationId)
    .neq("member_id", auth.user.id);

  const out: { self: string | null; nearby: string | null } = { self: null, nearby: null };
  for (const row of rows ?? []) {
    const key = row.media_kind === "self_and_outfit" ? "self" : row.media_kind === "nearby_view" ? "nearby" : null;
    if (!key) continue;
    const { data: signed } = await supabase!.storage.from("recognition-media").createSignedUrl(row.storage_path as string, 3600);
    if (signed?.signedUrl) out[key] = signed.signedUrl;
  }
  return NextResponse.json(out);
}

// Storage rejects any content type outside the bucket allow-list (jpeg/png/webp/heic/heif/gif).
// Browsers sometimes hand us an empty or non-image file.type (notably iPhone HEIC captures and
// some "Choose File" pickers), so normalise to a supported image type — preferring the reported
// type, then the filename extension, then jpeg — instead of forwarding a type storage will 415 on.
const SUPPORTED = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/gif"]);
const EXT_TYPE: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", heic: "image/heic", heif: "image/heif", gif: "image/gif" };
function resolveImageType(file: File): string {
  if (SUPPORTED.has(file.type)) return file.type;
  const ext = file.name.toLowerCase().split(".").pop() ?? "";
  return EXT_TYPE[ext] ?? "image/jpeg";
}

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
  if (file.size === 0 || file.size > MAX_BYTES || (file.type && !file.type.startsWith("image/"))) {
    return NextResponse.json({ message: "Photos must be an image under 5MB." }, { status: 400 });
  }

  const supabase = await createCorgiServerClient();
  const { data: auth, error: authError } = await supabase!.auth.getUser();
  if (authError || !auth.user) return NextResponse.json({ message: "Sign in again." }, { status: 401 });

  const contentType = resolveImageType(file);
  const mediaKind = MEDIA_KIND[kindParam];
  const extension = contentType.split("/")[1] ?? "jpg";
  const path = `${auth.user.id}/${recommendationId}/${mediaKind}-${Date.now()}.${extension}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  // No upsert: each upload uses a unique (Date.now) path, and Storage evaluates an upsert against
  // an UPDATE policy the recognition-media bucket doesn't have — which rejected every upload,
  // including first ones. A plain insert only needs the existing owner INSERT policy.
  const { error: uploadError } = await supabase!.storage.from("recognition-media").upload(path, bytes, { contentType });
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

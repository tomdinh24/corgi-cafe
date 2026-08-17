import { NextResponse } from "next/server";
import { createCorgiServerClient, getSupabaseConfig } from "../../../../lib/supabase";

const MAX_BYTES = 5 * 1024 * 1024;

// Storage rejects any content type outside the bucket allow-list. Browsers sometimes hand us an
// empty or non-image file.type (notably iPhone HEIC captures and some "Choose File" pickers), so
// normalise to a supported image type — reported type, then filename extension, then jpeg.
const SUPPORTED = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/gif"]);
const EXT_TYPE: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", heic: "image/heic", heif: "image/heif", gif: "image/gif" };
function resolveImageType(file: File): string {
  if (SUPPORTED.has(file.type)) return file.type;
  const ext = file.name.toLowerCase().split(".").pop() ?? "";
  return EXT_TYPE[ext] ?? "image/jpeg";
}

// Uploads a new profile photo (from "Take photo" / "Upload photo" / "Upload file" in account
// settings) into the public `avatars` bucket and points profiles.avatar_url at its public URL.
// The member id comes from the verified session cookie, and the object path is owner-scoped, so a
// caller can only ever write their own avatar. Each upload uses a unique (Date.now) path so the
// public URL changes and browsers don't serve a stale cached image after a re-upload.
export async function POST(request: Request) {
  if (getSupabaseConfig().mode === "setup_required") {
    return NextResponse.json({ status: "preview_only", message: "Supabase is not connected. Nothing was uploaded." });
  }
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ message: "No photo was provided." }, { status: 400 });
  if (file.size === 0 || file.size > MAX_BYTES || (file.type && !file.type.startsWith("image/"))) {
    return NextResponse.json({ message: "Your photo must be an image under 5MB." }, { status: 400 });
  }

  const supabase = await createCorgiServerClient();
  const { data: auth, error: authError } = await supabase!.auth.getUser();
  if (authError || !auth.user) return NextResponse.json({ message: "Sign in again." }, { status: 401 });

  const contentType = resolveImageType(file);
  const extension = contentType.split("/")[1] ?? "jpg";
  const path = `${auth.user.id}/avatar-${Date.now()}.${extension}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: uploadError } = await supabase!.storage.from("avatars").upload(path, bytes, { contentType });
  if (uploadError) return NextResponse.json({ message: "Your photo could not be uploaded." }, { status: 502 });

  const { data: pub } = supabase!.storage.from("avatars").getPublicUrl(path);
  const avatarUrl = pub.publicUrl;
  const { error: rowError } = await supabase!.from("profiles").update({ avatar_url: avatarUrl }).eq("member_id", auth.user.id);
  if (rowError) return NextResponse.json({ message: "Your photo uploaded, but your profile could not be updated." }, { status: 502 });

  return NextResponse.json({ status: "uploaded", avatarUrl });
}

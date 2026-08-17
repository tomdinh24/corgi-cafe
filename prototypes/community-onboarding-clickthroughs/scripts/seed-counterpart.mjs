// Seed one realistic counterpart (Rowan) into any Supabase project over HTTPS using the
// service-role key — no database password or psql needed. Works for local or cloud.
//
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-counterpart.mjs
//
// Safe to re-run: it upserts the profile/sources and only creates the auth user + session once.
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const email = "rowan@corgi.local";

// 1. Create (or find) the auth user. The on_auth_user_created trigger inserts members + onboarding.
let memberId;
const created = await admin.auth.admin.createUser({
  email,
  email_confirm: true,
  user_metadata: { full_name: "Rowan Ellery" },
});
if (created.error && !/already/i.test(created.error.message)) {
  console.error("createUser failed:", created.error.message);
  process.exit(1);
}
if (created.data?.user) {
  memberId = created.data.user.id;
} else {
  const { data } = await admin.auth.admin.listUsers();
  memberId = data.users.find((u) => u.email === email)?.id;
}
if (!memberId) { console.error("Could not resolve Rowan's member id."); process.exit(1); }

// 2. Profile.
await admin.from("profiles").upsert({
  member_id: memberId,
  first_name: "Rowan",
  last_name: "Ellery",
  broad_location: "San Francisco",
  role_title: "Community program designer",
  company_or_project: "Hospitality collective",
  about_me: "I help small gatherings feel easier to join.",
  current_work: "Designing low-pressure meetups for builders",
  favorite_drink: "Oat cortado",
  confirmed_at: new Date().toISOString(),
});

// 3. Shareable sources (revealed only after both confirm a meeting).
await admin.from("profile_sources").upsert(
  [
    { member_id: memberId, source_kind: "website", source_url: "https://rowan-studio.example", source_host: "rowan-studio.example", member_confirmed: true, share_after_meeting: true },
    { member_id: memberId, source_kind: "social", source_url: "https://instagram.com/rowan.gathers", source_host: "instagram.com", member_confirmed: true, share_after_meeting: true },
  ],
  { onConflict: "member_id,source_kind,source_url" },
);

// 4. An active searching session (only if Rowan has no active one already).
const { data: active } = await admin
  .from("visit_intro_sessions")
  .select("id")
  .eq("member_id", memberId)
  .in("status", ["draft", "searching", "waiting", "introduced", "meeting"]);
if (!active || active.length === 0) {
  const { error } = await admin.from("visit_intro_sessions").insert({
    member_id: memberId,
    cafe_code: "corgi-cafe",
    order_confirmed_today: true,
    at_cafe: true,
    presence_checked_at: new Date().toISOString(),
    conversation_mode: "specific",
    topics: ["Building community", "Creative projects"],
    useful_context: "Meeting builders who are thinking about how community forms",
    offer_context: "Can share how to host gatherings that feel easy to join",
    boundaries: { fundraising: false, recruiting: false, sales: false },
    status: "searching",
    expires_at: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
  });
  if (error) { console.error("session insert failed:", error.message); process.exit(1); }
}

console.log(`Seeded counterpart Rowan (${memberId}) with an active searching session.`);

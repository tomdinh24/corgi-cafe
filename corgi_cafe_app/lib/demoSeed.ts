import type { SupabaseClient } from "@supabase/supabase-js";
import { DEMO_CAFE_CODE } from "@/lib/cafes";
import { DEMO_PEOPLE, type DemoPerson } from "@/lib/demoPeople";
import { buildMemberEnrichment, ENRICHMENT_PIPELINE_VERSION } from "@/lib/enrichment";

// Seeds/refreshes the curated demo people so a Live-flow match can happen solo. Idempotent and
// self-healing: creates each person's auth user + profile on first run, then on every call cancels
// their stale session and inserts a fresh `searching` one carrying the CALLER's exact boundaries.
// That fresh-session-per-call design is deliberate — it clears the two things that otherwise make a
// seeded person silently unmatchable: (1) the exact jsonb boundaries-equality filter, and (2) a
// prior session already consumed (flipped to `introduced`) by an earlier demo match.

export type Boundaries = { fundraising: boolean; recruiting: boolean; sales: boolean };
export type SeedResult = { person: string; ok: boolean; sessionId?: string; error?: string };

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

// createUser errors (email already exists) after the first run; fall back to finding the id.
async function resolveMemberId(admin: SupabaseClient, person: DemoPerson): Promise<string | null> {
  const created = await admin.auth.admin.createUser({
    email: person.email,
    email_confirm: true,
    user_metadata: { full_name: `${person.firstName} ${person.lastName}` },
  });
  if (created.data?.user) return created.data.user.id;
  const { data } = await admin.auth.admin.listUsers();
  return data?.users.find((u) => u.email === person.email)?.id ?? null;
}

export async function seedDemoPeople(admin: SupabaseClient, boundaries: Boundaries): Promise<SeedResult[]> {
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  const results: SeedResult[] = [];

  for (const person of DEMO_PEOPLE) {
    const memberId = await resolveMemberId(admin, person);
    if (!memberId) {
      results.push({ person: person.email, ok: false, error: "could not resolve member id" });
      continue;
    }

    await admin.from("profiles").upsert({
      member_id: memberId,
      first_name: person.firstName,
      last_name: person.lastName,
      broad_location: person.location,
      role_title: person.roleTitle,
      company_or_project: person.company,
      about_me: person.about,
      current_work: person.currentWork,
      favorite_drink: person.drink,
      // enrichment is intentionally NOT written here: it's built once through the real pipeline below
      // and must survive re-seeds. Writing it here would clobber the derived `web` block every call.
      // Only written when the person has one, so a manual photo change isn't clobbered on re-seed.
      ...(person.avatarUrl ? { avatar_url: person.avatarUrl } : {}),
      confirmed_at: now,
    });

    // Run each demo person through the SAME enrichment pipeline a real member gets (lib/enrichment):
    // their own confirmed URLs + their company's own site → what the company does, stage, founder
    // status, focus areas, a digest. Done ONCE per person (guarded on a pipeline-versioned `web` block)
    // so re-seeds don't re-pay the Exa/OpenAI cost, and so an old hand-authored blob is replaced.
    const { data: existingProfile } = await admin.from("profiles").select("enrichment").eq("member_id", memberId).maybeSingle();
    const existingEnrichment = (existingProfile?.enrichment && typeof existingProfile.enrichment === "object" ? existingProfile.enrichment : {}) as Record<string, unknown>;
    const existingWeb = existingEnrichment.web as Record<string, unknown> | undefined;
    if (!existingWeb || typeof existingWeb.pipelineVersion !== "number") {
      const base = (person.enrichment ?? {}) as Record<string, unknown>;
      const outcome = await buildMemberEnrichment({
        name: `${person.firstName} ${person.lastName}`,
        company: person.company,
        role: person.roleTitle,
        location: person.location,
        base,
        sourceUrls: person.sources.map((source) => source.url),
      });
      // On a genuine no-signal, stamp an empty versioned block so we stop retrying; on no_content
      // (likely a transient Exa/key failure) leave it unversioned so the next seed retries.
      const enrichment =
        outcome.status === "enriched"
          ? outcome.enrichment
          : outcome.reason === "no_content"
            ? base
            : { ...base, web: { pipelineVersion: ENRICHMENT_PIPELINE_VERSION, sources: [] } };
      await admin.from("profiles").update({ enrichment }).eq("member_id", memberId);
    }

    if (person.sources.length) {
      await admin.from("profile_sources").upsert(
        person.sources.map((source) => ({
          member_id: memberId,
          source_kind: source.kind,
          source_url: source.url,
          source_host: hostOf(source.url),
          identifier_only: source.kind === "linkedin_identifier",
          member_confirmed: true,
          share_after_meeting: true,
        })),
        { onConflict: "member_id,source_kind,source_url" },
      );
    }

    await admin
      .from("visit_intro_sessions")
      .update({ status: "cancelled" })
      .eq("member_id", memberId)
      .in("status", ["draft", "searching", "waiting", "introduced", "meeting"]);

    const { data: session, error } = await admin
      .from("visit_intro_sessions")
      .insert({
        member_id: memberId,
        cafe_code: DEMO_CAFE_CODE,
        order_confirmed_today: true,
        at_cafe: true,
        presence_checked_at: now,
        conversation_mode: "specific",
        topics: person.topics,
        useful_context: person.useful,
        offer_context: person.offer,
        boundaries,
        status: "searching",
        expires_at: expiresAt,
      })
      .select("id")
      .single();

    results.push({ person: person.email, ok: !error, sessionId: session?.id, error: error?.message });
  }

  return results;
}

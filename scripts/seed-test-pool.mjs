// Seeds a small pool of diverse counterparts (beyond Rowan) into the cloud Supabase project over
// HTTPS using the service-role key, then exercises request_introduction against them to confirm
// the matcher produces real, distinct results for different topic/context combinations.
//
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-test-pool.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

const people = [
  {
    email: "priya@corgi.local",
    firstName: "Priya",
    lastName: "Nair",
    location: "San Francisco",
    roleTitle: "Product designer",
    company: "Loomleaf",
    about: "I design onboarding flows for early-stage products.",
    currentWork: "Simplifying signup for a fintech app",
    drink: "Iced matcha",
    topics: ["Product & technology", "Career stories"],
    useful: "Comparing notes on onboarding UX",
    offer: "Design critique and portfolio feedback",
  },
  {
    email: "marcus@corgi.local",
    firstName: "Marcus",
    lastName: "Webb",
    location: "Oakland",
    roleTitle: "Founder",
    company: "Fieldnote",
    about: "Building a tool for note-taking founders.",
    currentWork: "Raising a seed round",
    drink: "Drip coffee",
    topics: ["Fundraising", "First customers"],
    useful: "Fundraising war stories",
    offer: "Intros to early customers in logistics",
  },
  {
    email: "sasha@corgi.local",
    firstName: "Sasha",
    lastName: "Kim",
    location: "San Francisco",
    roleTitle: "ML engineer",
    company: "Fieldnote",
    about: "Working on retrieval systems.",
    currentWork: "AI search relevance",
    drink: "Cold brew",
    topics: ["AI & products", "Building community"],
    useful: "Talking through AI product tradeoffs",
    offer: "Technical deep-dives on retrieval/RAG",
  },
];

async function seedPerson(p) {
  let memberId;
  const created = await admin.auth.admin.createUser({
    email: p.email,
    email_confirm: true,
    user_metadata: { full_name: `${p.firstName} ${p.lastName}` },
  });
  if (created.data?.user) {
    memberId = created.data.user.id;
  } else {
    const { data } = await admin.auth.admin.listUsers();
    memberId = data.users.find((u) => u.email === p.email)?.id;
  }
  if (!memberId) throw new Error(`Could not resolve member id for ${p.email}`);

  await admin.from("profiles").upsert({
    member_id: memberId,
    first_name: p.firstName,
    last_name: p.lastName,
    broad_location: p.location,
    role_title: p.roleTitle,
    company_or_project: p.company,
    about_me: p.about,
    current_work: p.currentWork,
    favorite_drink: p.drink,
    confirmed_at: new Date().toISOString(),
  });

  await admin.from("visit_intro_sessions").update({ status: "cancelled" }).eq("member_id", memberId).in("status", ["draft", "searching", "waiting", "introduced", "meeting"]);

  const { data: session, error } = await admin.from("visit_intro_sessions").insert({
    member_id: memberId,
    cafe_code: "corgi-cafe",
    order_confirmed_today: true,
    at_cafe: true,
    presence_checked_at: new Date().toISOString(),
    conversation_mode: "specific",
    topics: p.topics,
    useful_context: p.useful,
    offer_context: p.offer,
    boundaries: { fundraising: false, recruiting: false, sales: false },
    status: "searching",
    expires_at: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
  }).select("id").single();
  if (error) throw new Error(`session insert failed for ${p.email}: ${error.message}`);

  console.log(`Seeded ${p.firstName} ${p.lastName} (${memberId}) — session ${session.id}, topics: ${p.topics.join(", ")}`);
  return { memberId, sessionId: session.id, name: `${p.firstName} ${p.lastName}`, topics: p.topics, email: p.email };
}

const seeded = [];
for (const p of people) {
  seeded.push(await seedPerson(p));
}

// request_introduction() checks auth.uid(), so it must be called as the real user, not the
// service-role client. Mint a real session per person (same generateLink -> verifyOtp path the
// app's dev-login uses) and call the RPC with that authenticated client.
async function asUser(email) {
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (linkError || !link?.properties?.email_otp) throw new Error(`generateLink failed for ${email}: ${linkError?.message}`);
  const client = createClient(url, process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error: verifyError } = await client.auth.verifyOtp({ email, token: link.properties.email_otp, type: "email" });
  if (verifyError) throw new Error(`verifyOtp failed for ${email}: ${verifyError.message}`);
  return client;
}

console.log("\n--- Running request_introduction for each seeded session (as the real user) ---");
for (const person of seeded) {
  const client = await asUser(person.email);
  const { data: recId, error } = await client.rpc("request_introduction", { target_session_id: person.sessionId });
  if (error) {
    console.log(`${person.name}: RPC error — ${error.message}`);
    continue;
  }
  if (!recId) {
    console.log(`${person.name}: no_match (no eligible counterpart found)`);
    continue;
  }
  const { data: counterpart, error: counterpartError } = await client.rpc("get_introduction_counterpart", { target_recommendation_id: recId });
  if (counterpartError) {
    console.log(`${person.name}: matched (recommendation ${recId}) but counterpart lookup failed — ${counterpartError.message}`);
    continue;
  }
  console.log(`${person.name}: matched with ${JSON.stringify(counterpart)}`);
}

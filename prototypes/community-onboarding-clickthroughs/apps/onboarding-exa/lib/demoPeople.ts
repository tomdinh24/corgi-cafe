// Curated demo pool — REAL people Tom picks, seeded as real (enriched) profiles so Demo mode can
// run the whole matching flow solo. They live only in the isolated `corgi-demo` cafe (see
// DEMO_CAFE_CODE) and never appear in Live pools.
//
// `enrichment` is the same jsonb blob the enrichment pipeline (app/api/enrich) produces and the
// matcher reads as `background`. It is baked in here from an anchored Exa lookup (see
// scripts/seed-demo-pool.mjs / the enrichment build step) so the LLM ranker can write a specific,
// grounded "why you two". Keep it optional so a person can be seeded before enrichment is filled in.

export type DemoEnrichment = {
  headline?: string;
  isFounder?: boolean;
  currentCompany?: string;
  pastCompanies?: string[];
  // Free-form web-derived context (stage / hiring / thesis / focus). Mirrors what the enrich route
  // stores under enrichment.web; the matcher's leanBackground() passes it through to the ranker.
  web?: Record<string, unknown>;
};

export type DemoSourceKind = "linkedin_identifier" | "website" | "github" | "social";

export type DemoPerson = {
  email: string;
  firstName: string;
  lastName: string;
  location: string;
  roleTitle: string;
  company: string;
  about: string;
  currentWork: string;
  drink: string;
  topics: string[];
  useful: string;
  offer: string;
  // Public links attached to the seeded profile (LinkedIn is the enrichment anchor — see build step).
  sources: { kind: DemoSourceKind; url: string }[];
  enrichment?: DemoEnrichment;
};

// topics use the app's canonical topicOptions (components/ExaOnboarding.tsx) for consistency.
export const DEMO_PEOPLE: DemoPerson[] = [
  {
    email: "richard.zhang@corgi.demo",
    firstName: "Richard",
    lastName: "Zhang",
    location: "New York",
    roleTitle: "Associate Product Manager",
    company: "Coinbase",
    about:
      "Associate PM on consumer crypto at Coinbase — making intimidating financial primitives usable for a first-timer. I came into product from a data-science / ML research background (UChicago Honors Data Science ’24), so I like the intersection of models and real product decisions.",
    currentWork: "Consumer product at Coinbase",
    drink: "Cortado",
    topics: ["Product & technology", "AI & products", "Career stories"],
    useful: "Notes on consumer crypto/fintech product, and breaking into PM from a technical / ML background",
    offer: "Product strategy for fintech/crypto, PM career advice (especially from a data-science start), and intros around the Coinbase orbit",
    sources: [{ kind: "linkedin_identifier", url: "https://www.linkedin.com/in/richardzhangxyz" }],
    // Anchored on Richard's confirmed LinkedIn (linkedin.com/in/richardzhangxyz) via Exa people-search.
    enrichment: {
      headline: "Product @ Coinbase · UChicago ’24",
      isFounder: false,
      currentCompany: "Coinbase",
      pastCompanies: ["Fermilab (data science research)", "University of Chicago Booth (ML research)"],
      web: {
        role: "Associate Product Manager, Product — Coinbase (Aug 2024–present)",
        focus: "Consumer crypto products",
        background: "Honors Data Science & Cognitive Science, University of Chicago ’24; ML / data-science research (Fermilab, UChicago Booth)",
        basedIn: "New York",
      },
    },
  },
  {
    email: "justin.ruiz@corgi.demo",
    firstName: "Justin",
    lastName: "Ruiz",
    location: "Los Angeles",
    roleTitle: "Senior Director, GTM",
    company: "Atoms",
    about:
      "I lead go-to-market at Atoms (atoms.co). I grew the role from strategy & planning to running GTM over about five years, and before Atoms I co-founded my own company (LoungeLooks) — so I think like a founder about growth: acquisition, retention, and the story that gets someone to try a new brand.",
    currentWork: "Running go-to-market at Atoms",
    drink: "Iced oat latte",
    topics: ["First customers", "Building community", "Product & technology"],
    useful: "GTM, growth, and strategy playbooks for consumer brands — and comparing notes on the founder path",
    offer: "Go-to-market strategy, early-customer acquisition, DTC growth, standing up a GTM function from scratch, and a founder’s perspective",
    sources: [
      { kind: "linkedin_identifier", url: "https://www.linkedin.com/in/justinruiz1" },
      { kind: "website", url: "https://atoms.co" },
    ],
    // Anchored on Justin's confirmed LinkedIn (linkedin.com/in/justinruiz1) via Exa people-search.
    enrichment: {
      headline: "Senior Director, GTM at Atoms · former founder",
      isFounder: true, // founder background — co-founded LoungeLooks before Atoms
      currentCompany: "Atoms",
      pastCompanies: ["LoungeLooks (co-founder)"],
      web: {
        role: "Senior Director, GTM — rose from Strategy & Planning over ~5 years at Atoms (atoms.co)",
        founderBackground: "Co-founded LoungeLooks before joining Atoms",
        background: "UCLA (Psychology)",
        basedIn: "Los Angeles",
      },
    },
  },
];

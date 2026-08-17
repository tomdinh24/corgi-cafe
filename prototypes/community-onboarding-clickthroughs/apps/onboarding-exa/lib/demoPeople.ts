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
    location: "San Francisco",
    roleTitle: "Product Manager",
    company: "Coinbase",
    about:
      "Product manager working on consumer crypto — the kind of products people have to actually trust with their money. I care a lot about turning intimidating financial primitives into something a first-timer can use.",
    currentWork: "Building consumer product at Coinbase",
    drink: "Cortado",
    topics: ["Product & technology", "AI & products", "Career stories"],
    useful: "Comparing notes on building trustworthy consumer fintech/crypto products",
    offer: "Product strategy for fintech/crypto, PM career advice, and intros around the Coinbase orbit",
    sources: [],
    // Filled by the enrichment build step (anchored on Richard's confirmed LinkedIn).
    enrichment: {
      headline: "Product Manager at Coinbase",
      isFounder: false,
      currentCompany: "Coinbase",
    },
  },
  {
    email: "justin.ruiz@corgi.demo",
    firstName: "Justin",
    lastName: "Ruiz",
    location: "San Francisco",
    roleTitle: "Go-to-market",
    company: "Atoms",
    about:
      "GTM at Atoms, a consumer footwear brand obsessed with fit and comfort. I spend my time on the unglamorous engine of growth — acquisition, retention, and the story that gets someone to try a new brand.",
    currentWork: "Running go-to-market at Atoms",
    drink: "Iced oat latte",
    topics: ["First customers", "Building community", "Product & technology"],
    useful: "Trading GTM and growth playbooks for consumer / DTC brands",
    offer: "Go-to-market strategy, early-customer acquisition, and DTC growth tactics",
    sources: [],
    // Filled by the enrichment build step (anchored on Justin's confirmed LinkedIn).
    enrichment: {
      headline: "Go-to-market at Atoms",
      isFounder: false,
      currentCompany: "Atoms",
    },
  },
];

import { defineConfig } from "@playwright/test";

const port = Number(process.env.CORGI_E2E_PORT ?? 4317);

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  fullyParallel: false,
  use: { trace: "retain-on-failure", baseURL: `http://127.0.0.1:${port}` },
  projects: [
    {
      name: "narrow-320",
      use: {
        viewport: { width: 320, height: 900 },
        isMobile: true,
        hasTouch: true,
      },
    },
    { name: "tablet-768", use: { viewport: { width: 768, height: 1024 } } },
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
  ],
  webServer: {
    command: `npm run build && npm exec --workspace=@corgi/onboarding-exa -- next start -p ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    // The browser suite exercises the UI in preview mode (no database), so it stays deterministic
    // and self-contained. The real-database matching path is covered by the API integration test
    // (supabase/tests/matching_rpc_test.sql) and the scripted end-to-end flow.
    env: {
      ...process.env,
      SESSION_SIGNING_SECRET: "corgi-e2e-session-secret-at-least-thirty-two-characters",
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
      CORGI_DEV_LOGIN: "",
    },
  },
});

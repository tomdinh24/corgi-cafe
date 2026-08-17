import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  use: {
    baseURL: "http://127.0.0.1:4413",
    trace: "retain-on-failure",
  },
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
    { name: "desktop-1440", use: { viewport: { width: 1440, height: 1000 } } },
  ],
  webServer: {
    command: "npm run dev:test",
    url: "http://127.0.0.1:4413",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});

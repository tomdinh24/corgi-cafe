import { expect, test, type Page } from "@playwright/test";

async function signInAndDescribe(page: Page) {
  await page.goto("/sign-up");
  await page.getByLabel("Email").fill("prototype@example.com");
  await page.getByRole("button", { name: "Sign up" }).click();
  await page.getByLabel("6-digit code").fill("424242");
  await page.getByRole("button", { name: "Verify" }).click();
  await page.getByLabel("First name").fill("Ari");
  await page.getByLabel("Last name").fill("Chen");
  await page.getByLabel("City or region").fill("Oakland, CA");
  await page.getByLabel("Role or title").fill("Product designer");
  await page.getByLabel("Company or project").fill("Loomleaf");
  await page.getByRole("button", { name: "Continue" }).click();
}

async function noSearchMatch(page: Page) {
  await page.route("**/api/search", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({ status: "draft_ready", candidates: [] }),
  }));
}

async function finishProfile(page: Page) {
  await noSearchMatch(page);
  await signInAndDescribe(page);
  // Auto-search runs on Continue from step 2; with no candidates we get the "add your details" state.
  await page.getByRole("button", { name: "Continue" }).click(); // step 3 → step 4 (add links)
  await page.getByRole("button", { name: "Continue" }).click(); // step 4 → step 5 (profile card)
  await page.getByRole("button", { name: "Confirm profile" }).click();
  await expect(page.getByRole("heading", { name: "What would you like to do next?" })).toBeVisible();
}

test("auto-search offers found profiles and skips cleanly when none match", async ({ page }) => {
  await page.route("**/api/search", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({ status: "draft_ready", candidates: [{
      id: "ari", firstName: "Ari", lastName: "Chen", title: "Untrusted imported role",
      company: "Untrusted imported company", location: "Exact location must not import",
      profileUrl: "https://www.linkedin.com/in/ari-cafe-demo", sourceHost: "linkedin.com",
      identifierOnly: true, mayExtractFacts: false,
    }] }),
  }));
  await signInAndDescribe(page);
  await page.getByRole("radio").check();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: /Add your public links/ })).toBeVisible();
});

test("approved onboarding and matching happy path reaches private feedback", async ({ page }) => {
  await finishProfile(page);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("What would you like help on?").fill("Compare onboarding notes");
  await page.getByLabel("What can you help with?").fill("Design research experience");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Meet Rowan" })).toBeVisible({ timeout: 5_000 });
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "+" }).first().click();
  await page.getByRole("button", { name: "+" }).click();
  await page.getByRole("button", { name: "Share with Rowan" }).click();
  await page.getByRole("button", { name: "Yes, we met" }).click();
  await expect(page.getByText("Only links Rowan approved for after an in-person meeting.")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Useful", exact: true }).click();
  await page.getByRole("button", { name: "Finish for today" }).click();
  await expect(page.getByRole("heading", { name: "Thanks for showing up." })).toBeVisible();
});

test("community-interest branch is truthful in setup mode", async ({ page }) => {
  await finishProfile(page);
  await page.getByRole("button", { name: /Join Corgi’s private community/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "You’re on the list." })).toBeVisible();
  await expect(page.getByText(/did not save your interest/i)).toBeVisible();
});

test("wrong OTP remains recoverable", async ({ page }) => {
  await page.goto("/sign-up");
  await page.getByLabel("Email").fill("prototype@example.com");
  await page.getByRole("button", { name: "Sign up" }).click();
  await page.getByLabel("6-digit code").fill("111111");
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page.getByText(/doesn’t match/i)).toBeVisible();
});

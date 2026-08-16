import { expect, test, type Page } from "@playwright/test";

const app = { name: "Exa", url: "http://127.0.0.1:4313" } as const;

async function identity(
  page: Page,
  person = {
    firstName: "Casey",
    lastName: "Builder",
    location: "San Francisco Bay Area",
    company: "Corgi Labs",
    roleTitle: "Product Lead",
    publicUrl: "https://example.com/casey-builder",
  },
) {
  await page.goto(app.url);
  await page.getByRole("button", { name: "Get started" }).click();
  await page.getByLabel("Email").fill("prototype@example.com");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("6-digit code").fill("424242");
  await page.getByRole("button", { name: "Verify" }).click();
  for (const [label, value] of [
    ["First name", person.firstName],
    ["Last name", person.lastName],
    ["City or region", person.location],
    ["Company", person.company],
    ["Role or title", person.roleTitle],
    ["Public URL", person.publicUrl],
  ] as const) {
    await page.getByLabel(label).fill(value);
    await page.getByRole("button", { name: "Continue" }).click();
  }
}

async function reachProfile(page: Page) {
  await identity(page);
  await page.getByRole("button", { name: "Find my profile" }).click();
  await page.getByRole("button", { name: "Enter it myself" }).click();
  await page.getByLabel("Role").fill("Product builder");
  await page.getByLabel("Company").fill("Corgi Labs");
  await page.getByLabel("Area", { exact: true }).fill("Product");
  await page.getByLabel("Focus areas").fill("Activation, community");
  await page.getByLabel("Can help with").fill("Product strategy, research");
  await page.getByRole("button", { name: "Confirm profile" }).click();
}

async function finishConnect(page: Page) {
  await page.getByRole("button", { name: /Connect at Corgi now/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.locator(".check-choice").first().click();
  await page
    .getByLabel("What would make the conversation useful?")
    .fill("Compare practical activation lessons.");
  await page
    .getByLabel("What could you share in return?")
    .fill("Early customer research notes.");
  await page.getByRole("button", { name: "Set preferences" }).click();
  const openNow = page.getByLabel("I’m open to an introduction now");
  await expect(openNow).not.toBeChecked();
  await openNow.check();
  await expect(page.getByLabel("Fundraising conversations")).not.toBeChecked();
  await expect(page.getByLabel("Recruiting conversations")).not.toBeChecked();
  await expect(page.getByLabel("Sales conversations")).not.toBeChecked();
  await expect(page.getByLabel("Notify me in this prototype")).not.toBeChecked();
  await page.getByRole("button", { name: "Review introduction" }).click();
  await page.getByRole("button", { name: "Start introductions" }).click();
  await expect(
    page.getByRole("heading", { name: "Ready for recommendations." }),
  ).toBeVisible();
  await expect(
    page.getByText(/has not searched for, ranked, or shown another person/i),
  ).toBeVisible();
}

test("Exa displays structured people and confirms exactly one", async ({
  page,
}) => {
  const longProfileUrl =
    "https://www.linkedin.com/in/casey-builder-with-a-long-public-profile-path?source=corgi-cafe";
  const candidates = Array.from({ length: 12 }, (_, index) => ({
    id: `person-${index + 1}`,
    firstName: index === 0 ? "Casey" : `Person${index + 1}`,
    lastName: index === 0 ? "Builder" : "Candidate",
    title: index === 0 ? "Product Lead" : "Founder",
    company: index === 0 ? "Corgi Labs" : `Company ${index + 1}`,
    location: "San Francisco, California",
    profileUrl:
      index === 0
        ? longProfileUrl
        : `https://example.com/people/person-${index + 1}`,
    imageUrl:
      index === 0 ? "https://images.example.com/profile.jpg" : undefined,
    sourceHost: index === 0 ? "linkedin.com" : "example.com",
    identifierOnly: index === 0,
    mayExtractFacts: index !== 0,
  }));
  await page.route("https://images.example.com/profile.jpg", (route) =>
    route.fulfill({
      contentType: "image/png",
      body: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
        "base64",
      ),
    }),
  );
  await page.route("**/api/search", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ status: "draft_ready", candidates }),
    }),
  );

  await identity(page);
  await page.getByRole("button", { name: "Find my profile" }).click();
  await page.getByRole("button", { name: "Search with Exa" }).click();

  const cards = page.locator(".person-card");
  await expect(cards).toHaveCount(10);
  await expect(cards.first()).toContainText("Casey Builder");
  await expect(cards.first()).toContainText("Product Lead · Corgi Labs");
  await expect(cards.first()).toContainText("LinkedIn profile · Identity only");
  await expect(cards.first().getByRole("link")).toHaveText(longProfileUrl);
  const image = cards.first().locator("img");
  await expect(image).toHaveAttribute(
    "src",
    "https://images.example.com/profile.jpg",
  );
  await expect(image).toHaveAttribute("referrerpolicy", "no-referrer");
  await expect(page.getByRole("radio")).toHaveCount(10);
  await expect(page.getByRole("radio").first()).not.toBeChecked();
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);

  await cards.first().getByRole("radio").check();
  await page.getByRole("button", { name: "Confirm this profile" }).click();
  await expect(
    page.getByRole("heading", { name: "Does this sound like you?" }),
  ).toBeVisible();
  await expect(page.getByLabel("Role")).toHaveValue("Product Lead");
  await expect(page.getByLabel("Company")).toHaveValue("Corgi Labs");
});

test("Exa completes connect-now without rendering a match", async ({ page }) => {
  await reachProfile(page);
  await finishConnect(page);
});

for (const branch of ["Record community interest", "Maybe later"] as const) {
  test(`Exa ${branch} is truthful and temporary`, async ({ page }) => {
    await reachProfile(page);
    await page.getByRole("button", { name: new RegExp(branch) }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Nothing was saved")).toBeVisible();
    await expect(page.getByText(/did not create a profile/i)).toBeVisible();
  });
}

test("Exa wrong OTP stays recoverable", async ({ page }) => {
  await page.goto(app.url);
  await page.getByRole("button", { name: "Get started" }).click();
  await page.getByLabel("Email").fill("prototype@example.com");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("6-digit code").fill("111111");
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page.getByText(/does not match/i)).toBeVisible();
});

test("@live Exa People Search smoke", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Live smoke runs once");
  test.skip(!process.env.EXA_API_KEY, "EXA_API_KEY not configured");
  await identity(page, {
    firstName: "Linus",
    lastName: "Torvalds",
    location: "Portland, Oregon",
    company: "Linux Foundation",
    roleTitle: "Software engineer",
    publicUrl: "https://github.com/torvalds",
  });
  await page.getByRole("button", { name: "Find my profile" }).click();
  await page.getByRole("button", { name: "Search with Exa" }).click();
  await expect(
    page.getByRole("heading", { name: "Do you see yourself here?" }),
  ).toBeVisible({ timeout: 30_000 });
  await page.getByRole("radio").first().check();
  await page.getByRole("button", { name: "Confirm this profile" }).click();
  await expect(
    page.getByRole("heading", { name: "Does this sound like you?" }),
  ).toBeVisible();
});

import { expect, test, type Page } from "@playwright/test";

const identityValues = {
  firstName: "Casey",
  lastName: "Builder",
  location: "San Francisco Bay Area",
  company: "Corgi Labs",
  role: "Member Role",
};

async function completeIdentity(page: Page) {
  await page.goto("/start");
  await page.getByLabel("Email").fill("prototype@example.com");
  await page.getByLabel("Email").press("Enter");
  await page.getByLabel("6-digit code").fill("424242");
  await page.getByLabel("6-digit code").press("Enter");
  for (const [label, value] of [
    ["First name", identityValues.firstName],
    ["Last name", identityValues.lastName],
    ["City or region", identityValues.location],
    ["Company or project", identityValues.company],
    ["Role or title", identityValues.role],
  ] as const) {
    await page.getByLabel(label).fill(value);
    await page.getByLabel(label).press("Enter");
  }
  await expect(
    page.getByRole("heading", { name: "Find your public profile." }),
  ).toBeVisible();
}

async function enterManualProfile(page: Page) {
  await completeIdentity(page);
  await page.getByRole("button", { name: "Enter it myself" }).click();
  await expect(
    page.getByRole("heading", { name: "Add public links?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Skip for now" }).click();
  await fillProfileReview(page);
}

async function fillProfileReview(page: Page) {
  await expect(
    page.getByRole("heading", { name: "Does this sound like you?" }),
  ).toBeVisible();
  await page.getByLabel("Area", { exact: true }).fill("Product");
  await page.getByLabel("Focus areas").fill("Activation, community");
  await page.getByLabel("Can help with").fill("Product strategy, research");
  await page.getByRole("button", { name: "Confirm profile" }).click();
  await expect(
    page.getByRole("heading", { name: "What would you like to do?" }),
  ).toBeVisible();
}

async function chooseConnect(page: Page) {
  await page.getByRole("radio", { name: /Meet someone now/ }).check();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(
    page.getByRole("heading", { name: "What would you like to talk about?" }),
  ).toBeVisible();
}

async function finishConnect(page: Page) {
  await chooseConnect(page);
  await expect(page.getByRole("checkbox", { name: "Compare notes with another builder" })).toBeChecked();
  await page
    .getByLabel("What would make the conversation useful?")
    .fill("Compare practical activation lessons.");
  await page
    .getByLabel("What could you help someone else with?")
    .fill("Share early customer research notes.");
  await page.getByRole("button", { name: "Choose conversation types" }).click();

  for (const label of [
    "Customer or design-partner conversation",
    "Hiring or opportunities",
    "Fundraising",
    "Sales or vendor conversation",
  ]) {
    await expect(page.getByRole("checkbox", { name: label })).not.toBeChecked();
  }
  await page.getByRole("button", { name: "Set availability" }).click();
  await expect(page.getByText("Choose at least one conversation type.")).toBeVisible();
  await page.getByRole("checkbox", { name: "Peer conversation" }).check();
  await page.getByRole("button", { name: "Set availability" }).click();

  await expect(page.getByRole("radio", { name: /^Now/ })).not.toBeChecked();
  await expect(page.getByRole("radio", { name: /People at Corgi/ })).not.toBeChecked();
  await expect(page.getByLabel("Notify me in this app")).not.toBeChecked();
  await page.getByRole("button", { name: "Review" }).click();
  await expect(page.getByText("Choose when you’re open.")).toBeVisible();
  await page.getByRole("radio", { name: /^Now/ }).check();
  await page.getByRole("radio", { name: /People at Corgi/ }).check();
  await page.getByLabel("Keep me open for").selectOption("60 minutes");
  await page.getByRole("button", { name: "Review" }).click();

  await expect(
    page.getByRole("heading", { name: "Ready for an introduction?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Start introductions" }).click();
  await expect(
    page.getByRole("heading", { name: "You’re open to an introduction." }),
  ).toBeVisible();
  await expect(
    page.getByText(/hasn’t searched for, ranked, or shown anyone/i),
  ).toBeVisible();
  await expect(page.getByText(/There may not be a match/i)).toBeVisible();
}

async function expectNoVisibleProviderTreatment(page: Page) {
  await expect(page.locator("body")).not.toContainText(/\bExa\b|comparison|version/i);
  await expect(page).not.toHaveTitle(/\bExa\b|comparison|version/i);
}

test("provider-found LinkedIn remains identifier-only while the other links stay editable", async ({
  page,
}) => {
  let linkedInRequests = 0;
  page.on("request", (request) => {
    if (/linkedin\.com$/i.test(new URL(request.url()).hostname)) linkedInRequests += 1;
  });
  const candidates = [
    {
      id: "linkedin-candidate",
      firstName: "Provider",
      lastName: "Identity",
      title: "Forbidden LinkedIn Role",
      company: "Forbidden LinkedIn Company",
      location: "Forbidden LinkedIn Location",
      profileUrl: "https://www.linkedin.com/in/casey-builder",
      sourceHost: "linkedin.com",
      identifierOnly: true,
      mayExtractFacts: false,
    },
    {
      id: "public-candidate",
      firstName: "Casey",
      lastName: "Builder",
      title: "Public Role",
      company: "Public Company",
      location: "Oakland",
      profileUrl: "https://casey.example.com/about",
      sourceHost: "casey.example.com",
      identifierOnly: false,
      mayExtractFacts: true,
    },
  ];
  await page.route("**/api/search", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ status: "draft_ready", candidates }),
    }),
  );

  await completeIdentity(page);
  await page.getByRole("button", { name: "Find my profile" }).click();
  await expect(page.getByRole("radio")).toHaveCount(2);
  await expect(page.getByRole("radio").first()).not.toBeChecked();
  await expect(page.locator(".person-card").first()).toContainText(
    "LinkedIn profile · Link only",
  );
  await expect(page.locator(".person-card").first()).not.toContainText(
    "Forbidden LinkedIn Role",
  );
  await expect(page.locator(".person-card").first()).toContainText(
    `${identityValues.firstName} ${identityValues.lastName}`,
  );
  await expect(page.locator(".person-card").first()).not.toContainText(
    "Provider Identity",
  );
  await page.getByRole("radio").first().check();
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(
    page.getByRole("heading", { name: "Add public links?" }),
  ).toBeVisible();
  await expect(page.getByLabel("LinkedIn")).toHaveCount(0);
  for (const label of [
    "Personal or company website",
    "GitHub",
    "Other social media",
  ]) {
    await expect(page.getByLabel(label)).toBeVisible();
  }
  await page.getByLabel("Personal or company website").fill("casey.example.com");
  await page.getByLabel("GitHub").fill("github.com/casey");
  await page.getByLabel("Other social media").fill("https://social.example.com/@casey");
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByRole("radio").first()).toBeChecked();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByLabel("Personal or company website")).toHaveValue("casey.example.com");
  await expect(page.getByLabel("GitHub")).toHaveValue("github.com/casey");
  await expect(page.getByLabel("LinkedIn")).toHaveCount(0);
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByLabel("Role")).toHaveValue(identityValues.role);
  await expect(page.getByLabel("Company or project")).toHaveValue(identityValues.company);
  await expect(page.locator("body")).not.toContainText("Found on linkedin.com");
  await expect(page.getByText("LinkedIn profile · Link only")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "LinkedIn", exact: true })).toHaveCount(0);
  await page.getByRole("textbox", { name: "Personal or company website", exact: true }).fill("https://new.example.com/work");
  await page.getByRole("button", { name: "Remove GitHub" }).click();
  await expect(page.getByRole("textbox", { name: "GitHub", exact: true })).toHaveCount(0);
  await page.getByLabel("Area", { exact: true }).fill("Product");
  await page.getByLabel("Focus areas").fill("Activation");
  await page.getByLabel("Can help with").fill("Product strategy");
  await page.getByRole("button", { name: "Confirm profile" }).click();
  await expect(page.getByRole("heading", { name: "What would you like to do?" })).toBeVisible();
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByText("LinkedIn profile · Link only")).toBeVisible();
  expect(linkedInRequests).toBe(0);
  await expectNoVisibleProviderTreatment(page);
});

test("blank links skip into manual profile review", async ({ page }) => {
  await completeIdentity(page);
  await page.getByRole("button", { name: "Enter it myself" }).click();
  await expect(page.getByText(/profile you’re creating/i)).toBeVisible();
  for (const label of ["LinkedIn", "Personal or company website", "GitHub", "Other social media"]) {
    await expect(page.getByLabel(label)).toHaveValue("");
  }
  await page.getByRole("button", { name: "Skip for now" }).click();
  await expect(page.getByText("No public links added.")).toBeVisible();
});

test("public link validation is recoverable and normalizes missing schemes", async ({ page }) => {
  await completeIdentity(page);
  await page.getByRole("button", { name: "Enter it myself" }).click();
  await page.getByLabel("LinkedIn").fill("https://example.com/casey");
  await page.getByLabel("GitHub").fill("https://github.com/casey/project");
  await page.getByLabel("Personal or company website").fill("https://linkedin.com/in/casey");
  await page.getByLabel("Other social media").fill("https://github.com/casey");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Enter a LinkedIn profile link.")).toBeVisible();
  await expect(page.getByText("Enter a GitHub profile link.")).toBeVisible();
  await expect(page.getByText("Add LinkedIn profile links in the LinkedIn field.")).toBeVisible();
  await expect(page.getByText("Add GitHub profile links in the GitHub field.")).toBeVisible();
  await page.getByLabel("LinkedIn").fill("linkedin.com/in/casey");
  await page.getByLabel("GitHub").fill("github.com/casey");
  await page.getByLabel("Personal or company website").fill("casey.example.com");
  await page.getByLabel("Other social media").fill("social.example.com/@casey");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("textbox", { name: "LinkedIn", exact: true })).toHaveValue("https://linkedin.com/in/casey");
  await expect(page.getByRole("textbox", { name: "GitHub", exact: true })).toHaveValue("https://github.com/casey");
});

for (const outcome of ["missing_key", "manual_only"] as const) {
  test(`profile search ${outcome} truthfully falls back to manual entry`, async ({ page }) => {
    await page.route("**/api/search", (route) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ status: outcome, candidates: [] }),
      }),
    );
    await completeIdentity(page);
    await page.getByRole("button", { name: "Find my profile" }).click();
    await expect(
      page.getByText(
        outcome === "missing_key"
          ? "Profile search isn’t available."
          : "No profile found.",
      ),
    ).toBeVisible();
    await page.getByRole("button", { name: "Enter it myself" }).click();
    await expect(page.getByRole("heading", { name: "Add public links?" })).toBeVisible();
    await expectNoVisibleProviderTreatment(page);
  });
}

test("none of these remains a manual fallback after candidate results", async ({ page }) => {
  await page.route("**/api/search", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        status: "draft_ready",
        candidates: [
          {
            id: "other",
            firstName: "Another",
            lastName: "Person",
            profileUrl: "https://another.example.com",
            sourceHost: "another.example.com",
            identifierOnly: false,
            mayExtractFacts: true,
          },
        ],
      }),
    }),
  );
  await completeIdentity(page);
  await page.getByRole("button", { name: "Find my profile" }).click();
  await page.getByRole("button", { name: "None of these" }).click();
  await expect(page.getByText(/profile you’re creating/i)).toBeVisible();
});

test("connect flow preserves explicit boundaries and truthful ready state", async ({ page }) => {
  await enterManualProfile(page);
  await finishConnect(page);
  await expectNoVisibleProviderTreatment(page);
});

for (const branch of ["Hear about the Corgi community", "Maybe later"] as const) {
  test(`${branch} terminal is truthful`, async ({ page }) => {
    await enterManualProfile(page);
    await page.getByRole("radio", { name: new RegExp(branch) }).check();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText(/doesn’t (submit or save|save)/i)).toBeVisible();
  });
}

test("wrong OTP remains recoverable and Enter submits the form", async ({ page }) => {
  await page.goto("/start");
  await page.getByLabel("Email").fill("prototype@example.com");
  await page.getByLabel("Email").press("Enter");
  await page.getByLabel("6-digit code").fill("111111");
  await page.getByLabel("6-digit code").press("Enter");
  await expect(page.getByText("That code doesn’t match. Try again.")).toBeVisible();
  await expect(page.getByLabel("6-digit code")).toBeFocused();
});

test("@live recovered profile search smoke", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440", "Live smoke runs once");
  test.skip(!process.env.EXA_API_KEY, "Server search key not configured");
  await completeIdentity(page);
  await page.getByRole("button", { name: "Find my profile" }).click();
  await expect(page.getByRole("heading", { name: "Is one of these you?" })).toBeVisible({
    timeout: 30_000,
  });
  await page.getByRole("radio").first().check();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Add public links?" })).toBeVisible();
});

import { expect, test } from "@playwright/test";

test("root is the canonical Corgi landing with local official branding", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Meet someone at Corgi | Corgi");
  await expect(
    page.getByRole("heading", { name: "Want to meet someone at Corgi?" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Skip the cold approach." })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "A real reason to say hello." }),
  ).toBeVisible();
  await expect(page.getByRole("article")).toContainText(
    "What changed when founder-led sales stopped scaling?",
  );
  await expect(page.getByRole("heading", { name: "No awkward surprises." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Open to an intro?" })).toBeVisible();
  const logos = page.getByRole("img", { name: "Corgi" });
  await expect(logos.first()).toHaveAttribute("src", "/brand/corgi-logo.svg");
  await expect(logos.first()).toHaveAttribute("width", "83");
  await expect(logos.first()).toHaveAttribute("height", "24");
  await expect(page.locator("body")).not.toContainText(/\bExa\b|comparison|version/i);
  await expect(page.locator("article button")).toHaveCount(0);
});

test("Start an intro is a direct keyboard route to email onboarding", async ({
  page,
}) => {
  await page.goto("/");
  const start = page.getByRole("link", { name: "Start an intro" }).first();
  await expect(start).toHaveAttribute("href", "/start");
  await start.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/start$/);
  await expect(page.getByRole("heading", { name: "What’s your email?" })).toBeFocused();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/Before we look|\bExa\b|comparison|version/i);
});

test("onboarding uses five phases, semantic forms, and warm focus and invalid states", async ({
  page,
}) => {
  await page.goto("/start");
  await expect(page.getByText("Sign in", { exact: true })).toBeVisible();
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-label",
    "Sign in. Step 1 of 16",
  );
  await expect(page.locator("body")).not.toContainText(/Step 1 of 17/i);

  await page.keyboard.press("Tab");
  const email = page.getByLabel("Email");
  await expect(email).toBeFocused();
  await expect
    .poll(() => email.evaluate((node) => getComputedStyle(node).borderColor))
    .toBe("rgb(204, 74, 0)");
  const inputFocus = await email.evaluate((node) => {
    const style = getComputedStyle(node);
    return { shadow: style.boxShadow, outline: style.outlineStyle };
  });
  expect(inputFocus.shadow).toContain("rgb(255, 227, 210)");
  expect(inputFocus.outline).toBe("none");

  await page.keyboard.press("Tab");
  const send = page.getByRole("button", { name: "Send code" });
  await expect(send).toBeFocused();
  const buttonFocus = await send.evaluate((node) => {
    const style = getComputedStyle(node);
    return { outline: style.outlineColor, width: style.outlineWidth };
  });
  expect(buttonFocus.outline).toBe("rgb(204, 74, 0)");
  expect(parseFloat(buttonFocus.width)).toBeGreaterThanOrEqual(3);

  await send.press("Enter");
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("Enter a valid email address.")).toBeVisible();
  await expect
    .poll(() => email.evaluate((node) => getComputedStyle(node).borderColor))
    .toBe("rgb(180, 35, 24)");
});

test("landing and onboarding reflow without horizontal overflow", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440", "One browser reviews all target widths");
  for (const width of [320, 390, 480, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/", "/start"]) {
      await page.goto(route);
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow, `${route} at ${width}px`).toBeLessThanOrEqual(1);
    }
  }
});

test("reduced motion and forced colors retain clear state", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const transition = await page
    .getByRole("link", { name: "Start an intro" })
    .first()
    .evaluate((node) => getComputedStyle(node).transitionDuration);
  expect(parseFloat(transition)).toBeLessThanOrEqual(0.01);

  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await page.goto("/start");
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Email")).toBeFocused();
  const outline = await page
    .getByLabel("Email")
    .evaluate((node) => getComputedStyle(node).outlineStyle);
  expect(outline).not.toBe("none");
});

test("two hundred percent zoom keeps controls reachable", async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto("/");
  await page.evaluate(() => {
    document.documentElement.style.zoom = "2";
  });
  await expect(page.getByRole("link", { name: "Start an intro" }).first()).toBeVisible();
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

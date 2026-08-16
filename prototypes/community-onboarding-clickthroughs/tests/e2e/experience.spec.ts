import { expect, test } from "@playwright/test";

const apps = [
  { name: "Exa", url: "http://127.0.0.1:4313" },
] as const;

for (const app of apps) {
  test(`${app.name} opening screen reflows and works by keyboard`, async ({
    page,
  }) => {
    await page.goto(app.url);
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
    await expect(
      page.getByRole("heading", { name: "Set up your intro session." }),
    ).toBeFocused();
    await page.keyboard.press("Tab");
    const start = page.getByRole("button", { name: "Get started" });
    await expect(start).toBeFocused();
    const focus = await start.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
      };
    });
    expect(focus.outlineStyle).not.toBe("none");
    expect(parseFloat(focus.outlineWidth)).toBeGreaterThanOrEqual(3);
    await page.keyboard.press("Enter");
    await expect(page.getByLabel("Email")).toBeVisible();
  });

  test(`${app.name} uses the shared Cafe visual system`, async ({ page }) => {
    await page.goto(app.url);
    const visual = await page.evaluate(() => {
      const body = getComputedStyle(document.body);
      const header = getComputedStyle(document.querySelector(".site-header")!);
      const heading = getComputedStyle(document.querySelector("h1")!);
      const notice = getComputedStyle(document.querySelector(".notice")!);
      const button = getComputedStyle(document.querySelector(".button")!);
      return {
        canvas: body.backgroundColor,
        headerColor: header.backgroundColor,
        headerBorder: header.borderBottomColor,
        fontFamily: body.fontFamily,
        headingSize: heading.fontSize,
        headingLineHeight: heading.lineHeight,
        headingFamily: heading.fontFamily,
        noticeColor: notice.backgroundColor,
        noticeRadius: notice.borderRadius,
        buttonHeight: parseFloat(button.height),
      };
    });
    expect(visual.canvas).toBe("rgb(246, 246, 246)");
    expect(visual.headerColor).toBe("rgba(255, 255, 255, 0.85)");
    expect(visual.headerBorder).toBe("rgb(208, 208, 208)");
    expect(visual.fontFamily.toLowerCase()).toContain("geist");
    expect(visual.headingFamily.toLowerCase()).toContain("geist");
    const desktopType = (page.viewportSize()?.width ?? 0) >= 700;
    expect(visual.headingSize).toBe(desktopType ? "36px" : "30px");
    expect(visual.headingLineHeight).toBe(desktopType ? "40px" : "34px");
    expect(visual.noticeColor).toBe("rgb(255, 255, 255)");
    expect(visual.noticeRadius).toBe("8px");
    expect(visual.buttonHeight).toBeGreaterThanOrEqual(44);
  });

  test(`${app.name} reduced motion removes visible animation`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(app.url);
    const duration = await page
      .locator(".progress-track span")
      .evaluate((node) => getComputedStyle(node).transitionDuration);
    expect(parseFloat(duration)).toBeLessThanOrEqual(0.01);
  });

  test(`${app.name} remains usable at 200 percent zoom`, async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 900 });
    await page.goto(app.url);
    await page.evaluate(() => {
      document.documentElement.style.zoom = "2";
    });
    await expect(page.getByRole("button", { name: "Get started" })).toBeVisible();
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
}

import { afterEach, describe, expect, it, vi } from "vitest";
import { signOtpState } from "@corgi/onboarding-shared";

afterEach(() => vi.unstubAllEnvs());
describe("Exa API fallback", () => {
  it("rejects provider work before OTP verification", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://local/api/search", { method: "POST", body: "{}" }),
    );
    expect(response.status).toBe(401);
  });
  it("returns manual fallback when the server key is missing", async () => {
    vi.stubEnv("EXA_API_KEY", "");
    const { POST } = await import("./route");
    const token = signOtpState(
      Date.now() + 10_000,
      "exa",
      "corgi-local-prototype-only",
    );
    const response = await POST(
      new Request("http://local/api/search", {
        method: "POST",
        headers: { cookie: `corgi_exa_otp=${token}` },
        body: "{}",
      }),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: "missing_key",
    });
  });
});

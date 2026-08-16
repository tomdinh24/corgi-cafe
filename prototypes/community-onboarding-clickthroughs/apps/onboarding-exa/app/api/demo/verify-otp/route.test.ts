import { afterEach, describe, expect, it, vi } from "vitest";
import { reserveExaSearches } from "../../../../lib/budget";

afterEach(() => vi.unstubAllEnvs());

describe("demo OTP verification", () => {
  it("does not mint a replacement session that resets its search budget", async () => {
    const { POST } = await import("./route");
    const first = await POST(
      new Request("http://local/api/demo/verify-otp", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ code: "424242" }),
      }),
    );
    expect(first.status).toBe(200);
    const cookie = first.headers.get("set-cookie");
    expect(cookie).toBeTruthy();
    const token = cookie!.match(/corgi_exa_otp=([^;]+)/)?.[1];
    expect(token).toBeTruthy();
    expect(reserveExaSearches(token!, 1)).toBe(true);
    expect(reserveExaSearches(token!, 1)).toBe(true);

    const renewed = await POST(
      new Request("http://local/api/demo/verify-otp", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `corgi_exa_otp=${token}`,
        },
        body: JSON.stringify({ code: "424242" }),
      }),
    );
    expect(renewed.status).toBe(200);
    expect(renewed.headers.get("set-cookie")).toBeNull();
    expect(reserveExaSearches(token!, 1)).toBe(false);
  });

  it("does not issue the fixed local code in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://local/api/demo/verify-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: "424242" }),
      }),
    );
    expect(response.status).toBe(400);
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});

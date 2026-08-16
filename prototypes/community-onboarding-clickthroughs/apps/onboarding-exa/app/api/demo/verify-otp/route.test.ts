import { describe, expect, it } from "vitest";
import { reserveExaSearches } from "../../../../lib/budget";

describe("demo OTP verification", () => {
  it("does not mint a replacement session that resets its search budget", async () => {
    const { POST } = await import("./route");
    const client = `203.0.113.${Math.floor(Math.random() * 200) + 1}`;
    const first = await POST(
      new Request("http://local/api/demo/verify-otp", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": client,
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
          "x-forwarded-for": client,
        },
        body: JSON.stringify({ code: "424242" }),
      }),
    );
    expect(renewed.status).toBe(200);
    expect(renewed.headers.get("set-cookie")).toBeNull();
    expect(reserveExaSearches(token!, 1)).toBe(false);
  });
});

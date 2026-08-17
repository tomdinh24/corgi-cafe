import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/**/*.test.ts", "corgi_cafe_app/**/*.test.ts"],
    environment: "node"
  }
});


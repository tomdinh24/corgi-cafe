import type { NextConfig } from "next";
const config: NextConfig = {
  transpilePackages: ["@corgi/onboarding-shared"],
  allowedDevOrigins: ["127.0.0.1"],
};
export default config;
